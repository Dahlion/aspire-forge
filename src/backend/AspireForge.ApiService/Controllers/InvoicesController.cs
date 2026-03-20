using AspireForge.ApiService.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspireForge.ApiService.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
public class InvoicesController(AppDbContext db) : ControllerBase
{
    // GET /api/admin/invoices - all invoices across all tenants
    [HttpGet("api/admin/invoices")]
    public async Task<IActionResult> GetAllInvoices([FromQuery] string? status = null)
    {
        var query = db.Invoices.Include(i => i.Tenant).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(i => i.Status == status.ToLowerInvariant());

        var invoices = await query
            .OrderByDescending(i => i.IssuedAt)
            .Select(i => new
            {
                i.Id, i.InvoiceNumber, i.Amount, i.Currency, i.Status,
                i.IssuedAt, i.DueAt, i.PaidAt, i.Notes,
                i.TenantId, TenantName = i.Tenant!.Name,
                i.SubscriptionId, i.CreatedAt, i.UpdatedAt
            })
            .ToListAsync();
        return Ok(invoices);
    }

    // GET /api/admin/invoices/summary - totals for dashboard
    [HttpGet("api/admin/invoices/summary")]
    public async Task<IActionResult> GetInvoiceSummary()
    {
        var now = DateTimeOffset.UtcNow;
        var totalOutstanding = await db.Invoices
            .Where(i => i.Status == "sent" || i.Status == "overdue")
            .SumAsync(i => (decimal?)i.Amount) ?? 0;

        var overdueCount = await db.Invoices
            .CountAsync(i => i.Status == "sent" && i.DueAt < now);

        var paidThisMonth = await db.Invoices
            .Where(i => i.Status == "paid" && i.PaidAt >= now.AddDays(-30))
            .SumAsync(i => (decimal?)i.Amount) ?? 0;

        return Ok(new { totalOutstanding, overdueCount, paidThisMonth });
    }

    // GET /api/admin/tenants/{tenantId}/invoices
    [HttpGet("api/admin/tenants/{tenantId:guid}/invoices")]
    public async Task<IActionResult> GetTenantInvoices(Guid tenantId)
    {
        if (!await db.Tenants.AnyAsync(t => t.Id == tenantId))
            return NotFound(new { message = "Tenant not found." });

        var invoices = await db.Invoices
            .Where(i => i.TenantId == tenantId)
            .OrderByDescending(i => i.IssuedAt)
            .Select(i => new
            {
                i.Id, i.InvoiceNumber, i.Amount, i.Currency, i.Status,
                i.IssuedAt, i.DueAt, i.PaidAt, i.Notes,
                i.SubscriptionId, i.CreatedAt, i.UpdatedAt
            })
            .ToListAsync();
        return Ok(invoices);
    }

    // POST /api/admin/tenants/{tenantId}/invoices
    [HttpPost("api/admin/tenants/{tenantId:guid}/invoices")]
    public async Task<IActionResult> CreateInvoice(Guid tenantId, [FromBody] CreateInvoiceRequest input)
    {
        if (!await db.Tenants.AnyAsync(t => t.Id == tenantId))
            return NotFound(new { message = "Tenant not found." });

        var invoiceNumber = await GenerateInvoiceNumber();

        var invoice = new Invoice
        {
            TenantId = tenantId,
            SubscriptionId = input.SubscriptionId,
            InvoiceNumber = invoiceNumber,
            Amount = input.Amount,
            Currency = (input.Currency ?? "USD").Trim().ToUpperInvariant(),
            Status = NormalizeStatus(input.Status ?? "draft"),
            IssuedAt = input.IssuedAt ?? DateTimeOffset.UtcNow,
            DueAt = input.DueAt ?? DateTimeOffset.UtcNow.AddDays(30),
            PaidAt = input.PaidAt,
            Notes = input.Notes?.Trim(),
        };

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();
        return Created($"/api/admin/invoices/{invoice.Id}", invoice);
    }

    // PUT /api/admin/invoices/{invoiceId}
    [HttpPut("api/admin/invoices/{invoiceId:guid}")]
    public async Task<IActionResult> UpdateInvoice(Guid invoiceId, [FromBody] UpdateInvoiceRequest input)
    {
        var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId);
        if (invoice is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(input.Status)) invoice.Status = NormalizeStatus(input.Status);
        if (input.Amount.HasValue) invoice.Amount = input.Amount.Value;
        if (!string.IsNullOrWhiteSpace(input.Currency)) invoice.Currency = input.Currency.Trim().ToUpperInvariant();
        if (input.DueAt.HasValue) invoice.DueAt = input.DueAt.Value;
        if (input.PaidAtSet) invoice.PaidAt = input.PaidAt;
        if (input.Notes != null) invoice.Notes = input.Notes.Trim();

        invoice.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Ok(invoice);
    }

    // DELETE /api/admin/invoices/{invoiceId}
    [HttpDelete("api/admin/invoices/{invoiceId:guid}")]
    public async Task<IActionResult> DeleteInvoice(Guid invoiceId)
    {
        var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId);
        if (invoice is null) return NotFound();
        db.Invoices.Remove(invoice);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string> GenerateInvoiceNumber()
    {
        var year = DateTimeOffset.UtcNow.Year;
        var count = await db.Invoices.CountAsync(i => i.CreatedAt.Year == year);
        return $"INV-{year}-{(count + 1):D4}";
    }

    private static string NormalizeStatus(string status) => status.Trim().ToLowerInvariant();
}

public record CreateInvoiceRequest(
    decimal Amount, string? Currency, string? Status,
    Guid? SubscriptionId, DateTimeOffset? IssuedAt, DateTimeOffset? DueAt,
    DateTimeOffset? PaidAt, string? Notes);

public record UpdateInvoiceRequest(
    string? Status, decimal? Amount, string? Currency,
    DateTimeOffset? DueAt, DateTimeOffset? PaidAt, bool PaidAtSet, string? Notes);
