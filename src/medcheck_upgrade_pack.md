# MedCheck upgrade pack

This pack contains the concrete code needed for the requested MedCheck changes.

## Backend

### 1) `backend/AspireForge.ApiService/Data/AppDbContext.cs`

Add these `DbSet<>` properties near the other EMS sets:

```csharp
public DbSet<MedDiscrepancy> MedDiscrepancies => Set<MedDiscrepancy>();
public DbSet<MedSealStock> MedSealStocks => Set<MedSealStock>();
```

Replace the EMS entity section with these updated classes.

```csharp
public class MedLicenseLevel
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Name { get; set; } = "";
    public int Rank { get; set; }
    public bool CanAdminister { get; set; }
    public bool CanWaste { get; set; }
    public bool CanWitness { get; set; }
    public bool CanStock { get; set; }
    public bool CanOrder { get; set; }
    public bool CanReceive { get; set; }
    public bool CanMove { get; set; }
    public bool CanPerformCheck { get; set; }
    public bool CanManageCatalog { get; set; }
    public bool CanManageRoster { get; set; }
    public bool CanManageLocations { get; set; }
    public bool CanManageSeals { get; set; }
    public bool CanApplySeal { get; set; }
    public bool CanBreakSeal { get; set; }
    public bool CanResolveDiscrepancies { get; set; }
    public bool CanViewReports { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
}

public class MedContainer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StorageLocationId { get; set; }
    public string Name { get; set; } = "";
    public string ContainerType { get; set; } = "drug-box";
    public bool IsSealable { get; set; } = true;
    public bool IsSealed { get; set; } = false;
    public string? SealNumber { get; set; }
    public bool IsMasterSeal { get; set; } = false;
    public DateTimeOffset? SealAppliedAt { get; set; }
    public Guid? SealAppliedByPersonnelId { get; set; }
    public DateTimeOffset? LastSealBrokenAt { get; set; }
    public Guid? LastSealBrokenByPersonnelId { get; set; }
    public Guid? DefaultSealLicenseLevelId { get; set; }
    public int CheckFrequencyHours { get; set; } = 24;
    public bool CheckRequiresWitness { get; set; } = false;
    public bool IsControlledSubstance { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public MedStorageLocation? StorageLocation { get; set; }
    public MedPersonnel? SealAppliedBy { get; set; }
    public MedPersonnel? LastSealBrokenBy { get; set; }
    public MedLicenseLevel? DefaultSealLicenseLevel { get; set; }
    public List<MedVial> Vials { get; set; } = [];
    public List<MedSealEvent> SealEvents { get; set; } = [];
}

public class MedCheckSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid StorageLocationId { get; set; }
    public Guid PersonnelId { get; set; }
    public Guid? WitnessPersonnelId { get; set; }
    public string Status { get; set; } = "draft"; // draft | in-progress | completed | cancelled | discrepancy-open
    public string? Notes { get; set; }
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public Guid? CancelledByPersonnelId { get; set; }
    public string? CancellationReason { get; set; }
    public DateTimeOffset? LastSavedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public MedStorageLocation? StorageLocation { get; set; }
    public MedPersonnel? Personnel { get; set; }
    public MedPersonnel? WitnessPersonnel { get; set; }
    public MedPersonnel? CancelledByPersonnel { get; set; }
    public List<MedCheckItem> Items { get; set; } = [];
}

public class MedDiscrepancy
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid? CheckSessionId { get; set; }
    public Guid? CheckItemId { get; set; }
    public Guid? StorageLocationId { get; set; }
    public Guid? ContainerId { get; set; }
    public Guid? VialId { get; set; }
    public string DiscrepancyType { get; set; } = "other";
    public string Severity { get; set; } = "warning";
    public string Status { get; set; } = "open";
    public string Summary { get; set; } = "";
    public string? Details { get; set; }
    public Guid OpenedByPersonnelId { get; set; }
    public DateTimeOffset OpenedAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid? ResolvedByPersonnelId { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public string? ResolutionNotes { get; set; }
    public bool RequiresSupervisorReview { get; set; }
    public bool RequiresSealReplacement { get; set; }
    public bool RequiresIncidentReport { get; set; }

    public MedCheckSession? CheckSession { get; set; }
    public MedCheckItem? CheckItem { get; set; }
    public MedStorageLocation? StorageLocation { get; set; }
    public MedContainer? Container { get; set; }
    public MedVial? Vial { get; set; }
    public MedPersonnel? OpenedByPersonnel { get; set; }
    public MedPersonnel? ResolvedByPersonnel { get; set; }
}

public class MedSealStock
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string SealNumber { get; set; } = "";
    public string SealType { get; set; } = "standard";
    public string Status { get; set; } = "available"; // available | applied | broken | void
    public Guid? AssignedLicenseLevelId { get; set; }
    public Guid? AssignedContainerId { get; set; }
    public DateTimeOffset? AppliedAt { get; set; }
    public DateTimeOffset? BrokenAt { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public MedLicenseLevel? AssignedLicenseLevel { get; set; }
    public MedContainer? AssignedContainer { get; set; }
}
```

Add this model configuration in `OnModelCreating`:

```csharp
modelBuilder.Entity<MedSealStock>()
    .HasIndex(x => new { x.TenantId, x.SealNumber })
    .IsUnique();

modelBuilder.Entity<MedDiscrepancy>()
    .HasIndex(x => new { x.TenantId, x.Status, x.OpenedAt });

modelBuilder.Entity<MedCheckSession>()
    .HasOne(x => x.CancelledByPersonnel)
    .WithMany()
    .HasForeignKey(x => x.CancelledByPersonnelId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<MedContainer>()
    .HasOne(x => x.LastSealBrokenBy)
    .WithMany()
    .HasForeignKey(x => x.LastSealBrokenByPersonnelId)
    .OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<MedContainer>()
    .HasOne(x => x.DefaultSealLicenseLevel)
    .WithMany()
    .HasForeignKey(x => x.DefaultSealLicenseLevelId)
    .OnDelete(DeleteBehavior.Restrict);
```

### 2) `backend/AspireForge.ApiService/Controllers/MedicationController.cs`

Replace the request records at the bottom with these:

```csharp
public record UpsertLicenseLevelReq(
    string Name,
    int Rank,
    bool CanAdminister,
    bool CanWaste,
    bool CanWitness,
    bool CanStock,
    bool CanOrder,
    bool CanReceive,
    bool CanMove,
    bool CanPerformCheck,
    bool CanManageCatalog,
    bool CanManageRoster,
    bool CanManageLocations,
    bool CanManageSeals,
    bool CanApplySeal,
    bool CanBreakSeal,
    bool CanResolveDiscrepancies,
    bool CanViewReports
);

public record ApplySealReq(
    string SealNumber,
    Guid PersonnelId,
    bool IsMasterSeal,
    Guid? WitnessPersonnelId,
    string? Notes
);

public record CreateCheckSessionReq(
    Guid StorageLocationId,
    Guid PersonnelId,
    Guid? WitnessPersonnelId,
    string? Notes,
    bool SaveAsDraft
);

public record UpdateCheckSessionReq(Guid? WitnessPersonnelId, string? Notes);

public record CancelCheckReq(Guid PersonnelId, string? Reason);

public record AddCheckItemReq(
    Guid? ContainerId,
    Guid? VialId,
    bool SealIntact,
    bool Passed,
    string? Discrepancy,
    string? DiscrepancyType,
    string? Severity,
    string? Summary,
    string? Details,
    bool RequiresSupervisorReview,
    bool RequiresSealReplacement,
    bool RequiresIncidentReport
);

public record UpsertSealStockReq(string SealNumber, string? SealType, Guid? AssignedLicenseLevelId, string? Notes);

public record ResolveDiscrepancyReq(Guid ResolvedByPersonnelId, string ResolutionNotes);
```

Update the dashboard action with this version:

```csharp
[HttpGet("dashboard")]
public async Task<IActionResult> Dashboard([FromQuery] Guid tenantId, [FromQuery] Guid? involvedPersonnelId = null)
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

    var containers = await _db.MedContainers
        .Include(c => c.StorageLocation)
        .Where(c => c.StorageLocation!.TenantId == tenantId && c.IsActive)
        .OrderBy(c => c.StorageLocation!.Name).ThenBy(c => c.Name)
        .ToListAsync();

    var lastChecks = await _db.MedCheckSessions
        .Where(s => s.TenantId == tenantId && (s.Status == "completed" || s.Status == "discrepancy-open"))
        .GroupBy(s => s.StorageLocationId)
        .Select(g => new { LocationId = g.Key, LastCompleted = g.Max(s => s.CompletedAt) })
        .ToListAsync();

    var lastCheckMap = lastChecks.ToDictionary(x => x.LocationId, x => x.LastCompleted);

    var checksDue = containers.Select(c =>
    {
        var lastCheck = lastCheckMap.TryGetValue(c.StorageLocationId, out var lc) ? lc : null;
        var dueAt = lastCheck.HasValue ? lastCheck.Value!.Value.AddHours(c.CheckFrequencyHours) : now.AddDays(-1);
        return new
        {
            ContainerId = c.Id,
            ContainerName = c.Name,
            LocationId = c.StorageLocationId,
            LocationName = c.StorageLocation?.Name,
            c.CheckFrequencyHours,
            c.CheckRequiresWitness,
            c.IsSealed,
            c.SealNumber,
            LastCompletedAt = lastCheck?.ToString("o"),
            DueAt = dueAt.ToString("o"),
            IsOverdue = dueAt <= now
        };
    })
    .Where(x => x.IsOverdue)
    .OrderByDescending(x => x.IsOverdue)
    .ThenBy(x => x.LocationName)
    .ThenBy(x => x.ContainerName)
    .Take(25)
    .ToList();

    var completedQuery = _db.MedCheckSessions
        .Include(s => s.StorageLocation)
        .Include(s => s.Personnel)
        .Include(s => s.WitnessPersonnel)
        .Where(s => s.TenantId == tenantId && (s.Status == "completed" || s.Status == "discrepancy-open"));

    if (involvedPersonnelId.HasValue)
    {
        completedQuery = completedQuery.Where(s => s.PersonnelId == involvedPersonnelId || s.WitnessPersonnelId == involvedPersonnelId);
    }

    var recentCompletedChecks = await completedQuery
        .OrderByDescending(s => s.CompletedAt ?? s.StartedAt)
        .Take(25)
        .Select(s => new
        {
            s.Id,
            s.Status,
            StartedAt = s.StartedAt.ToString("o"),
            CompletedAt = s.CompletedAt.HasValue ? s.CompletedAt.Value.ToString("o") : null,
            LocationId = s.StorageLocationId,
            LocationName = s.StorageLocation!.Name,
            PersonnelId = s.PersonnelId,
            PersonnelName = s.Personnel != null ? $"{s.Personnel.FirstName} {s.Personnel.LastName}" : null,
            WitnessPersonnelId = s.WitnessPersonnelId,
            WitnessName = s.WitnessPersonnel != null ? $"{s.WitnessPersonnel.FirstName} {s.WitnessPersonnel.LastName}" : null,
            ItemCount = s.Items.Count
        })
        .ToListAsync();

    var brokenSeals = await _db.MedContainers
        .Include(c => c.StorageLocation)
        .Where(c => c.StorageLocation!.TenantId == tenantId && c.IsSealable && !c.IsSealed && c.IsActive)
        .CountAsync();

    var openDiscrepancies = await _db.MedDiscrepancies.CountAsync(x => x.TenantId == tenantId && x.Status == "open");

    return Ok(new
    {
        VialsByStatus = vialsByStatus,
        ExpiringIn30DaysCount = expiringCount,
        ChecksDueCount = checksDue.Count,
        BrokenSealsCount = brokenSeals,
        OpenDiscrepanciesCount = openDiscrepancies,
        ChecksDue = checksDue,
        RecentCompletedChecks = recentCompletedChecks
    });
}
```

