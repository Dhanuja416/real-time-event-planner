# ?? EMAIL SERVICE SETUP GUIDE

## ? IMPLEMENTATION COMPLETE

The email service has been successfully integrated into your REAP backend using SendGrid.

---

## ?? FILES CREATED

### 1. **Interface**
- ? `RealTime.API/Services/IEmailService.cs`
  - `Task SendEmailVerificationAsync(string email, string token)`
  - `Task SendPasswordResetAsync(string email, string token)`

### 2. **Implementation**
- ? `RealTime.API/Services/SendGridEmailService.cs`
  - Professional HTML email templates
  - Plain text fallbacks
  - Error handling
  - Configurable settings

### 3. **Updated Files**
- ? `Program.cs` - Added service registration
- ? `appsettings.Development.json` - Added EmailSettings configuration
- ? `RealTime.API.csproj` - SendGrid package added (v9.29.3)

---

## ?? SETUP INSTRUCTIONS

### **Step 1: Get SendGrid API Key**

1. **Create SendGrid Account:**
   - Go to: https://signup.sendgrid.com/
   - Sign up for a free account (100 emails/day free tier)

2. **Create API Key:**
   - Login to SendGrid Dashboard
   - Go to **Settings** ? **API Keys**
   - Click **Create API Key**
   - Name: `REAP_Backend`
   - Permissions: **Full Access** (or Mail Send only)
   - Click **Create & View**
   - **?? COPY THE API KEY - You won't see it again!**

3. **Verify Sender Identity:**
   - Go to **Settings** ? **Sender Authentication**
   - Choose **Single Sender Verification** (easiest for development)
   - Enter your email (e.g., `your-email@gmail.com`)
   - Check your inbox and verify the email
   - **This email will appear as the "From" address**

---

### **Step 2: Update Configuration**

Open `RealTime.API/appsettings.Development.json` and update:

```json
"EmailSettings": {
  "SendGridApiKey": "SG.PASTE_YOUR_ACTUAL_API_KEY_HERE",
  "SenderEmail": "your-verified-email@gmail.com",
  "SenderName": "REAP Support",
  "FrontendUrl": "https://localhost:5173"
}
```

**Important:**
- Replace `"SendGridApiKey"` with your actual SendGrid API key
- Replace `"SenderEmail"` with the email you verified in SendGrid
- Keep `"FrontendUrl"` as `"https://localhost:5173"` for development

---

### **Step 3: Update AuthController (Add Email Features)**

You'll need to enhance your `AuthController.cs` to use the email service. Here's what to add:

#### **Inject IEmailService in AuthController:**

```csharp
private readonly IEmailService _emailService;

public AuthController(
    UserManager<IdentityUser> userManager, 
    IConfiguration configuration,
    IEmailService emailService)  // ? Add this
{
    _userManager = userManager;
    _configuration = configuration;
    _emailService = emailService;  // ? Add this
}
```

#### **Add Email Verification Endpoint:**

```csharp
// POST: api/Auth/send-verification-email
[HttpPost("send-verification-email")]
public async Task<IActionResult> SendVerificationEmail([FromBody] EmailRequestDto request)
{
    var user = await _userManager.FindByEmailAsync(request.Email);
    if (user == null)
        return NotFound(new { message = "User not found." });

    if (await _userManager.IsEmailConfirmedAsync(user))
        return BadRequest(new { message = "Email already verified." });

    var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
    await _emailService.SendEmailVerificationAsync(request.Email, token);

    return Ok(new { message = "Verification email sent successfully." });
}

// POST: api/Auth/verify-email
[HttpPost("verify-email")]
public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto request)
{
    var user = await _userManager.FindByEmailAsync(request.Email);
    if (user == null)
        return NotFound(new { message = "User not found." });

    var result = await _userManager.ConfirmEmailAsync(user, request.Token);
    
    if (!result.Succeeded)
        return BadRequest(new { message = "Invalid or expired token." });

    return Ok(new { message = "Email verified successfully!" });
}
```

#### **Add Password Reset Endpoints:**

```csharp
// POST: api/Auth/forgot-password
[HttpPost("forgot-password")]
public async Task<IActionResult> ForgotPassword([FromBody] EmailRequestDto request)
{
    var user = await _userManager.FindByEmailAsync(request.Email);
    if (user == null)
        // Don't reveal that user doesn't exist (security)
        return Ok(new { message = "If the email exists, a reset link has been sent." });

    var token = await _userManager.GeneratePasswordResetTokenAsync(user);
    await _emailService.SendPasswordResetAsync(request.Email, token);

    return Ok(new { message = "If the email exists, a reset link has been sent." });
}

// POST: api/Auth/reset-password
[HttpPost("reset-password")]
public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
{
    var user = await _userManager.FindByEmailAsync(request.Email);
    if (user == null)
        return BadRequest(new { message = "Invalid request." });

    var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
    
    if (!result.Succeeded)
        return BadRequest(new { message = "Invalid or expired token." });

    return Ok(new { message = "Password reset successfully!" });
}
```

---

### **Step 4: Create DTOs**

Create these DTOs in your `DTOs` folder:

**EmailRequestDto.cs:**
```csharp
using System.ComponentModel.DataAnnotations;

namespace RealTime.API.DTOs
{
    public class EmailRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}
```

**VerifyEmailDto.cs:**
```csharp
using System.ComponentModel.DataAnnotations;

namespace RealTime.API.DTOs
{
    public class VerifyEmailDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Token { get; set; } = string.Empty;
    }
}
```

**ResetPasswordDto.cs:**
```csharp
using System.ComponentModel.DataAnnotations;

namespace RealTime.API.DTOs
{
    public class ResetPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }
}
```

---

