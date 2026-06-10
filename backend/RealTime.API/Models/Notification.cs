using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace RealTime.API.Models
{
    public class Notification
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = string.Empty; // e.g. "DocumentShared", "DocumentEdited", "CommentAdded"

        [Required]
        [MaxLength(500)]
        public string Message { get; set; } = string.Empty;

        public int? DocumentId { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public IdentityUser? User { get; set; }
        public Document? Document { get; set; }
    }
}
