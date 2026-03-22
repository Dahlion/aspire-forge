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

    // ── EMS Medication Tracker ─────────────────────────────────────────────────
    public DbSet<MedLicenseLevel>     MedLicenseLevels     => Set<MedLicenseLevel>();
    public DbSet<MedTag>              MedTags              => Set<MedTag>();
    public DbSet<MedMedication>       MedMedications       => Set<MedMedication>();
    public DbSet<MedMedicationTag>    MedMedicationTags    => Set<MedMedicationTag>();
    public DbSet<MedMedicationConfig> MedMedicationConfigs => Set<MedMedicationConfig>();
    public DbSet<MedPersonnel>        MedPersonnel         => Set<MedPersonnel>();
    public DbSet<MedStorageLocation>  MedStorageLocations  => Set<MedStorageLocation>();
    public DbSet<MedContainer>        MedContainers        => Set<MedContainer>();
    public DbSet<MedVial>             MedVials             => Set<MedVial>();
    public DbSet<MedVialEvent>        MedVialEvents        => Set<MedVialEvent>();
    public DbSet<MedCheckSession>     MedCheckSessions     => Set<MedCheckSession>();
    public DbSet<MedCheckItem>        MedCheckItems        => Set<MedCheckItem>();
    public DbSet<MedAgencyConfig>     MedAgencyConfigs     => Set<MedAgencyConfig>();

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

        // ── EMS Medication Tracker ─────────────────────────────────────────────

        modelBuilder.Entity<MedLicenseLevel>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(80).IsRequired();
            e.HasIndex(x => new { x.TenantId, x.Rank }).IsUnique();
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MedTag>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(60).IsRequired();
            e.Property(x => x.Color).HasMaxLength(7);
            e.HasIndex(x => new { x.TenantId, x.Name }).IsUnique();
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MedMedication>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.GenericName).HasMaxLength(120).IsRequired();
            e.Property(x => x.BrandName).HasMaxLength(120);
            e.Property(x => x.NdcCode).HasMaxLength(20);
            e.Property(x => x.Concentration).HasMaxLength(80);
            e.Property(x => x.RouteOfAdministration).HasMaxLength(60);
            e.Property(x => x.FormDescription).HasMaxLength(80);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MedMedicationTag>(e =>
        {
            e.HasKey(x => new { x.MedicationId, x.TagId });
            e.HasOne(x => x.Medication).WithMany(m => m.Tags).HasForeignKey(x => x.MedicationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Tag).WithMany().HasForeignKey(x => x.TagId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MedMedicationConfig>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.MedicationId }).IsUnique();
            e.HasOne(x => x.Medication).WithMany(m => m.Configs).HasForeignKey(x => x.MedicationId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MedPersonnel>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.FirstName).HasMaxLength(80).IsRequired();
            e.Property(x => x.LastName).HasMaxLength(80).IsRequired();
            e.Property(x => x.BadgeNumber).HasMaxLength(40);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.KeycloakUserId).HasMaxLength(200);
            e.HasIndex(x => x.KeycloakUserId);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.LicenseLevel).WithMany().HasForeignKey(x => x.LicenseLevelId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MedStorageLocation>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.LocationType).HasMaxLength(30).IsRequired();
            e.Property(x => x.Description).HasMaxLength(300);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MedContainer>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.ContainerType).HasMaxLength(40).IsRequired();
            e.Property(x => x.SealNumber).HasMaxLength(60);
            e.HasOne(x => x.StorageLocation).WithMany(l => l.Containers).HasForeignKey(x => x.StorageLocationId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MedVial>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.LotNumber).HasMaxLength(60).IsRequired();
            e.Property(x => x.ManufacturerBarcode).HasMaxLength(80);
            e.Property(x => x.AgencyLabelCode).HasMaxLength(80);
            e.Property(x => x.Status).HasMaxLength(30).IsRequired();
            e.Property(x => x.TotalVolumeMl).HasPrecision(10, 3);
            e.Property(x => x.RemainingVolumeMl).HasPrecision(10, 3);
            e.HasIndex(x => new { x.TenantId, x.AgencyLabelCode })
             .IsUnique()
             .HasFilter("\"AgencyLabelCode\" IS NOT NULL");
            e.HasIndex(x => x.ManufacturerBarcode);
            e.HasIndex(x => new { x.TenantId, x.Status });
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Medication).WithMany().HasForeignKey(x => x.MedicationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Container).WithMany(c => c.Vials).HasForeignKey(x => x.ContainerId).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
        });

        modelBuilder.Entity<MedVialEvent>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.EventType).HasMaxLength(40).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(500);
            e.Property(x => x.IncidentNumber).HasMaxLength(80);
            e.Property(x => x.PatientWeightKg).HasPrecision(8, 2);
            e.Property(x => x.DosageAmountMl).HasPrecision(10, 3);
            e.HasOne(x => x.Vial).WithMany(v => v.Events).HasForeignKey(x => x.VialId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Personnel).WithMany().HasForeignKey(x => x.PersonnelId).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
            e.HasOne(x => x.WitnessPersonnel).WithMany().HasForeignKey(x => x.WitnessPersonnelId).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
        });

        modelBuilder.Entity<MedCheckSession>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(500);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.StorageLocation).WithMany().HasForeignKey(x => x.StorageLocationId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Personnel).WithMany().HasForeignKey(x => x.PersonnelId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.WitnessPersonnel).WithMany().HasForeignKey(x => x.WitnessPersonnelId).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
        });

        modelBuilder.Entity<MedCheckItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Discrepancy).HasMaxLength(300);
            e.HasOne(x => x.Session).WithMany(s => s.Items).HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Container).WithMany().HasForeignKey(x => x.ContainerId).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
            e.HasOne(x => x.Vial).WithMany().HasForeignKey(x => x.VialId).OnDelete(DeleteBehavior.SetNull).IsRequired(false);
        });

        modelBuilder.Entity<MedAgencyConfig>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.AgencyName).HasMaxLength(160);
            e.Property(x => x.AgencyLicenseNumber).HasMaxLength(80);
            e.HasIndex(x => x.TenantId).IsUnique();
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
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

