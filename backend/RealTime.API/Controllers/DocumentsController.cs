using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using RealTime.API.Data;
using RealTime.API.Models;
using RealTime.API.DTOs;
using RealTime.API.Hubs;
using Microsoft.AspNetCore.Identity;

namespace RealTime.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<TaskHub> _hubContext;
        private readonly IHubContext<DocumentHub> _documentHubContext;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly ILogger<DocumentsController> _logger;

        public DocumentsController(
            AppDbContext context,
            IHubContext<TaskHub> hubContext,
            IHubContext<DocumentHub> documentHubContext,
            UserManager<IdentityUser> userManager,
            ILogger<DocumentsController> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _documentHubContext = documentHubContext;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: api/Documents
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocuments()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var documents = await _context.Documents
                .Include(d => d.Owner)
                .Include(d => d.Permissions)
                .Where(d => d.OwnerId == userId || d.Permissions.Any(p => p.UserId == userId))
                .OrderByDescending(d => d.UpdatedAt)
                .ToListAsync();

            return Ok(documents);
        }

        // GET: api/Documents/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Document>> GetDocument(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var document = await _context.Documents
                .Include(d => d.Owner)
                .Include(d => d.Permissions)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null) return NotFound();

            // Check if user has access
            var hasAccess = document.OwnerId == userId || 
                           document.Permissions.Any(p => p.UserId == userId);

            if (!hasAccess) return Forbid();

            return Ok(document);
        }

        // POST: api/Documents
        [HttpPost]
        public async Task<ActionResult<Document>> PostDocument(CreateDocumentDto documentDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var document = new Document
            {
                Title = documentDto.Title,
                Content = documentDto.Content,
                OwnerId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(document).Reference(d => d.Owner).LoadAsync();

            _logger.LogInformation("Document {DocumentId} created by user {UserId}", document.Id, userId);

            // Broadcast only to the document owner (no collaborators yet on a new doc)
            await _hubContext.Clients.User(userId).SendAsync("DocumentReceived", document, "created");

            return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, document);
        }

        // PUT: api/Documents/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDocument(int id, UpdateDocumentDto documentDto)
        {
            if (id != documentDto.Id)
            {
                return BadRequest(new { message = "Document ID in URL must match ID in body." });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var document = await _context.Documents
                .Include(d => d.Permissions)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null) return NotFound();

            // Check permission: user is Owner OR has Editor/Owner permission level
            var isOwner = document.OwnerId == userId;
            var hasEditorPermission = document.Permissions.Any(p => 
                p.UserId == userId && (p.Level == PermissionLevel.Editor || p.Level == PermissionLevel.Owner));

            if (!isOwner && !hasEditorPermission)
            {
                return Forbid();
            }

            // Update document
            document.Title = documentDto.Title;
            document.Content = documentDto.Content;
            document.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();

                // Reload with navigation properties for broadcast
                await _context.Entry(document).Reference(d => d.Owner).LoadAsync();
                await _context.Entry(document).Collection(d => d.Permissions).LoadAsync();

                _logger.LogInformation("Document {DocumentId} updated by user {UserId}", document.Id, userId);

                // Broadcast only to users who have access (owner + permitted users)
                var allowedUserIds = document.Permissions
                    .Select(p => p.UserId)
                    .Append(document.OwnerId)
                    .Distinct()
                    .ToList();

                await _hubContext.Clients.Users(allowedUserIds).SendAsync("DocumentReceived", document, "updated");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Documents.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Documents/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var document = await _context.Documents
                .Include(d => d.Permissions)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null) return NotFound();

            // Only owner can delete
            if (document.OwnerId != userId)
            {
                return Forbid();
            }

            // Collect allowed user IDs before deleting
            var allowedUserIds = document.Permissions
                .Select(p => p.UserId)
                .Append(document.OwnerId)
                .Distinct()
                .ToList();

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Document {DocumentId} deleted by user {UserId}", id, userId);

            // Broadcast only to users who had access
            await _hubContext.Clients.Users(allowedUserIds).SendAsync("DocumentReceived", document, "deleted");

            return NoContent();
        }

        // POST: api/Documents/{id}/share
        [HttpPost("{id}/share")]
        public async Task<IActionResult> ShareDocument(int id, ShareDocumentDto shareDto)
        {
            if (id != shareDto.DocumentId)
            {
                return BadRequest(new { message = "Document ID in URL must match ID in body." });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var document = await _context.Documents
                .Include(d => d.Permissions)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null) return NotFound(new { message = "Document not found." });

            // Only owner can share
            if (document.OwnerId != userId)
            {
                return Forbid();
            }

            // Find user by email
            var userToShareWith = await _userManager.FindByEmailAsync(shareDto.UserEmail);
            if (userToShareWith == null)
            {
                return NotFound(new { message = $"User with email '{shareDto.UserEmail}' not found." });
            }

            // Check if permission already exists
            var existingPermission = await _context.DocumentPermissions
                .FirstOrDefaultAsync(p => p.DocumentId == id && p.UserId == userToShareWith.Id);

            if (existingPermission != null)
            {
                // Update existing permission
                existingPermission.Level = shareDto.PermissionLevel;
                existingPermission.GrantedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new permission
                var permission = new DocumentPermission
                {
                    DocumentId = id,
                    UserId = userToShareWith.Id,
                    Level = shareDto.PermissionLevel,
                    GrantedAt = DateTime.UtcNow
                };
                _context.DocumentPermissions.Add(permission);
            }

            await _context.SaveChangesAsync();

            // Create notification for shared user
            try
            {
                var sharingUser = await _userManager.FindByIdAsync(userId);
                var notification = new Notification
                {
                    UserId = userToShareWith.Id,
                    Type = "DocumentShared",
                    Message = $"{sharingUser?.UserName ?? "Someone"} shared the document \"{document.Title}\" with you.",
                    DocumentId = id,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                // Broadcast notification in real-time
                await _documentHubContext.Clients.User(userToShareWith.Id).SendAsync("ReceiveNotification", new
                {
                    notification.Id,
                    notification.Type,
                    notification.Message,
                    notification.DocumentId,
                    notification.IsRead,
                    notification.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create sharing notification for document {DocumentId}", id);
            }

            _logger.LogInformation("Document {DocumentId} shared with {SharedEmail} as {PermissionLevel} by {UserId}",
                id, shareDto.UserEmail, shareDto.PermissionLevel, userId);

            // Reload navigation properties
            await _context.Entry(document).Reference(d => d.Owner).LoadAsync();
            await _context.Entry(document).Collection(d => d.Permissions).LoadAsync();

            // Broadcast to all users with access (including the newly shared user)
            var allowedUserIds = document.Permissions
                .Select(p => p.UserId)
                .Append(document.OwnerId)
                .Distinct()
                .ToList();

            await _hubContext.Clients.Users(allowedUserIds).SendAsync("DocumentReceived", document, "shared");

            return Ok(new { message = $"Document shared with {shareDto.UserEmail} as {shareDto.PermissionLevel}." });
        }

        // GET: api/Documents/{id}/versions
        [HttpGet("{id}/versions")]
        public async Task<ActionResult<IEnumerable<object>>> GetVersions(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var document = await _context.Documents
                .Include(d => d.Permissions)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null) return NotFound();

            // Check access
            var hasAccess = document.OwnerId == userId || document.Permissions.Any(p => p.UserId == userId);
            if (!hasAccess) return Forbid();

            var versions = await _context.DocumentVersions
                .Include(v => v.CreatedBy)
                .Where(v => v.DocumentId == id)
                .OrderByDescending(v => v.VersionNumber)
                .Select(v => new
                {
                    v.Id,
                    v.DocumentId,
                    v.VersionNumber,
                    v.CreatedAt,
                    CreatedByEmail = v.CreatedBy != null ? v.CreatedBy.Email : "Unknown",
                    CreatedByUserName = v.CreatedBy != null ? v.CreatedBy.UserName : "Unknown"
                })
                .ToListAsync();

            return Ok(versions);
        }

        // GET: api/Documents/{id}/versions/{versionId}
        [HttpGet("{id}/versions/{versionId}")]
        public async Task<ActionResult<object>> GetVersion(int id, int versionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var document = await _context.Documents
                .Include(d => d.Permissions)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null) return NotFound();

            // Check access
            var hasAccess = document.OwnerId == userId || document.Permissions.Any(p => p.UserId == userId);
            if (!hasAccess) return Forbid();

            var version = await _context.DocumentVersions
                .Include(v => v.CreatedBy)
                .FirstOrDefaultAsync(v => v.DocumentId == id && v.Id == versionId);

            if (version == null) return NotFound();

            return Ok(new
            {
                version.Id,
                version.VersionNumber,
                version.Content,
                version.CreatedAt,
                CreatedByEmail = version.CreatedBy != null ? version.CreatedBy.Email : "Unknown"
            });
        }

        // POST: api/Documents/{id}/versions/{versionId}/restore
        [HttpPost("{id}/versions/{versionId}/restore")]
        public async Task<IActionResult> RestoreVersion(int id, int versionId)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var document = await _context.Documents
                .Include(d => d.Permissions)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (document == null) return NotFound();

            // Check access: only Owner or Editor can restore versions
            var isOwner = document.OwnerId == userId;
            var hasEditorPermission = document.Permissions.Any(p => 
                p.UserId == userId && (p.Level == PermissionLevel.Editor || p.Level == PermissionLevel.Owner));

            if (!isOwner && !hasEditorPermission)
            {
                return Forbid();
            }

            var version = await _context.DocumentVersions.FirstOrDefaultAsync(v => v.DocumentId == id && v.Id == versionId);
            if (version == null) return NotFound(new { message = "Version snapshot not found." });

            // Restore document content and binary state
            document.Content = version.Content;
            document.ContentBinary = version.ContentBinary;
            document.UpdatedAt = DateTime.UtcNow;
            document.LastEditedById = userId;
            document.Version += 1;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Document {DocumentId} restored to version snapshot {VersionNumber} (ID: {VersionId}) by user {UserId}",
                id, version.VersionNumber, versionId, userId);

            // Broadcast the restore event and new binary state to all active collaborators
            var groupName = $"Document_{id}";
            // Send the restored event so clients replace their entire Yjs doc state
            await _documentHubContext.Clients.Group(groupName).SendAsync("DocumentRestored", version.ContentBinary ?? Array.Empty<byte>(), document.Version);

            // Notify legacy TaskHub about document update
            var allowedUserIds = document.Permissions
                .Select(p => p.UserId)
                .Append(document.OwnerId)
                .Distinct()
                .ToList();
            await _hubContext.Clients.Users(allowedUserIds).SendAsync("DocumentReceived", document, "updated");

            return Ok(new { message = $"Document successfully restored to version {version.VersionNumber}." });
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new InvalidOperationException("User claim not found.");
        }
    }
}
