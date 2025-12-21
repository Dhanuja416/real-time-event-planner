using System.ComponentModel.DataAnnotations;

namespace RealTime.API.DTOs
{
    public class UpdateDocumentDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;
    }
}
