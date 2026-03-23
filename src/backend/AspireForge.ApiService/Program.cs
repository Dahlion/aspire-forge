using AspireForge.ApiService.Email;
using AspireForge.ApiService.Middleware;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using AspireForge.ApiService.Data;
using AspireForge.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// --- CORS ---
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("default", p =>
        p.WithOrigins(allowedOrigins)
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials());
});

// --- Email (Mailpit in dev) ---
builder.Services.AddScoped<IEmailService, MailKitEmailService>();

// --- EF Core (Postgres) ---
builder.AddNpgsqlDbContext<AppDbContext>("dbSeacoastDevops");

// --- Redis ---
builder.AddRedisClient("Redis");

// --- Azure Blob Storage (Azurite in dev) ---
builder.AddAzureBlobServiceClient("blobs");

// --- Auth (Keycloak) ---
var keycloakBase = builder.Configuration.GetConnectionString("keycloak") ?? "http://localhost:8080";
var authority = $"{keycloakBase.TrimEnd('/')}/realms/aspireforge";
var audience = builder.Configuration["Auth:Audience"] ?? "api";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = authority;
        options.Audience = audience;
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateIssuer = true
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireAssertion(context => IsAdmin(context.User)));
});

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
        opts.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- OpenFDA HTTP client (for medication barcode lookups) ---
builder.Services.AddHttpClient("openfda", c =>
{
    c.BaseAddress = new Uri("https://api.fda.gov/");
    c.DefaultRequestHeaders.Add("User-Agent", "AspireForge-EMS/1.0");
    c.Timeout = TimeSpan.FromSeconds(10);
});

var app = builder.Build();

app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("default");
app.UseTenantDomainResolution();   // resolve custom hostnames → MicroApp context
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/api/hello", () => Results.Ok(new { message = "Hello from API" }))
   .AllowAnonymous();

app.MapGet("/api/me", (HttpContext ctx) =>
{
    var name = ctx.User.Identity?.Name ?? "unknown";
    var claims = ctx.User.Claims.Select(c => new { c.Type, c.Value });
    return Results.Ok(new { name, claims });
}).RequireAuthorization();

// Auto-apply EF Core migrations and provision storage on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // If the DB has orphaned migration history rows (i.e. after a consolidation),
    // wipe and recreate so MigrateAsync can apply the single InitialSchema cleanly.
    try
    {
        var applied = (await db.Database.GetAppliedMigrationsAsync()).ToHashSet();
        var defined = db.Database.GetMigrations().ToHashSet();
        // Drop if any applied migrations no longer exist in code, or if DB has migration
        // history but code has no migrations at all (e.g. after migration consolidation)
        bool hasOrphaned = applied.Except(defined).Any() || (!defined.Any() && applied.Any());
        if (hasOrphaned)
            await db.Database.EnsureDeletedAsync();
    }
    catch { /* __EFMigrationsHistory doesn't exist yet — fresh DB, nothing to do */ }

    if (db.Database.GetMigrations().Any())
        await db.Database.MigrateAsync();
    else
        await db.Database.EnsureCreatedAsync(); // No migration files: create schema from model

    await SeedHardcodedTenantsAsync(db);
    await SeedSubscriptionPlansAsync(db);

    var blobService = scope.ServiceProvider.GetRequiredService<BlobServiceClient>();
    await blobService.GetBlobContainerClient("test").CreateIfNotExistsAsync();
}

await app.RunAsync();

static async Task SeedHardcodedTenantsAsync(AppDbContext db)
{
    // ── Lisbon EMS ────────────────────────────────────────────────────────────
    // GUIDs match realm-export.json tenant_id for lisbon-medic / lisbon-admin
    var lisbonTenantId = new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
    var lisbonSuiteId  = new Guid("b2c3d4e5-f6a7-8901-bcde-f01234567890");
    var lisbonAppId    = new Guid("c3d4e5f6-a7b8-9012-cdef-012345678901");

    // ── Seacoast Internal ─────────────────────────────────────────────────────
    // GUIDs match realm-export.json tenant_id for dclark / jkaufman
    var seacoastTenantId = new Guid("f0e1d2c3-b4a5-9687-fedc-ba9876543210");
    var seacoastSuiteId  = new Guid("e1d2c3b4-a596-8776-edcb-a98765432100");
    var seacoastAppId    = new Guid("d2c3b4a5-9687-7665-dcba-987654321000");

    if (!await db.Tenants.AnyAsync(t => t.Id == lisbonTenantId))
    {
        db.Tenants.Add(new Tenant { Id = lisbonTenantId, Name = "Lisbon EMS", Slug = "lisbon-ems", IsActive = true, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow });
        db.AppSuites.Add(new AppSuite { Id = lisbonSuiteId, TenantId = lisbonTenantId, Name = "EMS Operations", Slug = "ems-operations", Description = "Medication tracking and dispatch management for Lisbon EMS.", IconClass = "bi-hospital-fill", Color = "#0d6efd", SortOrder = 0 });
        db.MicroApps.Add(new MicroApp { Id = lisbonAppId, TenantId = lisbonTenantId, AppSuiteId = lisbonSuiteId, DisplayName = "MedTrack", Slug = "ems", Description = "DEA-compliant medication tracking — vials, checks, personnel, and drug catalog.", PrimaryColor = "#0d6efd", AccentColor = "#0a58ca", IconClass = "bi-capsule-pill", Status = "active", IsPublic = false });
        db.MedLicenseLevels.AddRange(BuildEmsLicenseLevels(lisbonTenantId));
    }

    if (!await db.Tenants.AnyAsync(t => t.Id == seacoastTenantId))
    {
        db.Tenants.Add(new Tenant { Id = seacoastTenantId, Name = "Seacoast Internal", Slug = "seacoast-internal", IsActive = true, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow });
        db.AppSuites.Add(new AppSuite { Id = seacoastSuiteId, TenantId = seacoastTenantId, Name = "EMS Operations", Slug = "ems-operations", Description = "Medication tracking and dispatch management for Seacoast Internal.", IconClass = "bi-hospital-fill", Color = "#198754", SortOrder = 0 });
        db.MicroApps.Add(new MicroApp { Id = seacoastAppId, TenantId = seacoastTenantId, AppSuiteId = seacoastSuiteId, DisplayName = "MedTrack", Slug = "ems", Description = "DEA-compliant medication tracking — vials, checks, personnel, and drug catalog.", PrimaryColor = "#198754", AccentColor = "#146c43", IconClass = "bi-capsule-pill", Status = "active", IsPublic = false });
        db.MedLicenseLevels.AddRange(BuildEmsLicenseLevels(seacoastTenantId));
    }

    await db.SaveChangesAsync();
}

