using AspireForge.ApiService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Manages application suites — logical groupings of micro apps per tenant.
///
/// Base URL: /api/suites
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AppSuitesController : ControllerBase
{
    private readonly AppDbContext _db;

    public AppSuitesController(AppDbContext db) => _db = db;

    /// <summary>GET /api/suites?tenantId=</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? tenantId)
    {
        var q = _db.AppSuites
            .Include(s => s.MicroApps)
                .ThenInclude(a => a.Process)
            .AsQueryable();

        if (tenantId.HasValue) q = q.Where(s => s.TenantId == tenantId);

        var list = await q
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>GET /api/suites/{id}</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var suite = await _db.AppSuites
            .Include(s => s.MicroApps)
                .ThenInclude(a => a.Process).ThenInclude(p => p!.Steps)
            .Include(s => s.MicroApps)
                .ThenInclude(a => a.Domains)
            .FirstOrDefaultAsync(s => s.Id == id);

        return suite == null ? NotFound() : Ok(suite);
    }

    /// <summary>POST /api/suites</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertSuiteRequest req)
    {
        if (!await _db.Tenants.AnyAsync(t => t.Id == req.TenantId))
            return BadRequest("Tenant not found.");

        var slug = Slugify(req.Slug ?? req.Name);
        if (await _db.AppSuites.AnyAsync(s => s.TenantId == req.TenantId && s.Slug == slug))
            return Conflict("A suite with this slug already exists for this tenant.");

        var suite = new AppSuite
        {
            TenantId        = req.TenantId,
            Name            = req.Name.Trim(),
            Slug            = slug,
            Description     = req.Description,
            IconClass       = req.IconClass       ?? "bi-grid-fill",
            Color           = req.Color           ?? "#2F4F4F",
            SortOrder       = req.SortOrder       ?? 0,
            IsPublic        = req.IsPublic        ?? false,
            ShowInDashboard = req.ShowInDashboard ?? false,
            RequiredPlanSlug = req.RequiredPlanSlug,
        };

        _db.AppSuites.Add(suite);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = suite.Id }, suite);
    }

    /// <summary>PUT /api/suites/{id}</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertSuiteRequest req)
    {
        var suite = await _db.AppSuites.FindAsync(id);
        if (suite == null) return NotFound();

        suite.Name             = req.Name.Trim();
        suite.Description      = req.Description      ?? suite.Description;
        suite.IconClass        = req.IconClass        ?? suite.IconClass;
        suite.Color            = req.Color            ?? suite.Color;
        suite.SortOrder        = req.SortOrder        ?? suite.SortOrder;
        suite.IsPublic         = req.IsPublic         ?? suite.IsPublic;
        suite.ShowInDashboard  = req.ShowInDashboard  ?? suite.ShowInDashboard;
        suite.RequiredPlanSlug = req.RequiredPlanSlug ?? suite.RequiredPlanSlug;
        suite.UpdatedAt        = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(suite);
    }

    /// <summary>DELETE /api/suites/{id}</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var suite = await _db.AppSuites.FindAsync(id);
        if (suite == null) return NotFound();

        // Unlink micro apps (SetNull cascade handled by EF) rather than hard-deleting them
        await _db.MicroApps
            .Where(a => a.AppSuiteId == id)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.AppSuiteId, (Guid?)null));

        _db.AppSuites.Remove(suite);
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

public record UpsertSuiteRequest(
    Guid    TenantId,
    string  Name,
    string? Slug             = null,
    string? Description      = null,
    string? IconClass        = null,
    string? Color            = null,
    int?    SortOrder        = null,
    bool?   IsPublic         = null,
    bool?   ShowInDashboard  = null,
    string? RequiredPlanSlug = null
);
