using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR; // 🎯 NEW: Required for IHubContext
using RealTime.API.Data;
using RealTime.API.DTOs;
using RealTime.API.Models;
using RealTime.API.Hubs;          // 🎯 NEW: Required for TaskHub
using Microsoft.AspNetCore.Authorization;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<TaskHub> _hubContext; // 🎯 NEW: Private field for SignalR

    // Constructor for Dependency Injection (DI)
    public TasksController(AppDbContext context, IHubContext<TaskHub> hubContext) // 🎯 NEW: Inject HubContext
    {
        _context = context;
        _hubContext = hubContext; // Assign the HubContext
    }

    // GET: api/Tasks
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTaskItems()
    {
        if (_context.TaskItems == null)
        {
            return NotFound();
        }
        return await _context.TaskItems.ToListAsync();
    }

    // POST: api/Tasks
    [HttpPost]
    public async Task<ActionResult<TaskItem>> PostTaskItem(CreateTaskDto taskDto)
    {
        // 1. Convert DTO to Model
        var taskItem = new TaskItem
        {
            Title = taskDto.Title,
            Description = taskDto.Description,
            DueDate = taskDto.DueDate,
            IsComplete = false,
            CreatedAt = DateTime.UtcNow
        };

        // 2. Add to database context and save
        _context.TaskItems.Add(taskItem);
        await _context.SaveChangesAsync();

        // 🎯 THE FIX: Broadcast the "created" event to all connected clients!
        // This is the line that makes the real-time sync work.
        await _hubContext.Clients.All.SendAsync("TaskReceived", taskItem, "created");

        // 3. Return a 201 Created response
        return CreatedAtAction(nameof(GetTaskItems), new { id = taskItem.Id }, taskItem);
    }

    // PUT: api/Tasks/5 (Required for completeness, needs broadcast added here too)
    [HttpPut("{id}")]
    public async Task<IActionResult> PutTaskItem(int id, UpdateTaskDto taskDto)
    {
        if (id != taskDto.Id)
        {
            return BadRequest(new { message = "Task ID in URL must match ID in body." });
        }

        var existingTask = await _context.TaskItems.FindAsync(id);
        if (existingTask == null) return NotFound();

        existingTask.Title = taskDto.Title;
        existingTask.Description = taskDto.Description;
        existingTask.IsComplete = taskDto.IsComplete;
        existingTask.DueDate = taskDto.DueDate;

        try
        {
            await _context.SaveChangesAsync();

            // 🎯 Broadcast the "updated" event!
            await _hubContext.Clients.All.SendAsync("TaskReceived", existingTask, "updated");
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

    // DELETE: api/Tasks/5 (Required for completeness, needs broadcast added here too)
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTaskItem(int id)
    {
        if (_context.TaskItems == null) return NotFound();

        var taskItem = await _context.TaskItems.FindAsync(id);
        if (taskItem == null) return NotFound();

        _context.TaskItems.Remove(taskItem);
        await _context.SaveChangesAsync();

        // 🎯 Broadcast the "deleted" event!
        await _hubContext.Clients.All.SendAsync("TaskReceived", taskItem, "deleted");

        return NoContent();
    }
}