using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Data;
using ParkingManagementSystem.Models;
using System.Security.Claims;

namespace ParkingManagementSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AvailabilityController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private bool IsManagerOnly => User.IsInRole(AppRoles.ParkingManager) && !User.IsInRole(AppRoles.Admin) && !User.IsInRole(AppRoles.Attendant);
    private string? ActorId => User.FindFirstValue(ClaimTypes.NameIdentifier);

    public AvailabilityController(ApplicationDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Spaces that appear free for the entire window: no overlapping reservation and no overlapping session interval.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AvailabilitySpaceDto>>> Get(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] int? parkingLotId,
        CancellationToken cancellationToken)
    {
        if (to <= from)
            return BadRequest(new { error = "'to' must be after 'from'." });

        if (parkingLotId is int lid && !await _db.ParkingLots.AsNoTracking().AnyAsync(l => l.Id == lid, cancellationToken))
            return BadRequest(new { error = "Unknown parking lot." });

        var reservedSpaceIds = await _db.Reservations
            .AsNoTracking()
            .Where(r => r.Status != "Cancelled" && r.Status != "Completed" && r.StartUtc < to && r.EndUtc > from)
            .Select(r => r.ParkingSpaceId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var sessionBusyIds = await _db.ParkingSessions
            .AsNoTracking()
            .Where(s =>
                (s.CheckOutUtc == null && s.CheckInUtc < to) ||
                (s.CheckOutUtc != null && s.CheckInUtc < to && s.CheckOutUtc > from))
            .Select(s => s.ParkingSpaceId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var blocked = reservedSpaceIds.Union(sessionBusyIds).ToHashSet();

        var free = await (
            from s in _db.ParkingSpaces.AsNoTracking()
            join l in _db.ParkingLots.AsNoTracking() on s.ParkingLotId equals l.Id
            where !blocked.Contains(s.Id)
                  && (parkingLotId == null || s.ParkingLotId == parkingLotId)
                  && (!IsManagerOnly || s.ManagerUserId == ActorId)
            orderby l.Name, s.Zone, s.SpaceNumber
            select new AvailabilitySpaceDto
            {
                Id = s.Id,
                ParkingLotId = l.Id,
                LotName = l.Name,
                LotAddress = l.Address,
                SpaceNumber = s.SpaceNumber,
                Location = s.Location,
                Zone = s.Zone,
                HourlyRate = s.HourlyRate
            }).ToListAsync(cancellationToken);

        return free;
    }

    /// <summary>Real-time style snapshot for the visual map (occupied / reserved / available / maintenance).</summary>
    [HttpGet("live")]
    public async Task<ActionResult<LiveMapDto>> Live([FromQuery] int? parkingLotId, CancellationToken cancellationToken)
    {
        var lotQuery = _db.ParkingLots.AsNoTracking().OrderBy(l => l.Id).AsQueryable();
        if (IsManagerOnly)
            lotQuery = lotQuery.Where(l => _db.ParkingSpaces.Any(s => s.ParkingLotId == l.Id && s.ManagerUserId == ActorId));
        var lot = parkingLotId is int lid
            ? await lotQuery.FirstOrDefaultAsync(l => l.Id == lid, cancellationToken)
            : await lotQuery.FirstOrDefaultAsync(cancellationToken);

        if (lot is null)
            return NotFound(new { error = "No parking lot configured." });

        var now = DateTime.UtcNow;
        var spaces = await _db.ParkingSpaces
            .AsNoTracking()
            .Where(s => s.ParkingLotId == lot.Id)
            .Where(s => !IsManagerOnly || s.ManagerUserId == ActorId)
            .OrderBy(s => s.MapRow)
            .ThenBy(s => s.MapColumn)
            .ThenBy(s => s.SpaceNumber)
            .ToListAsync(cancellationToken);

        var openSessions = await _db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.CheckOutUtc == null)
            .Select(s => new { s.ParkingSpaceId, s.Id, s.CheckInUtc })
            .ToListAsync(cancellationToken);
        var openBySpace = openSessions.ToDictionary(x => x.ParkingSpaceId, x => (x.Id, x.CheckInUtc));

        var activeReservations = await _db.Reservations
            .AsNoTracking()
            .Where(r =>
                r.Status != "Cancelled"
                && r.Status != "Completed"
                && r.StartUtc <= now
                && r.EndUtc > now)
            .Select(r => new { r.ParkingSpaceId, r.EndUtc })
            .ToListAsync(cancellationToken);
        var resBySpace = activeReservations.GroupBy(x => x.ParkingSpaceId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.EndUtc).First().EndUtc);

        var cells = new List<LiveSpaceCellDto>();
        var counts = (Available: 0, Occupied: 0, Reserved: 0, Maintenance: 0, Overstay: 0);

        foreach (var s in spaces)
        {
            string state;
            int? sessionId = null;
            DateTime? resEnd = null;
            var isOverstay = false;

            if (s.IsUnderMaintenance)
            {
                state = "Maintenance";
                counts.Maintenance++;
            }
            else if (openBySpace.TryGetValue(s.Id, out var open))
            {
                sessionId = open.Id;
                var maxStay = s.MaxStayMinutes ?? lot.DefaultMaxStayMinutes;
                if (maxStay is int cap)
                {
                    var allowedEnd = open.CheckInUtc.AddMinutes(cap + lot.GracePeriodMinutes);
                    if (now > allowedEnd)
                    {
                        state = "Overstay";
                        isOverstay = true;
                        counts.Overstay++;
                    }
                    else
                    {
                        state = "Occupied";
                        counts.Occupied++;
                    }
                }
                else
                {
                    state = "Occupied";
                    counts.Occupied++;
                }
            }
            else if (resBySpace.TryGetValue(s.Id, out var end))
            {
                state = "Reserved";
                resEnd = end;
                counts.Reserved++;
            }
            else
            {
                state = "Available";
                counts.Available++;
            }

            cells.Add(new LiveSpaceCellDto
            {
                Id = s.Id,
                SpaceNumber = s.SpaceNumber,
                SlotCategory = s.SlotCategory,
                MapRow = s.MapRow,
                MapColumn = s.MapColumn,
                Zone = s.Zone,
                DisplayState = state,
                ActiveSessionId = sessionId,
                ReservationEndsUtc = resEnd,
                IsOverstay = isOverstay,
                Floor = s.Floor,
                CustomLabel = s.CustomLabel,
            });
        }

        return new LiveMapDto
        {
            ParkingLotId = lot.Id,
            LotName = lot.Name,
            AvailableCount = counts.Available,
            OccupiedCount = counts.Occupied,
            ReservedCount = counts.Reserved,
            MaintenanceCount = counts.Maintenance,
            OverstayCount = counts.Overstay,
            Spaces = cells
        };
    }
}