Update create/update license level methods:

```csharp
[HttpPost("license-levels")]
public async Task<IActionResult> CreateLicenseLevel([FromQuery] Guid tenantId, [FromBody] UpsertLicenseLevelReq req)
{
    if (!await TenantExistsAsync(tenantId))
        return NotFound($"Tenant '{tenantId}' not found.");

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
        CanManageSeals = req.CanManageSeals,
        CanApplySeal = req.CanApplySeal,
        CanBreakSeal = req.CanBreakSeal,
        CanResolveDiscrepancies = req.CanResolveDiscrepancies,
        CanViewReports = req.CanViewReports,
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

    level.Name = req.Name;
    level.Rank = req.Rank;
    level.CanAdminister = req.CanAdminister;
    level.CanWaste = req.CanWaste;
    level.CanWitness = req.CanWitness;
    level.CanStock = req.CanStock;
    level.CanOrder = req.CanOrder;
    level.CanReceive = req.CanReceive;
    level.CanMove = req.CanMove;
    level.CanPerformCheck = req.CanPerformCheck;
    level.CanManageCatalog = req.CanManageCatalog;
    level.CanManageRoster = req.CanManageRoster;
    level.CanManageLocations = req.CanManageLocations;
    level.CanManageSeals = req.CanManageSeals;
    level.CanApplySeal = req.CanApplySeal;
    level.CanBreakSeal = req.CanBreakSeal;
    level.CanResolveDiscrepancies = req.CanResolveDiscrepancies;
    level.CanViewReports = req.CanViewReports;
    level.UpdatedAt = DateTimeOffset.UtcNow;

    await _db.SaveChangesAsync();
    return Ok(level);
}
```

Replace the seal methods with these:

```csharp
[HttpPost("containers/{id:guid}/break-seal")]
public async Task<IActionResult> BreakSeal(Guid id, [FromBody] SealEventReq req)
{
    var c = await _db.MedContainers
        .Include(x => x.StorageLocation)
        .Include(x => x.Vials)
        .FirstOrDefaultAsync(x => x.Id == id);

    if (c == null) return NotFound();
    if (!c.IsSealed) return BadRequest("Container is not sealed.");

    var oldSeal = c.SealNumber;
    c.IsSealed = false;
    c.SealNumber = null;
    c.LastSealBrokenAt = DateTimeOffset.UtcNow;
    c.LastSealBrokenByPersonnelId = req.PersonnelId;
    c.UpdatedAt = DateTimeOffset.UtcNow;

    _db.MedSealEvents.Add(new MedSealEvent
    {
        ContainerId = c.Id,
        SealNumber = oldSeal ?? string.Empty,
        EventType = "broken",
        PersonnelId = req.PersonnelId,
        WitnessPersonnelId = req.WitnessPersonnelId,
        Notes = req.Notes,
        OccurredAt = DateTimeOffset.UtcNow
    });

    var sealStock = await _db.MedSealStocks.FirstOrDefaultAsync(x => x.TenantId == c.StorageLocation!.TenantId && x.SealNumber == oldSeal);
    if (sealStock != null)
    {
        sealStock.Status = "broken";
        sealStock.BrokenAt = DateTimeOffset.UtcNow;
        sealStock.AssignedContainerId = null;
        sealStock.UpdatedAt = DateTimeOffset.UtcNow;
    }

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
    var c = await _db.MedContainers
        .Include(x => x.StorageLocation)
        .Include(x => x.Vials)
        .FirstOrDefaultAsync(x => x.Id == id);

    if (c == null) return NotFound();
    if (!c.IsSealable) return BadRequest("Container is not sealable.");
    if (c.IsSealed) return BadRequest("Container is already sealed.");

    var tenantId = c.StorageLocation!.TenantId;
    var duplicateSealInUse = await _db.MedContainers.AnyAsync(x =>
        x.Id != c.Id && x.StorageLocation!.TenantId == tenantId && x.SealNumber == req.SealNumber && x.IsSealed);

    if (duplicateSealInUse) return BadRequest("That seal number is already in use.");

    c.IsSealed = true;
    c.SealNumber = req.SealNumber;
    c.IsMasterSeal = req.IsMasterSeal;
    c.SealAppliedAt = DateTimeOffset.UtcNow;
    c.SealAppliedByPersonnelId = req.PersonnelId;
    c.UpdatedAt = DateTimeOffset.UtcNow;

    _db.MedSealEvents.Add(new MedSealEvent
    {
        ContainerId = c.Id,
        SealNumber = req.SealNumber,
        EventType = "applied",
        PersonnelId = req.PersonnelId,
        WitnessPersonnelId = req.WitnessPersonnelId,
        Notes = req.Notes,
        OccurredAt = DateTimeOffset.UtcNow
    });

    foreach (var v in c.Vials.Where(v => v.Status == "stocked" || v.Status == "in-use"))
    {
        _db.MedVialEvents.Add(new MedVialEvent
        {
            VialId = v.Id,
            PersonnelId = req.PersonnelId,
            WitnessPersonnelId = req.WitnessPersonnelId,
            EventType = "seal-applied",
            Notes = $"Container '{c.Name}' sealed with #{req.SealNumber}. {req.Notes}".Trim(),
            OccurredAt = DateTimeOffset.UtcNow
        });
    }

    var stock = await _db.MedSealStocks.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.SealNumber == req.SealNumber);
    if (stock != null)
    {
        stock.Status = "applied";
        stock.AssignedContainerId = c.Id;
        stock.AppliedAt = DateTimeOffset.UtcNow;
        stock.UpdatedAt = DateTimeOffset.UtcNow;
    }

    await _db.SaveChangesAsync();
    return Ok(c);
}
```

Replace the check workflow methods with these:

