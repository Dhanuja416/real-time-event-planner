using SendGrid;
using SendGrid.Helpers.Mail;

namespace RealTime.API.Services
{
    public class SendGridEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly string _apiKey;
        private readonly string _senderEmail;
        private readonly string _senderName;
        private readonly string _frontendUrl;

        public SendGridEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _apiKey = _configuration["EmailSettings:SendGridApiKey"] 
                ?? throw new InvalidOperationException("SendGrid API key not found in configuration.");
            _senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "noreply@reap.com";
            _senderName = _configuration["EmailSettings:SenderName"] ?? "REAP Support";
            _frontendUrl = _configuration["EmailSettings:FrontendUrl"] ?? "https://localhost:5173";
        }

        public async Task SendEmailVerificationAsync(string email, string token)
        {
            var client = new SendGridClient(_apiKey);
            var from = new EmailAddress(_senderEmail, _senderName);
            var to = new EmailAddress(email);
            var subject = "Verify Your Email - REAP";
            
            // Create verification link
            var verificationLink = $"{_frontendUrl}/verify-email?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";
            
            // HTML email body
            var htmlContent = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                        .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                        .button {{ display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>Welcome to REAP!</h1>
                        </div>
                        <div class='content'>
                            <h2>Verify Your Email Address</h2>
                            <p>Thank you for registering with REAP - Real-time Event and Planning platform.</p>
                            <p>To complete your registration and start collaborating on documents, please verify your email address by clicking the button below:</p>
                            <div style='text-align: center;'>
                                <a href='{verificationLink}' class='button'>Verify Email Address</a>
                            </div>
                            <p>If the button doesn't work, copy and paste this link into your browser:</p>
                            <p style='word-break: break-all; color: #4F46E5;'>{verificationLink}</p>
                            <p><strong>Note:</strong> This link will expire in 24 hours for security reasons.</p>
                        </div>
                        <div class='footer'>
                            <p>If you didn't create an account with REAP, please ignore this email.</p>
                            <p>&copy; 2024 REAP. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            // Plain text fallback
            var plainTextContent = $@"
                Welcome to REAP!
                
                Thank you for registering with REAP - Real-time Event and Planning platform.
                
                To complete your registration, please verify your email address by visiting this link:
                {verificationLink}
                
                This link will expire in 24 hours for security reasons.
                
                If you didn't create an account with REAP, please ignore this email.
                
                © 2024 REAP. All rights reserved.
            ";

            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            
            var response = await client.SendEmailAsync(msg);

            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Body.ReadAsStringAsync();
                throw new Exception($"Failed to send email verification. Status: {response.StatusCode}, Body: {responseBody}");
            }
        }

        public async Task SendPasswordResetAsync(string email, string token)
        {
            var client = new SendGridClient(_apiKey);
            var from = new EmailAddress(_senderEmail, _senderName);
            var to = new EmailAddress(email);
            var subject = "Reset Your Password - REAP";
            
            // Create password reset link
            var resetLink = $"{_frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";
            
            // HTML email body
            var htmlContent = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                        .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                        .button {{ display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                        .warning {{ background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 12px; margin: 20px 0; }}
                        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>Password Reset Request</h1>
                        </div>
                        <div class='content'>
                            <h2>Reset Your Password</h2>
                            <p>We received a request to reset the password for your REAP account.</p>
                            <p>Click the button below to reset your password:</p>
                            <div style='text-align: center;'>
                                <a href='{resetLink}' class='button'>Reset Password</a>
                            </div>
                            <p>If the button doesn't work, copy and paste this link into your browser:</p>
                            <p style='word-break: break-all; color: #DC2626;'>{resetLink}</p>
                            <div class='warning'>
                                <p><strong>?? Security Notice:</strong></p>
                                <ul>
                                    <li>This link will expire in 1 hour for security reasons.</li>
                                    <li>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</li>
                                    <li>Never share this link with anyone.</li>
                                </ul>
                            </div>
                        </div>
                        <div class='footer'>
                            <p>If you're having trouble, contact our support team.</p>
                            <p>&copy; 2024 REAP. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            // Plain text fallback
            var plainTextContent = $@"
                Password Reset Request
                
                We received a request to reset the password for your REAP account.
                
                To reset your password, visit this link:
                {resetLink}
                
                SECURITY NOTICE:
                - This link will expire in 1 hour for security reasons.
                - If you didn't request a password reset, please ignore this email.
                - Never share this link with anyone.
                
                If you're having trouble, contact our support team.
                
                © 2024 REAP. All rights reserved.
            ";

            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            
            var response = await client.SendEmailAsync(msg);

            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Body.ReadAsStringAsync();
                throw new Exception($"Failed to send password reset email. Status: {response.StatusCode}, Body: {responseBody}");
            }
        }
    }
}
