using AspireForge.ApiService.Email;
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
builder.AddNpgsqlDbContext<AppDbContext>("Postgres");

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

        options.RequireHttpsMetadata = false; // local dev
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

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.MapDefaultEndpoints();

// Swagger for dev
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("default");

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/hello", () => Results.Ok(new { message = "Hello from API" }))
   .AllowAnonymous();

app.MapGet("/api/me", (HttpContext ctx) =>
{
    var name = ctx.User.Identity?.Name ?? "unknown";
    var claims = ctx.User.Claims.Select(c => new { c.Type, c.Value });
    return Results.Ok(new { name, claims });
}).RequireAuthorization();

var adminApi = app.MapGroup("/api/admin").RequireAuthorization("AdminOnly");

adminApi.MapGet("/dashboard", async (AppDbContext db) =>
{
    var now = DateTimeOffset.UtcNow;
    var tenantCount = await db.Tenants.CountAsync();
    var activeTenantCount = await db.Tenants.CountAsync(t => t.IsActive);
    var subscriptionCount = await db.Subscriptions.CountAsync();
    var activeSubscriptionCount = await db.Subscriptions.CountAsync(s => s.Status == "active");
    var mrr = await db.Subscriptions
        .Where(s => s.Status == "active")
        .SumAsync(s => (decimal?)s.MonthlyPrice) ?? 0;

    var upcomingRenewals = await db.Subscriptions
        .Where(s => s.RenewsAt != null && s.RenewsAt >= now)
        .OrderBy(s => s.RenewsAt)
        .Take(10)
        .Select(s => new
        {
            s.Id,
            s.TenantId,
            s.PlanName,
            s.Status,
            s.RenewsAt,
            s.MonthlyPrice,
            s.Currency
        })
        .ToListAsync();

    var recentTenants = await db.Tenants
        .OrderByDescending(t => t.CreatedAt)
        .Take(8)
        .Select(t => new
        {
            t.Id,
            t.Name,
            t.Slug,
            t.IsActive,
            t.CreatedAt,
            SubscriptionCount = t.Subscriptions.Count
        })
        .ToListAsync();

    return Results.Ok(new
    {
        tenantCount,
        activeTenantCount,
        subscriptionCount,
        activeSubscriptionCount,
        monthlyRecurringRevenue = mrr,
        recentTenants,
        upcomingRenewals
    });
});

adminApi.MapGet("/tenants", async (AppDbContext db) =>
{
    var tenants = await db.Tenants
        .OrderBy(t => t.Name)
        .Select(t => new
        {
            t.Id,
            t.Name,
            t.Slug,
            t.IsActive,
            t.CreatedAt,
            t.UpdatedAt,
            SubscriptionCount = t.Subscriptions.Count,
            ActiveSubscriptionCount = t.Subscriptions.Count(s => s.Status == "active")
        })
        .ToListAsync();

    return Results.Ok(tenants);
});

adminApi.MapPost("/tenants", async (AppDbContext db, CreateTenantRequest input) =>
{
    if (string.IsNullOrWhiteSpace(input.Name))
    {
        return Results.BadRequest(new { message = "Tenant name is required." });
    }

    var slug = string.IsNullOrWhiteSpace(input.Slug)
        ? Slugify(input.Name)
        : Slugify(input.Slug);

    if (await db.Tenants.AnyAsync(t => t.Slug == slug))
    {
        return Results.Conflict(new { message = "Tenant slug must be unique." });
    }

    var tenant = new Tenant
    {
        Name = input.Name.Trim(),
        Slug = slug,
        IsActive = input.IsActive ?? true
    };

    db.Tenants.Add(tenant);
    await db.SaveChangesAsync();

    return Results.Created($"/api/admin/tenants/{tenant.Id}", tenant);
});

adminApi.MapGet("/tenants/{tenantId:guid}", async (AppDbContext db, Guid tenantId) =>
{
    var tenant = await db.Tenants
        .Where(t => t.Id == tenantId)
        .Select(t => new
        {
            t.Id,
            t.Name,
            t.Slug,
            t.IsActive,
            t.CreatedAt,
            t.UpdatedAt,
            subscriptions = t.Subscriptions
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    s.PlanName,
                    s.Status,
                    s.Seats,
                    s.MonthlyPrice,
                    s.Currency,
                    s.AutoRenew,
                    s.StartedAt,
                    s.RenewsAt,
                    s.CancelledAt,
                    s.CreatedAt,
                    s.UpdatedAt
                })
        })
        .FirstOrDefaultAsync();

    return tenant is null ? Results.NotFound() : Results.Ok(tenant);
});

adminApi.MapPut("/tenants/{tenantId:guid}", async (AppDbContext db, Guid tenantId, UpdateTenantRequest input) =>
{
    var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
    if (tenant is null)
    {
        return Results.NotFound();
    }

    if (!string.IsNullOrWhiteSpace(input.Name))
    {
        tenant.Name = input.Name.Trim();
    }

    if (!string.IsNullOrWhiteSpace(input.Slug))
    {
        var slug = Slugify(input.Slug);
        var slugInUse = await db.Tenants.AnyAsync(t => t.Id != tenant.Id && t.Slug == slug);
        if (slugInUse)
        {
            return Results.Conflict(new { message = "Tenant slug must be unique." });
        }

        tenant.Slug = slug;
    }

    if (input.IsActive.HasValue)
    {
        tenant.IsActive = input.IsActive.Value;
    }

    tenant.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(tenant);
});

