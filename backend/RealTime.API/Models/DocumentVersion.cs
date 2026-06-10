using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace RealTime.API.Models
{
    public class DocumentVersion
    {
        public int Id { get; set; }

        [Required]
        public int DocumentId { get; set; }

        public string Content { get; set; } = string.Empty;

        public byte[]? ContentBinary { get; set; }

        [Required]
        public int VersionNumber { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public string CreatedById { get; set; } = string.Empty;

        // Navigation properties
        public IdentityUser? CreatedBy { get; set; }
        public Document? Document { get; set; }
    }
}
