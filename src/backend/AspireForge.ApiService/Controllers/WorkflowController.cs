using AspireForge.ApiService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class WorkflowController : ControllerBase
{
    private readonly AppDbContext _db;

    public WorkflowController(AppDbContext db) => _db = db;

    // ── Processes ──────────────────────────────────────────────────────────

    [HttpGet("processes")]
    public async Task<IActionResult> GetProcesses([FromQuery] Guid? tenantId)
    {
        var query = _db.WorkflowProcesses.Include(p => p.Steps).AsQueryable();
        if (tenantId.HasValue)
            query = query.Where(p => p.TenantId == null || p.TenantId == tenantId);
        var list = await query.OrderBy(p => p.Name).ToListAsync();
        return Ok(list);
    }

    [HttpPost("processes")]
    public async Task<IActionResult> CreateProcess([FromBody] UpsertProcessRequest request)
    {
        var process = new WorkflowProcess
        {
            Name         = request.Name,
            Description  = request.Description,
            TenantId     = request.TenantId,
            PrimaryColor = request.PrimaryColor ?? "#2F4F4F",
            AccentColor  = request.AccentColor  ?? "#4a9a9a",
            IconClass    = request.IconClass    ?? "bi-diagram-3-fill",
            AppSlug      = request.AppSlug,
            FormSchema   = request.FormSchema,
            Steps        = request.Steps.Select((s, i) => new WorkflowStep
            {
                Name                = s.Name,
                Order               = i + 1,
                DefaultAssigneeRole = s.DefaultAssigneeRole,
                AllowBacktracking   = s.AllowBacktracking,
                CanSkip             = s.CanSkip
            }).ToList()
        };
        _db.WorkflowProcesses.Add(process);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProcesses), new { id = process.Id }, process);
    }

    [HttpPut("processes/{id:guid}")]
    public async Task<IActionResult> UpdateProcess(Guid id, [FromBody] UpsertProcessRequest request)
    {
        var process = await _db.WorkflowProcesses
            .Include(p => p.Steps)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (process == null) return NotFound();

        process.Name         = request.Name;
        process.Description  = request.Description;
        process.PrimaryColor = request.PrimaryColor ?? process.PrimaryColor;
        process.AccentColor  = request.AccentColor  ?? process.AccentColor;
        process.IconClass    = request.IconClass    ?? process.IconClass;
        process.AppSlug      = request.AppSlug;
        process.FormSchema   = request.FormSchema;

        // Replace steps: remove old, add new with correct order
        _db.WorkflowSteps.RemoveRange(process.Steps);
        process.Steps = request.Steps.Select((s, i) => new WorkflowStep
        {
            WorkflowProcessId   = id,
            Name                = s.Name,
            Order               = i + 1,
            DefaultAssigneeRole = s.DefaultAssigneeRole,
            AllowBacktracking   = s.AllowBacktracking,
            CanSkip             = s.CanSkip
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(process);
    }

    [HttpDelete("processes/{id:guid}")]
    public async Task<IActionResult> DeleteProcess(Guid id)
    {
        var process = await _db.WorkflowProcesses.FindAsync(id);
        if (process == null) return NotFound();
        _db.WorkflowProcesses.Remove(process);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Instances ──────────────────────────────────────────────────────────

    [HttpGet("instances")]
    public async Task<IActionResult> GetInstances([FromQuery] Guid processId, [FromQuery] Guid? tenantId)
    {
        var query = _db.WorkflowInstances
            .Include(i => i.Process!.Steps)
            .Include(i => i.CurrentStep)
            .Where(i => i.WorkflowProcessId == processId);

        if (tenantId.HasValue)
            query = query.Where(i => i.TenantId == tenantId);

        var instances = await query.OrderByDescending(i => i.UpdatedAt).ToListAsync();
        return Ok(instances);
    }

    [HttpPost("instances")]
    public async Task<IActionResult> CreateInstance([FromBody] CreateInstanceRequest request)
    {
        var process = await _db.WorkflowProcesses
            .Include(p => p.Steps)
            .FirstOrDefaultAsync(p => p.Id == request.WorkflowProcessId);
        if (process == null) return NotFound("Process not found.");

        var firstStep = process.Steps.OrderBy(s => s.Order).FirstOrDefault();
        if (firstStep == null) return BadRequest("Process has no steps.");

        var instance = new WorkflowInstance
        {
            TenantId          = request.TenantId,
            WorkflowProcessId = request.WorkflowProcessId,
            CurrentStepId     = firstStep.Id,
            Title             = request.Title,
            DataJson          = request.DataJson,
            CurrentAssigneeId = request.AssigneeId
        };
        _db.WorkflowInstances.Add(instance);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetInstances), new { processId = instance.WorkflowProcessId }, instance);
    }

    [HttpPost("instances/{id}/move")]
    public async Task<IActionResult> MoveStep(Guid id, [FromBody] MoveRequest request)
    {
        var instance = await _db.WorkflowInstances
            .Include(i => i.Process!.Steps)
            .Include(i => i.CurrentStep)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (instance == null) return NotFound();

        var targetStep = instance.Process!.Steps.FirstOrDefault(s => s.Id == request.TargetStepId);
        if (targetStep == null) return BadRequest("Invalid step");

        var currentOrder = instance.CurrentStep!.Order;
        if (targetStep.Order < currentOrder && !instance.CurrentStep.AllowBacktracking)
            return BadRequest("Backtracking not allowed for this step.");

        _db.WorkflowHistories.Add(new WorkflowHistory
        {
            WorkflowInstanceId = instance.Id,
            FromStepId         = instance.CurrentStepId,
            ToStepId           = targetStep.Id,
            ActionBy           = User.Identity?.Name ?? "system",
            Comments           = request.Comments
        });

        instance.CurrentStepId     = targetStep.Id;
        instance.CurrentAssigneeId = request.NewAssigneeId ?? instance.CurrentAssigneeId;
        instance.UpdatedAt         = DateTimeOffset.UtcNow;

        var maxOrder = instance.Process.Steps.Max(s => s.Order);
        if (targetStep.Order == maxOrder)
            instance.Status = "Completed";

        await _db.SaveChangesAsync();

        instance.CurrentStep = targetStep;
        return Ok(instance);
    }

    // ── Deployments ────────────────────────────────────────────────────────

    [HttpGet("deployments")]
    public async Task<IActionResult> GetDeployments([FromQuery] Guid? tenantId, [FromQuery] Guid? processId)
    {
        var query = _db.WorkflowDeployments
            .Include(d => d.Process!.Steps)
            .Include(d => d.Tenant)
            .AsQueryable();

        if (tenantId.HasValue) query = query.Where(d => d.TenantId == tenantId);
        if (processId.HasValue) query = query.Where(d => d.WorkflowProcessId == processId);

        var list = await query.OrderBy(d => d.DeployedAt).ToListAsync();
        return Ok(list);
    }

    [HttpPost("deployments")]
    public async Task<IActionResult> CreateDeployment([FromBody] CreateDeploymentRequest request)
    {
        var exists = await _db.WorkflowDeployments.AnyAsync(d =>
            d.WorkflowProcessId == request.WorkflowProcessId && d.TenantId == request.TenantId);
        if (exists) return Conflict("Already deployed to this tenant.");

        var deployment = new WorkflowDeployment
        {
            WorkflowProcessId = request.WorkflowProcessId,
            TenantId          = request.TenantId
        };
        _db.WorkflowDeployments.Add(deployment);
        await _db.SaveChangesAsync();
        return Ok(deployment);
    }

    [HttpDelete("deployments/{id:guid}")]
    public async Task<IActionResult> DeleteDeployment(Guid id)
    {
        var deployment = await _db.WorkflowDeployments.FindAsync(id);
        if (deployment == null) return NotFound();
        _db.WorkflowDeployments.Remove(deployment);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Seed ───────────────────────────────────────────────────────────────

    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        var delegateId = new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
        var hireId     = new Guid("b2c3d4e5-f6a7-8901-bcde-f12345678901");
        var demoTenant = new Guid("ffffffff-ffff-ffff-ffff-ffffffffffff");

        if (await _db.WorkflowProcesses.AnyAsync(p => p.Id == delegateId || p.Id == hireId))
            return Ok(new { message = "Seed data already exists." });

        // ── Delegate ─────────────────────────────────────────────────────

        var delegateSteps = new List<(string Name, string? Role, bool Back, bool Skip)>
        {
            ("Backlog",      "Product Owner", true,  true),
            ("Ready",        "Team Lead",     true,  false),
            ("In Progress",  "Developer",     true,  false),
            ("In Review",    "Reviewer",      true,  false),
            ("Done",         null,            false, false)
        };

        const string delegateSchema = """
            [
              {"key":"description","label":"Description","type":"textarea","required":false},
              {"key":"priority","label":"Priority","type":"select","required":true,"options":["Low","Medium","High","Critical"]},
              {"key":"dueDate","label":"Due Date","type":"date","required":false},
              {"key":"storyPoints","label":"Story Points","type":"number","required":false}
            ]
            """;

        var delegateProcess = new WorkflowProcess
        {
            Id           = delegateId,
            Name         = "Delegate",
            Description  = "Project & task management — track work from idea to done.",
            PrimaryColor = "#1a237e",
            AccentColor  = "#5c6bc0",
            IconClass    = "bi-kanban-fill",
            AppSlug      = "delegate",
            FormSchema   = delegateSchema,
            Steps        = delegateSteps.Select((s, i) => new WorkflowStep
            {
                Id                  = new Guid($"11111111-1111-1111-1111-11111111110{i + 1}"),
                WorkflowProcessId   = delegateId,
                Name                = s.Name,
                Order               = i + 1,
                DefaultAssigneeRole = s.Role,
                AllowBacktracking   = s.Back,
                CanSkip             = s.Skip
            }).ToList()
        };

        var delegateInstances = new[]
        {
            ("Design new landing page",           0),
            ("Fix authentication bug",            2),
            ("Add CSV export feature",            3),
            ("Update API documentation",          1),
            ("Performance optimisation sprint",   2),
            ("Onboard Q1 clients",                4),
        };

        var delegateInstanceEntities = delegateInstances.Select((item, idx) => new WorkflowInstance
        {
            TenantId          = demoTenant,
            WorkflowProcessId = delegateId,
            CurrentStepId     = new Guid($"11111111-1111-1111-1111-11111111110{item.Item2 + 1}"),
            Title             = item.Item1,
            Status            = item.Item2 == 4 ? "Completed" : "Active",
            CreatedAt         = DateTimeOffset.UtcNow.AddDays(-(6 - idx)),
            UpdatedAt         = DateTimeOffset.UtcNow.AddDays(-(3 - Math.Min(idx, 3)))
        }).ToList();

        // ── Hire ──────────────────────────────────────────────────────────

        var hireSteps = new List<(string Name, string? Role)>
        {
            ("Applied",             "Recruiter"),
            ("Phone Screening",     "Recruiter"),
            ("Technical Interview", "Engineering Lead"),
            ("Panel Interview",     "Hiring Panel"),
            ("Reference Check",     "HR"),
            ("Offer Extended",      "HR"),
            ("Onboarding",          "HR"),
            ("Active Employee",     null)
        };

        const string hireSchema = """
            [
              {"key":"department","label":"Department","type":"select","required":true,"options":["Engineering","Design","Marketing","Sales","HR","Operations","Finance"]},
              {"key":"role","label":"Role / Job Title","type":"text","required":true},
              {"key":"resumeUrl","label":"Resume URL","type":"text","required":false},
              {"key":"salaryExpectation","label":"Salary Expectation","type":"number","required":false},
              {"key":"notes","label":"Notes","type":"textarea","required":false}
            ]
            """;

        var hireProcess = new WorkflowProcess
        {
            Id           = hireId,
            Name         = "Hire",
            Description  = "End-to-end hiring & onboarding — from application to first day.",
            PrimaryColor = "#1b5e20",
            AccentColor  = "#4caf50",
            IconClass    = "bi-person-badge-fill",
            AppSlug      = "hire",
            FormSchema   = hireSchema,
            Steps        = hireSteps.Select((s, i) => new WorkflowStep
            {
                Id                  = new Guid($"22222222-2222-2222-2222-22222222220{i + 1}"),
                WorkflowProcessId   = hireId,
                Name                = s.Name,
                Order               = i + 1,
                DefaultAssigneeRole = s.Role,
                AllowBacktracking   = true,
                CanSkip             = false
            }).ToList()
        };

        var hireInstanceData = new[]
        {
            ("Sarah Johnson – Senior Engineer",    2),
            ("Marcus Williams – Product Designer", 1),
            ("Priya Patel – Data Analyst",         5),
            ("Tom Chen – Backend Developer",       0),
            ("Emma Rodriguez – Marketing Lead",    3),
            ("James Kim – DevOps Engineer",        6),
        };

        var hireInstanceEntities = hireInstanceData.Select((item, idx) => new WorkflowInstance
        {
            TenantId          = demoTenant,
            WorkflowProcessId = hireId,
            CurrentStepId     = new Guid($"22222222-2222-2222-2222-22222222220{item.Item2 + 1}"),
            Title             = item.Item1,
            Status            = "Active",
            CreatedAt         = DateTimeOffset.UtcNow.AddDays(-(10 - idx)),
            UpdatedAt         = DateTimeOffset.UtcNow.AddDays(-(5 - Math.Min(idx, 5)))
        }).ToList();

        _db.WorkflowProcesses.AddRange(delegateProcess, hireProcess);
        _db.WorkflowInstances.AddRange(delegateInstanceEntities);
        _db.WorkflowInstances.AddRange(hireInstanceEntities);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Seed complete.", processes = 2, instances = delegateInstanceEntities.Count + hireInstanceEntities.Count });
    }

    // ── Industry Seed ──────────────────────────────────────────────────────────
    // Creates realistic data for two verticals:
    //   1. EMS Dispatch & Scheduling (City of Acme EMS tenant)
    //   2. Government Contract Tracking – RFP/IDIQ/Task Order (Federal Contractors LLC tenant)

    [HttpPost("seed-industry")]
    public async Task<IActionResult> SeedIndustry()
    {
        // Fixed GUIDs so this endpoint is idempotent
        var emsProcessId      = new Guid("c3d4e5f6-a7b8-9012-cdef-123456789012");
        var contractProcessId = new Guid("d4e5f6a7-b8c9-0123-defa-234567890123");
        var toProcessId       = new Guid("e5f6a7b8-c9d0-1234-efab-345678901234");
        var emsTenantId       = new Guid("e6f7a8b9-c0d1-2345-fabc-456789012345");
        var govTenantId       = new Guid("f7a8b9c0-d1e2-3456-abcd-567890123456");

        if (await _db.WorkflowProcesses.AnyAsync(p =>
                p.Id == emsProcessId || p.Id == contractProcessId || p.Id == toProcessId))
            return Ok(new { message = "Industry seed data already exists." });

        // ── EMS Dispatch Process ─────────────────────────────────────────

        const string emsSchema = """
            [
              {"key":"incidentType","label":"Incident Type","type":"select","required":true,
               "options":["Medical","Trauma","Cardiac Arrest","Fire Assist","Hazmat","MVC","BLS Transport","Psych"]},
              {"key":"priority","label":"Priority","type":"select","required":true,
               "options":["Priority 1 – Code 3 (Lights/Siren)","Priority 2 – Urgent","Priority 3 – Routine"]},
              {"key":"unit","label":"Unit / Apparatus","type":"text","required":true},
              {"key":"crewLead","label":"Crew Lead","type":"text","required":true},
              {"key":"crewMembers","label":"Additional Crew","type":"text","required":false},
              {"key":"location","label":"Incident Address / Location","type":"text","required":true},
              {"key":"dispatchNotes","label":"Dispatch Notes","type":"textarea","required":false},
              {"key":"patientCount","label":"Patient Count","type":"number","required":false},
              {"key":"receivingFacility","label":"Receiving Facility","type":"text","required":false}
            ]
            """;

        var emsSteps = new (string Name, string? Role, bool Back)[]
        {
            ("Shift Request",      "Dispatcher",       true),
            ("Supervisor Review",  "Shift Supervisor", true),
            ("Resource Check",     "Resources",        true),
            ("Crew Assignment",    "Dispatcher",       true),
            ("Confirmed",          "Crew Lead",        false),
            ("Dispatched",         "Crew Lead",        false),
            ("Incident Report",    "Crew Lead",        true),
            ("Closed",             null,               false),
        };

        var emsProcess = new WorkflowProcess
        {
            Id           = emsProcessId,
            Name         = "EMS Dispatch",
            Description  = "Emergency Medical Services incident dispatch — from shift request through scene close and incident report.",
            PrimaryColor = "#b71c1c",
            AccentColor  = "#ef5350",
            IconClass    = "bi-hospital-fill",
            AppSlug      = "ems-dispatch",
            FormSchema   = emsSchema,
            Steps        = emsSteps.Select((s, i) => new WorkflowStep
            {
                Id                  = new Guid($"cccccccc-cccc-cccc-cccc-cccccccccc0{i + 1}"),
                WorkflowProcessId   = emsProcessId,
                Name                = s.Name,
                Order               = i + 1,
                DefaultAssigneeRole = s.Role,
                AllowBacktracking   = s.Back,
                CanSkip             = false,
            }).ToList()
        };

        var emsInstances = new[]
        {
            ("Unit 12 – Medical, Main & 3rd",      0),
            ("Unit 8 – MVC, I-95 Mile Marker 44",  5),
            ("Unit 3 – Cardiac, Riverside Tower",   6),
            ("Unit 7 – Trauma, Westfield Mall",     3),
            ("Unit 5 – BLS Transport, Harbor Hosp", 4),
            ("Unit 11 – Hazmat, Industrial Park",   1),
        };

        var emsInstanceEntities = emsInstances.Select((item, idx) => new WorkflowInstance
        {
            TenantId          = emsTenantId,
            WorkflowProcessId = emsProcessId,
            CurrentStepId     = new Guid($"cccccccc-cccc-cccc-cccc-cccccccccc0{item.Item2 + 1}"),
            Title             = item.Item1,
            Status            = item.Item2 == 7 ? "Completed" : "Active",
            CreatedAt         = DateTimeOffset.UtcNow.AddDays(-(6 - idx)),
            UpdatedAt         = DateTimeOffset.UtcNow.AddDays(-(2 - Math.Min(idx, 2))),
        }).ToList();

        // ── Government Contract Pursuit Process ──────────────────────────

        const string contractSchema = """
            [
              {"key":"solicitationNumber","label":"Solicitation Number","type":"text","required":true},
              {"key":"agency","label":"Agency / Customer","type":"text","required":true},
              {"key":"contractType","label":"Contract Type","type":"select","required":true,
               "options":["RFP","IDIQ","Task Order","BPA","SBIR","GSA Schedule","SEWP"]},
              {"key":"naicsCode","label":"NAICS Code","type":"text","required":false},
              {"key":"setAside","label":"Set-Aside","type":"select","required":false,
               "options":["None","Small Business","SDVOSB","8(a)","WOSB","HUBZone","VOSB"]},
              {"key":"dueDate","label":"Response Due Date","type":"date","required":true},
              {"key":"estimatedValue","label":"Estimated Contract Value ($)","type":"number","required":false},
              {"key":"goNoGo","label":"Bid Decision","type":"select","required":false,
               "options":["TBD","Go","No-Go"]},
              {"key":"captureManager","label":"Capture Manager","type":"text","required":false},
              {"key":"notes","label":"Notes / Intelligence","type":"textarea","required":false}
            ]
            """;

        var contractSteps = new (string Name, string? Role)[]
        {
            ("Opportunity Identified", "Capture Manager"),
            ("Bid / No-Bid Review",    "Leadership"),
            ("Capture Planning",       "Capture Manager"),
            ("Proposal Development",   "Proposal Manager"),
            ("Internal Review",        "Reviewer"),
            ("Submitted",              "Contracts"),
            ("Award Pending",          "Contracts"),
            ("Awarded",                null),
        };

        var contractProcess = new WorkflowProcess
        {
            Id           = contractProcessId,
            Name         = "Contract Pursuit",
            Description  = "Track RFP, IDIQ, and task order opportunities from pipeline identification through award.",
            PrimaryColor = "#1a237e",
            AccentColor  = "#3949ab",
            IconClass    = "bi-file-earmark-text-fill",
            AppSlug      = "contract-pursuit",
            FormSchema   = contractSchema,
            Steps        = contractSteps.Select((s, i) => new WorkflowStep
            {
                Id                  = new Guid($"dddddddd-dddd-dddd-dddd-dddddddddd0{i + 1}"),
                WorkflowProcessId   = contractProcessId,
                Name                = s.Name,
                Order               = i + 1,
                DefaultAssigneeRole = s.Role,
                AllowBacktracking   = true,
                CanSkip             = false,
            }).ToList()
        };

        var contractInstances = new[]
        {
            ("DoD IT Modernization RFP – W9133L-26-R-0041",   1),
            ("DHS Cybersecurity IDIQ – HSHQDC-26-R-00005",    3),
            ("GSA Facilities BPA – GS-06P-26-BG-D-0012",      0),
            ("HHS Data Analytics RFP – HHS-26-R-DATAV2",      5),
            ("Army Training SBIR – W911NF-26-1-0177",          6),
            ("DHS Small Business SDVOSB – HSBP1026R00032",     2),
        };

        var contractInstanceEntities = contractInstances.Select((item, idx) => new WorkflowInstance
        {
            TenantId          = govTenantId,
            WorkflowProcessId = contractProcessId,
            CurrentStepId     = new Guid($"dddddddd-dddd-dddd-dddd-dddddddddd0{item.Item2 + 1}"),
            Title             = item.Item1,
            Status            = item.Item2 == 7 ? "Completed" : "Active",
            CreatedAt         = DateTimeOffset.UtcNow.AddDays(-(14 - idx * 2)),
            UpdatedAt         = DateTimeOffset.UtcNow.AddDays(-(7 - idx)),
        }).ToList();

        // ── Task Order Execution Process ─────────────────────────────────

        const string toSchema = """
            [
              {"key":"toNumber","label":"Task Order Number","type":"text","required":true},
              {"key":"idiqVehicle","label":"IDIQ Vehicle / Contract","type":"text","required":true},
              {"key":"popStart","label":"Period of Performance Start","type":"date","required":true},
              {"key":"popEnd","label":"Period of Performance End","type":"date","required":true},
              {"key":"value","label":"Task Order Value ($)","type":"number","required":false},
              {"key":"programManager","label":"Program Manager","type":"text","required":true},
              {"key":"technicalLead","label":"Technical Lead","type":"text","required":false},
              {"key":"cdrl","label":"Key Deliverables / CDRLs","type":"textarea","required":false},
              {"key":"notes","label":"Notes","type":"textarea","required":false}
            ]
            """;

        var toSteps = new (string Name, string? Role)[]
        {
            ("TO Received",          "Contracts"),
            ("Technical Analysis",   "Technical Lead"),
            ("Proposal",             "Proposal Manager"),
            ("Submitted",            "Contracts"),
            ("Awarded",              "Program Manager"),
            ("Kickoff",              "Program Manager"),
            ("Execution",            "Technical Lead"),
            ("Deliverable Review",   "Quality Assurance"),
            ("Closed",               null),
        };

        var toProcess = new WorkflowProcess
        {
            Id           = toProcessId,
            Name         = "Task Order Execution",
            Description  = "Manage individual task orders under an IDIQ vehicle from receipt through delivery and close-out.",
            PrimaryColor = "#004d40",
            AccentColor  = "#00897b",
            IconClass    = "bi-clipboard2-check-fill",
            AppSlug      = "task-order",
            FormSchema   = toSchema,
            Steps        = toSteps.Select((s, i) => new WorkflowStep
            {
                Id                  = new Guid($"eeeeeeee-eeee-eeee-eeee-eeeeeeeeee0{i + 1}"),
                WorkflowProcessId   = toProcessId,
                Name                = s.Name,
                Order               = i + 1,
                DefaultAssigneeRole = s.Role,
                AllowBacktracking   = true,
                CanSkip             = false,
            }).ToList()
        };

        var toInstances = new[]
        {
            ("TO-001 – Cloud Migration Phase 1",       4),
            ("TO-002 – Help Desk Support Y1",           6),
            ("TO-003 – Network Infrastructure Upgrade", 1),
            ("TO-004 – Cybersecurity Assessment",       5),
            ("TO-005 – Training Development",           3),
        };

        var toInstanceEntities = toInstances.Select((item, idx) => new WorkflowInstance
        {
            TenantId          = govTenantId,
            WorkflowProcessId = toProcessId,
            CurrentStepId     = new Guid($"eeeeeeee-eeee-eeee-eeee-eeeeeeeeee0{item.Item2 + 1}"),
            Title             = item.Item1,
            Status            = "Active",
            CreatedAt         = DateTimeOffset.UtcNow.AddDays(-(10 - idx * 2)),
            UpdatedAt         = DateTimeOffset.UtcNow.AddDays(-(5 - idx)),
        }).ToList();

        // ── Tenants ──────────────────────────────────────────────────────

        var emsTenant = new Tenant
        {
            Id        = emsTenantId,
            Name      = "City of Acme EMS",
            Slug      = "city-of-acme-ems",
            IsActive  = true,
            CreatedAt = DateTimeOffset.UtcNow.AddMonths(-6),
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        var govTenant = new Tenant
        {
            Id        = govTenantId,
            Name      = "Federal Contractors LLC",
            Slug      = "federal-contractors-llc",
            IsActive  = true,
            CreatedAt = DateTimeOffset.UtcNow.AddMonths(-3),
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        // ── App Suites ───────────────────────────────────────────────────

        var emsSuiteId = new Guid("a8b9c0d1-e2f3-4567-bcde-678901234567");
        var govSuiteId = new Guid("b9c0d1e2-f3a4-5678-cdef-789012345678");

        var emsSuite = new AppSuite
        {
            Id          = emsSuiteId,
            TenantId    = emsTenantId,
            Name        = "EMS Operations",
            Slug        = "ems-operations",
            Description = "End-to-end emergency medical services — dispatch, scheduling, and compliance reporting.",
            IconClass   = "bi-hospital-fill",
            Color       = "#b71c1c",
            SortOrder   = 0,
        };

        var govSuite = new AppSuite
        {
            Id          = govSuiteId,
            TenantId    = govTenantId,
            Name        = "Contract Management",
            Slug        = "contract-management",
            Description = "Full lifecycle government contract management — from pipeline through task order execution.",
            IconClass   = "bi-briefcase-fill",
            Color       = "#1a237e",
            SortOrder   = 0,
        };

        // ── Micro Apps ───────────────────────────────────────────────────

        var emsApp = new MicroApp
        {
            Id                = new Guid("c9d0e1f2-a3b4-5678-cdef-890123456789"),
            TenantId          = emsTenantId,
            WorkflowProcessId = emsProcessId,
            AppSuiteId        = emsSuiteId,
            DisplayName       = "EMS Dispatch",
            Slug              = "ems-dispatch",
            Description       = "Real-time incident dispatch and crew management for EMS units.",
            PrimaryColor      = "#b71c1c",
            AccentColor       = "#ef5350",
            IconClass         = "bi-hospital-fill",
            Status            = "active",
            IsPublic          = false,
        };

        var contractApp = new MicroApp
        {
            Id                = new Guid("d0e1f2a3-b4c5-6789-defa-901234567890"),
            TenantId          = govTenantId,
            WorkflowProcessId = contractProcessId,
            AppSuiteId        = govSuiteId,
            DisplayName       = "Contract Pursuit",
            Slug              = "contract-pursuit",
            Description       = "Pipeline management for RFP, IDIQ, and BPA opportunities.",
            PrimaryColor      = "#1a237e",
            AccentColor       = "#3949ab",
            IconClass         = "bi-file-earmark-text-fill",
            Status            = "active",
            IsPublic          = false,
        };

        var toApp = new MicroApp
        {
            Id                = new Guid("e1f2a3b4-c5d6-7890-efab-012345678901"),
            TenantId          = govTenantId,
            WorkflowProcessId = toProcessId,
            AppSuiteId        = govSuiteId,
            DisplayName       = "Task Order Execution",
            Slug              = "task-order-execution",
            Description       = "Manage individual task orders under awarded IDIQ vehicles.",
            PrimaryColor      = "#004d40",
            AccentColor       = "#00897b",
            IconClass         = "bi-clipboard2-check-fill",
            Status            = "active",
            IsPublic          = false,
        };

        // ── App Links ─────────────────────────────────────────────────────

        var govLink = new AppLink
        {
            SourceMicroAppId = contractApp.Id,
            TargetMicroAppId = toApp.Id,
            LinkType         = "workflow-handoff",
            Label            = "Awarded → Execute Task Orders",
        };

        // ── Persist ───────────────────────────────────────────────────────

        _db.Tenants.AddRange(emsTenant, govTenant);
        _db.WorkflowProcesses.AddRange(emsProcess, contractProcess, toProcess);
        _db.WorkflowInstances.AddRange(emsInstanceEntities);
        _db.WorkflowInstances.AddRange(contractInstanceEntities);
        _db.WorkflowInstances.AddRange(toInstanceEntities);
        _db.AppSuites.AddRange(emsSuite, govSuite);
        _db.MicroApps.AddRange(emsApp, contractApp, toApp);
        _db.AppLinks.Add(govLink);

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message    = "Industry seed complete.",
            tenants    = 2,
            processes  = 3,
            instances  = emsInstanceEntities.Count + contractInstanceEntities.Count + toInstanceEntities.Count,
            suites     = 2,
            microApps  = 3,
            links      = 1,
        });
    }

}

public record MoveRequest(Guid TargetStepId, string? NewAssigneeId, string? Comments);

public record CreateInstanceRequest(
    Guid   TenantId,
    Guid   WorkflowProcessId,
    string Title,
    string? DataJson   = null,
    string? AssigneeId = null
);

public record UpsertProcessRequest(
    string  Name,
    string? Description,
    Guid?   TenantId,
    string? PrimaryColor,
    string? AccentColor,
    string? IconClass,
    string? AppSlug,
    string? FormSchema,
    List<StepRequest> Steps
);

public record StepRequest(
    string  Name,
    string? DefaultAssigneeRole = null,
    bool    AllowBacktracking   = true,
    bool    CanSkip             = false
);

public record CreateDeploymentRequest(Guid WorkflowProcessId, Guid TenantId);
