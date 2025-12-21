using System.ComponentModel.DataAnnotations;

namespace RealTime.API.DTOs
{
    public class CreateDocumentDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;
    }
}
