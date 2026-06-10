using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using RealTime.API.Hubs;
using RealTime.API.Data;
using RealTime.API.Models;
using RealTime.API.DTOs;

namespace RealTime.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CommentsController> _logger;
        private readonly IHubContext<DocumentHub> _documentHubContext;

        public CommentsController(AppDbContext context, ILogger<CommentsController> logger, IHubContext<DocumentHub> documentHubContext)
        {
            _context = context;
            _logger = logger;
            _documentHubContext = documentHubContext;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new InvalidOperationException("User claim not found.");
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

        // GET: api/Comments/document/5
        [HttpGet("document/{documentId}")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetComments(int documentId)
        {
            var userId = GetUserId();
            if (!await HasAccessAsync(documentId, userId))
            {
                return Forbid();
            }

            // Fetch root level comments (ParentCommentId == null) that are not resolved
            var comments = await _context.Comments
                .Include(c => c.User)
                .Include(c => c.Replies)
                    .ThenInclude(r => r.User)
                .Where(c => c.DocumentId == documentId && c.ParentCommentId == null)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            return Ok(comments);
        }

        // POST: api/Comments
        [HttpPost]
        public async Task<ActionResult<Comment>> PostComment(CreateCommentDto commentDto)
        {
            var userId = GetUserId();
            if (!await HasAccessAsync(commentDto.DocumentId, userId))
            {
                return Forbid();
            }

            var commenter = await _context.Users.FindAsync(userId);
            if (commenter == null) return Unauthorized();

            var document = await _context.Documents.FindAsync(commentDto.DocumentId);
            if (document == null) return NotFound(new { message = "Document not found." });

            var comment = new Comment
            {
                DocumentId = commentDto.DocumentId,
                UserId = userId,
                Content = commentDto.Content,
                SelectionText = commentDto.SelectionText,
                CommentAnchorId = commentDto.CommentAnchorId,
                ParentCommentId = commentDto.ParentCommentId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            // Load user data for the response
            await _context.Entry(comment).Reference(c => c.User).LoadAsync();

            _logger.LogInformation("Comment {CommentId} created on document {DocumentId} by user {UserId}", comment.Id, comment.DocumentId, userId);

            // --- Real-time Notifications & Comment Updates ---
            try
            {
                // Broadcast comment update to all collaborators editing the document
                var groupName = $"Document_{comment.DocumentId}";
                await _documentHubContext.Clients.Group(groupName).SendAsync("CommentReceived", comment, "added");

                Notification? notification = null;

                // 1. If this is a reply to an existing comment thread
                if (comment.ParentCommentId.HasValue)
                {
                    var parentComment = await _context.Comments
                        .Include(c => c.User)
                        .FirstOrDefaultAsync(c => c.Id == comment.ParentCommentId.Value);

                    if (parentComment != null && parentComment.UserId != userId)
                    {
                        notification = new Notification
                        {
                            UserId = parentComment.UserId,
                            Type = "CommentReply",
                            Message = $"{commenter.UserName} replied to your comment: \"{comment.Content}\"",
                            DocumentId = comment.DocumentId,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Notifications.Add(notification);
                    }
                }
                // 2. If it's a new comment and the commenter is NOT the document owner
                else if (document.OwnerId != userId)
                {
                    notification = new Notification
                    {
                        UserId = document.OwnerId,
                        Type = "CommentAdded",
                        Message = $"{commenter.UserName} left a comment on your document \"{document.Title}\": \"{comment.Content}\"",
                        DocumentId = comment.DocumentId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(notification);
                }

                if (notification != null)
                {
                    await _context.SaveChangesAsync();

                    // Push notification in real-time to the recipient
                    await _documentHubContext.Clients.User(notification.UserId).SendAsync("ReceiveNotification", new
                    {
                        notification.Id,
                        notification.Type,
                        notification.Message,
                        notification.DocumentId,
                        notification.IsRead,
                        notification.CreatedAt
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send real-time notification or broadcast comment {CommentId}", comment.Id);
            }

            return CreatedAtAction(nameof(GetComments), new { documentId = comment.DocumentId }, comment);
        }

        // PUT: api/Comments/5/resolve
        [HttpPut("{id}/resolve")]
        public async Task<IActionResult> ResolveComment(int id)
        {
            var userId = GetUserId();
            var comment = await _context.Comments.FindAsync(id);

            if (comment == null) return NotFound();
            if (!await HasAccessAsync(comment.DocumentId, userId))
            {
                return Forbid();
            }

            comment.ResolvedAt = DateTime.UtcNow;
            comment.ResolvedById = userId;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Comment thread {CommentId} resolved by user {UserId}", id, userId);

            // Broadcast resolve event in real-time to active collaborators
            try
            {
                var groupName = $"Document_{comment.DocumentId}";
                await _documentHubContext.Clients.Group(groupName).SendAsync("CommentReceived", new { Id = id }, "resolved");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast comment resolution for comment {CommentId}", id);
            }

            return NoContent();
        }

        // DELETE: api/Comments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            var userId = GetUserId();
            var comment = await _context.Comments
                .Include(c => c.Document)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comment == null) return NotFound();

            // Only the comment author OR the document owner can delete comments
            var isAuthor = comment.UserId == userId;
            var isDocOwner = comment.Document?.OwnerId == userId;

            if (!isAuthor && !isDocOwner)
            {
                return Forbid();
            }

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Comment {CommentId} deleted by user {UserId}", id, userId);

            // Broadcast delete event in real-time to active collaborators
            try
            {
                var groupName = $"Document_{comment.DocumentId}";
                await _documentHubContext.Clients.Group(groupName).SendAsync("CommentReceived", new { Id = id }, "deleted");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to broadcast comment deletion for comment {CommentId}", id);
            }

            return NoContent();
        }
    }
}