```csharp
[HttpGet("checks")]
public async Task<IActionResult> GetCheckSessions(
    [FromQuery] Guid tenantId,
    [FromQuery] Guid? locationId,
    [FromQuery] string? status,
    [FromQuery] DateTimeOffset? from,
    [FromQuery] DateTimeOffset? to,
    [FromQuery] Guid? involvedPersonnelId)
{
    var q = _db.MedCheckSessions
        .Include(s => s.StorageLocation)
        .Include(s => s.Personnel)
        .Include(s => s.WitnessPersonnel)
        .Where(s => s.TenantId == tenantId);

    if (locationId.HasValue) q = q.Where(s => s.StorageLocationId == locationId.Value);
    if (!string.IsNullOrWhiteSpace(status)) q = q.Where(s => s.Status == status);
    if (from.HasValue) q = q.Where(s => s.StartedAt >= from.Value);
    if (to.HasValue) q = q.Where(s => s.StartedAt <= to.Value);
    if (involvedPersonnelId.HasValue)
        q = q.Where(s => s.PersonnelId == involvedPersonnelId || s.WitnessPersonnelId == involvedPersonnelId);

    return Ok(await q.OrderByDescending(s => s.StartedAt).Take(100).ToListAsync());
}

[HttpGet("checks/due")]
public async Task<IActionResult> GetChecksDue([FromQuery] Guid tenantId)
{
    var now = DateTimeOffset.UtcNow;

    var containers = await _db.MedContainers
        .Include(c => c.StorageLocation)
        .Where(c => c.StorageLocation!.TenantId == tenantId && c.IsActive)
        .OrderBy(c => c.StorageLocation!.Name)
        .ThenBy(c => c.Name)
        .ToListAsync();

    var lastChecks = await _db.MedCheckSessions
        .Where(s => s.TenantId == tenantId && (s.Status == "completed" || s.Status == "discrepancy-open"))
        .GroupBy(s => s.StorageLocationId)
        .Select(g => new { LocationId = g.Key, LastCompleted = g.Max(s => s.CompletedAt) })
        .ToListAsync();

    var map = lastChecks.ToDictionary(x => x.LocationId, x => x.LastCompleted);

    var result = containers.Select(c =>
    {
        var last = map.TryGetValue(c.StorageLocationId, out var value) ? value : null;
        var dueAt = last.HasValue ? last.Value!.Value.AddHours(c.CheckFrequencyHours) : now.AddDays(-1);
        return new
        {
            ContainerId = c.Id,
            ContainerName = c.Name,
            LocationId = c.StorageLocationId,
            LocationName = c.StorageLocation!.Name,
            LastCompletedAt = last?.ToString("o"),
            DueAt = dueAt.ToString("o"),
            IsOverdue = dueAt <= now,
            c.CheckFrequencyHours,
            c.CheckRequiresWitness,
            c.IsSealed,
            c.SealNumber
        };
    })
    .Where(x => x.IsOverdue)
    .ToList();

    return Ok(result);
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
        Notes = req.Notes,
        Status = req.SaveAsDraft ? "draft" : "in-progress",
        StartedAt = DateTimeOffset.UtcNow,
        LastSavedAt = DateTimeOffset.UtcNow
    };

    _db.MedCheckSessions.Add(session);
    await _db.SaveChangesAsync();
    return Ok(session);
}

[HttpPut("checks/{id:guid}")]
public async Task<IActionResult> UpdateCheckSession(Guid id, [FromQuery] Guid tenantId, [FromBody] UpdateCheckSessionReq req)
{
    var session = await _db.MedCheckSessions.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
    if (session == null) return NotFound();
    if (session.Status != "draft" && session.Status != "in-progress") return BadRequest("Session can no longer be edited.");

    session.WitnessPersonnelId = req.WitnessPersonnelId;
    session.Notes = req.Notes;
    session.LastSavedAt = DateTimeOffset.UtcNow;
    await _db.SaveChangesAsync();
    return Ok(session);
}

[HttpPost("checks/{id:guid}/start")]
public async Task<IActionResult> StartCheckSession(Guid id, [FromQuery] Guid tenantId)
{
    var s = await _db.MedCheckSessions.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
    if (s == null) return NotFound();
    if (s.Status != "draft") return BadRequest("Only draft sessions can be started.");
    s.Status = "in-progress";
    s.LastSavedAt = DateTimeOffset.UtcNow;
    await _db.SaveChangesAsync();
    return Ok(s);
}

[HttpPost("checks/{id:guid}/cancel")]
public async Task<IActionResult> CancelCheckSession(Guid id, [FromQuery] Guid tenantId, [FromBody] CancelCheckReq req)
{
    var s = await _db.MedCheckSessions.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
    if (s == null) return NotFound();
    if (s.Status == "completed" || s.Status == "cancelled") return BadRequest("Session can no longer be cancelled.");

    s.Status = "cancelled";
    s.CancelledAt = DateTimeOffset.UtcNow;
    s.CancelledByPersonnelId = req.PersonnelId;
    s.CancellationReason = req.Reason;
    await _db.SaveChangesAsync();
    return Ok(s);
}

[HttpPost("checks/{id:guid}/items")]
public async Task<IActionResult> AddCheckItem(Guid id, [FromQuery] Guid tenantId, [FromBody] AddCheckItemReq req)
{
    var session = await _db.MedCheckSessions
        .Include(s => s.StorageLocation)
        .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);

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
        CheckType = req.ContainerId.HasValue && req.SealIntact ? "seal-verified" : "physical",
        CheckedAt = DateTimeOffset.UtcNow
    };

    _db.MedCheckItems.Add(item);
    await _db.SaveChangesAsync();

    if (req.VialId.HasValue)
    {
        _db.MedVialEvents.Add(new MedVialEvent
        {
            VialId = req.VialId.Value,
            PersonnelId = session.PersonnelId,
            EventType = "checked",
            Notes = req.Passed ? "Check passed." : $"Check failed: {req.Discrepancy ?? req.Summary}",
            OccurredAt = DateTimeOffset.UtcNow
        });
    }

    if (!req.Passed || !string.IsNullOrWhiteSpace(req.Discrepancy) || !string.IsNullOrWhiteSpace(req.Summary))
    {
        _db.MedDiscrepancies.Add(new MedDiscrepancy
        {
            TenantId = tenantId,
            CheckSessionId = session.Id,
            CheckItemId = item.Id,
            StorageLocationId = session.StorageLocationId,
            ContainerId = req.ContainerId,
            VialId = req.VialId,
            DiscrepancyType = string.IsNullOrWhiteSpace(req.DiscrepancyType) ? "other" : req.DiscrepancyType!,
            Severity = string.IsNullOrWhiteSpace(req.Severity) ? "warning" : req.Severity!,
            Summary = req.Summary ?? req.Discrepancy ?? "Check discrepancy",
            Details = req.Details,
            OpenedByPersonnelId = session.PersonnelId,
            RequiresSupervisorReview = req.RequiresSupervisorReview,
            RequiresSealReplacement = req.RequiresSealReplacement,
            RequiresIncidentReport = req.RequiresIncidentReport,
        });

        session.Status = "discrepancy-open";
    }

    await _db.SaveChangesAsync();
    return Ok(item);
}

[HttpPost("checks/{id:guid}/complete")]
public async Task<IActionResult> CompleteCheckSession(Guid id, [FromQuery] Guid tenantId, [FromBody] CompleteCheckReq req)
{
    var s = await _db.MedCheckSessions.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
    if (s == null) return NotFound();
    if (s.Status != "in-progress" && s.Status != "discrepancy-open") return BadRequest("Session is not in progress.");

    var hasOpenDiscrepancy = await _db.MedDiscrepancies.AnyAsync(x => x.CheckSessionId == s.Id && x.Status == "open");
    s.Status = hasOpenDiscrepancy ? "discrepancy-open" : "completed";
    s.CompletedAt = DateTimeOffset.UtcNow;
    s.Notes = req.Notes;
    await _db.SaveChangesAsync();
    return Ok(s);
}
```

Add new seal stock and discrepancy endpoints:

```csharp
[HttpGet("seals")]
public async Task<IActionResult> GetSeals([FromQuery] Guid tenantId, [FromQuery] string? status, [FromQuery] Guid? licenseLevelId)
{
    var q = _db.MedSealStocks
        .Include(x => x.AssignedLicenseLevel)
        .Include(x => x.AssignedContainer)
        .Where(x => x.TenantId == tenantId && x.IsActive);

    if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.Status == status);
    if (licenseLevelId.HasValue) q = q.Where(x => x.AssignedLicenseLevelId == licenseLevelId);

    return Ok(await q.OrderByDescending(x => x.CreatedAt).ToListAsync());
}

[HttpPost("seals")]
public async Task<IActionResult> CreateSeal([FromQuery] Guid tenantId, [FromBody] UpsertSealStockReq req)
{
    var exists = await _db.MedSealStocks.AnyAsync(x => x.TenantId == tenantId && x.SealNumber == req.SealNumber);
    if (exists) return BadRequest("Seal number already exists.");

    var item = new MedSealStock
    {
        TenantId = tenantId,
        SealNumber = req.SealNumber,
        SealType = string.IsNullOrWhiteSpace(req.SealType) ? "standard" : req.SealType!,
        AssignedLicenseLevelId = req.AssignedLicenseLevelId,
        Notes = req.Notes,
    };

    _db.MedSealStocks.Add(item);
    await _db.SaveChangesAsync();
    return Ok(item);
}

[HttpPost("seals/{id:guid}/void")]
public async Task<IActionResult> VoidSeal(Guid id, [FromQuery] Guid tenantId)
{
    var seal = await _db.MedSealStocks.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
    if (seal == null) return NotFound();
    seal.Status = "void";
    seal.UpdatedAt = DateTimeOffset.UtcNow;
    await _db.SaveChangesAsync();
    return Ok(seal);
}

[HttpGet("discrepancies")]
public async Task<IActionResult> GetDiscrepancies([FromQuery] Guid tenantId, [FromQuery] string? status)
{
    var q = _db.MedDiscrepancies
        .Include(x => x.StorageLocation)
        .Include(x => x.Container)
        .Include(x => x.Vial).ThenInclude(v => v!.Medication)
        .Include(x => x.OpenedByPersonnel)
        .Include(x => x.ResolvedByPersonnel)
        .Where(x => x.TenantId == tenantId);

    if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.Status == status);

    return Ok(await q.OrderByDescending(x => x.OpenedAt).ToListAsync());
}

[HttpPost("discrepancies/{id:guid}/resolve")]
public async Task<IActionResult> ResolveDiscrepancy(Guid id, [FromQuery] Guid tenantId, [FromBody] ResolveDiscrepancyReq req)
{
    var item = await _db.MedDiscrepancies.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
    if (item == null) return NotFound();

    item.Status = "resolved";
    item.ResolvedByPersonnelId = req.ResolvedByPersonnelId;
    item.ResolvedAt = DateTimeOffset.UtcNow;
    item.ResolutionNotes = req.ResolutionNotes;
    await _db.SaveChangesAsync();
    return Ok(item);
}

[HttpPost("catalog/seed-standard")]
public async Task<IActionResult> SeedStandardCatalog([FromQuery] Guid tenantId)
{
    var standard = new[]
    {
        new { Name = "Epinephrine", Brand = (string?)null, Conc = "1 mg/mL", Route = "IM", Form = "1 mL vial", Dea = 0 },
        new { Name = "Naloxone", Brand = (string?)"Narcan", Conc = "4 mg", Route = "IN", Form = "nasal spray", Dea = 0 },
        new { Name = "Midazolam", Brand = (string?)null, Conc = "5 mg/mL", Route = "IV/IM/IN", Form = "10 mL vial", Dea = 4 },
        new { Name = "Diazepam", Brand = (string?)null, Conc = "5 mg/mL", Route = "IV/IM", Form = "2 mL syringe", Dea = 4 },
        new { Name = "Lorazepam", Brand = (string?)null, Conc = "2 mg/mL", Route = "IV/IM", Form = "2 mL vial", Dea = 4 },
        new { Name = "Ketamine", Brand = (string?)null, Conc = "50 mg/mL", Route = "IV/IM/IN", Form = "10 mL vial", Dea = 3 },
        new { Name = "Morphine", Brand = (string?)null, Conc = "10 mg/mL", Route = "IV/IM", Form = "1 mL syringe", Dea = 2 },
        new { Name = "Fentanyl", Brand = (string?)null, Conc = "50 mcg/mL", Route = "IV/IN", Form = "2 mL ampule", Dea = 2 },
        new { Name = "Ondansetron", Brand = (string?)null, Conc = "2 mg/mL", Route = "IV/IM/PO", Form = "2 mL vial", Dea = 0 },
        new { Name = "Albuterol", Brand = (string?)null, Conc = "2.5 mg/3 mL", Route = "NEB", Form = "unit dose", Dea = 0 },
        new { Name = "Ipratropium", Brand = (string?)null, Conc = "0.5 mg/2.5 mL", Route = "NEB", Form = "unit dose", Dea = 0 },
        new { Name = "Nitroglycerin", Brand = (string?)null, Conc = "0.4 mg", Route = "SL", Form = "tablet or spray", Dea = 0 },
        new { Name = "Aspirin", Brand = (string?)null, Conc = "81 mg", Route = "PO", Form = "chewable tablet", Dea = 0 },
        new { Name = "Dextrose 10%", Brand = (string?)null, Conc = "10%", Route = "IV", Form = "bag", Dea = 0 },
        new { Name = "Glucagon", Brand = (string?)null, Conc = "1 mg", Route = "IM/IN", Form = "kit", Dea = 0 },
        new { Name = "Atropine", Brand = (string?)null, Conc = "1 mg/10 mL", Route = "IV/IO", Form = "prefilled syringe", Dea = 0 },
        new { Name = "Amiodarone", Brand = (string?)null, Conc = "150 mg/3 mL", Route = "IV/IO", Form = "ampule", Dea = 0 },
        new { Name = "Adenosine", Brand = (string?)null, Conc = "6 mg/2 mL", Route = "IV", Form = "vial", Dea = 0 },
        new { Name = "Magnesium Sulfate", Brand = (string?)null, Conc = "1 g/2 mL", Route = "IV/IO", Form = "vial", Dea = 0 },
        new { Name = "Calcium Chloride", Brand = (string?)null, Conc = "1 g/10 mL", Route = "IV/IO", Form = "syringe", Dea = 0 },
        new { Name = "Sodium Bicarbonate", Brand = (string?)null, Conc = "50 mEq/50 mL", Route = "IV/IO", Form = "prefilled syringe", Dea = 0 }
    };

    var existing = await _db.MedMedications.Where(x => x.TenantId == tenantId).Select(x => x.GenericName).ToListAsync();
    var created = new List<MedMedication>();

    foreach (var med in standard.Where(x => !existing.Contains(x.Name)))
    {
        var entity = new MedMedication
        {
            TenantId = tenantId,
            GenericName = med.Name,
            BrandName = med.Brand,
            Concentration = med.Conc,
            RouteOfAdministration = med.Route,
            FormDescription = med.Form,
            DeaSchedule = med.Dea
        };
        _db.MedMedications.Add(entity);
        created.Add(entity);
    }

    await _db.SaveChangesAsync();
    return Ok(new { created = created.Count, items = created });
}
```

