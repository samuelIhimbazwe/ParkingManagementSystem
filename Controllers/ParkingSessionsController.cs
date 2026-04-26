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
public class ParkingSessionsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IParkingBroadcast _broadcast;
    private readonly IAuditService _audit;
    private readonly IWebhookPublisher _webhooks;

    public ParkingSessionsController(
        ApplicationDbContext db,
        IParkingBroadcast broadcast,
        IAuditService audit,
        IWebhookPublisher webhooks)
    {
        _db = db;
        _broadcast = broadcast;
        _audit = audit;
        _webhooks = webhooks;
    }

    private string? ActorId => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private string? Ip => HttpContext.Connection.RemoteIpAddress?.ToString();
    private bool IsManagerOnly => User.IsInRole(AppRoles.ParkingManager) && !User.IsInRole(AppRoles.Admin) && !User.IsInRole(AppRoles.Attendant);
    private Task<bool> CanManagerAccessSpaceAsync(int spaceId, CancellationToken cancellationToken) =>
        _db.ParkingSpaces.AnyAsync(s => s.Id == spaceId && s.ManagerUserId == ActorId, cancellationToken);

    [HttpGet("active")]
    [Authorize(Policy = AppPermissions.Policies.SessionsSearch)]
    public async Task<ActionResult<IEnumerable<ParkingSession>>> Active(CancellationToken cancellationToken)
    {
        var q = _db.ParkingSessions
            .AsNoTracking()
            .Include(s => s.ParkingSpace)
            .Include(s => s.User)
            .Where(s => s.CheckOutUtc == null)
            .AsQueryable();
        if (IsManagerOnly)
            q = q.Where(s => s.ParkingSpace != null && s.ParkingSpace.ManagerUserId == ActorId);
        return await q.OrderBy(s => s.CheckInUtc).ToListAsync(cancellationToken);
    }

    [HttpGet("search")]
    [Authorize(Policy = AppPermissions.Policies.SessionsSearch)]
    public async Task<ActionResult<IEnumerable<SessionSearchRowDto>>> Search(
        [FromQuery] string? plate,
        [FromQuery] int? parkingLotId,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        CancellationToken cancellationToken)
    {
        var q = _db.ParkingSessions.AsNoTracking()
            .Where(s => s.CheckOutUtc == null)
            .Join(_db.ParkingSpaces.AsNoTracking(), s => s.ParkingSpaceId, sp => sp.Id, (s, sp) => new { s, sp })
            .Join(_db.ParkingLots.AsNoTracking(), x => x.sp.ParkingLotId, l => l.Id, (x, l) => new { x.s, x.sp, l });

        if (parkingLotId is int lid)
            q = q.Where(x => x.l.Id == lid);
        if (IsManagerOnly)
            q = q.Where(x => x.sp.ManagerUserId == ActorId);
        if (!string.IsNullOrWhiteSpace(plate))
        {
            var p = plate.Trim();
            q = q.Where(x => x.s.LicensePlate.Contains(p));
        }

        if (fromUtc is DateTime f)
            q = q.Where(x => x.s.CheckInUtc >= f);
        if (toUtc is DateTime t)
            q = q.Where(x => x.s.CheckInUtc <= t);

        var rows = await q
            .OrderBy(x => x.s.CheckInUtc)
            .Take(100)
            .Select(x => new SessionSearchRowDto
            {
                SessionId = x.s.Id,
                ParkingSpaceId = x.sp.Id,
                SpaceNumber = x.sp.SpaceNumber,
                ParkingLotId = x.l.Id,
                LotName = x.l.Name,
                LicensePlate = x.s.LicensePlate,
                TicketCode = x.s.TicketCode,
                CheckInUtc = x.s.CheckInUtc,
                IncidentKind = x.s.IncidentKind,
                Notes = x.s.Notes,
            })
            .ToListAsync(cancellationToken);

        return rows;
    }

    [HttpGet("my")]
    [Authorize(Roles = AppRoles.DriverRolesCsv)]
    public async Task<ActionResult<IEnumerable<ParkingSession>>> MySessions(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        return await _db.ParkingSessions
            .AsNoTracking()
            .Include(s => s.ParkingSpace)
            .Where(s => s.ApplicationUserId == userId)
            .OrderByDescending(s => s.CheckInUtc)
            .Take(50)
            .ToListAsync(cancellationToken);
    }

    [HttpPost("check-in")]
    [Authorize(Policy = AppPermissions.Policies.SessionsCheckIn)]
    public async Task<ActionResult<CheckInResponseDto>> CheckIn([FromBody] CheckInDto dto, CancellationToken cancellationToken)
    {
        if (dto.ParkingSpaceId <= 0)
            return BadRequest(new { error = "Select a valid parking space ID." });

        var space = await _db.ParkingSpaces.FirstOrDefaultAsync(s => s.Id == dto.ParkingSpaceId, cancellationToken);
        if (space is null)
            return NotFound(new { error = "Space not found." });
        if (IsManagerOnly && !await CanManagerAccessSpaceAsync(dto.ParkingSpaceId, cancellationToken))
            return Forbid();

        if (space.IsUnderMaintenance)
            return Conflict(new { error = "Space is under maintenance and cannot be used for check-in." });

        var open = await _db.ParkingSessions.AnyAsync(
            s => s.ParkingSpaceId == dto.ParkingSpaceId && s.CheckOutUtc == null,
            cancellationToken);
        if (open)
            return Conflict(new
            {
                error = "This bay already has an open parking session. Check that vehicle out first, or use a different space ID.",
            });

        if (space.Status != "Available")
            space.Status = "Available";

        Reservation? reservation = null;
        if (dto.ReservationId is int resId)
        {
            reservation = await _db.Reservations.FirstOrDefaultAsync(r => r.Id == resId, cancellationToken);
            if (reservation is null)
                return BadRequest(new { error = "Reservation not found." });
            if (reservation.ParkingSpaceId != dto.ParkingSpaceId)
                return BadRequest(new { error = "Reservation does not match space." });
            if (reservation.Status is "Cancelled" or "Completed")
                return BadRequest(new { error = "Reservation is not active." });
        }

        string? userId = null;
        if (dto.IsVisitor)
            userId = null;
        else if (!string.IsNullOrWhiteSpace(dto.ApplicationUserId))
            userId = dto.ApplicationUserId;
        else if (reservation is not null)
            userId = reservation.ApplicationUserId;

        var now = DateTime.UtcNow;
        var ticket = TicketCodes.New();
        var session = new ParkingSession
        {
            ParkingSpaceId = dto.ParkingSpaceId,
            ApplicationUserId = userId,
            ReservationId = reservation?.Id,
            LicensePlate = dto.LicensePlate.Trim(),
            CheckInUtc = now,
            Notes = null,
            TicketCode = ticket,
            IsVisitor = dto.IsVisitor
        };

        space.Status = "Occupied";
        _db.ParkingSessions.Add(session);
        await _db.SaveChangesAsync(cancellationToken);
        await _broadcast.NotifySlotsChangedAsync(cancellationToken);
        var orgId = await GetOrganizationIdForSpaceAsync(session.ParkingSpaceId, cancellationToken);
        await _webhooks.PublishAsync("session.started", new { session.Id, session.ParkingSpaceId, session.LicensePlate }, orgId, cancellationToken);
        await _audit.WriteAsync(ActorId, "session.check_in", "ParkingSession", session.Id.ToString(), null,
            new { session.ParkingSpaceId, session.LicensePlate, session.TicketCode }, Ip, cancellationToken);

        return new CheckInResponseDto
        {
            SessionId = session.Id,
            TicketCode = ticket,
            QrPayload = ticket,
            CheckInUtc = now,
            ParkingSpaceId = session.ParkingSpaceId,
            LicensePlate = session.LicensePlate,
            IsVisitor = session.IsVisitor
        };
    }

    [HttpPost("check-out-by-ticket")]
    [Authorize(Policy = AppPermissions.Policies.SessionsCheckOut)]
    public async Task<ActionResult<CheckoutPaymentDto>> CheckOutByTicket([FromBody] CheckOutByTicketDto dto, CancellationToken cancellationToken)
    {
        var code = dto.TicketCode.Trim();
        var session = await _db.ParkingSessions
            .Include(s => s.ParkingSpace)
            .FirstOrDefaultAsync(s => s.TicketCode == code && s.CheckOutUtc == null, cancellationToken);

        if (session is null)
            return NotFound(new { error = "No active session for this ticket." });
        if (IsManagerOnly && !await CanManagerAccessSpaceAsync(session.ParkingSpaceId, cancellationToken))
            return Forbid();

        return await CompleteCheckoutAsync(session, cancellationToken);
    }

    [HttpPost("prepare-checkout-by-ticket")]
    [Authorize(Policy = AppPermissions.Policies.SessionsCheckOut)]
    public async Task<ActionResult<CheckoutPaymentDto>> PrepareCheckOutByTicket([FromBody] CheckOutByTicketDto dto, CancellationToken cancellationToken)
    {
        var code = dto.TicketCode.Trim();
        var session = await _db.ParkingSessions
            .Include(s => s.ParkingSpace)
            .FirstOrDefaultAsync(s => s.TicketCode == code && s.CheckOutUtc == null, cancellationToken);
        if (session is null)
            return NotFound(new { error = "No active session for this ticket." });
        if (IsManagerOnly && !await CanManagerAccessSpaceAsync(session.ParkingSpaceId, cancellationToken))
            return Forbid();

        return BuildCheckoutPayment(session, EstimateTotalDueNow(session));
    }

    [HttpPost("{id:int}/check-out")]
    [Authorize(Policy = AppPermissions.Policies.SessionsCheckOut)]
    public async Task<ActionResult<CheckoutPaymentDto>> CheckOut(int id, CancellationToken cancellationToken)
    {
        var session = await _db.ParkingSessions
            .Include(s => s.ParkingSpace)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (session is null)
            return NotFound();
        if (session.CheckOutUtc is not null)
            return Conflict(new { error = "Session already closed." });
        if (IsManagerOnly && !await CanManagerAccessSpaceAsync(session.ParkingSpaceId, cancellationToken))
            return Forbid();

        return await CompleteCheckoutAsync(session, cancellationToken);
    }

    [HttpPost("{id:int}/prepare-checkout")]
    [Authorize(Policy = AppPermissions.Policies.SessionsCheckOut)]
    public async Task<ActionResult<CheckoutPaymentDto>> PrepareCheckout(int id, CancellationToken cancellationToken)
    {
        var session = await _db.ParkingSessions
            .Include(s => s.ParkingSpace)
            .FirstOrDefaultAsync(s => s.Id == id && s.CheckOutUtc == null, cancellationToken);
        if (session is null)
            return NotFound(new { error = "No open session with that id." });
        if (IsManagerOnly && !await CanManagerAccessSpaceAsync(session.ParkingSpaceId, cancellationToken))
            return Forbid();

        return BuildCheckoutPayment(session, EstimateTotalDueNow(session));
    }

    [HttpPost("{id:int}/force-checkout")]
    [Authorize(Policy = AppPermissions.Policies.SessionsForceCheckout)]
    public async Task<ActionResult<CheckoutPaymentDto>> ForceCheckout(int id, CancellationToken cancellationToken)
    {
        var session = await _db.ParkingSessions
            .Include(s => s.ParkingSpace)
            .FirstOrDefaultAsync(s => s.Id == id && s.CheckOutUtc == null, cancellationToken);
        if (session is null)
            return NotFound(new { error = "No open session with that id." });
        if (IsManagerOnly && !await CanManagerAccessSpaceAsync(session.ParkingSpaceId, cancellationToken))
            return Forbid();

        await _audit.WriteAsync(ActorId, "session.force_checkout", "ParkingSession", id.ToString(),
            new { session.LicensePlate, session.ParkingSpaceId }, null, Ip, cancellationToken);
        return await CompleteCheckoutAsync(session, cancellationToken);
    }

    [HttpPost("{id:int}/reassign")]
    [Authorize(Policy = AppPermissions.Policies.SessionsReassign)]
    public async Task<ActionResult> Reassign(int id, [FromBody] ReassignSessionDto dto, CancellationToken cancellationToken)
    {
        var session = await _db.ParkingSessions
            .Include(s => s.ParkingSpace)
            .FirstOrDefaultAsync(s => s.Id == id && s.CheckOutUtc == null, cancellationToken);
        if (session is null)
            return NotFound(new { error = "Open session not found." });
        if (IsManagerOnly && !await CanManagerAccessSpaceAsync(session.ParkingSpaceId, cancellationToken))
            return Forbid();

        var newSpace = await _db.ParkingSpaces.FirstOrDefaultAsync(s => s.Id == dto.NewParkingSpaceId, cancellationToken);
        if (newSpace is null)
            return NotFound(new { error = "Target space not found." });
        if (IsManagerOnly && !await CanManagerAccessSpaceAsync(newSpace.Id, cancellationToken))
            return Forbid();
        if (newSpace.IsUnderMaintenance)
            return Conflict(new { error = "Target space is under maintenance." });
        if (newSpace.ParkingLotId != session.ParkingSpace!.ParkingLotId)
            return BadRequest(new { error = "Reassign must stay within the same parking site." });

        var taken = await _db.ParkingSessions.AnyAsync(s => s.ParkingSpaceId == newSpace.Id && s.CheckOutUtc == null && s.Id != id, cancellationToken);
        if (taken)
            return Conflict(new { error = "Target space already occupied." });

        var oldSpaceId = session.ParkingSpaceId;
        session.ParkingSpace!.Status = "Available";
        newSpace.Status = "Occupied";
        session.ParkingSpaceId = newSpace.Id;

        await _db.SaveChangesAsync(cancellationToken);
        await _broadcast.NotifySlotsChangedAsync(cancellationToken);
        var orgRe = await GetOrganizationIdForSpaceAsync(newSpace.Id, cancellationToken);
        await _webhooks.PublishAsync("session.reassigned", new { session.Id, fromSpaceId = oldSpaceId, toSpaceId = newSpace.Id }, orgRe, cancellationToken);
        await _audit.WriteAsync(ActorId, "session.reassign", "ParkingSession", id.ToString(),
            new { oldSpaceId }, new { newSpaceId = newSpace.Id }, Ip, cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id:int}/incident")]
    [Authorize(Policy = AppPermissions.Policies.SessionsUpdateIncident)]
    public async Task<ActionResult> PatchIncident(int id, [FromBody] PatchSessionIncidentDto dto, CancellationToken cancellationToken)
    {
        var session = await _db.ParkingSessions.FirstOrDefaultAsync(s => s.Id == id && s.CheckOutUtc == null, cancellationToken);
        if (session is null)
            return NotFound();
        if (IsManagerOnly && !await CanManagerAccessSpaceAsync(session.ParkingSpaceId, cancellationToken))
            return Forbid();

        var before = new { session.IncidentKind, session.Notes };
        session.IncidentKind = dto.IncidentKind;
        if (dto.Notes is not null)
            session.Notes = dto.Notes;
        session.IncidentUpdatedUtc = DateTime.UtcNow;
        if (dto.IncidentKind == SessionIncidentKind.Overstay)
            session.OverstayFlaggedUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        await _audit.WriteAsync(ActorId, "session.incident", "ParkingSession", id.ToString(), before,
            new { dto.IncidentKind, dto.Notes }, Ip, cancellationToken);
        return NoContent();
    }

    private const string MomoMerchantCode = "494031";

    private static CheckoutPaymentDto BuildCheckoutPayment(ParkingSession session, decimal totalDue)
    {
        // Mobile money USSD expects integer francs.
        var amount = Math.Max(0, (int)Math.Ceiling(totalDue));
        var ussd = $"*182*8*1*{MomoMerchantCode}*{amount}#";
        var dialerUri = $"tel:{ussd.Replace("#", "%23")}";
        return new CheckoutPaymentDto
        {
            SessionId = session.Id,
            TicketCode = session.TicketCode,
            AmountRwf = amount,
            UssdCode = ussd,
            DialerUri = dialerUri,
            QrPayload = dialerUri
        };
    }

    private static decimal EstimateTotalDueNow(ParkingSession session)
    {
        var hourlyRate = session.ParkingSpace?.HourlyRate ?? 0m;
        var billableHours = Math.Max(1m, (decimal)Math.Ceiling((DateTime.UtcNow - session.CheckInUtc).TotalHours));
        return Math.Round(billableHours * hourlyRate, 2);
    }

    private async Task<ActionResult<CheckoutPaymentDto>> CompleteCheckoutAsync(ParkingSession session, CancellationToken cancellationToken)
    {
        var space = session.ParkingSpace ?? await _db.ParkingSpaces.FirstAsync(s => s.Id == session.ParkingSpaceId, cancellationToken);
        var end = DateTime.UtcNow;
        session.CheckOutUtc = end;

        var billableHours = Math.Max(1m, (decimal)Math.Ceiling((end - session.CheckInUtc).TotalHours));
        session.TotalDue = Math.Round(billableHours * space.HourlyRate, 2);

        space.Status = "Available";

        if (session.ReservationId is int resId)
        {
            var res = await _db.Reservations.FirstOrDefaultAsync(r => r.Id == resId, cancellationToken);
            if (res is not null)
                res.Status = "Completed";
        }

        await _db.SaveChangesAsync(cancellationToken);
        await _broadcast.NotifySlotsChangedAsync(cancellationToken);
        var orgEnd = await GetOrganizationIdForSpaceAsync(session.ParkingSpaceId, cancellationToken);
        await _webhooks.PublishAsync("session.ended", new { session.Id, session.ParkingSpaceId, session.TotalDue }, orgEnd, cancellationToken);
        await _audit.WriteAsync(ActorId, "session.check_out", "ParkingSession", session.Id.ToString(),
            new { session.ParkingSpaceId, session.LicensePlate }, new { session.TotalDue, session.CheckOutUtc }, Ip, cancellationToken);
        return BuildCheckoutPayment(session, session.TotalDue ?? 0m);
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = AppPermissions.Policies.SessionsSearch)]
    public async Task<ActionResult<ParkingSession>> GetById(int id, CancellationToken cancellationToken)
    {
        var session = await _db.ParkingSessions
            .AsNoTracking()
            .Include(s => s.ParkingSpace)
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (session is null)
            return NotFound();
        if (IsManagerOnly && !await CanManagerAccessSpaceAsync(session.ParkingSpaceId, cancellationToken))
            return Forbid();
        return session;
    }

    private Task<int?> GetOrganizationIdForSpaceAsync(int parkingSpaceId, CancellationToken cancellationToken) =>
        (from sp in _db.ParkingSpaces.AsNoTracking()
            join l in _db.ParkingLots.AsNoTracking() on sp.ParkingLotId equals l.Id
            where sp.Id == parkingSpaceId
            select (int?)l.OrganizationId).FirstOrDefaultAsync(cancellationToken);
}