// ═══════════════════════════════════════════════════════════════════════════════
// EMS MEDICATION TRACKER DOMAIN
// DEA-compliant vial lifecycle tracking for EMS agencies.
// ═══════════════════════════════════════════════════════════════════════════════

/// <summary>
/// Configurable license level for a tenant (Driver, EMT, AEMT, Paramedic, etc.)
/// with a granular permission matrix.
/// </summary>
public class MedLicenseLevel
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Name { get; set; } = "";     // "Paramedic"
    public int Rank { get; set; }              // sort order; 0=lowest privilege
    public bool CanAdminister { get; set; }
    public bool CanWaste { get; set; }
    public bool CanWitness { get; set; }
    public bool CanStock { get; set; }
    public bool CanOrder { get; set; }
    public bool CanReceive { get; set; }
    public bool CanMove { get; set; }
    public bool CanPerformCheck { get; set; }
    public bool CanManageCatalog { get; set; }
    public bool CanManageRoster { get; set; }
    public bool CanManageLocations { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
}

/// <summary>Tag definition scoped to a tenant (e.g., "Refrigeration Required").</summary>
public class MedTag
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Name { get; set; } = "";
    public string Color { get; set; } = "#17a2b8";
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
}

/// <summary>
/// Medication catalog entry scoped to a tenant.
/// NDC and OpenFDA fields can be pre-filled via barcode scan.
/// </summary>
public class MedMedication
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string GenericName { get; set; } = "";
    public string? BrandName { get; set; }
    public int DeaSchedule { get; set; } = 0;     // 0=non-controlled, 2-5=controlled
    public string? NdcCode { get; set; }           // e.g. "0641-6081-25"
    public string? Concentration { get; set; }    // "1 mg/mL"
    public string? RouteOfAdministration { get; set; }  // "IV/IO/IM"
    public string? FormDescription { get; set; }  // "1 mL prefilled syringe"
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
    public List<MedMedicationTag> Tags { get; set; } = [];
    public List<MedMedicationConfig> Configs { get; set; } = [];
}

