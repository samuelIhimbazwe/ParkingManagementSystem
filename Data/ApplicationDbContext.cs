using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Models;

namespace ParkingManagementSystem.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Organization> Organizations { get; set; } = null!;

        public DbSet<RolePermission> RolePermissions { get; set; } = null!;

        public DbSet<AuditLog> AuditLogs { get; set; } = null!;

        public DbSet<AppNotification> AppNotifications { get; set; } = null!;

        public DbSet<WaitlistEntry> WaitlistEntries { get; set; } = null!;

        public DbSet<WebhookSubscription> WebhookSubscriptions { get; set; } = null!;

        public DbSet<ParkingSpace> ParkingSpaces { get; set; }

        public DbSet<ParkingLot> ParkingLots { get; set; } = null!;

        public DbSet<Vehicle> Vehicles { get; set; } = null!;

        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

        public DbSet<Reservation> Reservations { get; set; } = null!;

        public DbSet<ParkingSession> ParkingSessions { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Organization>(entity =>
            {
                entity.ToTable("Organizations");
            });

            builder.Entity<RolePermission>(entity =>
            {
                entity.ToTable("RolePermissions");
                entity.HasIndex(e => new { e.RoleName, e.Permission }).IsUnique();
            });

            builder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("AuditLogs");
                entity.HasIndex(e => e.CreatedUtc);
                entity.Property(e => e.BeforeJson).HasMaxLength(8000);
                entity.Property(e => e.AfterJson).HasMaxLength(8000);
            });

            builder.Entity<AppNotification>(entity =>
            {
                entity.ToTable("AppNotifications");
                entity.HasIndex(e => new { e.UserId, e.ReadUtc });
                entity.Property(e => e.Body).HasMaxLength(4000);
            });

            builder.Entity<WaitlistEntry>(entity =>
            {
                entity.ToTable("WaitlistEntries");
                entity.HasIndex(e => new { e.ParkingLotId, e.Status });
                entity.HasOne(e => e.ParkingLot)
                    .WithMany()
                    .HasForeignKey(e => e.ParkingLotId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<WebhookSubscription>(entity =>
            {
                entity.ToTable("WebhookSubscriptions");
                entity.HasOne(e => e.Organization)
                    .WithMany()
                    .HasForeignKey(e => e.OrganizationId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<ApplicationUser>(entity =>
            {
                entity.HasOne(e => e.Organization)
                    .WithMany(o => o.Users)
                    .HasForeignKey(e => e.OrganizationId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            builder.Entity<RefreshToken>(entity =>
            {
                entity.ToTable("RefreshTokens");
                entity.HasIndex(e => e.TokenHash).IsUnique();
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.ApplicationUserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<ParkingLot>(entity =>
            {
                entity.ToTable("ParkingLots");
                entity.HasIndex(e => e.Code).IsUnique();
                entity.Property(e => e.DefaultHourlyRateRwf).HasPrecision(18, 2);
                entity.HasOne(e => e.Organization)
                    .WithMany(o => o.ParkingLots)
                    .HasForeignKey(e => e.OrganizationId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<ParkingSpace>(entity =>
            {
                entity.Property(e => e.HourlyRate).HasPrecision(18, 2);
                entity.HasIndex(e => new { e.ParkingLotId, e.MapRow, e.MapColumn });
                entity.HasIndex(e => e.ManagerUserId);
                entity.Property(e => e.CustomLabel).HasMaxLength(128);
                entity.HasOne(e => e.ParkingLot)
                    .WithMany(l => l.Spaces)
                    .HasForeignKey(e => e.ParkingLotId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.ManagerUser)
                    .WithMany()
                    .HasForeignKey(e => e.ManagerUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            builder.Entity<Vehicle>(entity =>
            {
                entity.ToTable("Vehicles");
                entity.HasIndex(e => new { e.ApplicationUserId, e.PlateNumber }).IsUnique();
                entity.HasOne(e => e.User)
                    .WithMany(u => u.Vehicles)
                    .HasForeignKey(e => e.ApplicationUserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<Reservation>(entity =>
            {
                entity.ToTable("Reservations");
                entity.HasIndex(e => new { e.ParkingSpaceId, e.StartUtc, e.EndUtc });
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.ApplicationUserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.ParkingSpace)
                    .WithMany(s => s.Reservations)
                    .HasForeignKey(e => e.ParkingSpaceId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<ParkingSession>(entity =>
            {
                entity.ToTable("ParkingSessions");
                entity.HasIndex(e => e.ParkingSpaceId);
                entity.HasIndex(e => e.CheckOutUtc);
                entity.HasIndex(e => e.TicketCode).IsUnique();
                entity.HasIndex(e => e.LicensePlate);
                entity.Property(e => e.TotalDue).HasPrecision(18, 2);
                entity.Property(e => e.IncidentKind).HasConversion<int>();
                entity.HasOne(e => e.ParkingSpace)
                    .WithMany(s => s.Sessions)
                    .HasForeignKey(e => e.ParkingSpaceId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.ApplicationUserId)
                    .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.Reservation)
                    .WithMany()
                    .HasForeignKey(e => e.ReservationId)
                    .OnDelete(DeleteBehavior.NoAction);
            });
        }
    }
}
