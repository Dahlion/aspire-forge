using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
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

// --- EF Core (Postgres) ---
var pg = builder.Configuration.GetConnectionString("Postgres");
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(pg));

// --- Redis ---
var redisConn = builder.Configuration.GetConnectionString("Redis");
builder.Services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConn!));

// --- Auth (Keycloak) ---
var authority = builder.Configuration["Auth:Authority"]!;
var audience = builder.Configuration["Auth:Audience"]!;

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

builder.Services.AddAuthorization();

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

app.MapGet("/api/todos", async (AppDbContext db) =>
    await db.Todos.OrderByDescending(t => t.Id).ToListAsync()
).RequireAuthorization();

app.MapPost("/api/todos", async (AppDbContext db, TodoItem input) =>
{
    var item = new TodoItem { Title = input.Title, IsDone = input.IsDone };
    db.Todos.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/api/todos/{item.Id}", item);
}).RequireAuthorization();

app.Run();
