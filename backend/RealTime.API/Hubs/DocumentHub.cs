using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using RealTime.API.Data;
using RealTime.API.Models;

namespace RealTime.API.Hubs
{
    [Authorize]
    public class DocumentHub : Hub
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DocumentHub> _logger;

        public DocumentHub(AppDbContext context, ILogger<DocumentHub> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string GetUserId()
        {
            return Context.User?.FindFirstValue(ClaimTypes.NameIdentifier) 
                ?? throw new HubException("User not authenticated.");
        }

        private async Task<bool> HasAccessAsync(int documentId, string userId)
        {
            var document = await _context.Documents
                .Include(d => d.Permissions)
                .FirstOrDefaultAsync(d => d.Id == documentId);

            if (document == null) return false;
            if (document.OwnerId == userId) return true;
            return document.Permissions.Any(p => p.UserId == userId);
        }

        public async Task JoinDocument(int documentId)
        {
            var userId = GetUserId();
            if (!await HasAccessAsync(documentId, userId))
            {
                _logger.LogWarning("User {UserId} attempted unauthorized access to document {DocumentId}", userId, documentId);
                throw new HubException("Unauthorized access to document.");
            }

            var groupName = $"Document_{documentId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            var document = await _context.Documents.FindAsync(documentId);
            if (document != null)
            {
                // Send the current serialized Yjs binary state back to the caller
                await Clients.Caller.SendAsync("LoadDocumentState", document.ContentBinary ?? Array.Empty<byte>());
            }

            _logger.LogInformation("Connection {ConnectionId} joined document group {GroupName}", Context.ConnectionId, groupName);
        }

        public async Task LeaveDocument(int documentId)
        {
            var groupName = $"Document_{documentId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            _logger.LogInformation("Connection {ConnectionId} left document group {GroupName}", Context.ConnectionId, groupName);
        }

        public async Task SendUpdate(int documentId, byte[] update)
        {
            var groupName = $"Document_{documentId}";
            
            // Broadcast the update to all other collaborators in the group
            await Clients.OthersInGroup(groupName).SendAsync("ReceiveUpdate", update);
        }

        public async Task SendAwareness(int documentId, byte[] awarenessState)
        {
            var groupName = $"Document_{documentId}";
            // Broadcast client presence/cursor info to others in the group
            await Clients.OthersInGroup(groupName).SendAsync("ReceiveAwareness", awarenessState);
        }

        public async Task SaveDocumentState(int documentId, byte[] stateBytes, string htmlContent)
        {
            var userId = GetUserId();
            if (!await HasAccessAsync(documentId, userId))
            {
                throw new HubException("Unauthorized access to document.");
            }

            var document = await _context.Documents.FindAsync(documentId);
            if (document != null)
            {
                document.ContentBinary = stateBytes;
                document.Content = htmlContent;
                document.LastEditedById = userId;
                document.Version += 1;
                document.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                
                var groupName = $"Document_{documentId}";
                await Clients.Group(groupName).SendAsync("DocumentSaved", userId, document.Version);
                _logger.LogInformation("Document {DocumentId} saved by user {UserId}. Version: {Version}", documentId, userId, document.Version);
            }
        }
    }
}