Update `GetMyPermissions` to return the new flags:

```csharp
[HttpGet("my-permissions")]
public async Task<IActionResult> GetMyPermissions([FromQuery] Guid tenantId, [FromQuery] string username)
{
    var personnel = await _db.MedPersonnel
        .Include(p => p.LicenseLevel)
        .Where(p => p.TenantId == tenantId && p.IsActive && (p.KeycloakUserId == username || p.Email == username))
        .FirstOrDefaultAsync();

    if (personnel?.LicenseLevel == null)
    {
        return Ok(new
        {
            Found = false,
            PersonnelId = (Guid?)null,
            Name = username,
            LicenseLevelName = "Unknown",
            Rank = -1,
            CanAdminister = false,
            CanWaste = false,
            CanWitness = false,
            CanStock = false,
            CanOrder = false,
            CanReceive = false,
            CanMove = false,
            CanPerformCheck = false,
            CanManageCatalog = false,
            CanManageRoster = false,
            CanManageLocations = false,
            CanManageSeals = false,
            CanApplySeal = false,
            CanBreakSeal = false,
            CanResolveDiscrepancies = false,
            CanViewReports = false,
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
        ll.CanAdminister,
        ll.CanWaste,
        ll.CanWitness,
        ll.CanStock,
        ll.CanOrder,
        ll.CanReceive,
        ll.CanMove,
        ll.CanPerformCheck,
        ll.CanManageCatalog,
        ll.CanManageRoster,
        ll.CanManageLocations,
        ll.CanManageSeals,
        ll.CanApplySeal,
        ll.CanBreakSeal,
        ll.CanResolveDiscrepancies,
        ll.CanViewReports,
    });
}
```

### 3) `backend/AspireForge.ApiService/Program.cs`

Update your seed helper so the default levels include the new permissions. Replace the helper with this:

```csharp
static MedLicenseLevel[] BuildEmsLicenseLevels(Guid tenantId) =>
[
    new() { TenantId = tenantId, Name = "Driver", Rank = 10, CanWitness = true },
    new() { TenantId = tenantId, Name = "EMT", Rank = 20, CanAdminister = true, CanWitness = true, CanPerformCheck = true },
    new() { TenantId = tenantId, Name = "AEMT", Rank = 30, CanAdminister = true, CanWaste = true, CanWitness = true, CanStock = true, CanPerformCheck = true, CanApplySeal = true, CanBreakSeal = true },
    new() { TenantId = tenantId, Name = "Paramedic", Rank = 40, CanAdminister = true, CanWaste = true, CanWitness = true, CanStock = true, CanReceive = true, CanMove = true, CanPerformCheck = true, CanApplySeal = true, CanBreakSeal = true },
    new() { TenantId = tenantId, Name = "Supervisor", Rank = 80, CanAdminister = true, CanWaste = true, CanWitness = true, CanStock = true, CanOrder = true, CanReceive = true, CanMove = true, CanPerformCheck = true, CanManageSeals = true, CanApplySeal = true, CanBreakSeal = true, CanResolveDiscrepancies = true, CanViewReports = true },
    new() { TenantId = tenantId, Name = "Service Admin", Rank = 100, CanAdminister = true, CanWaste = true, CanWitness = true, CanStock = true, CanOrder = true, CanReceive = true, CanMove = true, CanPerformCheck = true, CanManageCatalog = true, CanManageRoster = true, CanManageLocations = true, CanManageSeals = true, CanApplySeal = true, CanBreakSeal = true, CanResolveDiscrepancies = true, CanViewReports = true }
];
```

## Frontend

### 4) `frontend/web/src/types/ems.ts`

Replace the file with this:

```ts
export interface MedLicenseLevel {
  id: string;
  tenantId: string;
  name: string;
  rank: number;
  canAdminister: boolean;
  canWaste: boolean;
  canWitness: boolean;
  canStock: boolean;
  canOrder: boolean;
  canReceive: boolean;
  canMove: boolean;
  canPerformCheck: boolean;
  canManageCatalog: boolean;
  canManageRoster: boolean;
  canManageLocations: boolean;
  canManageSeals: boolean;
  canApplySeal: boolean;
  canBreakSeal: boolean;
  canResolveDiscrepancies: boolean;
  canViewReports: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedTag {
  id: string;
  tenantId: string;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

export interface MedMedication {
  id: string;
  tenantId: string;
  genericName: string;
  brandName?: string;
  deaSchedule: number;
  ndcCode?: string;
  concentration?: string;
  routeOfAdministration?: string;
  formDescription?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tags: MedMedicationTag[];
  configs: MedMedicationConfig[];
}

export interface MedMedicationTag {
  medicationId: string;
  tagId: string;
  tag?: MedTag;
}

export interface MedMedicationConfig {
  id: string;
  tenantId: string;
  medicationId: string;
  requireWitnessForWaste: boolean;
  isControlledSubstance: boolean;
  requireSealedStorage: boolean;
  minCheckFrequencyHours?: number;
  requiresPhysicalCount: boolean;
  updatedAt: string;
}

export interface MedPersonnel {
  id: string;
  tenantId: string;
  licenseLevelId: string;
  firstName: string;
  lastName: string;
  badgeNumber?: string;
  email?: string;
  keycloakUserId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  licenseLevel?: MedLicenseLevel;
  fullName?: string;
}

export interface MedStorageLocation {
  id: string;
  tenantId: string;
  parentLocationId?: string;
  name: string;
  locationType: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parentLocation?: MedStorageLocation;
  childLocations?: MedStorageLocation[];
  containers: MedContainer[];
}

export interface MedContainer {
  id: string;
  storageLocationId: string;
  name: string;
  containerType: string;
  isSealable: boolean;
  isSealed: boolean;
  sealNumber?: string;
  isMasterSeal: boolean;
  sealAppliedAt?: string;
  sealAppliedByPersonnelId?: string;
  lastSealBrokenAt?: string;
  lastSealBrokenByPersonnelId?: string;
  defaultSealLicenseLevelId?: string;
  checkFrequencyHours: number;
  checkRequiresWitness: boolean;
  isControlledSubstance: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  storageLocation?: MedStorageLocation;
  sealAppliedBy?: MedPersonnel;
  sealEvents?: MedSealEvent[];
  vials: MedVial[];
}

export interface MedSealEvent {
  id: string;
  containerId: string;
  sealNumber: string;
  eventType: string;
  personnelId?: string;
  witnessPersonnelId?: string;
  notes?: string;
  occurredAt: string;
  createdAt: string;
  personnel?: MedPersonnel;
  witnessPersonnel?: MedPersonnel;
}

export interface MedSealStock {
  id: string;
  tenantId: string;
  sealNumber: string;
  sealType: string;
  status: 'available' | 'applied' | 'broken' | 'void';
  assignedLicenseLevelId?: string;
  assignedContainerId?: string;
  appliedAt?: string;
  brokenAt?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedLicenseLevel?: MedLicenseLevel;
  assignedContainer?: MedContainer;
}

export type VialStatus =
  | 'ordered' | 'received' | 'stocked' | 'in-use'
  | 'administered' | 'wasted' | 'disposed' | 'expired';

export interface MedVial {
  id: string;
  tenantId: string;
  medicationId: string;
  containerId?: string;
  lotNumber: string;
  manufacturerBarcode?: string;
  agencyLabelCode?: string;
  totalVolumeMl: number;
  remainingVolumeMl: number;
  status: VialStatus;
  expiresAt?: string;
  orderedAt?: string;
  receivedAt?: string;
  stockedAt?: string;
  administeredAt?: string;
  wastedAt?: string;
  disposedAt?: string;
  createdAt: string;
  updatedAt: string;
  medication?: MedMedication;
  container?: MedContainer;
  events: MedVialEvent[];
}

export type VialEventType =
  | 'ordered' | 'received' | 'stocked' | 'moved'
  | 'administered' | 'wasted' | 'disposed' | 'expired'
  | 'checked' | 'seal-broken' | 'seal-applied';

export interface MedVialEvent {
  id: string;
  vialId: string;
  personnelId?: string;
  witnessPersonnelId?: string;
  eventType: VialEventType;
  notes?: string;
  incidentNumber?: string;
  patientWeightKg?: number;
  dosageAmountMl?: number;
  fromContainerId?: string;
  toContainerId?: string;
  occurredAt: string;
  createdAt: string;
  personnel?: MedPersonnel;
  witnessPersonnel?: MedPersonnel;
}

export interface MedCheckSession {
  id: string;
  tenantId: string;
  storageLocationId: string;
  personnelId: string;
  witnessPersonnelId?: string;
  status: 'draft' | 'in-progress' | 'completed' | 'cancelled' | 'discrepancy-open';
  notes?: string;
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledByPersonnelId?: string;
  cancellationReason?: string;
  lastSavedAt?: string;
  createdAt: string;
  storageLocation?: MedStorageLocation;
  personnel?: MedPersonnel;
  witnessPersonnel?: MedPersonnel;
  items: MedCheckItem[];
}

export interface MedCheckItem {
  id: string;
  sessionId: string;
  containerId?: string;
  vialId?: string;
  sealIntact: boolean;
  passed: boolean;
  discrepancy?: string;
  checkType: string;
  inheritedFromSealNumber?: string;
  checkedAt: string;
  container?: MedContainer;
  vial?: MedVial;
}

export interface MedDiscrepancy {
  id: string;
  tenantId: string;
  checkSessionId?: string;
  checkItemId?: string;
  storageLocationId?: string;
  containerId?: string;
  vialId?: string;
  discrepancyType: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'open' | 'under-review' | 'resolved' | 'void';
  summary: string;
  details?: string;
  openedByPersonnelId: string;
  openedAt: string;
  resolvedByPersonnelId?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  requiresSupervisorReview: boolean;
  requiresSealReplacement: boolean;
  requiresIncidentReport: boolean;
  storageLocation?: MedStorageLocation;
  container?: MedContainer;
  vial?: MedVial;
  openedByPersonnel?: MedPersonnel;
  resolvedByPersonnel?: MedPersonnel;
}

export interface CheckDueItem {
  containerId: string;
  containerName: string;
  locationId: string;
  locationName: string;
  checkFrequencyHours: number;
  checkRequiresWitness: boolean;
  isSealed: boolean;
  sealNumber?: string;
  lastCompletedAt?: string;
  dueAt: string;
  isOverdue: boolean;
}

export interface RecentCompletedCheckItem {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  locationId: string;
  locationName: string;
  personnelId: string;
  personnelName?: string;
  witnessPersonnelId?: string;
  witnessName?: string;
  itemCount: number;
}

export interface EmsDashboard {
  vialsByStatus: { status: string; count: number }[];
  expiringIn30DaysCount: number;
  checksDueCount: number;
  brokenSealsCount: number;
  openDiscrepanciesCount: number;
  checksDue: CheckDueItem[];
  recentCompletedChecks: RecentCompletedCheckItem[];
}

export interface MedAgencyConfig {
  id: string;
  tenantId: string;
  agencyName: string;
  agencyLicenseNumber: string;
  enableVialTracking: boolean;
  enableDailyChecks: boolean;
  enableControlledSubstanceLog: boolean;
  enableExpiryAlerts: boolean;
  enableSealedContainers: boolean;
  enableOpenFdaLookup: boolean;
  enableReporting: boolean;
  enforceRolePermissions: boolean;
  reportVialUsage: boolean;
  reportWasteLog: boolean;
  reportCheckCompliance: boolean;
  reportExpiryTracking: boolean;
  reportInventorySnapshot: boolean;
  defaultCheckFrequencyHours: number;
  expiryWarningDays: number;
  requireWitnessForAllWaste: boolean;
  requireWitnessForAllChecks: boolean;
  allowSealInheritance: boolean;
  updatedAt: string;
}

export interface EmsPermissions {
  found: boolean;
  personnelId?: string;
  name: string;
  licenseLevelName: string;
  rank: number;
  canAdminister: boolean;
  canWaste: boolean;
  canWitness: boolean;
  canStock: boolean;
  canOrder: boolean;
  canReceive: boolean;
  canMove: boolean;
  canPerformCheck: boolean;
  canManageCatalog: boolean;
  canManageRoster: boolean;
  canManageLocations: boolean;
  canManageSeals: boolean;
  canApplySeal: boolean;
  canBreakSeal: boolean;
  canResolveDiscrepancies: boolean;
  canViewReports: boolean;
}

export interface OpenFdaLookup {
  genericName: string;
  brandName?: string;
  ndcCode: string;
  concentration?: string;
  routeOfAdministration?: string;
  formDescription?: string;
  manufacturer?: string;
  deaSchedule: number;
}
```

