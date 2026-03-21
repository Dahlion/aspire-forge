using AspireForge.ApiService.Data;
using Microsoft.EntityFrameworkCore;
using AppDomain = AspireForge.ApiService.Data.AppDomain;

namespace AspireForge.ApiService.Middleware;

/// <summary>
/// Resolves an incoming HTTP hostname to a MicroApp + Tenant context.
/// Custom domains (e.g. ems.cityofacme.gov) are looked up in AppDomains and
/// the resolved MicroApp / Tenant are stored in HttpContext.Items so downstream
/// controllers and endpoints can scope their queries without re-querying.
///
/// Registration order: after UseCors, before UseAuthentication.
/// </summary>
public class TenantDomainMiddleware
{
    private readonly RequestDelegate _next;

    public TenantDomainMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        var host = context.Request.Host.Host;

        // Skip loopback, single-label hostnames, and *.aspireforge.internal
        if (!ShouldResolve(host))
        {
            await _next(context);
            return;
        }

        var domain = await db.AppDomains
            .Include(d => d.MicroApp)
                .ThenInclude(a => a!.Tenant)
            .Include(d => d.MicroApp)
                .ThenInclude(a => a!.Process)
                    .ThenInclude(p => p!.Steps)
            .Include(d => d.MicroApp)
                .ThenInclude(a => a!.Suite)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Hostname == host);

        if (domain?.MicroApp != null && domain.MicroApp.Status == "active")
        {
            context.Items["CurrentMicroApp"] = domain.MicroApp;
            context.Items["CurrentTenant"]   = domain.MicroApp.Tenant;
            context.Items["CurrentDomain"]   = domain;
        }

        await _next(context);
    }

    private static bool ShouldResolve(string host)
    {
        if (string.IsNullOrEmpty(host)) return false;
        if (host == "localhost") return false;
        if (host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase)) return false;
        if (!host.Contains('.')) return false;
        return true;
    }
}

public static class TenantDomainMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantDomainResolution(this IApplicationBuilder app)
        => app.UseMiddleware<TenantDomainMiddleware>();
}

/// <summary>
/// Convenience extensions for reading domain-resolved context from HttpContext.Items.
/// </summary>
public static class HttpContextDomainExtensions
{
    public static MicroApp? GetCurrentMicroApp(this HttpContext ctx)
        => ctx.Items["CurrentMicroApp"] as MicroApp;

    public static Tenant? GetCurrentTenant(this HttpContext ctx)
        => ctx.Items["CurrentTenant"] as Tenant;

    public static AppDomain? GetCurrentDomain(this HttpContext ctx)
        => ctx.Items["CurrentDomain"] as AppDomain;
}
