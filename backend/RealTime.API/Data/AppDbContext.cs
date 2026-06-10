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
        public DbSet<DocumentVersion> DocumentVersions { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Comment> Comments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Document.Owner relationship
            modelBuilder.Entity<Document>()
                .HasOne(d => d.Owner)
                .WithMany()
                .HasForeignKey(d => d.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Document.LastEditedBy relationship
            modelBuilder.Entity<Document>()
                .HasOne(d => d.LastEditedBy)
                .WithMany()
                .HasForeignKey(d => d.LastEditedById)
                .OnDelete(DeleteBehavior.Restrict);

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

            // Configure DocumentVersion relationship
            modelBuilder.Entity<DocumentVersion>()
                .HasOne(d => d.Document)
                .WithMany(d => d.Versions)
                .HasForeignKey(d => d.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DocumentVersion>()
                .HasOne(d => d.CreatedBy)
                .WithMany()
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Notification relationships
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Document)
                .WithMany()
                .HasForeignKey(n => n.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Comment relationships
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Document)
                .WithMany()
                .HasForeignKey(c => c.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.ResolvedBy)
                .WithMany()
                .HasForeignKey(c => c.ResolvedById)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}