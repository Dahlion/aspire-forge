using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace AspireForge.ApiService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<TenantNote> TenantNotes => Set<TenantNote>();
    public DbSet<TenantContact> TenantContacts => Set<TenantContact>();

    public DbSet<WorkflowProcess> WorkflowProcesses => Set<WorkflowProcess>();
    public DbSet<WorkflowStep> WorkflowSteps => Set<WorkflowStep>();
    public DbSet<WorkflowInstance> WorkflowInstances => Set<WorkflowInstance>();
    public DbSet<WorkflowHistory> WorkflowHistories => Set<WorkflowHistory>();
    public DbSet<WorkflowDeployment> WorkflowDeployments => Set<WorkflowDeployment>();

    public DbSet<AppSuite> AppSuites => Set<AppSuite>();
    public DbSet<MicroApp> MicroApps => Set<MicroApp>();
    public DbSet<AppDomain> AppDomains => Set<AppDomain>();
    public DbSet<AppLink> AppLinks => Set<AppLink>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Name).HasMaxLength(160).IsRequired();
            entity.Property(t => t.Slug).HasMaxLength(100).IsRequired();
            entity.Property(t => t.CreatedAt).IsRequired();
            entity.Property(t => t.UpdatedAt).IsRequired();
            entity.HasIndex(t => t.Slug).IsUnique();
        });

        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.PlanName).HasMaxLength(100).IsRequired();
            entity.Property(s => s.Status).HasMaxLength(40).IsRequired();
            entity.Property(s => s.Currency).HasMaxLength(3).IsRequired();
            entity.Property(s => s.MonthlyPrice).HasPrecision(18, 2);
            entity.Property(s => s.Seats).IsRequired();
            entity.Property(s => s.CreatedAt).IsRequired();
            entity.Property(s => s.UpdatedAt).IsRequired();

            entity
                .HasOne(s => s.Tenant)
                .WithMany(t => t.Subscriptions)
                .HasForeignKey(s => s.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SubscriptionPlan>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).HasMaxLength(100).IsRequired();
            entity.Property(p => p.Slug).HasMaxLength(100).IsRequired();
            entity.Property(p => p.Description).HasMaxLength(500);
            entity.Property(p => p.Currency).HasMaxLength(3).IsRequired();
            entity.Property(p => p.MonthlyPrice).HasPrecision(18, 2);
            entity.Property(p => p.Features).HasMaxLength(2000);
            entity.HasIndex(p => p.Slug).IsUnique();
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.InvoiceNumber).HasMaxLength(50).IsRequired();
            entity.Property(i => i.Status).HasMaxLength(20).IsRequired();
            entity.Property(i => i.Currency).HasMaxLength(3).IsRequired();
            entity.Property(i => i.Amount).HasPrecision(18, 2);
            entity.Property(i => i.Notes).HasMaxLength(2000);
            entity.HasOne(i => i.Tenant)
                .WithMany(t => t.Invoices)
                .HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(i => i.Subscription)
                .WithMany()
                .HasForeignKey(i => i.SubscriptionId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);
        });

        modelBuilder.Entity<Lead>(entity =>
        {
            entity.HasKey(l => l.Id);
            entity.Property(l => l.CompanyName).HasMaxLength(200).IsRequired();
            entity.Property(l => l.ContactName).HasMaxLength(200).IsRequired();
            entity.Property(l => l.Email).HasMaxLength(200);
            entity.Property(l => l.Phone).HasMaxLength(50);
            entity.Property(l => l.Status).HasMaxLength(40).IsRequired();
            entity.Property(l => l.Source).HasMaxLength(100);
            entity.Property(l => l.Segment).HasMaxLength(100);
            entity.Property(l => l.Notes).HasMaxLength(2000);
            entity.Property(l => l.EstimatedValue).HasPrecision(18, 2);
        });

        modelBuilder.Entity<TenantNote>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.Content).HasMaxLength(2000).IsRequired();
            entity.Property(n => n.Category).HasMaxLength(50);
            entity.Property(n => n.CreatedBy).HasMaxLength(200);
            entity.HasOne(n => n.Tenant)
                .WithMany(t => t.Notes)
                .HasForeignKey(n => n.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TenantContact>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).HasMaxLength(200).IsRequired();
            entity.Property(c => c.Title).HasMaxLength(100);
            entity.Property(c => c.Email).HasMaxLength(200);
            entity.Property(c => c.Phone).HasMaxLength(50);
            entity.HasOne(c => c.Tenant)
                .WithMany(t => t.Contacts)
                .HasForeignKey(c => c.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Add these to your existing OnModelCreating method
        modelBuilder.Entity<WorkflowProcess>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PrimaryColor).HasMaxLength(7);
            entity.Property(e => e.AccentColor).HasMaxLength(7);
            entity.Property(e => e.IconClass).HasMaxLength(60);
            entity.Property(e => e.AppSlug).HasMaxLength(60);
            entity.HasMany(e => e.Steps).WithOne().HasForeignKey(s => s.WorkflowProcessId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WorkflowDeployment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.WorkflowProcessId, e.TenantId }).IsUnique();
            entity.HasOne(e => e.Process).WithMany().HasForeignKey(e => e.WorkflowProcessId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WorkflowStep>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.WorkflowProcessId, e.Order });
        });

        modelBuilder.Entity<WorkflowInstance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Process).WithMany().HasForeignKey(e => e.WorkflowProcessId);
            entity.HasOne(e => e.CurrentStep).WithMany().HasForeignKey(e => e.CurrentStepId);
        });

        // ── Micro App Platform ─────────────────────────────────────────────

        modelBuilder.Entity<AppSuite>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(120).IsRequired();
            entity.Property(e => e.Slug).HasMaxLength(80).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IconClass).HasMaxLength(60);
            entity.Property(e => e.Color).HasMaxLength(7);
            entity.HasIndex(e => new { e.TenantId, e.Slug }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MicroApp>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DisplayName).HasMaxLength(120).IsRequired();
            entity.Property(e => e.Slug).HasMaxLength(80).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.PrimaryColor).HasMaxLength(7);
            entity.Property(e => e.AccentColor).HasMaxLength(7);
            entity.Property(e => e.IconClass).HasMaxLength(60);
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
            entity.HasIndex(e => new { e.TenantId, e.Slug }).IsUnique();
            entity.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Process).WithMany().HasForeignKey(e => e.WorkflowProcessId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Suite).WithMany(s => s.MicroApps).HasForeignKey(e => e.AppSuiteId).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
            entity.HasMany(e => e.Domains).WithOne(d => d.MicroApp).HasForeignKey(d => d.MicroAppId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AppDomain>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Hostname).HasMaxLength(253).IsRequired();
            entity.Property(e => e.SslStatus).HasMaxLength(20).IsRequired();
            entity.HasIndex(e => e.Hostname).IsUnique();
        });

        modelBuilder.Entity<AppLink>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LinkType).HasMaxLength(30).IsRequired();
            entity.Property(e => e.Label).HasMaxLength(100);
            entity.HasOne(e => e.Source).WithMany(a => a.OutboundLinks).HasForeignKey(e => e.SourceMicroAppId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Target).WithMany().HasForeignKey(e => e.TargetMicroAppId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.SourceMicroAppId, e.TargetMicroAppId }).IsUnique();
        });
    }
}

