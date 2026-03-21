using AspireForge.ApiService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AppDomain = AspireForge.ApiService.Data.AppDomain;

/// <summary>
/// Manages the micro app platform: deployments, custom domains, inter-app links.
///
/// Base URL: /api/microapps
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MicroAppsController : ControllerBase
{
    private readonly AppDbContext _db;

    public MicroAppsController(AppDbContext db) => _db = db;

    // ── MicroApp CRUD ──────────────────────────────────────────────────────────

    /// <summary>GET /api/microapps?tenantId=&amp;suiteId=&amp;status=</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid?   tenantId,
        [FromQuery] Guid?   suiteId,
        [FromQuery] string? status)
    {
        var q = _db.MicroApps
            .Include(a => a.Process).ThenInclude(p => p!.Steps)
            .Include(a => a.Suite)
            .Include(a => a.Domains)
            .AsQueryable();

        if (tenantId.HasValue) q = q.Where(a => a.TenantId == tenantId);
        if (suiteId.HasValue)  q = q.Where(a => a.AppSuiteId == suiteId);
        if (!string.IsNullOrEmpty(status)) q = q.Where(a => a.Status == status);

        var list = await q.OrderBy(a => a.DisplayName).ToListAsync();
        return Ok(list);
    }

    /// <summary>GET /api/microapps/{id}</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var app = await _db.MicroApps
            .Include(a => a.Process).ThenInclude(p => p!.Steps)
            .Include(a => a.Suite)
            .Include(a => a.Domains)
            .Include(a => a.OutboundLinks).ThenInclude(l => l.Target)
            .FirstOrDefaultAsync(a => a.Id == id);

        return app == null ? NotFound() : Ok(app);
    }

    /// <summary>GET /api/microapps/resolve?hostname=ems.cityofacme.gov</summary>
    [HttpGet("resolve")]
    public async Task<IActionResult> Resolve([FromQuery] string hostname)
    {
        if (string.IsNullOrWhiteSpace(hostname))
            return BadRequest("hostname is required.");

        var domain = await _db.AppDomains
            .Include(d => d.MicroApp)
                .ThenInclude(a => a!.Process).ThenInclude(p => p!.Steps)
            .Include(d => d.MicroApp)
                .ThenInclude(a => a!.Tenant)
            .Include(d => d.MicroApp)
                .ThenInclude(a => a!.Suite)
            .FirstOrDefaultAsync(d => d.Hostname == hostname.ToLowerInvariant());

        if (domain == null) return NotFound(new { message = "No micro app mapped to this hostname." });
        if (domain.MicroApp!.Status != "active") return NotFound(new { message = "App is not active." });

        return Ok(new
        {
            microApp   = domain.MicroApp,
            tenant     = domain.MicroApp.Tenant,
            domain,
        });
    }

    /// <summary>POST /api/microapps</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMicroAppRequest req)
    {
        if (!await _db.Tenants.AnyAsync(t => t.Id == req.TenantId))
            return BadRequest("Tenant not found.");

        if (!await _db.WorkflowProcesses.AnyAsync(p => p.Id == req.WorkflowProcessId))
            return BadRequest("WorkflowProcess not found.");

        var slug = Slugify(req.Slug ?? req.DisplayName);
        if (await _db.MicroApps.AnyAsync(a => a.TenantId == req.TenantId && a.Slug == slug))
            return Conflict("A micro app with this slug already exists for this tenant.");

        var app = new MicroApp
        {
            TenantId          = req.TenantId,
            WorkflowProcessId = req.WorkflowProcessId,
            AppSuiteId        = req.AppSuiteId,
            DisplayName       = req.DisplayName.Trim(),
            Slug              = slug,
            Description       = req.Description,
            PrimaryColor      = req.PrimaryColor ?? "#2F4F4F",
            AccentColor       = req.AccentColor  ?? "#4a9a9a",
            IconClass         = req.IconClass    ?? "bi-diagram-3-fill",
            Status            = "active",
            IsPublic          = req.IsPublic,
        };

        _db.MicroApps.Add(app);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = app.Id }, app);
    }

    /// <summary>PUT /api/microapps/{id}</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMicroAppRequest req)
    {
        var app = await _db.MicroApps.FindAsync(id);
        if (app == null) return NotFound();

        if (req.AppSuiteId.HasValue && req.AppSuiteId != app.AppSuiteId)
        {
            if (!await _db.AppSuites.AnyAsync(s => s.Id == req.AppSuiteId && s.TenantId == app.TenantId))
                return BadRequest("Suite not found for this tenant.");
        }

        app.DisplayName  = req.DisplayName?.Trim() ?? app.DisplayName;
        app.Description  = req.Description ?? app.Description;
        app.PrimaryColor = req.PrimaryColor ?? app.PrimaryColor;
        app.AccentColor  = req.AccentColor  ?? app.AccentColor;
        app.IconClass    = req.IconClass    ?? app.IconClass;
        app.AppSuiteId   = req.AppSuiteId   ?? app.AppSuiteId;
        app.Status       = req.Status       ?? app.Status;
        app.IsPublic     = req.IsPublic     ?? app.IsPublic;
        app.UpdatedAt    = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(app);
    }

    /// <summary>DELETE /api/microapps/{id}</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var app = await _db.MicroApps.FindAsync(id);
        if (app == null) return NotFound();
        _db.MicroApps.Remove(app);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Domains ────────────────────────────────────────────────────────────────

    /// <summary>GET /api/microapps/{id}/domains</summary>
    [HttpGet("{id:guid}/domains")]
    public async Task<IActionResult> GetDomains(Guid id)
    {
        var domains = await _db.AppDomains
            .Where(d => d.MicroAppId == id)
            .OrderByDescending(d => d.IsPrimary)
            .ThenBy(d => d.CreatedAt)
            .ToListAsync();
        return Ok(domains);
    }

    /// <summary>POST /api/microapps/{id}/domains</summary>
    [HttpPost("{id:guid}/domains")]
    public async Task<IActionResult> AddDomain(Guid id, [FromBody] AddDomainRequest req)
    {
        if (!await _db.MicroApps.AnyAsync(a => a.Id == id))
            return NotFound("MicroApp not found.");

        var hostname = req.Hostname.Trim().ToLowerInvariant();
        if (await _db.AppDomains.AnyAsync(d => d.Hostname == hostname))
            return Conflict("This hostname is already mapped to another app.");

        if (req.IsPrimary)
        {
            // Clear existing primary flag for this app
            var existing = await _db.AppDomains
                .Where(d => d.MicroAppId == id && d.IsPrimary)
                .ToListAsync();
            existing.ForEach(d => d.IsPrimary = false);
        }

        var domain = new AppDomain
        {
            MicroAppId = id,
            Hostname   = hostname,
            IsPrimary  = req.IsPrimary,
            SslStatus  = "pending",
        };

        _db.AppDomains.Add(domain);
        await _db.SaveChangesAsync();
        return Ok(domain);
    }

    /// <summary>POST /api/microapps/{id}/domains/{domainId}/verify</summary>
    [HttpPost("{id:guid}/domains/{domainId:guid}/verify")]
    public async Task<IActionResult> VerifyDomain(Guid id, Guid domainId)
    {
        var domain = await _db.AppDomains
            .FirstOrDefaultAsync(d => d.Id == domainId && d.MicroAppId == id);
        if (domain == null) return NotFound();

        // In production this would trigger a DNS TXT record check.
        // Here we optimistically mark it provisioned.
        domain.SslStatus  = "provisioned";
        domain.VerifiedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(domain);
    }

    /// <summary>DELETE /api/microapps/{id}/domains/{domainId}</summary>
    [HttpDelete("{id:guid}/domains/{domainId:guid}")]
    public async Task<IActionResult> DeleteDomain(Guid id, Guid domainId)
    {
        var domain = await _db.AppDomains
            .FirstOrDefaultAsync(d => d.Id == domainId && d.MicroAppId == id);
        if (domain == null) return NotFound();
        _db.AppDomains.Remove(domain);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Links ──────────────────────────────────────────────────────────────────

    /// <summary>GET /api/microapps/{id}/links</summary>
    [HttpGet("{id:guid}/links")]
    public async Task<IActionResult> GetLinks(Guid id)
    {
        var links = await _db.AppLinks
            .Include(l => l.Target)
            .Where(l => l.SourceMicroAppId == id)
            .OrderBy(l => l.LinkType)
            .ToListAsync();
        return Ok(links);
    }

    /// <summary>POST /api/microapps/{id}/links</summary>
    [HttpPost("{id:guid}/links")]
    public async Task<IActionResult> AddLink(Guid id, [FromBody] AddLinkRequest req)
    {
        if (!await _db.MicroApps.AnyAsync(a => a.Id == id))
            return NotFound("Source app not found.");
        if (!await _db.MicroApps.AnyAsync(a => a.Id == req.TargetMicroAppId))
            return BadRequest("Target app not found.");
        if (id == req.TargetMicroAppId)
            return BadRequest("A micro app cannot link to itself.");
        if (await _db.AppLinks.AnyAsync(l => l.SourceMicroAppId == id && l.TargetMicroAppId == req.TargetMicroAppId))
            return Conflict("Link already exists.");

        var link = new AppLink
        {
            SourceMicroAppId = id,
            TargetMicroAppId = req.TargetMicroAppId,
            LinkType         = req.LinkType ?? "related",
            Label            = req.Label,
        };

        _db.AppLinks.Add(link);
        await _db.SaveChangesAsync();

        await _db.Entry(link).Reference(l => l.Target).LoadAsync();
        return Ok(link);
    }

    /// <summary>DELETE /api/microapps/{id}/links/{linkId}</summary>
    [HttpDelete("{id:guid}/links/{linkId:guid}")]
    public async Task<IActionResult> DeleteLink(Guid id, Guid linkId)
    {
        var link = await _db.AppLinks
            .FirstOrDefaultAsync(l => l.Id == linkId && l.SourceMicroAppId == id);
        if (link == null) return NotFound();
        _db.AppLinks.Remove(link);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static string Slugify(string input)
    {
        var slug = input.Trim().ToLowerInvariant();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-");
        return slug.Trim('-');
    }
}

// ── Request DTOs ───────────────────────────────────────────────────────────────

public record CreateMicroAppRequest(
    Guid    TenantId,
    Guid    WorkflowProcessId,
    string  DisplayName,
    string? Slug         = null,
    string? Description  = null,
    Guid?   AppSuiteId   = null,
    string? PrimaryColor = null,
    string? AccentColor  = null,
    string? IconClass    = null,
    bool    IsPublic     = false
);

public record UpdateMicroAppRequest(
    string? DisplayName  = null,
    string? Description  = null,
    Guid?   AppSuiteId   = null,
    string? PrimaryColor = null,
    string? AccentColor  = null,
    string? IconClass    = null,
    string? Status       = null,
    bool?   IsPublic     = null
);

public record AddDomainRequest(
    string Hostname,
    bool   IsPrimary = false
);

public record AddLinkRequest(
    Guid    TargetMicroAppId,
    string? LinkType = "related",
    string? Label    = null
);
