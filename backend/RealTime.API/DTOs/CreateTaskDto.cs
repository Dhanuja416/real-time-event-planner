using System.ComponentModel.DataAnnotations;

namespace RealTime.API.DTOs
{
    public class CreateTaskDto
    {
        [Required] // Ensures the client must provide a title
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime? DueDate { get; set; }
    }
}
