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

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
        bool hasOrphaned = applied.Except(db.Database.GetMigrations()).Any();
        if (hasOrphaned)
            await db.Database.EnsureDeletedAsync();
    }
    catch { /* __EFMigrationsHistory doesn't exist yet — fresh DB, nothing to do */ }

    await db.Database.MigrateAsync();

    var blobService = scope.ServiceProvider.GetRequiredService<BlobServiceClient>();
    await blobService.GetBlobContainerClient("test").CreateIfNotExistsAsync();
}

await app.RunAsync();

static bool IsAdmin(ClaimsPrincipal user)
{
    if (user.Claims.Any(c => (c.Type is ClaimTypes.Role or "role" or "roles") && c.Value.Equals("seacoast_owneradmin", StringComparison.OrdinalIgnoreCase)))
        return true;

    return user.Claims.Any(c =>
        c.Type.Equals("realm_access", StringComparison.OrdinalIgnoreCase)
        && c.Value.Contains("\"seacoast_owneradmin\"", StringComparison.OrdinalIgnoreCase));
}
