using Microsoft.EntityFrameworkCore; // This namespace is essential
using RealTime.API.Models;


namespace RealTime.API.Data
{
    public class AppDbContext: DbContext
    {
        // This constructor is used by Dependency Injection (DI)
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // DbSet maps the TaskItem class to a table named "TaskItems"
        public DbSet<TaskItem> TaskItems { get; set; }
    }
}
