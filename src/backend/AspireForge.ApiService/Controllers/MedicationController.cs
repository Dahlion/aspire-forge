using AspireForge.ApiService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

/// <summary>
/// DEA-compliant EMS medication tracker API.
/// Base URL: /api/med
/// All endpoints are tenant-scoped via ?tenantId= query param.
/// </summary>
[ApiController]
[Route("api/med")]
public class MedicationController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _http;

    public MedicationController(AppDbContext db, IHttpClientFactory http)
    {
        _db = db;
        _http = http;
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    /// <summary>GET /api/med/dashboard?tenantId=</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard([FromQuery] Guid tenantId)
    {
        var now = DateTimeOffset.UtcNow;
        var in30 = now.AddDays(30);

        var vialsByStatus = await _db.MedVials
            .Where(v => v.TenantId == tenantId)
            .GroupBy(v => v.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var expiringCount = await _db.MedVials
            .Where(v => v.TenantId == tenantId && v.ExpiresAt <= in30 &&
                        v.Status != "disposed" && v.Status != "expired" && v.Status != "wasted")
            .CountAsync();

        // Containers that are due for a check
        var containers = await _db.MedContainers
            .Include(c => c.StorageLocation)
            .Where(c => c.StorageLocation!.TenantId == tenantId && c.IsActive)
            .ToListAsync();

        var lastChecks = await _db.MedCheckSessions
            .Where(s => s.TenantId == tenantId && s.Status == "completed")
            .GroupBy(s => s.StorageLocationId)
            .Select(g => new { LocationId = g.Key, LastCompleted = g.Max(s => s.CompletedAt) })
            .ToListAsync();

        var lastCheckMap = lastChecks.ToDictionary(x => x.LocationId, x => x.LastCompleted);

        int checksDueCount = 0;
        foreach (var c in containers)
        {
            var lastCheck = lastCheckMap.TryGetValue(c.StorageLocationId, out var lc) ? lc : null;
            var dueAt = lastCheck.HasValue
                ? lastCheck.Value.AddHours(c.CheckFrequencyHours)
                : now.AddDays(-1); // never checked = overdue
            if (dueAt <= now) checksDueCount++;
        }

        var brokenSeals = await _db.MedContainers
            .Include(c => c.StorageLocation)
            .Where(c => c.StorageLocation!.TenantId == tenantId && c.IsSealable && !c.IsSealed && c.IsActive)
            .CountAsync();

        return Ok(new
        {
            VialsByStatus = vialsByStatus,
            ExpiringIn30DaysCount = expiringCount,
            ChecksDueCount = checksDueCount,
            BrokenSealsCount = brokenSeals
        });
    }

    // ── License Levels ────────────────────────────────────────────────────────

    [HttpGet("license-levels")]
    public async Task<IActionResult> GetLicenseLevels([FromQuery] Guid tenantId)
    {
        var levels = await _db.MedLicenseLevels
            .Where(l => l.TenantId == tenantId && l.IsActive)
            .OrderBy(l => l.Rank)
            .ToListAsync();
        return Ok(levels);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<bool> TenantExistsAsync(Guid tenantId)
        => await _db.Tenants.AnyAsync(t => t.Id == tenantId);

    // ── License Levels (continued) ─────────────────────────────────────────────

    [HttpPost("license-levels")]
    public async Task<IActionResult> CreateLicenseLevel([FromQuery] Guid tenantId, [FromBody] UpsertLicenseLevelReq req)
    {
        if (!await TenantExistsAsync(tenantId))
            return NotFound($"Tenant '{tenantId}' not found. Create the tenant in the admin portal and ensure your Keycloak account has the correct tenant_id attribute.");

        var level = new MedLicenseLevel
        {
            TenantId = tenantId,
            Name = req.Name,
            Rank = req.Rank,
            CanAdminister = req.CanAdminister,
            CanWaste = req.CanWaste,
            CanWitness = req.CanWitness,
            CanStock = req.CanStock,
            CanOrder = req.CanOrder,
            CanReceive = req.CanReceive,
            CanMove = req.CanMove,
            CanPerformCheck = req.CanPerformCheck,
            CanManageCatalog = req.CanManageCatalog,
            CanManageRoster = req.CanManageRoster,
            CanManageLocations = req.CanManageLocations,
        };
        _db.MedLicenseLevels.Add(level);
        await _db.SaveChangesAsync();
        return Ok(level);
    }

    [HttpPut("license-levels/{id:guid}")]
    public async Task<IActionResult> UpdateLicenseLevel(Guid id, [FromQuery] Guid tenantId, [FromBody] UpsertLicenseLevelReq req)
    {
        var level = await _db.MedLicenseLevels.FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId);
        if (level == null) return NotFound();
        level.Name = req.Name; level.Rank = req.Rank; level.CanAdminister = req.CanAdminister;
        level.CanWaste = req.CanWaste; level.CanWitness = req.CanWitness; level.CanStock = req.CanStock;
        level.CanOrder = req.CanOrder; level.CanReceive = req.CanReceive; level.CanMove = req.CanMove;
        level.CanPerformCheck = req.CanPerformCheck; level.CanManageCatalog = req.CanManageCatalog;
        level.CanManageRoster = req.CanManageRoster; level.CanManageLocations = req.CanManageLocations;
        level.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(level);
    }

    [HttpDelete("license-levels/{id:guid}")]
    public async Task<IActionResult> DeleteLicenseLevel(Guid id, [FromQuery] Guid tenantId)
    {
        var level = await _db.MedLicenseLevels.FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId);
        if (level == null) return NotFound();
        bool hasPersonnel = await _db.MedPersonnel.AnyAsync(p => p.LicenseLevelId == id);
        if (hasPersonnel) return BadRequest("Cannot delete: personnel assigned to this level.");
        level.IsActive = false; level.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Tags ──────────────────────────────────────────────────────────────────

    [HttpGet("tags")]
    public async Task<IActionResult> GetTags([FromQuery] Guid tenantId)
        => Ok(await _db.MedTags.Where(t => t.TenantId == tenantId && t.IsActive).OrderBy(t => t.Name).ToListAsync());

    [HttpPost("tags")]
    public async Task<IActionResult> CreateTag([FromQuery] Guid tenantId, [FromBody] UpsertTagReq req)
    {
        if (!await TenantExistsAsync(tenantId))
            return NotFound($"Tenant '{tenantId}' not found.");
        var tag = new MedTag { TenantId = tenantId, Name = req.Name, Color = req.Color };
        _db.MedTags.Add(tag);
        await _db.SaveChangesAsync();
        return Ok(tag);
    }

    [HttpPut("tags/{id:guid}")]
    public async Task<IActionResult> UpdateTag(Guid id, [FromQuery] Guid tenantId, [FromBody] UpsertTagReq req)
    {
        var tag = await _db.MedTags.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
        if (tag == null) return NotFound();
        tag.Name = req.Name; tag.Color = req.Color;
        await _db.SaveChangesAsync();
        return Ok(tag);
    }

    [HttpDelete("tags/{id:guid}")]
    public async Task<IActionResult> DeleteTag(Guid id, [FromQuery] Guid tenantId)
    {
        var tag = await _db.MedTags.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);
        if (tag == null) return NotFound();
        tag.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Medications ───────────────────────────────────────────────────────────

    [HttpGet("medications")]
    public async Task<IActionResult> GetMedications([FromQuery] Guid tenantId, [FromQuery] string? search,
        [FromQuery] int? schedule, [FromQuery] Guid? tagId)
    {
        var q = _db.MedMedications
            .Include(m => m.Tags).ThenInclude(t => t.Tag)
            .Include(m => m.Configs)
            .Where(m => m.TenantId == tenantId && m.IsActive);

        if (!string.IsNullOrEmpty(search))
            q = q.Where(m => m.GenericName.Contains(search) || (m.BrandName != null && m.BrandName.Contains(search)));
        if (schedule.HasValue) q = q.Where(m => m.DeaSchedule == schedule.Value);
        if (tagId.HasValue) q = q.Where(m => m.Tags.Any(t => t.TagId == tagId.Value));

        return Ok(await q.OrderBy(m => m.GenericName).ToListAsync());
    }

    [HttpGet("medications/{id:guid}")]
    public async Task<IActionResult> GetMedication(Guid id, [FromQuery] Guid tenantId)
    {
        var med = await _db.MedMedications
            .Include(m => m.Tags).ThenInclude(t => t.Tag)
            .Include(m => m.Configs)
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);
        return med == null ? NotFound() : Ok(med);
    }

    [HttpPost("medications")]
    public async Task<IActionResult> CreateMedication([FromQuery] Guid tenantId, [FromBody] UpsertMedicationReq req)
    {
        if (!await TenantExistsAsync(tenantId))
            return NotFound($"Tenant '{tenantId}' not found.");
        var med = new MedMedication
        {
            TenantId = tenantId,
            GenericName = req.GenericName,
            BrandName = req.BrandName,
            DeaSchedule = req.DeaSchedule,
            NdcCode = req.NdcCode,
            Concentration = req.Concentration,
            RouteOfAdministration = req.RouteOfAdministration,
            FormDescription = req.FormDescription
        };
        _db.MedMedications.Add(med);
        await _db.SaveChangesAsync();
        return Ok(med);
    }

    [HttpPut("medications/{id:guid}")]
    public async Task<IActionResult> UpdateMedication(Guid id, [FromQuery] Guid tenantId, [FromBody] UpsertMedicationReq req)
    {
        var med = await _db.MedMedications.FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);
        if (med == null) return NotFound();
        med.GenericName = req.GenericName; med.BrandName = req.BrandName; med.DeaSchedule = req.DeaSchedule;
        med.NdcCode = req.NdcCode; med.Concentration = req.Concentration;
        med.RouteOfAdministration = req.RouteOfAdministration; med.FormDescription = req.FormDescription;
        med.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(med);
    }

    [HttpDelete("medications/{id:guid}")]
    public async Task<IActionResult> DeleteMedication(Guid id, [FromQuery] Guid tenantId)
    {
        var med = await _db.MedMedications.FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);
        if (med == null) return NotFound();
        med.IsActive = false; med.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("medications/{id:guid}/tags")]
    public async Task<IActionResult> AddTag(Guid id, [FromQuery] Guid tenantId, [FromBody] AddTagReq req)
    {
        var med = await _db.MedMedications.FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);
        if (med == null) return NotFound();
        if (await _db.MedMedicationTags.AnyAsync(t => t.MedicationId == id && t.TagId == req.TagId))
            return Conflict("Tag already applied.");
        _db.MedMedicationTags.Add(new MedMedicationTag { MedicationId = id, TagId = req.TagId });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("medications/{id:guid}/tags/{tagId:guid}")]
    public async Task<IActionResult> RemoveTag(Guid id, Guid tagId, [FromQuery] Guid tenantId)
    {
        var row = await _db.MedMedicationTags.FirstOrDefaultAsync(t => t.MedicationId == id && t.TagId == tagId);
        if (row == null) return NotFound();
        _db.MedMedicationTags.Remove(row);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>GET /api/med/medications/lookup-barcode?barcode= — queries OpenFDA to prefill medication info.</summary>
    [HttpGet("medications/lookup-barcode")]
    public async Task<IActionResult> LookupBarcode([FromQuery] string barcode)
    {
        if (string.IsNullOrWhiteSpace(barcode)) return BadRequest("barcode required");
        try
        {
            var client = _http.CreateClient("openfda");
            var encoded = Uri.EscapeDataString($"\"{barcode}\"");
            var resp = await client.GetAsync($"/drug/ndc.json?search=package_ndc:{encoded}&limit=1");
            if (!resp.IsSuccessStatusCode) return NotFound(new { message = "Not found in OpenFDA" });

            var json = await resp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var results = doc.RootElement.GetProperty("results");
            if (results.GetArrayLength() == 0) return NotFound(new { message = "Not found in OpenFDA" });

            var r = results[0];
            string GetStr(string key) => r.TryGetProperty(key, out var v) ? v.GetString() ?? "" : "";
            string GetArr(string key) => r.TryGetProperty(key, out var v) && v.GetArrayLength() > 0
                ? v[0].GetString() ?? "" : "";

            return Ok(new
            {
                GenericName = GetStr("generic_name"),
                BrandName = GetStr("brand_name"),
                NdcCode = barcode,
                Concentration = GetArr("active_ingredients"),
                RouteOfAdministration = GetArr("route"),
                FormDescription = GetStr("dosage_form"),
                Manufacturer = GetStr("labeler_name"),
                DeaSchedule = 0 // not available in NDC, must be set manually
            });
        }
        catch
        {
            return StatusCode(502, new { message = "OpenFDA lookup failed" });
        }
    }

    // ── Medication Config ─────────────────────────────────────────────────────

    [HttpGet("medications/{id:guid}/config")]
    public async Task<IActionResult> GetMedConfig(Guid id, [FromQuery] Guid tenantId)
    {
        var cfg = await _db.MedMedicationConfigs.FirstOrDefaultAsync(c => c.MedicationId == id && c.TenantId == tenantId);
        return Ok(cfg ?? new MedMedicationConfig { MedicationId = id, TenantId = tenantId });
    }

    [HttpPut("medications/{id:guid}/config")]
    public async Task<IActionResult> UpsertMedConfig(Guid id, [FromQuery] Guid tenantId, [FromBody] UpsertMedConfigReq req)
    {
        var cfg = await _db.MedMedicationConfigs.FirstOrDefaultAsync(c => c.MedicationId == id && c.TenantId == tenantId);
        if (cfg == null)
        {
            cfg = new MedMedicationConfig { MedicationId = id, TenantId = tenantId };
            _db.MedMedicationConfigs.Add(cfg);
        }
        cfg.RequireWitnessForWaste = req.RequireWitnessForWaste;
        cfg.IsControlledSubstance = req.IsControlledSubstance;
        cfg.RequireSealedStorage = req.RequireSealedStorage;
        cfg.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(cfg);
    }

    // ── Personnel ─────────────────────────────────────────────────────────────

    [HttpGet("personnel")]
    public async Task<IActionResult> GetPersonnel([FromQuery] Guid tenantId, [FromQuery] bool? active)
    {
        var q = _db.MedPersonnel.Include(p => p.LicenseLevel).Where(p => p.TenantId == tenantId);
        if (active.HasValue) q = q.Where(p => p.IsActive == active.Value);
        return Ok(await q.OrderBy(p => p.LastName).ThenBy(p => p.FirstName).ToListAsync());
    }

    [HttpGet("personnel/{id:guid}")]
    public async Task<IActionResult> GetPersonnelById(Guid id, [FromQuery] Guid tenantId)
    {
        var p = await _db.MedPersonnel.Include(x => x.LicenseLevel).FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        return p == null ? NotFound() : Ok(p);
    }

    [HttpPost("personnel")]
    public async Task<IActionResult> CreatePersonnel([FromQuery] Guid tenantId, [FromBody] UpsertPersonnelReq req)
    {
        if (!await TenantExistsAsync(tenantId))
            return NotFound($"Tenant '{tenantId}' not found.");
        var p = new MedPersonnel
        {
            TenantId = tenantId,
            LicenseLevelId = req.LicenseLevelId,
            FirstName = req.FirstName,
            LastName = req.LastName,
            BadgeNumber = req.BadgeNumber,
            Email = req.Email,
            KeycloakUserId = req.KeycloakUserId
        };
        _db.MedPersonnel.Add(p);
        await _db.SaveChangesAsync();
        return Ok(p);
    }

    [HttpPut("personnel/{id:guid}")]
    public async Task<IActionResult> UpdatePersonnel(Guid id, [FromQuery] Guid tenantId, [FromBody] UpsertPersonnelReq req)
    {
        var p = await _db.MedPersonnel.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (p == null) return NotFound();
        p.LicenseLevelId = req.LicenseLevelId; p.FirstName = req.FirstName; p.LastName = req.LastName;
        p.BadgeNumber = req.BadgeNumber; p.Email = req.Email; p.KeycloakUserId = req.KeycloakUserId;
        if (req.IsActive.HasValue) p.IsActive = req.IsActive.Value;
        p.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(p);
    }

    [HttpDelete("personnel/{id:guid}")]
    public async Task<IActionResult> DeletePersonnel(Guid id, [FromQuery] Guid tenantId)
    {
        var p = await _db.MedPersonnel.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (p == null) return NotFound();
        p.IsActive = false; p.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Storage Locations ─────────────────────────────────────────────────────

    [HttpGet("locations")]
    public async Task<IActionResult> GetLocations([FromQuery] Guid tenantId)
    {
        var locs = await _db.MedStorageLocations
            .Include(l => l.Containers).ThenInclude(c => c.Vials).ThenInclude(v => v.Medication)
            .Where(l => l.TenantId == tenantId && l.IsActive)
            .OrderBy(l => l.Name)
            .ToListAsync();
        return Ok(locs);
    }

    [HttpGet("locations/{id:guid}")]
    public async Task<IActionResult> GetLocation(Guid id, [FromQuery] Guid tenantId)
    {
        var loc = await _db.MedStorageLocations
            .Include(l => l.Containers).ThenInclude(c => c.Vials).ThenInclude(v => v.Medication)
            .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId);
        return loc == null ? NotFound() : Ok(loc);
    }

    [HttpPost("locations")]
    public async Task<IActionResult> CreateLocation([FromQuery] Guid tenantId, [FromBody] UpsertLocationReq req)
    {
        if (!await TenantExistsAsync(tenantId))
            return NotFound($"Tenant '{tenantId}' not found.");
        var loc = new MedStorageLocation { TenantId = tenantId, Name = req.Name, LocationType = req.LocationType, Description = req.Description };
        _db.MedStorageLocations.Add(loc);
        await _db.SaveChangesAsync();
        return Ok(loc);
    }

    [HttpPut("locations/{id:guid}")]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromQuery] Guid tenantId, [FromBody] UpsertLocationReq req)
    {
        var loc = await _db.MedStorageLocations.FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId);
        if (loc == null) return NotFound();
        loc.Name = req.Name; loc.LocationType = req.LocationType; loc.Description = req.Description;
        loc.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(loc);
    }

    [HttpDelete("locations/{id:guid}")]
    public async Task<IActionResult> DeleteLocation(Guid id, [FromQuery] Guid tenantId)
    {
        var loc = await _db.MedStorageLocations.FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId);
        if (loc == null) return NotFound();
        loc.IsActive = false; loc.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Containers ────────────────────────────────────────────────────────────

    [HttpGet("locations/{locationId:guid}/containers")]
    public async Task<IActionResult> GetContainers(Guid locationId)
    {
        var containers = await _db.MedContainers
            .Include(c => c.Vials).ThenInclude(v => v.Medication)
            .Where(c => c.StorageLocationId == locationId && c.IsActive)
            .ToListAsync();
        return Ok(containers);
    }

    [HttpGet("containers/{id:guid}")]
    public async Task<IActionResult> GetContainer(Guid id)
    {
        var c = await _db.MedContainers
            .Include(c => c.Vials).ThenInclude(v => v.Medication)
            .Include(c => c.StorageLocation)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (c == null) return NotFound();

        // Find last completed check for this container's location
        var lastCheck = await _db.MedCheckSessions
            .Where(s => s.StorageLocationId == c.StorageLocationId && s.Status == "completed")
            .OrderByDescending(s => s.CompletedAt)
            .Select(s => s.CompletedAt)
            .FirstOrDefaultAsync();

        var dueAt = lastCheck.HasValue
            ? lastCheck.Value.AddHours(c.CheckFrequencyHours)
            : DateTimeOffset.UtcNow.AddDays(-1);

        return Ok(new { container = c, lastCheckedAt = lastCheck, nextDueAt = dueAt, isOverdue = dueAt <= DateTimeOffset.UtcNow });
    }

    [HttpPost("locations/{locationId:guid}/containers")]
    public async Task<IActionResult> CreateContainer(Guid locationId, [FromBody] UpsertContainerReq req)
    {
        var c = new MedContainer
        {
            StorageLocationId = locationId,
            Name = req.Name,
            ContainerType = req.ContainerType,
            IsSealable = req.IsSealable,
            IsSealed = req.IsSealed,
            SealNumber = req.SealNumber,
            CheckFrequencyHours = req.CheckFrequencyHours,
            CheckRequiresWitness = req.CheckRequiresWitness,
            IsControlledSubstance = req.IsControlledSubstance
        };
        _db.MedContainers.Add(c);
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpPut("containers/{id:guid}")]
    public async Task<IActionResult> UpdateContainer(Guid id, [FromBody] UpsertContainerReq req)
    {
        var c = await _db.MedContainers.FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound();
        c.Name = req.Name; c.ContainerType = req.ContainerType; c.IsSealable = req.IsSealable;
        c.IsSealed = req.IsSealed; c.SealNumber = req.SealNumber;
        c.CheckFrequencyHours = req.CheckFrequencyHours; c.CheckRequiresWitness = req.CheckRequiresWitness;
        c.IsControlledSubstance = req.IsControlledSubstance; c.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpPost("containers/{id:guid}/break-seal")]
    public async Task<IActionResult> BreakSeal(Guid id, [FromBody] SealEventReq req)
    {
        var c = await _db.MedContainers.Include(x => x.Vials).FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound();
        if (!c.IsSealed) return BadRequest("Container is not sealed.");

        var oldSeal = c.SealNumber;
        c.IsSealed = false;
        c.SealNumber = null;
        c.UpdatedAt = DateTimeOffset.UtcNow;

        // Record a seal-broken event on each vial in the container
        foreach (var v in c.Vials.Where(v => v.Status == "stocked" || v.Status == "in-use"))
        {
            _db.MedVialEvents.Add(new MedVialEvent
            {
                VialId = v.Id,
                PersonnelId = req.PersonnelId,
                WitnessPersonnelId = req.WitnessPersonnelId,
                EventType = "seal-broken",
                Notes = $"Container '{c.Name}' seal {oldSeal} broken. {req.Notes}".Trim(),
                OccurredAt = DateTimeOffset.UtcNow
            });
        }
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpPost("containers/{id:guid}/apply-seal")]
    public async Task<IActionResult> ApplySeal(Guid id, [FromBody] ApplySealReq req)
    {
        var c = await _db.MedContainers.Include(x => x.Vials).FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound();
        if (!c.IsSealable) return BadRequest("Container is not sealable.");
        if (c.IsSealed) return BadRequest("Container is already sealed.");

        c.IsSealed = true;
        c.SealNumber = req.SealNumber;
        c.UpdatedAt = DateTimeOffset.UtcNow;

        foreach (var v in c.Vials.Where(v => v.Status == "stocked" || v.Status == "in-use"))
        {
            _db.MedVialEvents.Add(new MedVialEvent
            {
                VialId = v.Id,
                PersonnelId = req.PersonnelId,
                EventType = "seal-applied",
                Notes = $"Container '{c.Name}' sealed with #{req.SealNumber}.",
                OccurredAt = DateTimeOffset.UtcNow
            });
        }
        await _db.SaveChangesAsync();
        return Ok(c);
    }

    [HttpGet("containers/{id:guid}/check-due")]
    public async Task<IActionResult> ContainerCheckDue(Guid id)
    {
        var c = await _db.MedContainers.FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound();
        var last = await _db.MedCheckSessions
            .Where(s => s.StorageLocationId == c.StorageLocationId && s.Status == "completed")
            .OrderByDescending(s => s.CompletedAt)
            .Select(s => s.CompletedAt)
            .FirstOrDefaultAsync();
        var due = last.HasValue ? last.Value.AddHours(c.CheckFrequencyHours) : DateTimeOffset.UtcNow.AddDays(-1);
        return Ok(new { lastCheckedAt = last, nextDueAt = due, isOverdue = due <= DateTimeOffset.UtcNow });
    }

    // ── Vials ─────────────────────────────────────────────────────────────────

    [HttpGet("vials")]
    public async Task<IActionResult> GetVials([FromQuery] Guid tenantId, [FromQuery] string? status,
        [FromQuery] Guid? containerId, [FromQuery] Guid? locationId, [FromQuery] Guid? medicationId,
        [FromQuery] string? filter)
    {
        var q = _db.MedVials
            .Include(v => v.Medication)
            .Include(v => v.Container).ThenInclude(c => c!.StorageLocation)
            .Where(v => v.TenantId == tenantId);

        if (!string.IsNullOrEmpty(status)) q = q.Where(v => v.Status == status);
        if (containerId.HasValue) q = q.Where(v => v.ContainerId == containerId);
        if (medicationId.HasValue) q = q.Where(v => v.MedicationId == medicationId);
        if (locationId.HasValue) q = q.Where(v => v.Container != null && v.Container.StorageLocationId == locationId);

        if (filter == "expiring")
        {
            var cutoff = DateTimeOffset.UtcNow.AddDays(30);
            q = q.Where(v => v.ExpiresAt <= cutoff && v.Status != "disposed" && v.Status != "expired" && v.Status != "wasted");
            q = q.OrderBy(v => v.ExpiresAt);
        }
        else
        {
            q = q.OrderByDescending(v => v.UpdatedAt);
        }

        return Ok(await q.ToListAsync());
    }

    /// <summary>GET /api/med/vials/scan?code= — lookup by AgencyLabelCode or ManufacturerBarcode.</summary>
    [HttpGet("vials/scan")]
    public async Task<IActionResult> ScanVial([FromQuery] Guid tenantId, [FromQuery] string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return BadRequest("code required");
        var vial = await _db.MedVials
            .Include(v => v.Medication).ThenInclude(m => m!.Configs)
            .Include(v => v.Container).ThenInclude(c => c!.StorageLocation)
            .Include(v => v.Events).ThenInclude(e => e.Personnel)
            .FirstOrDefaultAsync(v => v.TenantId == tenantId &&
                (v.AgencyLabelCode == code || v.ManufacturerBarcode == code));
        return vial == null ? NotFound() : Ok(vial);
    }

    [HttpGet("vials/{id:guid}")]
    public async Task<IActionResult> GetVial(Guid id, [FromQuery] Guid tenantId)
    {
        var vial = await _db.MedVials
            .Include(v => v.Medication).ThenInclude(m => m!.Tags).ThenInclude(t => t.Tag)
            .Include(v => v.Medication).ThenInclude(m => m!.Configs)
            .Include(v => v.Container).ThenInclude(c => c!.StorageLocation)
            .Include(v => v.Events.OrderByDescending(e => e.OccurredAt)).ThenInclude(e => e.Personnel)
            .Include(v => v.Events).ThenInclude(e => e.WitnessPersonnel)
            .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId);
        return vial == null ? NotFound() : Ok(vial);
    }

    [HttpPost("vials")]
    public async Task<IActionResult> CreateVial([FromQuery] Guid tenantId, [FromBody] CreateVialReq req)
    {
        var vial = new MedVial
        {
            TenantId = tenantId,
            MedicationId = req.MedicationId,
            LotNumber = req.LotNumber,
            ManufacturerBarcode = req.ManufacturerBarcode,
            AgencyLabelCode = req.AgencyLabelCode,
            TotalVolumeMl = req.TotalVolumeMl,
            RemainingVolumeMl = req.TotalVolumeMl,
            Status = "ordered",
            ExpiresAt = req.ExpiresAt,
            OrderedAt = DateTimeOffset.UtcNow
        };
        _db.MedVials.Add(vial);
        _db.MedVialEvents.Add(new MedVialEvent { VialId = vial.Id, PersonnelId = req.PersonnelId, EventType = "ordered", Notes = req.Notes, OccurredAt = DateTimeOffset.UtcNow });
        await _db.SaveChangesAsync();
        return Ok(vial);
    }

    [HttpPost("vials/{id:guid}/receive")]
    public async Task<IActionResult> ReceiveVial(Guid id, [FromQuery] Guid tenantId, [FromBody] ReceiveVialReq req)
    {
        var v = await _db.MedVials.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (v == null) return NotFound();
        v.Status = "received"; v.ReceivedAt = DateTimeOffset.UtcNow;
        v.LotNumber = req.LotNumber; v.ExpiresAt = req.ExpiresAt;
        v.TotalVolumeMl = req.TotalVolumeMl; v.RemainingVolumeMl = req.TotalVolumeMl;
        v.UpdatedAt = DateTimeOffset.UtcNow;
        _db.MedVialEvents.Add(new MedVialEvent { VialId = id, PersonnelId = req.PersonnelId, EventType = "received", Notes = req.Notes, OccurredAt = DateTimeOffset.UtcNow });
        await _db.SaveChangesAsync();
        return Ok(v);
    }

    [HttpPost("vials/{id:guid}/stock")]
    public async Task<IActionResult> StockVial(Guid id, [FromQuery] Guid tenantId, [FromBody] StockVialReq req)
    {
        var v = await _db.MedVials.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (v == null) return NotFound();
        v.Status = "stocked"; v.ContainerId = req.ContainerId; v.StockedAt = DateTimeOffset.UtcNow; v.UpdatedAt = DateTimeOffset.UtcNow;
        _db.MedVialEvents.Add(new MedVialEvent { VialId = id, PersonnelId = req.PersonnelId, EventType = "stocked", ToContainerId = req.ContainerId, Notes = req.Notes, OccurredAt = DateTimeOffset.UtcNow });
        await _db.SaveChangesAsync();
        return Ok(v);
    }

    [HttpPost("vials/{id:guid}/move")]
    public async Task<IActionResult> MoveVial(Guid id, [FromQuery] Guid tenantId, [FromBody] MoveVialReq req)
    {
        var v = await _db.MedVials.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (v == null) return NotFound();
        var from = v.ContainerId;
        v.ContainerId = req.ToContainerId; v.UpdatedAt = DateTimeOffset.UtcNow;
        _db.MedVialEvents.Add(new MedVialEvent { VialId = id, PersonnelId = req.PersonnelId, EventType = "moved", FromContainerId = from, ToContainerId = req.ToContainerId, Notes = req.Notes, OccurredAt = DateTimeOffset.UtcNow });
        await _db.SaveChangesAsync();
        return Ok(v);
    }

    [HttpPost("vials/{id:guid}/administer")]
    public async Task<IActionResult> AdministerVial(Guid id, [FromQuery] Guid tenantId, [FromBody] AdministerReq req)
    {
        var v = await _db.MedVials.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (v == null) return NotFound();
        if (req.DosageAmountMl > v.RemainingVolumeMl)
            return BadRequest($"Dosage ({req.DosageAmountMl} mL) exceeds remaining volume ({v.RemainingVolumeMl} mL).");

        v.RemainingVolumeMl -= req.DosageAmountMl;
        if (v.RemainingVolumeMl <= 0) { v.RemainingVolumeMl = 0; v.Status = "administered"; v.AdministeredAt = req.OccurredAt ?? DateTimeOffset.UtcNow; }
        else { v.Status = "in-use"; }
        v.UpdatedAt = DateTimeOffset.UtcNow;

        _db.MedVialEvents.Add(new MedVialEvent
        {
            VialId = id, PersonnelId = req.PersonnelId, EventType = "administered",
            DosageAmountMl = req.DosageAmountMl, IncidentNumber = req.IncidentNumber,
            PatientWeightKg = req.PatientWeightKg, Notes = req.Notes,
            OccurredAt = req.OccurredAt ?? DateTimeOffset.UtcNow
        });
        await _db.SaveChangesAsync();
        return Ok(v);
    }

    [HttpPost("vials/{id:guid}/waste")]
    public async Task<IActionResult> WasteVial(Guid id, [FromQuery] Guid tenantId, [FromBody] WasteReq req)
    {
        var v = await _db.MedVials.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (v == null) return NotFound();

        // Enforce witness requirement from medication config
        var cfg = await _db.MedMedicationConfigs.FirstOrDefaultAsync(c => c.MedicationId == v.MedicationId && c.TenantId == tenantId);
        if (cfg?.RequireWitnessForWaste == true && !req.WitnessPersonnelId.HasValue)
            return BadRequest("A witness is required to waste this medication.");

        v.RemainingVolumeMl -= req.DosageAmountMl;
        if (v.RemainingVolumeMl <= 0) { v.RemainingVolumeMl = 0; v.Status = "wasted"; v.WastedAt = req.OccurredAt ?? DateTimeOffset.UtcNow; }
        v.UpdatedAt = DateTimeOffset.UtcNow;

        _db.MedVialEvents.Add(new MedVialEvent
        {
            VialId = id, PersonnelId = req.PersonnelId, WitnessPersonnelId = req.WitnessPersonnelId,
            EventType = "wasted", DosageAmountMl = req.DosageAmountMl, Notes = req.Notes,
            OccurredAt = req.OccurredAt ?? DateTimeOffset.UtcNow
        });
        await _db.SaveChangesAsync();
        return Ok(v);
    }

    [HttpPost("vials/{id:guid}/dispose")]
    public async Task<IActionResult> DisposeVial(Guid id, [FromQuery] Guid tenantId, [FromBody] SimpleVialActionReq req)
    {
        var v = await _db.MedVials.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (v == null) return NotFound();
        v.Status = "disposed"; v.DisposedAt = DateTimeOffset.UtcNow; v.ContainerId = null; v.UpdatedAt = DateTimeOffset.UtcNow;
        _db.MedVialEvents.Add(new MedVialEvent { VialId = id, PersonnelId = req.PersonnelId, EventType = "disposed", Notes = req.Notes, OccurredAt = DateTimeOffset.UtcNow });
        await _db.SaveChangesAsync();
        return Ok(v);
    }

    [HttpPost("vials/{id:guid}/expire")]
    public async Task<IActionResult> ExpireVial(Guid id, [FromQuery] Guid tenantId, [FromBody] SimpleVialActionReq req)
    {
        var v = await _db.MedVials.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (v == null) return NotFound();
        v.Status = "expired"; v.ContainerId = null; v.UpdatedAt = DateTimeOffset.UtcNow;
        _db.MedVialEvents.Add(new MedVialEvent { VialId = id, PersonnelId = req.PersonnelId, EventType = "expired", Notes = req.Notes, OccurredAt = DateTimeOffset.UtcNow });
        await _db.SaveChangesAsync();
        return Ok(v);
    }

    [HttpGet("vials/{id:guid}/events")]
    public async Task<IActionResult> GetVialEvents(Guid id, [FromQuery] Guid tenantId)
    {
        var vial = await _db.MedVials.FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId);
        if (vial == null) return NotFound();
        var events = await _db.MedVialEvents
            .Include(e => e.Personnel)
            .Include(e => e.WitnessPersonnel)
            .Where(e => e.VialId == id)
            .OrderByDescending(e => e.OccurredAt)
            .ToListAsync();
        return Ok(events);
    }

    // ── Check Sessions ────────────────────────────────────────────────────────

    [HttpGet("checks")]
    public async Task<IActionResult> GetCheckSessions([FromQuery] Guid tenantId, [FromQuery] Guid? locationId,
        [FromQuery] string? status, [FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to)
    {
        var q = _db.MedCheckSessions
            .Include(s => s.StorageLocation)
            .Include(s => s.Personnel)
            .Include(s => s.WitnessPersonnel)
            .Where(s => s.TenantId == tenantId);

        if (locationId.HasValue) q = q.Where(s => s.StorageLocationId == locationId.Value);
        if (!string.IsNullOrEmpty(status)) q = q.Where(s => s.Status == status);
        if (from.HasValue) q = q.Where(s => s.StartedAt >= from.Value);
        if (to.HasValue) q = q.Where(s => s.StartedAt <= to.Value);

        return Ok(await q.OrderByDescending(s => s.StartedAt).Take(100).ToListAsync());
    }

    [HttpPost("checks")]
    public async Task<IActionResult> CreateCheckSession([FromQuery] Guid tenantId, [FromBody] CreateCheckSessionReq req)
    {
        var session = new MedCheckSession
        {
            TenantId = tenantId,
            StorageLocationId = req.StorageLocationId,
            PersonnelId = req.PersonnelId,
            WitnessPersonnelId = req.WitnessPersonnelId,
            Status = "in-progress",
            StartedAt = DateTimeOffset.UtcNow
        };
        _db.MedCheckSessions.Add(session);
        await _db.SaveChangesAsync();
        return Ok(session);
    }

    [HttpGet("checks/{id:guid}")]
    public async Task<IActionResult> GetCheckSession(Guid id, [FromQuery] Guid tenantId)
    {
        var s = await _db.MedCheckSessions
            .Include(x => x.StorageLocation).ThenInclude(l => l.Containers).ThenInclude(c => c.Vials).ThenInclude(v => v.Medication)
            .Include(x => x.Personnel)
            .Include(x => x.WitnessPersonnel)
            .Include(x => x.Items).ThenInclude(i => i.Container)
            .Include(x => x.Items).ThenInclude(i => i.Vial)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        return s == null ? NotFound() : Ok(s);
    }

    [HttpPost("checks/{id:guid}/items")]
    public async Task<IActionResult> AddCheckItem(Guid id, [FromQuery] Guid tenantId, [FromBody] AddCheckItemReq req)
    {
        var session = await _db.MedCheckSessions.FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);
        if (session == null) return NotFound();
        if (session.Status != "in-progress") return BadRequest("Session is not in progress.");

        var item = new MedCheckItem
        {
            SessionId = id,
            ContainerId = req.ContainerId,
            VialId = req.VialId,
            SealIntact = req.SealIntact,
            Passed = req.Passed,
            Discrepancy = req.Discrepancy,
            CheckedAt = DateTimeOffset.UtcNow
        };
        _db.MedCheckItems.Add(item);

        // If a vial is being checked, record a "checked" event
        if (req.VialId.HasValue)
        {
            _db.MedVialEvents.Add(new MedVialEvent
            {
                VialId = req.VialId.Value,
                PersonnelId = session.PersonnelId,
                EventType = "checked",
                Notes = req.Passed ? "Check passed." : $"Check failed: {req.Discrepancy}",
                OccurredAt = DateTimeOffset.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPost("checks/{id:guid}/complete")]
    public async Task<IActionResult> CompleteCheckSession(Guid id, [FromQuery] Guid tenantId, [FromBody] CompleteCheckReq req)
    {
        var s = await _db.MedCheckSessions.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (s == null) return NotFound();
        if (s.Status != "in-progress") return BadRequest("Session is not in progress.");
        s.Status = "completed"; s.CompletedAt = DateTimeOffset.UtcNow; s.Notes = req.Notes;
        await _db.SaveChangesAsync();
        return Ok(s);
    }

    [HttpPost("checks/{id:guid}/abort")]
    public async Task<IActionResult> AbortCheckSession(Guid id, [FromQuery] Guid tenantId)
    {
        var s = await _db.MedCheckSessions.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (s == null) return NotFound();
        s.Status = "aborted";
        await _db.SaveChangesAsync();
        return Ok(s);
    }

    // ── Agency Config ─────────────────────────────────────────────────────────

    /// <summary>GET /api/med/agency-config?tenantId= — get (or auto-create) agency config.</summary>
    [HttpGet("agency-config")]
    public async Task<IActionResult> GetAgencyConfig([FromQuery] Guid tenantId)
    {
        if (!await TenantExistsAsync(tenantId))
            return NotFound($"Tenant '{tenantId}' not found.");
        var cfg = await _db.MedAgencyConfigs.FirstOrDefaultAsync(c => c.TenantId == tenantId);
        if (cfg == null)
        {
            cfg = new MedAgencyConfig { TenantId = tenantId };
            _db.MedAgencyConfigs.Add(cfg);
            await _db.SaveChangesAsync();
        }
        return Ok(cfg);
    }

    /// <summary>PUT /api/med/agency-config?tenantId= — update agency config.</summary>
    [HttpPut("agency-config")]
    public async Task<IActionResult> UpdateAgencyConfig([FromQuery] Guid tenantId, [FromBody] UpsertAgencyConfigReq req)
    {
        var cfg = await _db.MedAgencyConfigs.FirstOrDefaultAsync(c => c.TenantId == tenantId);
        if (cfg == null)
        {
            cfg = new MedAgencyConfig { TenantId = tenantId };
            _db.MedAgencyConfigs.Add(cfg);
        }
        cfg.AgencyName = req.AgencyName;
        cfg.AgencyLicenseNumber = req.AgencyLicenseNumber;
        cfg.EnableVialTracking = req.EnableVialTracking;
        cfg.EnableDailyChecks = req.EnableDailyChecks;
        cfg.EnableControlledSubstanceLog = req.EnableControlledSubstanceLog;
        cfg.EnableExpiryAlerts = req.EnableExpiryAlerts;
        cfg.EnableSealedContainers = req.EnableSealedContainers;
        cfg.EnableOpenFdaLookup = req.EnableOpenFdaLookup;
        cfg.EnableReporting = req.EnableReporting;
        cfg.EnforceRolePermissions = req.EnforceRolePermissions;
        cfg.ReportVialUsage = req.ReportVialUsage;
        cfg.ReportWasteLog = req.ReportWasteLog;
        cfg.ReportCheckCompliance = req.ReportCheckCompliance;
        cfg.ReportExpiryTracking = req.ReportExpiryTracking;
        cfg.ReportInventorySnapshot = req.ReportInventorySnapshot;
        cfg.DefaultCheckFrequencyHours = req.DefaultCheckFrequencyHours;
        cfg.ExpiryWarningDays = req.ExpiryWarningDays;
        cfg.RequireWitnessForAllWaste = req.RequireWitnessForAllWaste;
        cfg.RequireWitnessForAllChecks = req.RequireWitnessForAllChecks;
        cfg.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(cfg);
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    /// <summary>GET /api/med/my-permissions?tenantId=&username= — resolve current user's license level.</summary>
    [HttpGet("my-permissions")]
    public async Task<IActionResult> GetMyPermissions([FromQuery] Guid tenantId, [FromQuery] string username)
    {
        var personnel = await _db.MedPersonnel
            .Include(p => p.LicenseLevel)
            .Where(p => p.TenantId == tenantId && p.IsActive &&
                        (p.KeycloakUserId == username || p.Email == username))
            .FirstOrDefaultAsync();

        if (personnel?.LicenseLevel == null)
        {
            // Unknown user — return a no-permission stub
            return Ok(new
            {
                Found = false,
                PersonnelId = (Guid?)null,
                Name = username,
                LicenseLevelName = "Unknown",
                Rank = -1,
                CanAdminister = false, CanWaste = false, CanWitness = false,
                CanStock = false, CanOrder = false, CanReceive = false, CanMove = false,
                CanPerformCheck = false, CanManageCatalog = false, CanManageRoster = false,
                CanManageLocations = false,
            });
        }

        var ll = personnel.LicenseLevel;
        return Ok(new
        {
            Found = true,
            PersonnelId = personnel.Id,
            Name = $"{personnel.FirstName} {personnel.LastName}",
            LicenseLevelName = ll.Name,
            ll.Rank,
            ll.CanAdminister, ll.CanWaste, ll.CanWitness,
            ll.CanStock, ll.CanOrder, ll.CanReceive, ll.CanMove,
            ll.CanPerformCheck, ll.CanManageCatalog, ll.CanManageRoster,
            ll.CanManageLocations,
        });
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    /// <summary>GET /api/med/reports/vial-usage?tenantId=&from=&to= — administered vial events grouped by medication.</summary>
    [HttpGet("reports/vial-usage")]
    public async Task<IActionResult> ReportVialUsage(
        [FromQuery] Guid tenantId,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to)
    {
        var q = _db.MedVialEvents
            .Include(e => e.Vial).ThenInclude(v => v!.Medication)
            .Include(e => e.Personnel)
            .Where(e => e.Vial!.TenantId == tenantId && e.EventType == "administered");
        if (from.HasValue) q = q.Where(e => e.OccurredAt >= from.Value);
        if (to.HasValue)   q = q.Where(e => e.OccurredAt <= to.Value);

        var events = await q.OrderByDescending(e => e.OccurredAt).ToListAsync();

        var grouped = events
            .GroupBy(e => e.Vial?.Medication?.GenericName ?? "Unknown")
            .Select(g => new
            {
                MedicationName = g.Key,
                TotalDoses = g.Count(),
                TotalVolumeMl = g.Sum(e => e.DosageAmountMl ?? 0),
                Events = g.Select(e => new
                {
                    e.Id, OccurredAt = e.OccurredAt.ToString("o"),
                    DosageAmountMl = e.DosageAmountMl,
                    IncidentNumber = e.IncidentNumber,
                    PersonnelName = e.Personnel != null ? $"{e.Personnel.FirstName} {e.Personnel.LastName}" : null,
                    e.Notes
                })
            });

        return Ok(grouped);
    }

    /// <summary>GET /api/med/reports/waste-log?tenantId=&from=&to= — wasted controlled substance log.</summary>
    [HttpGet("reports/waste-log")]
    public async Task<IActionResult> ReportWasteLog(
        [FromQuery] Guid tenantId,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to)
    {
        var q = _db.MedVialEvents
            .Include(e => e.Vial).ThenInclude(v => v!.Medication)
            .Include(e => e.Personnel)
            .Include(e => e.WitnessPersonnel)
            .Where(e => e.Vial!.TenantId == tenantId && e.EventType == "wasted");
        if (from.HasValue) q = q.Where(e => e.OccurredAt >= from.Value);
        if (to.HasValue)   q = q.Where(e => e.OccurredAt <= to.Value);

        var events = await q.OrderByDescending(e => e.OccurredAt).ToListAsync();
        return Ok(events.Select(e => new
        {
            e.Id,
            OccurredAt = e.OccurredAt.ToString("o"),
            Medication = e.Vial?.Medication?.GenericName,
            LotNumber = e.Vial?.LotNumber,
            DosageAmountMl = e.DosageAmountMl,
            PersonnelName = e.Personnel != null ? $"{e.Personnel.FirstName} {e.Personnel.LastName}" : null,
            WitnessName = e.WitnessPersonnel != null ? $"{e.WitnessPersonnel.FirstName} {e.WitnessPersonnel.LastName}" : null,
            HasWitness = e.WitnessPersonnelId.HasValue,
            e.Notes
        }));
    }

    /// <summary>GET /api/med/reports/check-compliance?tenantId=&from=&to=</summary>
    [HttpGet("reports/check-compliance")]
    public async Task<IActionResult> ReportCheckCompliance(
        [FromQuery] Guid tenantId,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to)
    {
        var q = _db.MedCheckSessions
            .Include(s => s.StorageLocation)
            .Include(s => s.Personnel)
            .Where(s => s.TenantId == tenantId);
        if (from.HasValue) q = q.Where(s => s.StartedAt >= from.Value);
        if (to.HasValue)   q = q.Where(s => s.StartedAt <= to.Value);

        var sessions = await q.OrderByDescending(s => s.StartedAt).ToListAsync();
        var total = sessions.Count;
        var completed = sessions.Count(s => s.Status == "completed");
        var aborted = sessions.Count(s => s.Status == "aborted");

        return Ok(new
        {
            TotalSessions = total,
            CompletedSessions = completed,
            AbortedSessions = aborted,
            ComplianceRate = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0,
            ByLocation = sessions
                .GroupBy(s => s.StorageLocation?.Name ?? "Unknown")
                .Select(g => new
                {
                    Location = g.Key,
                    Total = g.Count(),
                    Completed = g.Count(s => s.Status == "completed"),
                })
                .OrderByDescending(x => x.Total),
            RecentSessions = sessions.Take(50).Select(s => new
            {
                s.Id,
                Location = s.StorageLocation?.Name,
                StartedAt = s.StartedAt.ToString("o"),
                CompletedAt = s.CompletedAt?.ToString("o"),
                s.Status,
                PersonnelName = s.Personnel != null ? $"{s.Personnel.FirstName} {s.Personnel.LastName}" : null,
            })
        });
    }

    /// <summary>GET /api/med/reports/expiry?tenantId= — current expiry status of all active vials.</summary>
    [HttpGet("reports/expiry")]
    public async Task<IActionResult> ReportExpiry([FromQuery] Guid tenantId, [FromQuery] int warningDays = 30)
    {
        var now = DateTimeOffset.UtcNow;
        var warnDate = now.AddDays(warningDays);

        var vials = await _db.MedVials
            .Include(v => v.Medication)
            .Include(v => v.Container).ThenInclude(c => c!.StorageLocation)
            .Where(v => v.TenantId == tenantId &&
                        v.Status != "disposed" && v.Status != "expired" && v.Status != "wasted" && v.Status != "administered")
            .OrderBy(v => v.ExpiresAt)
            .ToListAsync();

        return Ok(new
        {
            Expired  = vials.Where(v => v.ExpiresAt.HasValue && v.ExpiresAt <= now).Select(v => VialSummary(v)),
            Critical = vials.Where(v => v.ExpiresAt.HasValue && v.ExpiresAt > now && v.ExpiresAt <= now.AddDays(7)).Select(v => VialSummary(v)),
            Warning  = vials.Where(v => v.ExpiresAt.HasValue && v.ExpiresAt > now.AddDays(7) && v.ExpiresAt <= warnDate).Select(v => VialSummary(v)),
            Ok       = vials.Where(v => !v.ExpiresAt.HasValue || v.ExpiresAt > warnDate).Select(v => VialSummary(v)),
        });

        static object VialSummary(MedVial v) => new
        {
            v.Id, v.LotNumber, v.AgencyLabelCode,
            Medication = v.Medication?.GenericName,
            ExpiresAt = v.ExpiresAt?.ToString("o"),
            Location = v.Container?.StorageLocation?.Name,
            Container = v.Container?.Name,
            v.Status,
        };
    }

    /// <summary>GET /api/med/reports/inventory?tenantId= — current inventory snapshot grouped by medication.</summary>
    [HttpGet("reports/inventory")]
    public async Task<IActionResult> ReportInventory([FromQuery] Guid tenantId)
    {
        var vials = await _db.MedVials
            .Include(v => v.Medication)
            .Include(v => v.Container).ThenInclude(c => c!.StorageLocation)
            .Where(v => v.TenantId == tenantId && (v.Status == "stocked" || v.Status == "received" || v.Status == "in-use"))
            .ToListAsync();

        var grouped = vials
            .GroupBy(v => v.Medication?.GenericName ?? "Unknown")
            .Select(g => new
            {
                Medication = g.Key,
                TotalVials = g.Count(),
                TotalVolumeMl = g.Sum(v => v.RemainingVolumeMl),
                ByLocation = g
                    .GroupBy(v => v.Container?.StorageLocation?.Name ?? "Unassigned")
                    .Select(lg => new { Location = lg.Key, Count = lg.Count() })
            });

        return Ok(grouped);
    }

    // ── EMS Admin Summary (for platform admin console) ────────────────────────

    /// <summary>GET /api/med/admin-summary?tenantId= — high-level EMS stats for admin console.</summary>
    [HttpGet("admin-summary")]
    public async Task<IActionResult> AdminSummary([FromQuery] Guid tenantId)
    {
        var vialCount = await _db.MedVials.CountAsync(v => v.TenantId == tenantId && v.Status == "stocked");
        var personnelCount = await _db.MedPersonnel.CountAsync(p => p.TenantId == tenantId && p.IsActive);
        var locationCount = await _db.MedStorageLocations.CountAsync(l => l.TenantId == tenantId && l.IsActive);
        var medicationCount = await _db.MedMedications.CountAsync(m => m.TenantId == tenantId && m.IsActive);
        var lastCheckSession = await _db.MedCheckSessions
            .Where(s => s.TenantId == tenantId && s.Status == "completed")
            .OrderByDescending(s => s.CompletedAt)
            .Select(s => s.CompletedAt)
            .FirstOrDefaultAsync();
        var cfg = await _db.MedAgencyConfigs.FirstOrDefaultAsync(c => c.TenantId == tenantId);

        return Ok(new
        {
            StockedVials = vialCount,
            ActivePersonnel = personnelCount,
            ActiveLocations = locationCount,
            MedicationsInCatalog = medicationCount,
            LastCheckCompletedAt = lastCheckSession?.ToString("o"),
            AgencyName = cfg?.AgencyName,
            AgencyLicenseNumber = cfg?.AgencyLicenseNumber,
            IsConfigured = cfg != null,
        });
    }
}

// ── Request records ────────────────────────────────────────────────────────────

public record UpsertLicenseLevelReq(string Name, int Rank, bool CanAdminister, bool CanWaste, bool CanWitness,
    bool CanStock, bool CanOrder, bool CanReceive, bool CanMove, bool CanPerformCheck,
    bool CanManageCatalog, bool CanManageRoster, bool CanManageLocations);

public record UpsertTagReq(string Name, string Color);

public record UpsertMedicationReq(string GenericName, string? BrandName, int DeaSchedule, string? NdcCode,
    string? Concentration, string? RouteOfAdministration, string? FormDescription);

public record AddTagReq(Guid TagId);

public record UpsertMedConfigReq(bool RequireWitnessForWaste, bool IsControlledSubstance, bool RequireSealedStorage);

public record UpsertPersonnelReq(Guid LicenseLevelId, string FirstName, string LastName,
    string? BadgeNumber, string? Email, string? KeycloakUserId, bool? IsActive = null);

public record UpsertLocationReq(string Name, string LocationType, string? Description);

public record UpsertContainerReq(string Name, string ContainerType, bool IsSealable, bool IsSealed,
    string? SealNumber, int CheckFrequencyHours, bool CheckRequiresWitness, bool IsControlledSubstance);

public record SealEventReq(Guid PersonnelId, Guid? WitnessPersonnelId, string? Notes);

public record ApplySealReq(string SealNumber, Guid PersonnelId);

public record CreateVialReq(Guid MedicationId, string LotNumber, string? ManufacturerBarcode, string? AgencyLabelCode,
    decimal TotalVolumeMl, DateTimeOffset? ExpiresAt, Guid? PersonnelId, string? Notes);

public record ReceiveVialReq(string LotNumber, DateTimeOffset? ExpiresAt, decimal TotalVolumeMl, Guid? PersonnelId, string? Notes);

public record StockVialReq(Guid ContainerId, Guid? PersonnelId, string? Notes);

public record MoveVialReq(Guid ToContainerId, Guid? PersonnelId, string? Notes);

public record AdministerReq(decimal DosageAmountMl, string IncidentNumber, decimal? PatientWeightKg,
    Guid? PersonnelId, DateTimeOffset? OccurredAt, string? Notes);

public record WasteReq(decimal DosageAmountMl, Guid? PersonnelId, Guid? WitnessPersonnelId,
    DateTimeOffset? OccurredAt, string? Notes);

public record SimpleVialActionReq(Guid? PersonnelId, string? Notes);

public record CreateCheckSessionReq(Guid StorageLocationId, Guid PersonnelId, Guid? WitnessPersonnelId);

public record AddCheckItemReq(Guid? ContainerId, Guid? VialId, bool SealIntact, bool Passed, string? Discrepancy);

public record CompleteCheckReq(string? Notes);

public record UpsertAgencyConfigReq(
    string AgencyName, string AgencyLicenseNumber,
    bool EnableVialTracking, bool EnableDailyChecks, bool EnableControlledSubstanceLog,
    bool EnableExpiryAlerts, bool EnableSealedContainers, bool EnableOpenFdaLookup,
    bool EnableReporting, bool EnforceRolePermissions,
    bool ReportVialUsage, bool ReportWasteLog, bool ReportCheckCompliance,
    bool ReportExpiryTracking, bool ReportInventorySnapshot,
    int DefaultCheckFrequencyHours, int ExpiryWarningDays,
    bool RequireWitnessForAllWaste, bool RequireWitnessForAllChecks);
