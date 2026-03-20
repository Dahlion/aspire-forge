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