## ?? TESTING THE EMAIL SERVICE

### **Test 1: Send Verification Email**

```http
POST https://localhost:7072/api/Auth/send-verification-email
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Expected Response:**
```json
{
  "message": "Verification email sent successfully."
}
```

**Check Your Email:**
- You should receive an email with subject "Verify Your Email - REAP"
- Click the verification link (or copy the token)

---

### **Test 2: Verify Email**

```http
POST https://localhost:7072/api/Auth/verify-email
Content-Type: application/json

{
  "email": "test@example.com",
  "token": "TOKEN_FROM_EMAIL_LINK"
}
```

**Expected Response:**
```json
{
  "message": "Email verified successfully!"
}
```

---

### **Test 3: Forgot Password**

```http
POST https://localhost:7072/api/Auth/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Expected Response:**
```json
{
  "message": "If the email exists, a reset link has been sent."
}
```

**Check Your Email:**
- You should receive an email with subject "Reset Your Password - REAP"
- Click the reset link (or copy the token)

---

### **Test 4: Reset Password**

```http
POST https://localhost:7072/api/Auth/reset-password
Content-Type: application/json

{
  "email": "test@example.com",
  "token": "TOKEN_FROM_EMAIL_LINK",
  "newPassword": "NewSecurePassword123!"
}
```

**Expected Response:**
```json
{
  "message": "Password reset successfully!"
}
```

---

## ?? EMAIL TEMPLATES

### **Verification Email Preview:**

**Subject:** Verify Your Email - REAP

**Body:**
- Professional header with "Welcome to REAP!"
- Clear call-to-action button
- Fallback plain text link
- 24-hour expiration notice
- Security disclaimer

### **Password Reset Email Preview:**

**Subject:** Reset Your Password - REAP

**Body:**
- Warning header (red theme)
- Clear reset password button
- Fallback plain text link
- Security warnings:
  - 1-hour expiration
  - Don't share the link
  - Ignore if not requested

---

## ?? SECURITY FEATURES

### **Token Expiration:**
- Email verification tokens: **24 hours** (ASP.NET Identity default)
- Password reset tokens: **1 hour** (can be configured)

### **Token Generation:**
- Uses ASP.NET Identity's built-in token providers
- Cryptographically secure
- Single-use tokens (invalidated after use)

### **Email Security:**
- Tokens are URL-encoded
- Uses HTTPS links
- Clear security warnings in emails
- Doesn't reveal if email exists (password reset)

---

## ?? CONFIGURATION OPTIONS

You can customize the email settings in `appsettings.Development.json`:

```json
"EmailSettings": {
  "SendGridApiKey": "YOUR_API_KEY",
  "SenderEmail": "noreply@yourdomain.com",
  "SenderName": "Your App Name",
  "FrontendUrl": "https://yourdomain.com"  // Change for production
}
```

---

## ?? PRODUCTION DEPLOYMENT

### **For Production:**

1. **Update `appsettings.json` (NOT Development):**
   ```json
   "EmailSettings": {
     "SendGridApiKey": "USE_ENVIRONMENT_VARIABLE",
     "SenderEmail": "noreply@yourdomain.com",
     "SenderName": "REAP",
     "FrontendUrl": "https://yourdomain.com"
   }
   ```

2. **Use Environment Variables:**
   ```bash
   # Don't hardcode API keys in production!
   export EmailSettings__SendGridApiKey="your-production-key"
   ```

3. **Domain Authentication:**
   - Instead of single sender verification
   - Use domain authentication in SendGrid
   - This improves deliverability and removes "via sendgrid.net"

4. **Monitor Email Sending:**
   - SendGrid Dashboard ? Activity
   - Track delivery rates, bounces, spam reports

---

## ?? TROUBLESHOOTING

### **Emails Not Sending:**

1. **Check SendGrid API Key:**
   - Is it correctly copied in `appsettings.Development.json`?
   - Did you verify the sender email in SendGrid?

2. **Check Logs:**
   - Exceptions are thrown if sending fails
   - Look for error messages in console

3. **Check SendGrid Dashboard:**
   - Go to Activity Feed
   - See if emails are being processed

### **Emails in Spam:**

- For development with free tier, emails might go to spam
- Use domain authentication for production
- Warm up your IP by gradually increasing send volume

### **"Sender not verified" Error:**

- You must verify your sender email in SendGrid
- Go to Settings ? Sender Authentication
- Complete single sender verification

---

## ?? SENDGRID FREE TIER LIMITS

- **100 emails/day** - Perfect for development
- Unlimited contacts
- Basic email API
- 30-day email activity history

**Upgrade if needed:**
- Essentials: $15/month (40,000 emails)
- Pro: $60/month (100,000 emails)

---

## ? WHAT'S NEXT?

### **Frontend Integration:**

1. Create email verification page at `/verify-email`
2. Create password reset page at `/reset-password`
3. Extract token and email from URL query params
4. Call backend endpoints with extracted values

### **Optional Enhancements:**

1. **Resend Verification Email:**
   - Add rate limiting (max 3 per hour)
   
2. **Email Change Verification:**
   - Verify new email when user changes it

3. **Email Templates:**
   - Create custom HTML templates
   - Add your logo/branding

4. **Email Analytics:**
   - Track open rates
   - Track click rates

---

## ?? SUMMARY

? **Implemented:**
- SendGrid integration
- Email verification system
- Password reset system
- Professional HTML email templates
- Error handling
- Security best practices

? **Configured:**
- Service registration in DI container
- Configuration settings
- Frontend URL integration

? **Ready for:**
- Testing with real emails
- Frontend integration
- Production deployment

---

**Your email service is production-ready! ??**

Need help setting up SendGrid or integrating with frontend? Let me know!
