using AspireForge.ApiService.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspireForge.ApiService.Controllers;

[ApiController]
[Route("api/admin/plans")]
[Authorize(Policy = "AdminOnly")]
public class PlansController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPlans()
    {
        var plans = await db.SubscriptionPlans
            .OrderBy(p => p.MonthlyPrice)
            .Select(p => new
            {
                p.Id, p.Name, p.Slug, p.Description, p.MonthlyPrice, p.Currency,
                p.MaxSeats, p.Features, p.IsActive, p.CreatedAt, p.UpdatedAt
            })
            .ToListAsync();
        return Ok(plans);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePlan([FromBody] CreatePlanRequest input)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
            return BadRequest(new { message = "Plan name is required." });

        var slug = string.IsNullOrWhiteSpace(input.Slug) ? Slugify(input.Name) : Slugify(input.Slug);

        if (await db.SubscriptionPlans.AnyAsync(p => p.Slug == slug))
            return Conflict(new { message = "Plan slug must be unique." });

        var plan = new SubscriptionPlan
        {
            Name = input.Name.Trim(),
            Slug = slug,
            Description = input.Description?.Trim(),
            MonthlyPrice = input.MonthlyPrice,
            Currency = (input.Currency ?? "USD").Trim().ToUpperInvariant(),
            MaxSeats = input.MaxSeats ?? 0,
            Features = input.Features?.Trim(),
            IsActive = input.IsActive ?? true,
        };

        db.SubscriptionPlans.Add(plan);
        await db.SaveChangesAsync();
        return Created($"/api/admin/plans/{plan.Id}", plan);
    }

    [HttpGet("{planId:guid}")]
    public async Task<IActionResult> GetPlan(Guid planId)
    {
        var plan = await db.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == planId);
        return plan is null ? NotFound() : Ok(plan);
    }

    [HttpPut("{planId:guid}")]
    public async Task<IActionResult> UpdatePlan(Guid planId, [FromBody] UpdatePlanRequest input)
    {
        var plan = await db.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == planId);
        if (plan is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(input.Name)) plan.Name = input.Name.Trim();

        if (!string.IsNullOrWhiteSpace(input.Slug))
        {
            var slug = Slugify(input.Slug);
            if (await db.SubscriptionPlans.AnyAsync(p => p.Id != plan.Id && p.Slug == slug))
                return Conflict(new { message = "Plan slug must be unique." });
            plan.Slug = slug;
        }

        if (input.Description != null) plan.Description = input.Description.Trim();
        if (input.MonthlyPrice.HasValue) plan.MonthlyPrice = input.MonthlyPrice.Value;
        if (!string.IsNullOrWhiteSpace(input.Currency)) plan.Currency = input.Currency.Trim().ToUpperInvariant();
        if (input.MaxSeats.HasValue) plan.MaxSeats = input.MaxSeats.Value;
        if (input.Features != null) plan.Features = input.Features.Trim();
        if (input.IsActive.HasValue) plan.IsActive = input.IsActive.Value;

        plan.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Ok(plan);
    }

    [HttpDelete("{planId:guid}")]
    public async Task<IActionResult> DeletePlan(Guid planId)
    {
        var plan = await db.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == planId);
        if (plan is null) return NotFound();
        db.SubscriptionPlans.Remove(plan);
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
}

public record CreatePlanRequest(
    string Name, string? Slug, string? Description,
    decimal MonthlyPrice, string? Currency, int? MaxSeats,
    string? Features, bool? IsActive);

public record UpdatePlanRequest(
    string? Name, string? Slug, string? Description,
    decimal? MonthlyPrice, string? Currency, int? MaxSeats,
    string? Features, bool? IsActive);
