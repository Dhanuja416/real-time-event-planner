using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using RealTime.API.Data;
using RealTime.API.DTOs;
using RealTime.API.Models;
using RealTime.API.Hubs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<TaskHub> _hubContext;

    public TasksController(AppDbContext context, IHubContext<TaskHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("User claim not found.");
    }

    // GET: api/Tasks
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTaskItems()
    {
        if (_context.TaskItems == null)
        {
            return NotFound();
        }
        var userId = GetUserId();
        return await _context.TaskItems
            .Where(t => t.OwnerId == userId)
            .ToListAsync();
    }

    // POST: api/Tasks
    [HttpPost]
    public async Task<ActionResult<TaskItem>> PostTaskItem(CreateTaskDto taskDto)
    {
        var userId = GetUserId();

        var taskItem = new TaskItem
        {
            Title = taskDto.Title,
            Description = taskDto.Description,
            DueDate = taskDto.DueDate,
            IsComplete = false,
            CreatedAt = DateTime.UtcNow,
            OwnerId = userId
        };

        _context.TaskItems.Add(taskItem);
        await _context.SaveChangesAsync();

        // Broadcast "created" event only to the authenticated owner
        await _hubContext.Clients.User(userId).SendAsync("TaskReceived", taskItem, "created");

        return CreatedAtAction(nameof(GetTaskItems), new { id = taskItem.Id }, taskItem);
    }

    // PUT: api/Tasks/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutTaskItem(int id, UpdateTaskDto taskDto)
    {
        if (id != taskDto.Id)
        {
            return BadRequest(new { message = "Task ID in URL must match ID in body." });
        }

        var userId = GetUserId();
        var existingTask = await _context.TaskItems.FindAsync(id);
        if (existingTask == null) return NotFound();

        // Security check: Only the owner can modify their tasks
        if (existingTask.OwnerId != userId)
        {
            return Forbid();
        }

        existingTask.Title = taskDto.Title;
        existingTask.Description = taskDto.Description;
        existingTask.IsComplete = taskDto.IsComplete;
        existingTask.DueDate = taskDto.DueDate;

        try
        {
            await _context.SaveChangesAsync();

            // Broadcast "updated" event only to the authenticated owner
            await _hubContext.Clients.User(userId).SendAsync("TaskReceived", existingTask, "updated");
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.TaskItems.Any(e => e.Id == id))
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

    // DELETE: api/Tasks/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTaskItem(int id)
    {
        if (_context.TaskItems == null) return NotFound();

        var userId = GetUserId();
        var taskItem = await _context.TaskItems.FindAsync(id);
        if (taskItem == null) return NotFound();

        // Security check: Only the owner can delete their tasks
        if (taskItem.OwnerId != userId)
        {
            return Forbid();
        }

        _context.TaskItems.Remove(taskItem);
        await _context.SaveChangesAsync();

        // Broadcast "deleted" event only to the authenticated owner
        await _hubContext.Clients.User(userId).SendAsync("TaskReceived", taskItem, "deleted");

        return NoContent();
    }
}