adminApi.MapDelete("/tenants/{tenantId:guid}", async (AppDbContext db, Guid tenantId) =>
{
    var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
    if (tenant is null)
    {
        return Results.NotFound();
    }

    db.Tenants.Remove(tenant);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

adminApi.MapPost("/tenants/{tenantId:guid}/subscriptions", async (AppDbContext db, Guid tenantId, CreateSubscriptionRequest input) =>
{
    var tenantExists = await db.Tenants.AnyAsync(t => t.Id == tenantId);
    if (!tenantExists)
    {
        return Results.NotFound(new { message = "Tenant not found." });
    }

    var subscription = new Subscription
    {
        TenantId = tenantId,
        PlanName = input.PlanName.Trim(),
        Status = NormalizeStatus(input.Status),
        Seats = input.Seats,
        MonthlyPrice = input.MonthlyPrice,
        Currency = input.Currency.Trim().ToUpperInvariant(),
        AutoRenew = input.AutoRenew,
        StartedAt = input.StartedAt,
        RenewsAt = input.RenewsAt,
        CancelledAt = input.CancelledAt
    };

    db.Subscriptions.Add(subscription);
    await db.SaveChangesAsync();
    return Results.Created($"/api/admin/tenants/{tenantId}/subscriptions/{subscription.Id}", subscription);
});

adminApi.MapPut("/tenants/{tenantId:guid}/subscriptions/{subscriptionId:guid}", async (AppDbContext db, Guid tenantId, Guid subscriptionId, UpdateSubscriptionRequest input) =>
{
    var subscription = await db.Subscriptions
        .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.TenantId == tenantId);

    if (subscription is null)
    {
        return Results.NotFound();
    }

    if (!string.IsNullOrWhiteSpace(input.PlanName))
    {
        subscription.PlanName = input.PlanName.Trim();
    }

    if (!string.IsNullOrWhiteSpace(input.Status))
    {
        subscription.Status = NormalizeStatus(input.Status);
    }

    if (input.Seats.HasValue)
    {
        subscription.Seats = input.Seats.Value;
    }

    if (input.MonthlyPrice.HasValue)
    {
        subscription.MonthlyPrice = input.MonthlyPrice.Value;
    }

    if (!string.IsNullOrWhiteSpace(input.Currency))
    {
        subscription.Currency = input.Currency.Trim().ToUpperInvariant();
    }

    if (input.AutoRenew.HasValue)
    {
        subscription.AutoRenew = input.AutoRenew.Value;
    }

    if (input.StartedAt.HasValue)
    {
        subscription.StartedAt = input.StartedAt.Value;
    }

    if (input.RenewsAtSet)
    {
        subscription.RenewsAt = input.RenewsAt;
    }

    if (input.CancelledAtSet)
    {
        subscription.CancelledAt = input.CancelledAt;
    }

    subscription.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(subscription);
});

adminApi.MapDelete("/tenants/{tenantId:guid}/subscriptions/{subscriptionId:guid}", async (AppDbContext db, Guid tenantId, Guid subscriptionId) =>
{
    var subscription = await db.Subscriptions
        .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.TenantId == tenantId);

    if (subscription is null)
    {
        return Results.NotFound();
    }

    db.Subscriptions.Remove(subscription);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// Auto-apply EF Core migrations and provision storage on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    var blobService = scope.ServiceProvider.GetRequiredService<BlobServiceClient>();
    await blobService.GetBlobContainerClient("test").CreateIfNotExistsAsync();
}

await app.RunAsync();

static bool IsAdmin(ClaimsPrincipal user)
{
    if (user.Claims.Any(c => (c.Type is ClaimTypes.Role or "role" or "roles") && c.Value.Equals("platform_admin", StringComparison.OrdinalIgnoreCase)))
    {
        return true;
    }

    return user.Claims.Any(c =>
        c.Type.Equals("realm_access", StringComparison.OrdinalIgnoreCase)
        && c.Value.Contains("\"platform_admin\"", StringComparison.OrdinalIgnoreCase));
}

static string Slugify(string value)
{
    var chars = value.Trim().ToLowerInvariant().Select(ch =>
        char.IsLetterOrDigit(ch) ? ch : '-').ToArray();

    var slug = new string(chars);
    while (slug.Contains("--", StringComparison.Ordinal))
    {
        slug = slug.Replace("--", "-", StringComparison.Ordinal);
    }

    return slug.Trim('-');
}

static string NormalizeStatus(string status) => status.Trim().ToLowerInvariant();

record CreateTenantRequest(string Name, string? Slug, bool? IsActive);

record UpdateTenantRequest(string? Name, string? Slug, bool? IsActive);

record CreateSubscriptionRequest(
    string PlanName,
    string Status,
    int Seats,
    decimal MonthlyPrice,
    string Currency,
    bool AutoRenew,
    DateTimeOffset StartedAt,
    DateTimeOffset? RenewsAt,
    DateTimeOffset? CancelledAt);

record UpdateSubscriptionRequest(
    string? PlanName,
    string? Status,
    int? Seats,
    decimal? MonthlyPrice,
    string? Currency,
    bool? AutoRenew,
    DateTimeOffset? StartedAt,
    DateTimeOffset? RenewsAt,
    bool RenewsAtSet,
    DateTimeOffset? CancelledAt,
    bool CancelledAtSet);
