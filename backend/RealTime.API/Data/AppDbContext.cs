using Microsoft.AspNetCore.Identity.EntityFrameworkCore; // NEW
using Microsoft.EntityFrameworkCore;
using RealTime.API.Models;
using Microsoft.AspNetCore.Identity;

namespace RealTime.API.Data
{
    // MUST inherit from IdentityDbContext<IdentityUser> now
    public class AppDbContext : IdentityDbContext<IdentityUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // DbSet maps the TaskItem class to a table named "TaskItems"
        public DbSet<TaskItem> TaskItems { get; set; }
        
        // DbSets for new Document models
        public DbSet<Document> Documents { get; set; }
        public DbSet<DocumentPermission> DocumentPermissions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Document.Owner relationship
            modelBuilder.Entity<Document>()
                .HasOne(d => d.Owner)
                .WithMany()
                .HasForeignKey(d => d.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Document.Permissions relationship
            modelBuilder.Entity<Document>()
                .HasMany(d => d.Permissions)
                .WithOne(p => p.Document)
                .HasForeignKey(p => p.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure DocumentPermission.User relationship
            modelBuilder.Entity<DocumentPermission>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Create unique composite index to prevent duplicate permissions
            modelBuilder.Entity<DocumentPermission>()
                .HasIndex(p => new { p.DocumentId, p.UserId })
                .IsUnique();
        }
    }
}