### 5) `frontend/web/src/features/ems/api.ts`

Use these added and updated functions:

```ts
import type {
  EmsDashboard, MedLicenseLevel, MedTag, MedMedication, MedMedicationConfig,
  MedPersonnel, MedStorageLocation, MedContainer, MedVial, MedVialEvent,
  MedCheckSession, MedCheckItem, OpenFdaLookup, MedAgencyConfig, EmsPermissions,
  MedSealEvent, MedSealStock, MedDiscrepancy,
} from '../../types/ems';

const BASE = 'http://localhost:5236/api/med';

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) =>
  '?' + Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

export const fetchEmsDashboard = (tenantId: string, involvedPersonnelId?: string) =>
  req<EmsDashboard>(`${BASE}/dashboard${qs({ tenantId, involvedPersonnelId })}`);

export const fetchLicenseLevels = (tenantId: string) =>
  req<MedLicenseLevel[]>(`${BASE}/license-levels${qs({ tenantId })}`);

export const createLicenseLevel = (tenantId: string, body: Partial<MedLicenseLevel>) =>
  req<MedLicenseLevel>(`${BASE}/license-levels${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const updateLicenseLevel = (tenantId: string, id: string, body: Partial<MedLicenseLevel>) =>
  req<MedLicenseLevel>(`${BASE}/license-levels/${id}${qs({ tenantId })}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteLicenseLevel = (tenantId: string, id: string) =>
  req<void>(`${BASE}/license-levels/${id}${qs({ tenantId })}`, { method: 'DELETE' });

// keep your existing tag, catalog, personnel, location, container, vial functions here

export const breakSeal = (id: string, body: { personnelId: string; witnessPersonnelId?: string; notes?: string }) =>
  req<MedContainer>(`${BASE}/containers/${id}/break-seal`, { method: 'POST', body: JSON.stringify(body) });

export const applySeal = (id: string, body: { sealNumber: string; personnelId: string; isMasterSeal: boolean; witnessPersonnelId?: string; notes?: string }) =>
  req<MedContainer>(`${BASE}/containers/${id}/apply-seal`, { method: 'POST', body: JSON.stringify(body) });

export const fetchSeals = (tenantId: string, params?: { status?: string; licenseLevelId?: string }) =>
  req<MedSealStock[]>(`${BASE}/seals${qs({ tenantId, ...(params ?? {}) })}`);

export const createSeal = (tenantId: string, body: { sealNumber: string; sealType?: string; assignedLicenseLevelId?: string; notes?: string }) =>
  req<MedSealStock>(`${BASE}/seals${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const voidSeal = (tenantId: string, id: string) =>
  req<MedSealStock>(`${BASE}/seals/${id}/void${qs({ tenantId })}`, { method: 'POST', body: '{}' });

export const fetchCheckSessions = (
  tenantId: string,
  params?: { locationId?: string; status?: string; involvedPersonnelId?: string; from?: string; to?: string }
) => req<MedCheckSession[]>(`${BASE}/checks${qs({ tenantId, ...(params ?? {}) })}`);

export const fetchChecksDue = (tenantId: string) =>
  req<any[]>(`${BASE}/checks/due${qs({ tenantId })}`);

export const createCheckSession = (tenantId: string, body: {
  storageLocationId: string;
  personnelId: string;
  witnessPersonnelId?: string;
  notes?: string;
  saveAsDraft: boolean;
}) => req<MedCheckSession>(`${BASE}/checks${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const updateCheckSession = (tenantId: string, id: string, body: { witnessPersonnelId?: string; notes?: string }) =>
  req<MedCheckSession>(`${BASE}/checks/${id}${qs({ tenantId })}`, { method: 'PUT', body: JSON.stringify(body) });

export const startCheckSession = (tenantId: string, id: string) =>
  req<MedCheckSession>(`${BASE}/checks/${id}/start${qs({ tenantId })}`, { method: 'POST', body: '{}' });

export const cancelCheckSession = (tenantId: string, id: string, body: { personnelId: string; reason?: string }) =>
  req<MedCheckSession>(`${BASE}/checks/${id}/cancel${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const fetchCheckSession = (tenantId: string, id: string) =>
  req<MedCheckSession>(`${BASE}/checks/${id}${qs({ tenantId })}`);

export const addCheckItem = (tenantId: string, sessionId: string, body: {
  containerId?: string;
  vialId?: string;
  sealIntact: boolean;
  passed: boolean;
  discrepancy?: string;
  discrepancyType?: string;
  severity?: string;
  summary?: string;
  details?: string;
  requiresSupervisorReview?: boolean;
  requiresSealReplacement?: boolean;
  requiresIncidentReport?: boolean;
}) => req<MedCheckItem>(`${BASE}/checks/${sessionId}/items${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const completeCheckSession = (tenantId: string, id: string, notes?: string) =>
  req<MedCheckSession>(`${BASE}/checks/${id}/complete${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify({ notes }) });

export const abortCheckSession = (tenantId: string, id: string) =>
  req<MedCheckSession>(`${BASE}/checks/${id}/abort${qs({ tenantId })}`, { method: 'POST', body: '{}' });

export const fetchDiscrepancies = (tenantId: string, status?: string) =>
  req<MedDiscrepancy[]>(`${BASE}/discrepancies${qs({ tenantId, status })}`);

export const resolveDiscrepancy = (tenantId: string, id: string, body: { resolvedByPersonnelId: string; resolutionNotes: string }) =>
  req<MedDiscrepancy>(`${BASE}/discrepancies/${id}/resolve${qs({ tenantId })}`, { method: 'POST', body: JSON.stringify(body) });

export const fetchMyPermissions = (tenantId: string, username: string) =>
  req<EmsPermissions>(`${BASE}/my-permissions${qs({ tenantId, username })}`);

export const seedStandardMedications = (tenantId: string) =>
  req<{ created: number }>(`${BASE}/catalog/seed-standard${qs({ tenantId })}`, { method: 'POST', body: '{}' });
```

### 6) `frontend/web/src/features/ems/routing.ts`

Replace with:

```ts
export type EmsRoute =
  | { kind: 'dashboard' }
  | { kind: 'scan'; mode?: 'receive' | 'stock' | 'administer' | 'waste' }
  | { kind: 'vial'; vialId: string }
  | { kind: 'vials'; filter?: string }
  | { kind: 'check' }
  | { kind: 'check-session'; sessionId: string }
  | { kind: 'locations' }
  | { kind: 'location'; locationId: string }
  | { kind: 'seals' }
  | { kind: 'catalog' }
  | { kind: 'personnel' }
  | { kind: 'settings' }
  | { kind: 'reports' }
  | { kind: 'history-reports' }
  | { kind: 'discrepancies' }
  | { kind: 'agency-config' };

export function parseEmsHashRoute(hash: string): EmsRoute {
  const path = hash.replace(/^#\/ems\/?/, '');
  const parts = path.split('/').filter(Boolean);

  switch (parts[0]) {
    case 'scan': return { kind: 'scan', mode: parts[1] as any };
    case 'vials': return parts[1] === 'list' ? { kind: 'vials', filter: parts[2] } : parts[1] ? { kind: 'vial', vialId: parts[1] } : { kind: 'vials' };
    case 'check': return parts[1] ? { kind: 'check-session', sessionId: parts[1] } : { kind: 'check' };
    case 'locations': return parts[1] ? { kind: 'location', locationId: parts[1] } : { kind: 'locations' };
    case 'seals': return { kind: 'seals' };
    case 'catalog': return { kind: 'catalog' };
    case 'personnel': return { kind: 'personnel' };
    case 'settings': return { kind: 'settings' };
    case 'reports': return { kind: 'reports' };
    case 'history-reports': return { kind: 'history-reports' };
    case 'discrepancies': return { kind: 'discrepancies' };
    case 'agency-config': return { kind: 'agency-config' };
    default: return { kind: 'dashboard' };
  }
}

export function emsPath(route: EmsRoute): string {
  switch (route.kind) {
    case 'dashboard': return '#/ems';
    case 'scan': return route.mode ? `#/ems/scan/${route.mode}` : '#/ems/scan';
    case 'vials': return route.filter ? `#/ems/vials/list/${route.filter}` : '#/ems/vials';
    case 'vial': return `#/ems/vials/${route.vialId}`;
    case 'check': return '#/ems/check';
    case 'check-session': return `#/ems/check/${route.sessionId}`;
    case 'locations': return '#/ems/locations';
    case 'location': return `#/ems/locations/${route.locationId}`;
    case 'seals': return '#/ems/seals';
    case 'catalog': return '#/ems/catalog';
    case 'personnel': return '#/ems/personnel';
    case 'settings': return '#/ems/settings';
    case 'reports': return '#/ems/reports';
    case 'history-reports': return '#/ems/history-reports';
    case 'discrepancies': return '#/ems/discrepancies';
    case 'agency-config': return '#/ems/agency-config';
  }
}

export function navigateEms(route: EmsRoute): void {
  window.location.hash = emsPath(route).replace(/^#/, '');
}
```

### 7) `frontend/web/src/features/ems/EmsPortal.tsx`

Replace with:

```tsx
import { useEffect, useState, createContext, useContext } from 'react';
import { parseEmsHashRoute, emsPath, navigateEms, type EmsRoute } from './routing';
import { fetchMyPermissions } from './api';
import { T } from './theme';
import EmsDashboard from './components/EmsDashboard';
import EmsScanView from './components/EmsScanView';
import EmsVialDetail from './components/EmsVialDetail';
import EmsVialList from './components/EmsVialList';
import EmsCheckView from './components/EmsCheckView';
import EmsCheckSessionView from './components/EmsCheckSessionView';
import EmsLocationsView from './components/EmsLocationsView';
import EmsLocationDetail from './components/EmsLocationDetail';
import EmsCatalogView from './components/EmsCatalogView';
import EmsPersonnelView from './components/EmsPersonnelView';
import EmsSettingsView from './components/EmsSettingsView';
import EmsReportsView from './components/EmsReportsView';
import EmsAgencyConfigView from './components/EmsAgencyConfigView';
import EmsSealsView from './components/EmsSealsView';
import EmsDiscrepanciesView from './components/EmsDiscrepanciesView';
import EmsHistoryReportsView from './components/EmsHistoryReportsView';
import type { EmsPermissions } from '../../types/ems';

const DEFAULT_PERMS: EmsPermissions = {
  found: false, name: '', licenseLevelName: 'Unknown', rank: -1,
  canAdminister: false, canWaste: false, canWitness: false,
  canStock: false, canOrder: false, canReceive: false, canMove: false,
  canPerformCheck: false, canManageCatalog: false, canManageRoster: false,
  canManageLocations: false, canManageSeals: false, canApplySeal: false,
  canBreakSeal: false, canResolveDiscrepancies: false, canViewReports: false,
};

export const PermissionsCtx = createContext<EmsPermissions>(DEFAULT_PERMS);
export const useEmsPermissions = () => useContext(PermissionsCtx);

interface Props { tenantId: string; username: string; logout: () => void; }

function useEmsHash(): string {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const h = () => setHash(window.location.hash);
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return hash;
}

export default function EmsPortal({ tenantId, username, logout }: Props) {
  const hash = useEmsHash();
  const route = parseEmsHashRoute(hash);
  const [perms, setPerms] = useState<EmsPermissions>(DEFAULT_PERMS);

  useEffect(() => {
    if (!tenantId || !username) return;
    fetchMyPermissions(tenantId, username).then(setPerms).catch(() => setPerms(DEFAULT_PERMS));
  }, [tenantId, username]);

  const isAdmin = perms.canManageCatalog || perms.canManageRoster || perms.canManageLocations || perms.canManageSeals || perms.canViewReports;

  return (
    <PermissionsCtx.Provider value={perms}>
      <div data-bs-theme="dark" style={{ minHeight: '100vh', background: T.bg, paddingBottom: 72, color: T.text }}>
        <nav style={{ background: T.topBar, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 200, padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigateEms({ kind: 'dashboard' })}>
            <i className="bi bi-capsule-pill" style={{ fontSize: '1.3rem', color: T.accent }} />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: T.text }}>MedTrack EMS</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {perms.found && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: T.text, fontWeight: 600, lineHeight: 1.2 }}>{perms.name}</div>
                <div style={{ fontSize: '0.65rem', color: T.muted, lineHeight: 1.2 }}>{perms.licenseLevelName}</div>
              </div>
            )}
            <button style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '4px 10px', cursor: 'pointer' }} onClick={logout} title="Sign out">
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </nav>

        <div className="container-fluid px-3 py-3" style={{ maxWidth: 920 }}>
          {route.kind === 'dashboard' && <EmsDashboard tenantId={tenantId} />}
          {route.kind === 'scan' && <EmsScanView tenantId={tenantId} mode={route.mode} />}
          {route.kind === 'vial' && <EmsVialDetail tenantId={tenantId} vialId={route.vialId} />}
          {route.kind === 'vials' && <EmsVialList tenantId={tenantId} filter={route.filter} />}
          {route.kind === 'check' && <EmsCheckView tenantId={tenantId} />}
          {route.kind === 'check-session' && <EmsCheckSessionView tenantId={tenantId} sessionId={route.sessionId} />}
          {route.kind === 'locations' && <EmsLocationsView tenantId={tenantId} />}
          {route.kind === 'location' && <EmsLocationDetail tenantId={tenantId} locationId={route.locationId} />}
          {route.kind === 'seals' && <EmsSealsView tenantId={tenantId} />}
          {route.kind === 'catalog' && <EmsCatalogView tenantId={tenantId} />}
          {route.kind === 'personnel' && <EmsPersonnelView tenantId={tenantId} />}
          {route.kind === 'settings' && <EmsSettingsView tenantId={tenantId} />}
          {route.kind === 'reports' && <EmsReportsView tenantId={tenantId} />}
          {route.kind === 'history-reports' && <EmsHistoryReportsView tenantId={tenantId} />}
          {route.kind === 'discrepancies' && <EmsDiscrepanciesView tenantId={tenantId} />}
          {route.kind === 'agency-config' && <EmsAgencyConfigView tenantId={tenantId} />}
        </div>

        <EmsBottomNav route={route} isAdmin={isAdmin} />
      </div>
    </PermissionsCtx.Provider>
  );
}

function EmsBottomNav({ route, isAdmin }: { route: EmsRoute; isAdmin: boolean }) {
  const tabs = [
    { kind: 'dashboard', icon: 'bi-house-fill', label: 'Home' },
    { kind: 'scan', icon: 'bi-qr-code-scan', label: 'Scan' },
    { kind: 'check', icon: 'bi-clipboard2-check-fill', label: 'Checks' },
    { kind: 'vials', icon: 'bi-capsule', label: 'Vials' },
    { kind: 'settings', icon: 'bi-grid-fill', label: isAdmin ? 'Manage' : 'More' },
  ] as const;

  const active = (kind: string) =>
    route.kind === kind || (kind === 'settings' && ['settings', 'agency-config', 'personnel', 'locations', 'catalog', 'reports', 'seals', 'history-reports', 'discrepancies'].includes(route.kind));

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, background: T.topBar, zIndex: 300, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(tab => (
        <a key={tab.kind} href={emsPath({ kind: tab.kind } as EmsRoute)} style={{ flex: 1, padding: '6px 0', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: active(tab.kind) ? T.accent : T.muted }} onClick={e => { e.preventDefault(); navigateEms({ kind: tab.kind } as EmsRoute); }}>
          <i className={`bi ${tab.icon}`} style={{ fontSize: '1.4rem' }} />
          <span style={{ fontSize: '0.63rem', marginTop: 2 }}>{tab.label}</span>
        </a>
      ))}
    </nav>
  );
}
```

### 8) `frontend/web/src/features/ems/components/EmsDashboard.tsx`

Replace with:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { fetchEmsDashboard } from '../api';
import { navigateEms } from '../routing';
import { useEmsPermissions } from '../EmsPortal';
import { T, cardStyle, cardHeaderStyle } from '../theme';
import type { EmsDashboard as EmsDashboardData } from '../../../types/ems';

interface Props { tenantId: string; }

export default function EmsDashboard({ tenantId }: Props) {
  const perms = useEmsPermissions();
  const [data, setData] = useState<EmsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchEmsDashboard(tenantId, onlyMine ? perms.personnelId : undefined)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId, onlyMine, perms.personnelId]);

  const statusCount = (status: string) => data?.vialsByStatus.find(v => v.status === status)?.count ?? 0;

  const actions = useMemo(() => [
    { icon: 'bi-qr-code-scan', label: 'Scan a Vial', sub: 'Look up any med by QR or barcode', color: T.accent, show: true, onClick: () => navigateEms({ kind: 'scan' }) },
    { icon: 'bi-clipboard2-check-fill', label: 'Start New Check', sub: 'Open a card-based check workflow', color: T.green, show: perms.canPerformCheck, onClick: () => navigateEms({ kind: 'check' }) },
    { icon: 'bi-syringe', label: 'Administer', sub: 'Record dosage given to patient', color: T.red, show: perms.canAdminister, onClick: () => navigateEms({ kind: 'scan', mode: 'administer' }) },
    { icon: 'bi-droplet-half', label: 'Waste Medication', sub: 'Document wasted controlled substance', color: T.amber, show: perms.canWaste, onClick: () => navigateEms({ kind: 'scan', mode: 'waste' }) },
    { icon: 'bi-building', label: 'Manage Locations', sub: 'Units, stations and boxes', color: '#6b7280', show: perms.canManageLocations || !perms.found, onClick: () => navigateEms({ kind: 'locations' }) },
    { icon: 'bi-shield-lock', label: 'Manage Seals', sub: 'Seal stock, assigned seals and history', color: '#7c3aed', show: perms.canManageSeals || !perms.found, onClick: () => navigateEms({ kind: 'seals' }) },
    { icon: 'bi-exclamation-diamond', label: 'Discrepancies', sub: `${data?.openDiscrepanciesCount ?? 0} open issues`, color: data?.openDiscrepanciesCount ? T.red : T.muted, show: true, onClick: () => navigateEms({ kind: 'discrepancies' }) },
    { icon: 'bi-clock-history', label: 'History & Reports', sub: 'Completed checks, seal history and reports', color: '#0891b2', show: true, onClick: () => navigateEms({ kind: 'history-reports' }) },
  ].filter(a => a.show), [perms, data]);

  return (
    <div>
      <div className="row g-2 mb-3">
        <SquareStat icon="bi-capsule" label="Vials Stocked" value={statusCount('stocked') + statusCount('in-use')} color={T.accent} onClick={() => navigateEms({ kind: 'vials', filter: 'stocked' })} />
        <SquareStat icon="bi-clipboard2-check" label="Checks Due" value={data?.checksDueCount ?? 0} color={data?.checksDueCount ? T.red : T.green} onClick={() => navigateEms({ kind: 'check' })} />
        <SquareStat icon="bi-hourglass-split" label="Expiring 30d" value={data?.expiringIn30DaysCount ?? 0} color={data?.expiringIn30DaysCount ? T.amber : T.green} onClick={() => navigateEms({ kind: 'vials', filter: 'expiring' })} />
        <SquareStat icon="bi-shield-exclamation" label="Broken Seals" value={data?.brokenSealsCount ?? 0} color={data?.brokenSealsCount ? T.red : T.green} onClick={() => navigateEms({ kind: 'seals' })} />
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-lightning-fill me-2" style={{ color: T.accent }} />I Want To…</strong></div>
        <div style={{ padding: 12 }}>
          <div className="row g-2">
            {actions.map(a => <SquareAction key={a.label} {...a} />)}
          </div>
        </div>
      </div>

      <Section title="Checks Due" icon="bi bi-alarm-fill">
        {(data?.checksDue?.length ?? 0) === 0 && <EmptyText text="No checks are due right now." />}
        {(data?.checksDue ?? []).map(item => (
          <RowCard key={item.containerId} onClick={() => navigateEms({ kind: 'check' })}>
            <div>
              <div style={{ fontWeight: 700 }}>{item.locationName}</div>
              <div style={{ color: T.muted, fontSize: '0.78rem' }}>{item.containerName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: item.isOverdue ? T.red : T.amber, fontWeight: 700 }}>{item.isOverdue ? 'Overdue' : 'Due Soon'}</div>
              <div style={{ color: T.muted, fontSize: '0.75rem' }}>{item.isSealed ? `Seal ${item.sealNumber ?? ''}` : 'Unsealed'}</div>
            </div>
          </RowCard>
        ))}
      </Section>

      <Section title="Checks Completed" icon="bi bi-check2-square">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: T.muted, fontSize: '0.8rem' }}>
          <input type="checkbox" checked={onlyMine} onChange={e => setOnlyMine(e.target.checked)} />
          Only checks I was involved in
        </label>
        {(data?.recentCompletedChecks?.length ?? 0) === 0 && <EmptyText text="No completed checks found." />}
        {(data?.recentCompletedChecks ?? []).map(item => (
          <RowCard key={item.id} onClick={() => navigateEms({ kind: 'check-session', sessionId: item.id })}>
            <div>
              <div style={{ fontWeight: 700 }}>{item.locationName}</div>
              <div style={{ color: T.muted, fontSize: '0.78rem' }}>{item.personnelName ?? 'Unknown'}{item.witnessName ? ` • witness ${item.witnessName}` : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: item.status === 'discrepancy-open' ? T.red : T.green, fontWeight: 700 }}>{item.status}</div>
              <div style={{ color: T.muted, fontSize: '0.75rem' }}>{item.itemCount} items</div>
            </div>
          </RowCard>
        ))}
      </Section>

      {loading && <div style={{ textAlign: 'center', padding: '32px 0', color: T.muted }}><div className="spinner-border spinner-border-sm me-2" />Loading…</div>}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className={`${icon} me-2`} style={{ color: T.accent }} />{title}</strong></div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <div style={{ color: T.muted, fontSize: '0.82rem' }}>{text}</div>;
}

function RowCard({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={{ width: '100%', border: `1px solid ${T.border}`, background: T.card, color: T.text, borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, cursor: 'pointer', textAlign: 'left' }}>{children}</button>;
}

function SquareStat({ icon, label, value, color, onClick }: { icon: string; label: string; value: number; color: string; onClick: () => void }) {
  return (
    <div className="col-6 col-md-3">
      <button onClick={onClick} style={{ width: '100%', aspectRatio: '1 / 1', background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 6 }}>
        <i className={`bi ${icon}`} style={{ color, fontSize: '1.5rem' }} />
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: '0.74rem', color: T.muted }}>{label}</div>
      </button>
    </div>
  );
}

function SquareAction({ icon, label, sub, color, onClick }: { icon: string; label: string; sub: string; color: string; onClick: () => void }) {
  return (
    <div className="col-6 col-md-3">
      <button onClick={onClick} style={{ width: '100%', aspectRatio: '1 / 1', background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <i className={`bi ${icon}`} style={{ color, fontSize: '1.35rem' }} />
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: T.text }}>{label}</div>
        <div style={{ fontSize: '0.72rem', color: T.muted, marginTop: 4 }}>{sub}</div>
      </button>
    </div>
  );
}
```

