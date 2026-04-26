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
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ReportsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("overview")]
    [Authorize(Roles = AppRoles.StaffRolesCsv)]
    public async Task<ActionResult<ReportsOverviewDto>> Overview(CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var total = await _db.ParkingSpaces.CountAsync(cancellationToken);
        var available = await _db.ParkingSpaces.CountAsync(s => s.Status == "Available", cancellationToken);
        var occupied = await _db.ParkingSpaces.CountAsync(s => s.Status == "Occupied", cancellationToken);
        var activeSessions = await _db.ParkingSessions.CountAsync(s => s.CheckOutUtc == null, cancellationToken);
        var reservationsUpcoming = await _db.Reservations.CountAsync(
            r => r.Status != "Cancelled" && r.EndUtc >= DateTime.UtcNow,
            cancellationToken);

        var endedToday = await _db.ParkingSessions
            .Where(s => s.CheckOutUtc >= today && s.CheckOutUtc < tomorrow && s.TotalDue != null)
            .SumAsync(s => s.TotalDue ?? 0m, cancellationToken);

        var activeRows = await (
            from s in _db.ParkingSessions
            join p in _db.ParkingSpaces on s.ParkingSpaceId equals p.Id
            where s.CheckOutUtc == null
            select new { s.CheckInUtc, p.HourlyRate }
        ).ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var activeEstimated = activeRows.Sum(x =>
            x.HourlyRate * (decimal)Math.Max(1, Math.Ceiling((now - x.CheckInUtc).TotalHours)));

        return new ReportsOverviewDto
        {
            TotalSpaces = total,
            AvailableSpaces = available,
            OccupiedSpaces = occupied,
            ActiveSessions = activeSessions,
            ReservationsUpcoming = reservationsUpcoming,
            EstimatedRevenueToday = endedToday + activeEstimated
        };
    }

    [HttpGet("occupancy-by-zone")]
    [Authorize(Roles = AppRoles.StaffRolesCsv)]
    public async Task<ActionResult<IEnumerable<OccupancyByZoneItem>>> OccupancyByZone(CancellationToken cancellationToken)
    {
        var query = await _db.ParkingSpaces
            .GroupBy(s => s.Zone)
            .Select(g => new OccupancyByZoneItem
            {
                Zone = g.Key,
                TotalSpaces = g.Count(),
                OccupiedSpaces = g.Count(s => s.Status == "Occupied")
            })
            .ToListAsync(cancellationToken);

        return Ok(query.OrderByDescending(x => x.OccupiedSpaces).ToList());
    }

    [HttpGet("revenue-series")]
    [Authorize(Roles = AppRoles.StaffRolesCsv)]
    public async Task<ActionResult<IEnumerable<RevenueSeriesPoint>>> RevenueSeries([FromQuery] int days = 14, CancellationToken cancellationToken = default)
    {
        days = Math.Clamp(days, 1, 90);
        var start = DateTime.UtcNow.Date.AddDays(-days + 1);

        var sessions = await _db.ParkingSessions
            .AsNoTracking()
            .Where(s => s.CheckOutUtc != null && s.CheckOutUtc >= start && s.TotalDue != null)
            .Select(s => new { s.CheckOutUtc, s.TotalDue })
            .ToListAsync(cancellationToken);

        var points = sessions
            .GroupBy(s => DateOnly.FromDateTime(s.CheckOutUtc!.Value))
            .Select(g => new RevenueSeriesPoint
            {
                Day = g.Key,
                Revenue = Math.Round(g.Sum(x => x.TotalDue ?? 0m), 2),
                SessionsEnded = g.Count()
            })
            .OrderBy(p => p.Day)
            .ToList();

        return points;
    }

    [HttpGet("my-activity")]
    [Authorize(Roles = AppRoles.DriverRolesCsv)]
    public async Task<ActionResult<MyActivityDto>> MyActivity(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var reservationsTotal = await _db.Reservations.CountAsync(r => r.ApplicationUserId == userId, cancellationToken);
        var activeReservations = await _db.Reservations.CountAsync(
            r => r.ApplicationUserId == userId && r.Status != "Cancelled" && r.Status != "Completed" && r.EndUtc >= DateTime.UtcNow,
            cancellationToken);

        var activeSession = await _db.ParkingSessions
            .Where(s => s.ApplicationUserId == userId && s.CheckOutUtc == null)
            .OrderByDescending(s => s.CheckInUtc)
            .Select(s => new { s.Id })
            .FirstOrDefaultAsync(cancellationToken);

        var lastParked = await (
            from s in _db.ParkingSessions
            join p in _db.ParkingSpaces on s.ParkingSpaceId equals p.Id
            where s.ApplicationUserId == userId && s.CheckOutUtc != null
            orderby s.CheckOutUtc descending
            select new { s.CheckOutUtc, p.SpaceNumber }).FirstOrDefaultAsync(cancellationToken);

        return new MyActivityDto
        {
            ReservationsTotal = reservationsTotal,
            ActiveReservations = activeReservations,
            HasActiveSession = activeSession is not null,
            ActiveSessionId = activeSession?.Id,
            LastParkedSpaceNumber = lastParked?.SpaceNumber,
            LastCheckOutUtc = lastParked?.CheckOutUtc
        };
    }

    /// <summary>CSV of completed sessions in the last N days (UTC checkout).</summary>
    [HttpGet("export/sessions")]
    [Authorize(Policy = AppPermissions.Policies.ReportsExport)]
    public async Task<IActionResult> ExportSessions([FromQuery] int days = 14, CancellationToken cancellationToken = default)
    {
        days = Math.Clamp(days, 1, 90);
        var start = DateTime.UtcNow.Date.AddDays(-days);

        var rows = await (
            from s in _db.ParkingSessions.AsNoTracking()
            join p in _db.ParkingSpaces.AsNoTracking() on s.ParkingSpaceId equals p.Id
            join l in _db.ParkingLots.AsNoTracking() on p.ParkingLotId equals l.Id
            where s.CheckOutUtc != null && s.CheckOutUtc >= start
            orderby s.CheckOutUtc
            select new
            {
                s.Id,
                l.Name,
                p.SpaceNumber,
                s.LicensePlate,
                s.CheckInUtc,
                s.CheckOutUtc,
                s.TotalDue,
                s.IsVisitor,
            }).ToListAsync(cancellationToken);

        await using var sw = new StringWriter();
        await sw.WriteLineAsync("SessionId,LotName,SpaceNumber,LicensePlate,CheckInUtc,CheckOutUtc,TotalDue,IsVisitor");
        foreach (var r in rows)
        {
            await sw.WriteLineAsync(
                $"{r.Id},\"{r.Name.Replace("\"", "\"\"")}\",\"{r.SpaceNumber.Replace("\"", "\"\"")}\",\"{r.LicensePlate.Replace("\"", "\"\"")}\",{r.CheckInUtc:O},{r.CheckOutUtc:O},{r.TotalDue},{r.IsVisitor}");
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(sw.ToString());
        return File(bytes, "text/csv", $"sessions-export-{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}