public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<Subscription> Subscriptions { get; set; } = [];
    public List<Invoice> Invoices { get; set; } = [];
    public List<TenantNote> Notes { get; set; } = [];
    public List<TenantContact> Contacts { get; set; } = [];
}

public class Subscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string PlanName { get; set; } = "";
    public string Status { get; set; } = "trialing";
    public int Seats { get; set; } = 1;
    public decimal MonthlyPrice { get; set; }
    public string Currency { get; set; } = "USD";
    public bool AutoRenew { get; set; } = true;
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? RenewsAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
}

public class SubscriptionPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string? Description { get; set; }
    public decimal MonthlyPrice { get; set; }
    public string Currency { get; set; } = "USD";
    public int MaxSeats { get; set; } = 0; // 0 = unlimited
    public string? Features { get; set; }  // newline-separated feature list
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid? SubscriptionId { get; set; }
    public string InvoiceNumber { get; set; } = "";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string Status { get; set; } = "draft"; // draft, sent, paid, overdue, void
    public DateTimeOffset IssuedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset DueAt { get; set; } = DateTimeOffset.UtcNow.AddDays(30);
    public DateTimeOffset? PaidAt { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
    public Subscription? Subscription { get; set; }
}

public class Lead
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CompanyName { get; set; } = "";
    public string ContactName { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Status { get; set; } = "new"; // new, contacted, qualified, proposal, won, lost
    public string? Source { get; set; }          // website, referral, cold-call, event
    public string? Segment { get; set; }         // government, healthcare, private
    public decimal? EstimatedValue { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset? FollowUpAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class TenantNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Content { get; set; } = "";
    public string? Category { get; set; } // general, billing, support, sales
    public string? CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
}

public class TenantContact
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Name { get; set; } = "";
    public string? Title { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsPrimary { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
}

// The Blueprint/Template (e.g., "Employee Hiring")
public class WorkflowProcess
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [Required, MaxLength(100)]
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public Guid? TenantId { get; set; } // If null, it's a global template
    public List<WorkflowStep> Steps { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Branding
    [MaxLength(7)]
    public string PrimaryColor { get; set; } = "#2F4F4F";
    [MaxLength(7)]
    public string AccentColor { get; set; } = "#4a9a9a";
    [MaxLength(60)]
    public string IconClass { get; set; } = "bi-diagram-3-fill";
    [MaxLength(60)]
    public string? AppSlug { get; set; }

    // Form schema: JSON array of field definitions used when creating instances
    public string? FormSchema { get; set; }
}

// A specific step in the blueprint
public class WorkflowStep
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowProcessId { get; set; }
    [Required, MaxLength(100)]
    public string Name { get; set; } = "";
    public int Order { get; set; } // 1, 2, 3...
    public string? DefaultAssigneeRole { get; set; }
    public bool AllowBacktracking { get; set; } = true;
    public bool CanSkip { get; set; } = false;
}

// The actual "Ticket" or "Task" running through the process
public class WorkflowInstance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid WorkflowProcessId { get; set; }
    public Guid CurrentStepId { get; set; }
    
    [Required, MaxLength(200)]
    public string Title { get; set; } = "";
    public string? DataJson { get; set; } // Flexible data payload for specific app needs
    
    public string? CurrentAssigneeId { get; set; }
    public string Status { get; set; } = "Active"; // Active, Completed, Cancelled
    
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public WorkflowProcess? Process { get; set; }
    public WorkflowStep? CurrentStep { get; set; }
}