/// <summary>Join entity attaching a tag to a medication.</summary>
public class MedMedicationTag
{
    public Guid MedicationId { get; set; }
    public Guid TagId { get; set; }

    public MedMedication? Medication { get; set; }
    public MedTag? Tag { get; set; }
}

/// <summary>
/// Per-tenant override/configuration for a specific medication —
/// controls witness requirements, controlled substance handling, and storage rules.
/// </summary>
public class MedMedicationConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid MedicationId { get; set; }
    public bool RequireWitnessForWaste { get; set; } = false;
    public bool IsControlledSubstance { get; set; } = false;
    public bool RequireSealedStorage { get; set; } = false;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public MedMedication? Medication { get; set; }
}

/// <summary>Personnel roster entry for a tenant with license level and Keycloak identity link.</summary>
public class MedPersonnel
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid LicenseLevelId { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string? BadgeNumber { get; set; }
    public string? Email { get; set; }
    public string? KeycloakUserId { get; set; }   // links to Keycloak identity
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
    public MedLicenseLevel? LicenseLevel { get; set; }
}

/// <summary>
/// Physical storage location (truck unit, station, vault).
/// Contains one or more containers.
/// </summary>
public class MedStorageLocation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Name { get; set; } = "";            // "Medic 3", "Station 1 Vault"
    public string LocationType { get; set; } = "unit"; // unit | truck | station | vault
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
    public List<MedContainer> Containers { get; set; } = [];
}

/// <summary>
/// A drug box or other container within a storage location.
/// Sealed containers auto-pass all contents if the seal is intact.
/// </summary>
public class MedContainer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StorageLocationId { get; set; }
    public string Name { get; set; } = "";            // "ALS Drug Box A"
    public string ContainerType { get; set; } = "drug-box"; // drug-box | bag | vault-drawer
    public bool IsSealable { get; set; } = true;      // supports tamper-evident seals
    public bool IsSealed { get; set; } = false;
    public string? SealNumber { get; set; }           // printed on tamper-evident seal
    public int CheckFrequencyHours { get; set; } = 24;
    public bool CheckRequiresWitness { get; set; } = false;
    public bool IsControlledSubstance { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public MedStorageLocation? StorageLocation { get; set; }
    public List<MedVial> Vials { get; set; } = [];
}

/// <summary>
/// A single physical vial tracked from order through disposal.
/// AgencyLabelCode is the QR code applied by the agency.
/// ManufacturerBarcode is the barcode printed on the vial itself.
/// </summary>
public class MedVial
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid MedicationId { get; set; }
    public Guid? ContainerId { get; set; }            // null = in transit / not stocked

    public string LotNumber { get; set; } = "";
    public string? ManufacturerBarcode { get; set; }  // manufacturer barcode on the vial
    public string? AgencyLabelCode { get; set; }      // QR label applied by agency (unique per tenant)

    public decimal TotalVolumeMl { get; set; }
    public decimal RemainingVolumeMl { get; set; }

    // ordered | received | stocked | in-use | administered | wasted | disposed | expired
    public string Status { get; set; } = "ordered";

    public DateTimeOffset? ExpiresAt { get; set; }
    public DateTimeOffset? OrderedAt { get; set; }
    public DateTimeOffset? ReceivedAt { get; set; }
    public DateTimeOffset? StockedAt { get; set; }
    public DateTimeOffset? AdministeredAt { get; set; }
    public DateTimeOffset? WastedAt { get; set; }
    public DateTimeOffset? DisposedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
    public MedMedication? Medication { get; set; }
    public MedContainer? Container { get; set; }
    public List<MedVialEvent> Events { get; set; } = [];
}

