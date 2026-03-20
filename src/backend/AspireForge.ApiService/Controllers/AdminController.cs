using AspireForge.ApiService.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspireForge.ApiService.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController(AppDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
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
            .Select(s => new { s.Id, s.TenantId, s.PlanName, s.Status, s.RenewsAt, s.MonthlyPrice, s.Currency })
            .ToListAsync();

        var recentTenants = await db.Tenants
            .OrderByDescending(t => t.CreatedAt)
            .Take(8)
            .Select(t => new { t.Id, t.Name, t.Slug, t.IsActive, t.CreatedAt, SubscriptionCount = t.Subscriptions.Count })
            .ToListAsync();

        return Ok(new
        {
            tenantCount,
            activeTenantCount,
            subscriptionCount,
            activeSubscriptionCount,
            monthlyRecurringRevenue = mrr,
            recentTenants,
            upcomingRenewals
        });
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants()
    {
        var tenants = await db.Tenants
            .OrderBy(t => t.Name)
            .Select(t => new
            {
                t.Id, t.Name, t.Slug, t.IsActive, t.CreatedAt, t.UpdatedAt,
                SubscriptionCount = t.Subscriptions.Count,
                ActiveSubscriptionCount = t.Subscriptions.Count(s => s.Status == "active")
            })
            .ToListAsync();
        return Ok(tenants);
    }

    [HttpPost("tenants")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest input)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
            return BadRequest(new { message = "Tenant name is required." });

        var slug = string.IsNullOrWhiteSpace(input.Slug) ? Slugify(input.Name) : Slugify(input.Slug);

        if (await db.Tenants.AnyAsync(t => t.Slug == slug))
            return Conflict(new { message = "Tenant slug must be unique." });

        var tenant = new Tenant { Name = input.Name.Trim(), Slug = slug, IsActive = input.IsActive ?? true };
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();
        return Created($"/api/admin/tenants/{tenant.Id}", tenant);
    }

    [HttpGet("tenants/{tenantId:guid}")]
    public async Task<IActionResult> GetTenant(Guid tenantId)
    {
        var tenant = await db.Tenants
            .Where(t => t.Id == tenantId)
            .Select(t => new
            {
                t.Id, t.Name, t.Slug, t.IsActive, t.CreatedAt, t.UpdatedAt,
                subscriptions = t.Subscriptions
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => new
                    {
                        s.Id, s.PlanName, s.Status, s.Seats, s.MonthlyPrice, s.Currency,
                        s.AutoRenew, s.StartedAt, s.RenewsAt, s.CancelledAt, s.CreatedAt, s.UpdatedAt
                    })
            })
            .FirstOrDefaultAsync();

        return tenant is null ? NotFound() : Ok(tenant);
    }

    [HttpPut("tenants/{tenantId:guid}")]
    public async Task<IActionResult> UpdateTenant(Guid tenantId, [FromBody] UpdateTenantRequest input)
    {
        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(input.Name)) tenant.Name = input.Name.Trim();

        if (!string.IsNullOrWhiteSpace(input.Slug))
        {
            var slug = Slugify(input.Slug);
            if (await db.Tenants.AnyAsync(t => t.Id != tenant.Id && t.Slug == slug))
                return Conflict(new { message = "Tenant slug must be unique." });
            tenant.Slug = slug;
        }

        if (input.IsActive.HasValue) tenant.IsActive = input.IsActive.Value;
        tenant.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Ok(tenant);
    }

    [HttpDelete("tenants/{tenantId:guid}")]
    public async Task<IActionResult> DeleteTenant(Guid tenantId)
    {
        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant is null) return NotFound();
        db.Tenants.Remove(tenant);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("tenants/{tenantId:guid}/subscriptions")]
    public async Task<IActionResult> CreateSubscription(Guid tenantId, [FromBody] CreateSubscriptionRequest input)
    {
        if (!await db.Tenants.AnyAsync(t => t.Id == tenantId))
            return NotFound(new { message = "Tenant not found." });

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
        return Created($"/api/admin/tenants/{tenantId}/subscriptions/{subscription.Id}", subscription);
    }

    [HttpPut("tenants/{tenantId:guid}/subscriptions/{subscriptionId:guid}")]
    public async Task<IActionResult> UpdateSubscription(Guid tenantId, Guid subscriptionId, [FromBody] UpdateSubscriptionRequest input)
    {
        var subscription = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.TenantId == tenantId);
        if (subscription is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(input.PlanName)) subscription.PlanName = input.PlanName.Trim();
        if (!string.IsNullOrWhiteSpace(input.Status)) subscription.Status = NormalizeStatus(input.Status);
        if (input.Seats.HasValue) subscription.Seats = input.Seats.Value;
        if (input.MonthlyPrice.HasValue) subscription.MonthlyPrice = input.MonthlyPrice.Value;
        if (!string.IsNullOrWhiteSpace(input.Currency)) subscription.Currency = input.Currency.Trim().ToUpperInvariant();
        if (input.AutoRenew.HasValue) subscription.AutoRenew = input.AutoRenew.Value;
        if (input.StartedAt.HasValue) subscription.StartedAt = input.StartedAt.Value;
        if (input.RenewsAtSet) subscription.RenewsAt = input.RenewsAt;
        if (input.CancelledAtSet) subscription.CancelledAt = input.CancelledAt;

        subscription.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Ok(subscription);
    }

    [HttpDelete("tenants/{tenantId:guid}/subscriptions/{subscriptionId:guid}")]
    public async Task<IActionResult> DeleteSubscription(Guid tenantId, Guid subscriptionId)
    {
        var subscription = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.TenantId == tenantId);
        if (subscription is null) return NotFound();
        db.Subscriptions.Remove(subscription);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string Slugify(string value)
    {
        var chars = value.Trim().ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-').ToArray();
        var slug = new string(chars);
        while (slug.Contains("--", StringComparison.Ordinal))
            slug = slug.Replace("--", "-", StringComparison.Ordinal);
        return slug.Trim('-');
    }

    private static string NormalizeStatus(string status) => status.Trim().ToLowerInvariant();
}

public record CreateTenantRequest(string Name, string? Slug, bool? IsActive);
public record UpdateTenantRequest(string? Name, string? Slug, bool? IsActive);
public record CreateSubscriptionRequest(
    string PlanName, string Status, int Seats, decimal MonthlyPrice, string Currency,
    bool AutoRenew, DateTimeOffset StartedAt, DateTimeOffset? RenewsAt, DateTimeOffset? CancelledAt);
public record UpdateSubscriptionRequest(
    string? PlanName, string? Status, int? Seats, decimal? MonthlyPrice, string? Currency,
    bool? AutoRenew, DateTimeOffset? StartedAt, DateTimeOffset? RenewsAt, bool RenewsAtSet,
    DateTimeOffset? CancelledAt, bool CancelledAtSet);
