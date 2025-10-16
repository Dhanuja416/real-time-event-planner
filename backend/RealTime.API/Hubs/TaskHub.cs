using Microsoft.AspNetCore.SignalR;
using RealTime.API.Models;

namespace RealTime.API.Hubs
{
    // The Hub class inherits from SignalR's base Hub to gain WebSocket management capability.
    public class TaskHub : Hub
    {
        /// <summary>
        /// Sends a notification about a task update (create, update, delete) to all connected clients.
        /// </summary>
        /// <param name="task">The TaskItem object that was changed.</param>
        /// <param name="action">The type of action performed (e.g., "created", "updated", "deleted").</param>
        public async Task SendTaskUpdate(TaskItem task, string action)
        {
            // Clients.All targets every browser currently connected to the Hub.
            // "TaskReceived" is the event name the React client is listening for.
            await Clients.All.SendAsync("TaskReceived", task, action);
        }
    }
}
