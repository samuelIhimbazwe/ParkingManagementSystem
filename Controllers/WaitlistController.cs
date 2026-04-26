using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Data;
using ParkingManagementSystem.Models;

namespace ParkingManagementSystem.Controllers;

[Authorize(Policy = AppPermissions.Policies.WaitlistUse)]
[ApiController]
[Route("api/[controller]")]
public class WaitlistController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public WaitlistController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<WaitlistEntry>>> Mine(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        return await _db.WaitlistEntries
            .AsNoTracking()
            .Include(w => w.ParkingLot)
            .Where(w => w.ApplicationUserId == userId)
            .OrderByDescending(w => w.CreatedUtc)
            .Take(50)
            .ToListAsync(cancellationToken);
    }

    [HttpPost]
    public async Task<ActionResult<WaitlistEntry>> Create([FromBody] CreateWaitlistEntryDto dto, CancellationToken cancellationToken)
    {
        if (dto.RequestedEndUtc <= dto.RequestedStartUtc)
            return BadRequest(new { error = "End must be after start." });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        if (!await _db.ParkingLots.AnyAsync(l => l.Id == dto.ParkingLotId, cancellationToken))
            return BadRequest(new { error = "Unknown parking lot." });

        if (dto.ParkingSpaceIdPreferred is int sid &&
            !await _db.ParkingSpaces.AnyAsync(s => s.Id == sid && s.ParkingLotId == dto.ParkingLotId, cancellationToken))
            return BadRequest(new { error = "Preferred space is not in the selected lot." });

        var entry = new WaitlistEntry
        {
            ApplicationUserId = userId,
            ParkingLotId = dto.ParkingLotId,
            ParkingSpaceIdPreferred = dto.ParkingSpaceIdPreferred,
            RequestedStartUtc = dto.RequestedStartUtc,
            RequestedEndUtc = dto.RequestedEndUtc,
            LicensePlate = dto.LicensePlate.Trim(),
            CreatedUtc = DateTime.UtcNow,
            Status = "Waiting",
        };

        _db.WaitlistEntries.Add(entry);
        await _db.SaveChangesAsync(cancellationToken);
        await _db.Entry(entry).Reference(e => e.ParkingLot).LoadAsync(cancellationToken);
        return StatusCode(StatusCodes.Status201Created, entry);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var entry = await _db.WaitlistEntries.FirstOrDefaultAsync(
            w => w.Id == id && w.ApplicationUserId == userId && w.Status == "Waiting",
            cancellationToken);
        if (entry is null)
            return NotFound();

        entry.Status = "Cancelled";
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
