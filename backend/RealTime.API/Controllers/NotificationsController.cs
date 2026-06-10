using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using RealTime.API.Data;
using RealTime.API.Models;

namespace RealTime.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(AppDbContext context, ILogger<NotificationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new InvalidOperationException("User claim not found.");
        }

        // GET: api/Notifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications()
        {
            var userId = GetUserId();
            var notifications = await _context.Notifications
                .Include(n => n.Document)
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50) // Limit to latest 50
                .ToListAsync();

            return Ok(notifications);
        }

        // PUT: api/Notifications/5/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = GetUserId();
            var notification = await _context.Notifications.FindAsync(id);

            if (notification == null) return NotFound();
            if (notification.UserId != userId) return Forbid();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification {NotificationId} marked as read by user {UserId}", id, userId);
            return NoContent();
        }

        // PUT: api/Notifications/read-all
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetUserId();
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("All notifications marked as read by user {UserId}", userId);
            return NoContent();
        }
    }
}
