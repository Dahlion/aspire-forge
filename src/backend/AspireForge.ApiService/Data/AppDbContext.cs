using Microsoft.EntityFrameworkCore;

namespace AspireForge.ApiService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();

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