using AspireForge.ApiService.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspireForge.ApiService.Controllers;

[ApiController]
[Route("api/admin/leads")]
[Authorize(Policy = "AdminOnly")]
public class LeadsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetLeads([FromQuery] string? status = null, [FromQuery] string? segment = null)
    {
        var query = db.Leads.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(l => l.Status == status.ToLowerInvariant());
        if (!string.IsNullOrWhiteSpace(segment))
            query = query.Where(l => l.Segment == segment.ToLowerInvariant());

        var leads = await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                l.Id, l.CompanyName, l.ContactName, l.Email, l.Phone,
                l.Status, l.Source, l.Segment, l.EstimatedValue,
                l.Notes, l.FollowUpAt, l.CreatedAt, l.UpdatedAt
            })
            .ToListAsync();
        return Ok(leads);
    }

    [HttpPost]
    public async Task<IActionResult> CreateLead([FromBody] CreateLeadRequest input)
    {
        if (string.IsNullOrWhiteSpace(input.CompanyName))
            return BadRequest(new { message = "Company name is required." });
        if (string.IsNullOrWhiteSpace(input.ContactName))
            return BadRequest(new { message = "Contact name is required." });

        var lead = new Lead
        {
            CompanyName = input.CompanyName.Trim(),
            ContactName = input.ContactName.Trim(),
            Email = input.Email?.Trim(),
            Phone = input.Phone?.Trim(),
            Status = NormalizeStatus(input.Status ?? "new"),
            Source = input.Source?.Trim().ToLowerInvariant(),
            Segment = input.Segment?.Trim().ToLowerInvariant(),
            EstimatedValue = input.EstimatedValue,
            Notes = input.Notes?.Trim(),
            FollowUpAt = input.FollowUpAt,
        };

        db.Leads.Add(lead);
        await db.SaveChangesAsync();
        return Created($"/api/admin/leads/{lead.Id}", lead);
    }

    [HttpGet("{leadId:guid}")]
    public async Task<IActionResult> GetLead(Guid leadId)
    {
        var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == leadId);
        return lead is null ? NotFound() : Ok(lead);
    }

    [HttpPut("{leadId:guid}")]
    public async Task<IActionResult> UpdateLead(Guid leadId, [FromBody] UpdateLeadRequest input)
    {
        var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == leadId);
        if (lead is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(input.CompanyName)) lead.CompanyName = input.CompanyName.Trim();
        if (!string.IsNullOrWhiteSpace(input.ContactName)) lead.ContactName = input.ContactName.Trim();
        if (input.Email != null) lead.Email = input.Email.Trim();
        if (input.Phone != null) lead.Phone = input.Phone.Trim();
        if (!string.IsNullOrWhiteSpace(input.Status)) lead.Status = NormalizeStatus(input.Status);
        if (input.Source != null) lead.Source = input.Source.Trim().ToLowerInvariant();
        if (input.Segment != null) lead.Segment = input.Segment.Trim().ToLowerInvariant();
        if (input.EstimatedValue.HasValue) lead.EstimatedValue = input.EstimatedValue.Value;
        if (input.Notes != null) lead.Notes = input.Notes.Trim();
        if (input.FollowUpAtSet) lead.FollowUpAt = input.FollowUpAt;

        lead.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Ok(lead);
    }

    [HttpDelete("{leadId:guid}")]
    public async Task<IActionResult> DeleteLead(Guid leadId)
    {
        var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == leadId);
        if (lead is null) return NotFound();
        db.Leads.Remove(lead);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string NormalizeStatus(string status) => status.Trim().ToLowerInvariant();
}

public record CreateLeadRequest(
    string CompanyName, string ContactName,
    string? Email, string? Phone, string? Status,
    string? Source, string? Segment, decimal? EstimatedValue,
    string? Notes, DateTimeOffset? FollowUpAt);

public record UpdateLeadRequest(
    string? CompanyName, string? ContactName,
    string? Email, string? Phone, string? Status,
    string? Source, string? Segment, decimal? EstimatedValue,
    string? Notes, DateTimeOffset? FollowUpAt, bool FollowUpAtSet);
