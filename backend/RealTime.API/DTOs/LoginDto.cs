using System.ComponentModel.DataAnnotations;

namespace RealTime.API.DTOs
{
    // Used for both Login and Registration input
    public class LoginDto
    {
        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}