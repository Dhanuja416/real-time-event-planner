using System.ComponentModel.DataAnnotations;
using RealTime.API.Models;

namespace RealTime.API.DTOs
{
    public class ShareDocumentDto
    {
        [Required]
        public int DocumentId { get; set; }

        [Required]
        [EmailAddress]
        public string UserEmail { get; set; } = string.Empty;

        [Required]
        public PermissionLevel PermissionLevel { get; set; }
    }
}