### 9) `frontend/web/src/features/ems/components/EmsCheckView.tsx`

Replace with:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { fetchLocations, fetchCheckSessions, createCheckSession, fetchPersonnel, fetchChecksDue, cancelCheckSession } from '../api';
import { navigateEms } from '../routing';
import { useEmsPermissions } from '../EmsPortal';
import { T, cardStyle, cardHeaderStyle, inputStyle, btnBackStyle } from '../theme';
import type { MedStorageLocation, MedCheckSession, MedPersonnel, CheckDueItem } from '../../../types/ems';

interface Props { tenantId: string; }
type Tab = 'new' | 'due' | 'completed';

export default function EmsCheckView({ tenantId }: Props) {
  const perms = useEmsPermissions();
  const [tab, setTab] = useState<Tab>('new');
  const [locations, setLocations] = useState<MedStorageLocation[]>([]);
  const [personnel, setPersonnel] = useState<MedPersonnel[]>([]);
  const [completed, setCompleted] = useState<MedCheckSession[]>([]);
  const [checksDue, setChecksDue] = useState<CheckDueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<MedStorageLocation | null>(null);
  const [personnelId, setPersonnelId] = useState('');
  const [witnessPersonnelId, setWitnessPersonnelId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);

  const effectivePersonnelId = perms.personnelId ?? personnelId;

  async function load() {
    setLoading(true);
    try {
      const [locs, people, due, done] = await Promise.all([
        fetchLocations(tenantId),
        fetchPersonnel(tenantId),
        fetchChecksDue(tenantId),
        fetchCheckSessions(tenantId, { status: 'completed', involvedPersonnelId: onlyMine ? perms.personnelId : undefined }),
      ]);
      setLocations(locs.filter(x => x.isActive));
      setPersonnel(people.filter(x => x.isActive));
      setChecksDue(due);
      setCompleted(done);
      if (!personnelId && perms.personnelId) setPersonnelId(perms.personnelId);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load().catch(console.error); }, [tenantId, onlyMine, perms.personnelId]);

  const dueLocationIds = useMemo(() => new Set(checksDue.map(x => x.locationId)), [checksDue]);

  async function doSaveDraft() {
    if (!selectedLocation || !effectivePersonnelId) return;
    setSaving(true);
    try {
      const session = await createCheckSession(tenantId, {
        storageLocationId: selectedLocation.id,
        personnelId: effectivePersonnelId,
        witnessPersonnelId: witnessPersonnelId || undefined,
        notes: notes || undefined,
        saveAsDraft: true,
      });
      setShowModal(false);
      navigateEms({ kind: 'check-session', sessionId: session.id });
    } finally { setSaving(false); }
  }

  async function doStartNow() {
    if (!selectedLocation || !effectivePersonnelId) return;
    setSaving(true);
    try {
      const session = await createCheckSession(tenantId, {
        storageLocationId: selectedLocation.id,
        personnelId: effectivePersonnelId,
        witnessPersonnelId: witnessPersonnelId || undefined,
        notes: notes || undefined,
        saveAsDraft: false,
      });
      setShowModal(false);
      navigateEms({ kind: 'check-session', sessionId: session.id });
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}><i className="bi bi-arrow-left me-1" />Back</button>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['new', 'due', 'completed'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ border: `1px solid ${tab === t ? T.accent : T.border}`, background: tab === t ? `${T.accent}22` : T.card, color: tab === t ? T.accent : T.text, borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>{t === 'new' ? 'New Check' : t === 'due' ? 'Checks Due' : 'Checks Completed'}</button>
          ))}
        </div>
      </div>

      {tab === 'new' && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-grid-3x3-gap-fill me-2" style={{ color: T.accent }} />Select a Location</strong></div>
          <div style={{ padding: 12 }}>
            <div className="row g-2">
              {locations.map(loc => (
                <div className="col-6 col-md-4" key={loc.id}>
                  <button onClick={() => { setSelectedLocation(loc); setShowModal(true); }} style={{ width: '100%', aspectRatio: '1 / 1', border: `1px solid ${T.border}`, background: T.card, color: T.text, borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                    {dueLocationIds.has(loc.id) && <span style={{ position: 'absolute', top: 8, right: 8, background: T.red, color: '#fff', borderRadius: 12, fontSize: '0.65rem', padding: '2px 7px', fontWeight: 700 }}>Due</span>}
                    <i className="bi bi-building" style={{ color: T.accent, fontSize: '1.45rem', marginBottom: 10 }} />
                    <div style={{ fontWeight: 700 }}>{loc.name}</div>
                    <div style={{ color: T.muted, fontSize: '0.74rem', marginTop: 4 }}>{loc.locationType}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'due' && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-alarm me-2" style={{ color: T.accent }} />Checks Due</strong></div>
          <div style={{ padding: 12 }}>
            {checksDue.length === 0 && <div style={{ color: T.muted }}>Nothing is due right now.</div>}
            {checksDue.map(item => (
              <button key={item.containerId} onClick={() => {
                const loc = locations.find(x => x.id === item.locationId) ?? null;
                setSelectedLocation(loc); setShowModal(true);
              }} style={{ width: '100%', border: `1px solid ${T.border}`, background: T.card, color: T.text, borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', marginBottom: 8, cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.locationName}</div>
                  <div style={{ fontSize: '0.78rem', color: T.muted }}>{item.containerName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: item.isOverdue ? T.red : T.amber, fontWeight: 700 }}>{item.isOverdue ? 'Overdue' : 'Due'}</div>
                  <div style={{ fontSize: '0.74rem', color: T.muted }}>{item.isSealed ? `Seal ${item.sealNumber ?? ''}` : 'Unsealed'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'completed' && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-check2-square me-2" style={{ color: T.accent }} />Checks Completed</strong></div>
          <div style={{ padding: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.muted, fontSize: '0.8rem', marginBottom: 10 }}>
              <input type="checkbox" checked={onlyMine} onChange={e => setOnlyMine(e.target.checked)} />
              Only checks I was involved in
            </label>
            {completed.map(s => (
              <button key={s.id} onClick={() => navigateEms({ kind: 'check-session', sessionId: s.id })} style={{ width: '100%', border: `1px solid ${T.border}`, background: T.card, color: T.text, borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', marginBottom: 8, cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.storageLocation?.name ?? 'Unknown location'}</div>
                  <div style={{ fontSize: '0.78rem', color: T.muted }}>{s.personnel ? `${s.personnel.firstName} ${s.personnel.lastName}` : 'Unknown'}{s.witnessPersonnel ? ` • witness ${s.witnessPersonnel.firstName} ${s.witnessPersonnel.lastName}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: s.status === 'discrepancy-open' ? T.red : T.green, fontWeight: 700 }}>{s.status}</div>
                  <div style={{ fontSize: '0.74rem', color: T.muted }}>{s.items?.length ?? 0} items</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showModal && selectedLocation && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}>
            <div className="modal-header" style={{ borderBottom: `1px solid ${T.border}` }}>
              <h5 className="modal-title">Start check for {selectedLocation.name}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
            </div>
            <div className="modal-body">
              {!perms.personnelId && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: T.muted, marginBottom: 4 }}>Performed By</label>
                  <select value={personnelId} onChange={e => setPersonnelId(e.target.value)} style={{ ...inputStyle, width: '100%', padding: '10px 12px' }}>
                    <option value="">Select personnel</option>
                    {personnel.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: T.muted, marginBottom: 4 }}>Witness</label>
                <select value={witnessPersonnelId} onChange={e => setWitnessPersonnelId(e.target.value)} style={{ ...inputStyle, width: '100%', padding: '10px 12px' }}>
                  <option value="">No witness</option>
                  {personnel.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: T.muted, marginBottom: 4 }}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, width: '100%', minHeight: 100, padding: '10px 12px' }} />
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: `1px solid ${T.border}`, justifyContent: 'center' }}>
              <button className="btn btn-outline-light" onClick={() => setShowModal(false)}>Cancel Check</button>
              <button className="btn btn-secondary" disabled={!effectivePersonnelId || saving} onClick={doSaveDraft}>Save Draft</button>
              <button className="btn btn-primary" disabled={!effectivePersonnelId || saving} onClick={doStartNow}>Save</button>
            </div>
          </div></div>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border" style={{ color: T.accent }} /></div>}
    </div>
  );
}
```

### 10) `frontend/web/src/features/ems/components/EmsSealsView.tsx`

Create this file:

```tsx
import { useEffect, useState } from 'react';
import { createSeal, fetchLicenseLevels, fetchSeals, voidSeal } from '../api';
import { navigateEms } from '../routing';
import { T, cardStyle, cardHeaderStyle, btnBackStyle, inputStyle } from '../theme';
import type { MedLicenseLevel, MedSealStock } from '../../../types/ems';

export default function EmsSealsView({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<MedSealStock[]>([]);
  const [levels, setLevels] = useState<MedLicenseLevel[]>([]);
  const [status, setStatus] = useState('');
  const [sealNumber, setSealNumber] = useState('');
  const [sealType, setSealType] = useState('standard');
  const [assignedLicenseLevelId, setAssignedLicenseLevelId] = useState('');

  async function load() {
    const [seals, licenseLevels] = await Promise.all([
      fetchSeals(tenantId, { status: status || undefined }),
      fetchLicenseLevels(tenantId),
    ]);
    setItems(seals);
    setLevels(licenseLevels);
  }

  useEffect(() => { load().catch(console.error); }, [tenantId, status]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}><i className="bi bi-arrow-left me-1" />Back</button>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, width: 180 }}>
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="applied">Applied</option>
          <option value="broken">Broken</option>
          <option value="void">Void</option>
        </select>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-plus-circle me-2" style={{ color: T.accent }} />Add Seal</strong></div>
        <div style={{ padding: 12 }} className="row g-2">
          <div className="col-md-4"><input value={sealNumber} onChange={e => setSealNumber(e.target.value)} style={{ ...inputStyle, width: '100%' }} placeholder="Seal number" /></div>
          <div className="col-md-3"><input value={sealType} onChange={e => setSealType(e.target.value)} style={{ ...inputStyle, width: '100%' }} placeholder="Type" /></div>
          <div className="col-md-3">
            <select value={assignedLicenseLevelId} onChange={e => setAssignedLicenseLevelId(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              <option value="">Any level</option>
              {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="col-md-2 d-grid">
            <button className="btn btn-primary" onClick={async () => {
              await createSeal(tenantId, { sealNumber, sealType, assignedLicenseLevelId: assignedLicenseLevelId || undefined });
              setSealNumber('');
              await load();
            }}>Add</button>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle }}>
        <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-shield-lock me-2" style={{ color: T.accent }} />Seal Inventory</strong></div>
        <div style={{ padding: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{item.sealNumber}</div>
                <div style={{ color: T.muted, fontSize: '0.78rem' }}>{item.sealType} • {item.assignedLicenseLevel?.name ?? 'Any level'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge text-bg-secondary">{item.status}</span>
                {item.status !== 'void' && <button className="btn btn-sm btn-outline-danger" onClick={() => voidSeal(tenantId, item.id).then(load)}>Void</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 11) `frontend/web/src/features/ems/components/EmsDiscrepanciesView.tsx`

Create this file:

```tsx
import { useEffect, useState } from 'react';
import { fetchDiscrepancies, resolveDiscrepancy } from '../api';
import { navigateEms } from '../routing';
import { useEmsPermissions } from '../EmsPortal';
import { T, cardStyle, cardHeaderStyle, btnBackStyle, inputStyle } from '../theme';
import type { MedDiscrepancy } from '../../../types/ems';

export default function EmsDiscrepanciesView({ tenantId }: { tenantId: string }) {
  const perms = useEmsPermissions();
  const [items, setItems] = useState<MedDiscrepancy[]>([]);
  const [status, setStatus] = useState('open');
  const [resolving, setResolving] = useState<MedDiscrepancy | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  async function load() {
    setItems(await fetchDiscrepancies(tenantId, status || undefined));
  }

  useEffect(() => { load().catch(console.error); }, [tenantId, status]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}><i className="bi bi-arrow-left me-1" />Back</button>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, width: 180 }}>
          <option value="open">Open</option>
          <option value="under-review">Under review</option>
          <option value="resolved">Resolved</option>
          <option value="void">Void</option>
          <option value="">All</option>
        </select>
      </div>

      <div style={{ ...cardStyle }}>
        <div style={cardHeaderStyle} className="px-3 py-2"><strong><i className="bi bi-exclamation-diamond me-2" style={{ color: T.accent }} />Discrepancies</strong></div>
        <div style={{ padding: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.summary}</div>
                  <div style={{ color: T.muted, fontSize: '0.78rem' }}>{item.storageLocation?.name ?? 'Unknown location'}{item.container?.name ? ` • ${item.container.name}` : ''}</div>
                  {item.details && <div style={{ fontSize: '0.82rem', marginTop: 6 }}>{item.details}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><span className="badge text-bg-danger">{item.severity}</span></div>
                  <div style={{ color: T.muted, fontSize: '0.74rem', marginTop: 6 }}>{item.status}</div>
                </div>
              </div>
              {item.status !== 'resolved' && perms.canResolveDiscrepancies && perms.personnelId && (
                <div style={{ marginTop: 10 }}>
                  <button className="btn btn-sm btn-outline-light" onClick={() => { setResolving(item); setResolutionNotes(''); }}>Resolve</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {resolving && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}>
            <div className="modal-header" style={{ borderBottom: `1px solid ${T.border}` }}>
              <h5 className="modal-title">Resolve Discrepancy</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setResolving(null)} />
            </div>
            <div className="modal-body">
              <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} style={{ ...inputStyle, width: '100%', minHeight: 120, padding: '10px 12px' }} placeholder="Resolution notes" />
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline-light" onClick={() => setResolving(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                await resolveDiscrepancy(tenantId, resolving.id, { resolvedByPersonnelId: perms.personnelId!, resolutionNotes });
                setResolving(null);
                await load();
              }}>Resolve</button>
            </div>
          </div></div>
        </div>
      )}
    </div>
  );
}
```

### 12) `frontend/web/src/features/ems/components/EmsHistoryReportsView.tsx`

Create this file:

```tsx
import { useState } from 'react';
import EmsReportsView from './EmsReportsView';
import EmsDiscrepanciesView from './EmsDiscrepanciesView';
import { navigateEms } from '../routing';
import { T, btnBackStyle } from '../theme';

export default function EmsHistoryReportsView({ tenantId }: { tenantId: string }) {
  const [tab, setTab] = useState<'reports' | 'discrepancies'>('reports');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button style={btnBackStyle} className="btn btn-sm" onClick={() => navigateEms({ kind: 'dashboard' })}><i className="bi bi-arrow-left me-1" />Back</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" style={{ background: tab === 'reports' ? T.accent : T.card, color: '#fff' }} onClick={() => setTab('reports')}>Reports</button>
          <button className="btn btn-sm" style={{ background: tab === 'discrepancies' ? T.accent : T.card, color: '#fff' }} onClick={() => setTab('discrepancies')}>Discrepancies</button>
        </div>
      </div>
      {tab === 'reports' ? <EmsReportsView tenantId={tenantId} /> : <EmsDiscrepanciesView tenantId={tenantId} />}
    </div>
  );
}
```

### 13) `frontend/web/src/features/ems/components/EmsSettingsView.tsx`

Add these permission entries to `PERMISSIONS`:

```ts
{ key: 'canManageSeals', label: 'Manage Seals' },
{ key: 'canApplySeal', label: 'Apply Seals' },
{ key: 'canBreakSeal', label: 'Break Seals' },
{ key: 'canResolveDiscrepancies', label: 'Resolve Discrepancies' },
{ key: 'canViewReports', label: 'View Reports' },
```

Update the presets so Supervisor and Service Admin include the new flags.

### 14) `frontend/web/src/features/ems/components/EmsLocationDetail.tsx`

Keep the page mostly as-is, but make these changes:

- leave quick `Break Seal` and `Apply Seal` on the container card
- remove any global seal-administration responsibilities from this page
- make sure the seal modal uses the updated `applySeal()` payload with `notes`

The modal submit should be:

```tsx
if (action === 'break') {
  await breakSeal(container.id, { personnelId, witnessPersonnelId: witnessId || undefined, notes: notes || undefined });
} else {
  await applySeal(container.id, {
    sealNumber,
    personnelId,
    isMasterSeal,
    witnessPersonnelId: witnessId || undefined,
    notes: notes || undefined,
  });
}
```

## Migration

Create a migration after the backend changes:

```bash
dotnet ef migrations add MedcheckWorkflowUpgrade --project backend/AspireForge.ApiService --startup-project backend/AspireForge.ApiService
```

Then update the database.

```bash
dotnet ef database update --project backend/AspireForge.ApiService --startup-project backend/AspireForge.ApiService
```
