using System.ComponentModel.DataAnnotations;

namespace RealTime.API.DTOs
{
    public class CreateCommentDto
    {
        [Required]
        public int DocumentId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        public string SelectionText { get; set; } = string.Empty;

        // Unique client-generated anchor ID mapping to Tiptap comment marks
        [Required]
        public string CommentAnchorId { get; set; } = string.Empty;

        public int? ParentCommentId { get; set; }
    }
}