static MedLicenseLevel[] BuildEmsLicenseLevels(Guid tenantId) =>
[
    new MedLicenseLevel { TenantId = tenantId, Name = "Driver",           Rank = 0 },
    new MedLicenseLevel { TenantId = tenantId, Name = "EMT",              Rank = 1, CanReceive = true, CanStock = true, CanMove = true, CanPerformCheck = true },
    new MedLicenseLevel { TenantId = tenantId, Name = "AEMT",             Rank = 2, CanReceive = true, CanStock = true, CanMove = true, CanPerformCheck = true, CanAdminister = true, CanWaste = true, CanWitness = true },
    new MedLicenseLevel { TenantId = tenantId, Name = "Paramedic",        Rank = 3, CanReceive = true, CanStock = true, CanMove = true, CanPerformCheck = true, CanAdminister = true, CanWaste = true, CanWitness = true, CanOrder = true },
    new MedLicenseLevel { TenantId = tenantId, Name = "Service Admin",    Rank = 4, CanReceive = true, CanStock = true, CanMove = true, CanPerformCheck = true, CanAdminister = true, CanWaste = true, CanWitness = true, CanOrder = true, CanManageCatalog = true, CanManageRoster = true, CanManageLocations = true },
    new MedLicenseLevel { TenantId = tenantId, Name = "Medical Director", Rank = 5, CanReceive = true, CanStock = true, CanMove = true, CanPerformCheck = true, CanAdminister = true, CanWaste = true, CanWitness = true, CanOrder = true, CanManageCatalog = true, CanManageRoster = true, CanManageLocations = true },
];

static async Task SeedSubscriptionPlansAsync(AppDbContext db)
{
    var plans = new[]
    {
        new SubscriptionPlan
        {
            Id           = new Guid("aa000001-0000-0000-0000-000000000001"),
            Name         = "EMS Standard",
            Slug         = "ems-standard",
            Description  = "Full MedTrack access for small to mid-size EMS agencies.",
            MonthlyPrice = 99.00m,
            Currency     = "USD",
            MaxSeats     = 25,
            Features     = "MedTrack medication lifecycle\nVial tracking & checks\nPersonnel roster\nBasic reporting",
            IsActive     = true,
        },
        new SubscriptionPlan
        {
            Id           = new Guid("aa000002-0000-0000-0000-000000000002"),
            Name         = "EMS Professional",
            Slug         = "ems-professional",
            Description  = "Unlimited seats, advanced reporting, and priority support.",
            MonthlyPrice = 249.00m,
            Currency     = "USD",
            MaxSeats     = 0, // unlimited
            Features     = "Everything in EMS Standard\nUnlimited personnel\nAdvanced DEA reporting\nOpenFDA barcode lookup\nPriority support",
            IsActive     = true,
        },
        new SubscriptionPlan
        {
            Id           = new Guid("aa000003-0000-0000-0000-000000000003"),
            Name         = "Enterprise",
            Slug         = "enterprise",
            Description  = "Custom deployments, white-labelling, and dedicated infrastructure.",
            MonthlyPrice = 0.00m,
            Currency     = "USD",
            MaxSeats     = 0,
            Features     = "Everything in EMS Professional\nCustom domain/white-label\nDedicated infrastructure\nSLA agreement\nCustom integrations",
            IsActive     = true,
        },
    };

    foreach (var plan in plans)
    {
        if (!await db.SubscriptionPlans.AnyAsync(p => p.Id == plan.Id))
            db.SubscriptionPlans.Add(plan);
    }

    await db.SaveChangesAsync();
}

static bool IsAdmin(ClaimsPrincipal user)
{
    if (user.Claims.Any(c => (c.Type is ClaimTypes.Role or "role" or "roles") && c.Value.Equals("seacoast_owneradmin", StringComparison.OrdinalIgnoreCase)))
        return true;

    return user.Claims.Any(c =>
        c.Type.Equals("realm_access", StringComparison.OrdinalIgnoreCase)
        && c.Value.Contains("\"seacoast_owneradmin\"", StringComparison.OrdinalIgnoreCase));
}
