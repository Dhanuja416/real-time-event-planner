using System.ComponentModel.DataAnnotations;

namespace RealTime.API.DTOs
{
    public class UpdateTaskDto
    {
        [Required]
        public int Id { get; set; } // Required to identify which task to update

        [Required]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        public bool IsComplete { get; set; } // Crucial for marking tasks as done

        public DateTime? DueDate { get; set; }
    }
}