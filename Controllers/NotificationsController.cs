using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Data;
using ParkingManagementSystem.Models;

namespace ParkingManagementSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public NotificationsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppNotification>>> List(
        CancellationToken cancellationToken,
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int take = 50)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        take = Math.Clamp(take, 1, 200);
        var q = _db.AppNotifications.AsNoTracking().Where(n => n.UserId == userId);
        if (unreadOnly)
            q = q.Where(n => n.ReadUtc == null);

        return await q.OrderByDescending(n => n.CreatedUtc).Take(take).ToListAsync(cancellationToken);
    }

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var n = await _db.AppNotifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        if (n is null)
            return NotFound();

        n.ReadUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var now = DateTime.UtcNow;
        await _db.AppNotifications
            .Where(n => n.UserId == userId && n.ReadUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.ReadUtc, now), cancellationToken);

        return NoContent();
    }
}
