using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using RealTime.API.Models;

namespace RealTime.API.Hubs
{
    [Authorize]
    public class TaskHub : Hub
    {
        /// <summary>
        /// Sends a notification about a task update (create, update, delete) to the calling user.
        /// </summary>
        public async Task SendTaskUpdate(TaskItem task, string action)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                await Clients.User(userId).SendAsync("TaskReceived", task, action);
            }
        }
    }
}