// Links a WorkflowProcess to a Tenant — the admin "deploys" an app to a tenant
public class WorkflowDeployment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowProcessId { get; set; }
    public Guid TenantId { get; set; }
    public DateTimeOffset DeployedAt { get; set; } = DateTimeOffset.UtcNow;

    public WorkflowProcess? Process { get; set; }
    public Tenant? Tenant { get; set; }
}

// Audit trail of every move
public class WorkflowHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowInstanceId { get; set; }
    public Guid FromStepId { get; set; }
    public Guid ToStepId { get; set; }
    public string ActionBy { get; set; } = "";
    public string? Comments { get; set; }
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
}

// ── Micro App Platform ─────────────────────────────────────────────────────────

/// <summary>
/// Logical grouping of micro apps belonging to a single tenant.
/// Example: "EMS Operations Suite" contains Dispatch + Scheduling + Reporting apps.
/// </summary>
public class AppSuite
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string? Description { get; set; }
    public string IconClass { get; set; } = "bi-grid-fill";
    public string Color { get; set; } = "#2F4F4F";
    public int SortOrder { get; set; } = 0;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
    public List<MicroApp> MicroApps { get; set; } = [];
}

/// <summary>
/// A deployed workflow process instance for a tenant. First-class entity that extends
/// WorkflowDeployment with branding overrides, custom domains, suite membership, and inter-app links.
/// </summary>
public class MicroApp
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid WorkflowProcessId { get; set; }
    public Guid? AppSuiteId { get; set; }

    public string DisplayName { get; set; } = "";   // can differ from process name
    public string Slug { get; set; } = "";           // unique per tenant
    public string? Description { get; set; }

    // Branding overrides (fall back to WorkflowProcess values at runtime if empty)
    public string PrimaryColor { get; set; } = "#2F4F4F";
    public string AccentColor { get; set; } = "#4a9a9a";
    public string IconClass { get; set; } = "bi-diagram-3-fill";

    public string Status { get; set; } = "active";   // active, archived, suspended
    public bool IsPublic { get; set; } = false;

    public DateTimeOffset DeployedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
    public WorkflowProcess? Process { get; set; }
    public AppSuite? Suite { get; set; }
    public List<AppDomain> Domains { get; set; } = [];
    public List<AppLink> OutboundLinks { get; set; } = [];
}

/// <summary>
/// Custom hostname mapped to a specific MicroApp.
/// Enables white-labelled deployments (e.g., ems.cityofacme.gov → EMS Dispatch app).
/// </summary>
public class AppDomain
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MicroAppId { get; set; }
    public string Hostname { get; set; } = "";        // e.g. "ems.cityofacme.gov"
    public bool IsPrimary { get; set; } = false;
    public string SslStatus { get; set; } = "pending"; // pending, provisioned, failed
    public DateTimeOffset? VerifiedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public MicroApp? MicroApp { get; set; }
}

/// <summary>
/// Typed directional relationship between two micro apps.
/// Enables cross-app navigation, data handoff, and suite-level workflow chains.
/// </summary>
public class AppLink
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SourceMicroAppId { get; set; }
    public Guid TargetMicroAppId { get; set; }
    // related | child | data-feed | workflow-handoff
    public string LinkType { get; set; } = "related";
    public string? Label { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public MicroApp? Source { get; set; }
    public MicroApp? Target { get; set; }
}