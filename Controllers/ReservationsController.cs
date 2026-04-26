using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Data;
using ParkingManagementSystem.Models;
using ParkingManagementSystem.Services;

namespace ParkingManagementSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IParkingBroadcast _broadcast;
    private bool IsManagerOnly => User.IsInRole(AppRoles.ParkingManager) && !User.IsInRole(AppRoles.Admin) && !User.IsInRole(AppRoles.Attendant);

    public ReservationsController(ApplicationDbContext db, IParkingBroadcast broadcast)
    {
        _db = db;
        _broadcast = broadcast;
    }

    [HttpGet("mine")]
    [Authorize(Roles = AppRoles.DriverRolesCsv)]
    public async Task<ActionResult<IEnumerable<Reservation>>> Mine(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        return await _db.Reservations
            .AsNoTracking()
            .Include(r => r.ParkingSpace)
            .Where(r => r.ApplicationUserId == userId)
            .OrderByDescending(r => r.StartUtc)
            .ToListAsync(cancellationToken);
    }

    [HttpGet]
    [Authorize(Roles = AppRoles.StaffRolesCsv)]
    public async Task<ActionResult<IEnumerable<Reservation>>> GetAll(CancellationToken cancellationToken)
    {
        var q = _db.Reservations
            .AsNoTracking()
            .Include(r => r.ParkingSpace)
            .AsQueryable();
        if (IsManagerOnly)
            q = q.Where(r => r.ParkingSpace != null && r.ParkingSpace.ManagerUserId == User.FindFirstValue(ClaimTypes.NameIdentifier));
        return await q.OrderByDescending(r => r.StartUtc).ToListAsync(cancellationToken);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.DriverRolesCsv)]
    public async Task<ActionResult<Reservation>> Create([FromBody] CreateReservationDto dto, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        if (dto.EndUtc <= dto.StartUtc)
            return BadRequest(new { error = "End time must be after start time." });

        var space = await _db.ParkingSpaces.FirstOrDefaultAsync(s => s.Id == dto.ParkingSpaceId, cancellationToken);
        if (space is null)
            return NotFound(new { error = "Parking space not found." });

        if (space.IsUnderMaintenance)
            return Conflict(new { error = "Space is under maintenance." });

        var openSession = await _db.ParkingSessions.AnyAsync(
            s => s.ParkingSpaceId == dto.ParkingSpaceId && s.CheckOutUtc == null,
            cancellationToken);
        if (openSession)
            return Conflict(new { error = "Space is currently occupied." });

        var overlaps = await _db.Reservations.AnyAsync(
            r => r.ParkingSpaceId == dto.ParkingSpaceId
                 && r.Status != "Cancelled"
                 && r.Status != "Completed"
                 && r.StartUtc < dto.EndUtc
                 && r.EndUtc > dto.StartUtc,
            cancellationToken);

        if (overlaps)
            return Conflict(new { error = "That time window overlaps an existing reservation." });

        var entity = new Reservation
        {
            ApplicationUserId = userId,
            ParkingSpaceId = dto.ParkingSpaceId,
            StartUtc = dto.StartUtc,
            EndUtc = dto.EndUtc,
            Status = "Confirmed",
            CreatedUtc = DateTime.UtcNow
        };

        _db.Reservations.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        await _broadcast.NotifySlotsChangedAsync(cancellationToken);

        await _db.Entry(entity).Reference(r => r.ParkingSpace).LoadAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRoles.DriverRolesCsv)]
    public async Task<ActionResult<Reservation>> Update(int id, [FromBody] UpdateReservationDto dto, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        if (dto.EndUtc <= dto.StartUtc)
            return BadRequest(new { error = "End time must be after start time." });

        var reservation = await _db.Reservations.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (reservation is null)
            return NotFound();

        if (!AppRoles.IsStaff(User) && reservation.ApplicationUserId != userId)
            return Forbid();

        if (reservation.Status is "Cancelled" or "Completed")
            return BadRequest(new { error = "Cannot modify a cancelled or completed reservation." });

        var overlaps = await _db.Reservations.AnyAsync(
            r => r.Id != id
                 && r.ParkingSpaceId == reservation.ParkingSpaceId
                 && r.Status != "Cancelled"
                 && r.Status != "Completed"
                 && r.StartUtc < dto.EndUtc
                 && r.EndUtc > dto.StartUtc,
            cancellationToken);

        if (overlaps)
            return Conflict(new { error = "That time window overlaps another reservation." });

        reservation.StartUtc = dto.StartUtc;
        reservation.EndUtc = dto.EndUtc;
        await _db.SaveChangesAsync(cancellationToken);
        await _broadcast.NotifySlotsChangedAsync(cancellationToken);

        await _db.Entry(reservation).Reference(r => r.ParkingSpace).LoadAsync(cancellationToken);
        return reservation;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Reservation>> GetById(int id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var reservation = await _db.Reservations
            .Include(r => r.ParkingSpace)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (reservation is null)
            return NotFound();

        if (AppRoles.IsStaff(User))
        {
            if (IsManagerOnly && reservation.ParkingSpace?.ManagerUserId != User.FindFirstValue(ClaimTypes.NameIdentifier))
                return Forbid();
            return reservation;
        }

        if (AppRoles.IsDriver(User) && reservation.ApplicationUserId == userId)
            return reservation;

        return Forbid();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var reservation = await _db.Reservations.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (reservation is null)
            return NotFound();

        if (!AppRoles.IsStaff(User) && reservation.ApplicationUserId != userId)
            return Forbid();
        if (IsManagerOnly && reservation.ParkingSpaceId != 0)
        {
            var allowed = await _db.ParkingSpaces.AnyAsync(s => s.Id == reservation.ParkingSpaceId && s.ManagerUserId == userId, cancellationToken);
            if (!allowed) return Forbid();
        }

        if (reservation.Status is "Cancelled" or "Completed")
            return NoContent();

        reservation.Status = "Cancelled";
        await _db.SaveChangesAsync(cancellationToken);
        await _broadcast.NotifySlotsChangedAsync(cancellationToken);
        return NoContent();
    }
}
