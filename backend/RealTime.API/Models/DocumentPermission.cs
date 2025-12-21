using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace RealTime.API.Models
{
    public enum PermissionLevel
    {
        Viewer = 1,
        Editor = 2,
        Owner = 3
    }

    public class DocumentPermission
    {
        public int Id { get; set; }

        [Required]
        public int DocumentId { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public PermissionLevel Level { get; set; }

        public DateTime GrantedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Document? Document { get; set; }
        public IdentityUser? User { get; set; }
    }
}
