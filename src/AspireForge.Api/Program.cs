using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// Configure Entity Framework Core with InMemory database for demo
builder.Services.AddDbContext<MyDbContext>(options =>
    options.UseInMemoryDatabase("TestDb")
);

// Configure Keycloak Authentication
builder.Services.AddAuthentication(options => {
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options => {
    options.Authority = "https://<your-keycloak-server>/auth/realms/<your-realm>";
    options.Audience = "<your-audience>";
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error"); // For production
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/example", async (context) => {
    await context.Response.WriteAsJsonAsync(new { message = "Hello World" });
});

app.Run();

public class MyDbContext : DbContext
{
    public MyDbContext(DbContextOptions<MyDbContext> options) : base(options) {}
    // Define DbSets for your entities
}