/// <summary>
/// Immutable audit log entry for every state change on a vial.
/// Records who did it, when it happened, dosage details, and witness.
/// </summary>
public class MedVialEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VialId { get; set; }
    public Guid? PersonnelId { get; set; }
    public Guid? WitnessPersonnelId { get; set; }

    // ordered | received | stocked | moved | administered | wasted | disposed | expired | checked | seal-broken | seal-applied
    public string EventType { get; set; } = "";
    public string? Notes { get; set; }
    public string? IncidentNumber { get; set; }
    public decimal? PatientWeightKg { get; set; }
    public decimal? DosageAmountMl { get; set; }

    public Guid? FromContainerId { get; set; }
    public Guid? ToContainerId { get; set; }

    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public MedVial? Vial { get; set; }
    public MedPersonnel? Personnel { get; set; }
    public MedPersonnel? WitnessPersonnel { get; set; }
}

/// <summary>
/// A single check event: who performed it, when, and which location.
/// Contains MedCheckItems for each container/vial inspected.
/// </summary>
public class MedCheckSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid StorageLocationId { get; set; }
    public Guid PersonnelId { get; set; }
    public Guid? WitnessPersonnelId { get; set; }
    public string Status { get; set; } = "in-progress"; // in-progress | completed | aborted
    public string? Notes { get; set; }
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
    public MedStorageLocation? StorageLocation { get; set; }
    public MedPersonnel? Personnel { get; set; }
    public MedPersonnel? WitnessPersonnel { get; set; }
    public List<MedCheckItem> Items { get; set; } = [];
}

/// <summary>
/// Tenant-level configuration for the EMS MedTrack module.
/// Controls feature flags, report access, and workflow defaults.
/// One record per tenant (unique index on TenantId).
/// </summary>
public class MedAgencyConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }

    // ── Agency identity ────────────────────────────────────────────────────────
    public string AgencyName { get; set; } = "";
    public string AgencyLicenseNumber { get; set; } = "";

    // ── Feature toggles ────────────────────────────────────────────────────────
    public bool EnableVialTracking { get; set; } = true;
    public bool EnableDailyChecks { get; set; } = true;
    public bool EnableControlledSubstanceLog { get; set; } = true;
    public bool EnableExpiryAlerts { get; set; } = true;
    public bool EnableSealedContainers { get; set; } = true;
    public bool EnableOpenFdaLookup { get; set; } = true;
    public bool EnableReporting { get; set; } = true;
    public bool EnforceRolePermissions { get; set; } = false;

    // ── Report toggles ─────────────────────────────────────────────────────────
    public bool ReportVialUsage { get; set; } = true;
    public bool ReportWasteLog { get; set; } = true;
    public bool ReportCheckCompliance { get; set; } = true;
    public bool ReportExpiryTracking { get; set; } = true;
    public bool ReportInventorySnapshot { get; set; } = true;

    // ── Workflow defaults ──────────────────────────────────────────────────────
    public int DefaultCheckFrequencyHours { get; set; } = 24;
    public int ExpiryWarningDays { get; set; } = 30;
    public bool RequireWitnessForAllWaste { get; set; } = false;
    public bool RequireWitnessForAllChecks { get; set; } = false;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Tenant? Tenant { get; set; }
}

/// <summary>One container or vial item checked within a MedCheckSession.</summary>
public class MedCheckItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SessionId { get; set; }
    public Guid? ContainerId { get; set; }
    public Guid? VialId { get; set; }
    public bool SealIntact { get; set; } = true;    // for sealed containers
    public bool Passed { get; set; } = true;
    public string? Discrepancy { get; set; }
    public DateTimeOffset CheckedAt { get; set; } = DateTimeOffset.UtcNow;

    public MedCheckSession? Session { get; set; }
    public MedContainer? Container { get; set; }
    public MedVial? Vial { get; set; }
}