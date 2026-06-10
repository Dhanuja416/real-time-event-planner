using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using RealTime.API.DTOs;
using RealTime.API.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;

[Route("api/[controller]")] // Route: /api/Auth
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<IdentityUser> userManager,
        IConfiguration configuration,
        IEmailService emailService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _configuration = configuration;
        _emailService = emailService;
        _logger = logger;
    }

    // POST: api/Auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] LoginDto model)
    {
        var userExists = await _userManager.FindByEmailAsync(model.Email);
        if (userExists != null)
            return StatusCode(StatusCodes.Status400BadRequest, new { Status = "Error", Message = "User already exists!" });

        IdentityUser user = new()
        {
            Email = model.Email,
            SecurityStamp = Guid.NewGuid().ToString(),
            UserName = model.Email, // Use Email as Username for simplicity
            EmailConfirmed = false  // User must verify email before login
        };
        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
            return StatusCode(StatusCodes.Status500InternalServerError, new { Status = "Error", Message = "User creation failed! " + string.Join(", ", result.Errors.Select(e => e.Description)) });

        // Generate email confirmation token
        var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = WebUtility.UrlEncode(emailToken);

        // Send verification email
        try
        {
            await _emailService.SendEmailVerificationAsync(user.Email, encodedToken);
            _logger.LogInformation("Verification email sent to {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email sending failed for {Email}", user.Email);
            
            return StatusCode(StatusCodes.Status500InternalServerError, new { 
                Status = "Error", 
                Message = "User registered successfully, but email verification failed. Please contact support or check your SendGrid configuration.",
                Details = ex.Message
            });
        }

        return Ok(new { Status = "Success", Message = "Registration successful! Please check your email to verify your account." });
    }

    // POST: api/Auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        
        if (user == null)
            return Unauthorized(new { Status = "Error", Message = "Invalid email or password." });

        // Check if email is verified (bypassed in Development mode for easy testing)
        var isDevelopment = System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
        if (!isDevelopment && !user.EmailConfirmed)
            return Unauthorized(new { Status = "Error", Message = "Please verify your email first." });

        // Check password
        if (await _userManager.CheckPasswordAsync(user, model.Password))
        {
            var token = GetToken(user);
            _logger.LogInformation("User {Email} logged in successfully", user.Email);

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expiration = token.ValidTo
            });
        }
        
        _logger.LogWarning("Failed login attempt for {Email}", model.Email);
        return Unauthorized(new { Status = "Error", Message = "Invalid email or password." });
    }

    // POST: api/Auth/verify-email
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        
        if (user == null)
            return NotFound(new { Status = "Error", Message = "User not found." });

        if (user.EmailConfirmed)
            return BadRequest(new { Status = "Error", Message = "Email is already verified." });

        // URL decode the token
        var decodedToken = WebUtility.UrlDecode(model.Token);

        // Confirm email
        var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { Status = "Error", Message = $"Email verification failed: {errors}" });
        }

        _logger.LogInformation("Email verified for {Email}", model.Email);
        return Ok(new { Status = "Success", Message = "Email verified successfully! You can now log in." });
    }

    // POST: api/Auth/forgot-password
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        
        // For security, don't reveal if email exists or not
        if (user == null)
            return Ok(new { Status = "Success", Message = "If your email exists, you'll receive password reset instructions." });

        // Generate password reset token
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebUtility.UrlEncode(resetToken);

        // Send password reset email with error handling
        try
        {
            await _emailService.SendPasswordResetAsync(user.Email, encodedToken);
            _logger.LogInformation("Password reset email sent to {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Password reset email failed for {Email}", user.Email);
            // Continue execution — don't reveal email issues for security
        }

        return Ok(new { Status = "Success", Message = "If your email exists, you'll receive password reset instructions." });
    }

    // POST: api/Auth/reset-password
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        
        if (user == null)
            return NotFound(new { Status = "Error", Message = "User not found." });

        // URL decode the token
        var decodedToken = WebUtility.UrlDecode(model.Token);

        // Reset password
        var result = await _userManager.ResetPasswordAsync(user, decodedToken, model.NewPassword);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { Status = "Error", Message = $"Password reset failed: {errors}" });
        }

        _logger.LogInformation("Password reset successfully for {Email}", model.Email);
        return Ok(new { Status = "Success", Message = "Password reset successfully! You can now log in." });
    }

#if DEBUG
    // DEVELOPMENT ONLY: Get verification token for testing without email
    // POST: api/Auth/test-get-token
    [HttpPost("test-get-token")]
    public async Task<IActionResult> GetVerificationTokenForTesting([FromBody] ForgotPasswordDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return NotFound(new { Status = "Error", Message = "User not found. Register this email first." });
        
        if (user.EmailConfirmed)
            return BadRequest(new { Status = "Error", Message = "Email is already verified." });

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = WebUtility.UrlEncode(token);
        
        return Ok(new { 
            Status = "Success",
            Message = "Use this token with POST /api/Auth/verify-email",
            Email = user.Email,
            Token = encodedToken,
            Note = "This is a development endpoint. Remove before production!"
        });
    }

    // DEVELOPMENT ONLY: Instantly verify email without token
    // POST: api/Auth/test-verify-instantly
    [HttpPost("test-verify-instantly")]
    public async Task<IActionResult> VerifyEmailInstantly([FromBody] ForgotPasswordDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return NotFound(new { Status = "Error", Message = "User not found. Register this email first." });
        
        if (user.EmailConfirmed)
            return BadRequest(new { Status = "Error", Message = "Email is already verified." });

        user.EmailConfirmed = true;
        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
            return StatusCode(500, new { Status = "Error", Message = "Failed to verify email." });

        return Ok(new { 
            Status = "Success", 
            Message = "Email verified instantly! You can now log in.",
            Note = "This is a development endpoint. Remove before production!"
        });
    }

    // DEVELOPMENT ONLY: Delete user to let them register fresh
    // POST: api/Auth/test-delete-user
    [HttpPost("test-delete-user")]
    public async Task<IActionResult> DeleteUserForTesting([FromBody] ForgotPasswordDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return NotFound(new { Status = "Error", Message = "User not found. Register this email first." });

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return StatusCode(500, new { Status = "Error", Message = "Failed to delete user." });

        return Ok(new { 
            Status = "Success", 
            Message = "User deleted successfully! You can now register this email address fresh.",
            Note = "This is a development endpoint. Remove before production!"
        });
    }
#endif

    private JwtSecurityToken GetToken(IdentityUser user)
    {
        var authClaims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]));

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            expires: DateTime.Now.AddDays(Convert.ToDouble(_configuration["JwtSettings:DurationInDays"])),
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        );

        return token;
    }
}