namespace RealTime.API.Services
{
    public interface IEmailService
    {
        Task SendEmailVerificationAsync(string email, string token);
        Task SendPasswordResetAsync(string email, string token);
    }
}
