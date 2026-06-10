using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace RealTime.API.Models
{
    public class Document
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        [Required]
        public string OwnerId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Y.js Collaborative state (serialized CRDT)
        public byte[]? ContentBinary { get; set; }

        public string? LastEditedById { get; set; }

        public int Version { get; set; } = 1;

        // Navigation properties
        public IdentityUser? Owner { get; set; }
        public IdentityUser? LastEditedBy { get; set; }
        public ICollection<DocumentPermission> Permissions { get; set; } = new List<DocumentPermission>();
        public ICollection<DocumentVersion> Versions { get; set; } = new List<DocumentVersion>();
    }
}
