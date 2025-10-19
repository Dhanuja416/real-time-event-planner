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
    }
}