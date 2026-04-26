using System.Text.RegularExpressions;
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
public class ParkingLotsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ParkingLotsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ParkingLot>>> List(CancellationToken cancellationToken)
    {
        var q = _db.ParkingLots.AsNoTracking().AsQueryable();
        var actorUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isManagerOnly = User.IsInRole(AppRoles.ParkingManager) && !User.IsInRole(AppRoles.Admin) && !User.IsInRole(AppRoles.Attendant);
        if (isManagerOnly)
        {
            q = q.Where(l => _db.ParkingSpaces.Any(s => s.ParkingLotId == l.Id && s.ManagerUserId == actorUserId));
        }
        return await q.OrderBy(l => l.Name).ToListAsync(cancellationToken);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ParkingLot>> Get(int id, CancellationToken cancellationToken)
    {
        var lot = await _db.ParkingLots.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
        if (lot is null)
            return NotFound();
        var actorUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isManagerOnly = User.IsInRole(AppRoles.ParkingManager) && !User.IsInRole(AppRoles.Admin) && !User.IsInRole(AppRoles.Attendant);
        if (isManagerOnly)
        {
            var hasAccess = await _db.ParkingSpaces.AnyAsync(s => s.ParkingLotId == id && s.ManagerUserId == actorUserId, cancellationToken);
            if (!hasAccess) return Forbid();
        }
        return lot;
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ParkingLot>> Create([FromBody] CreateParkingLotDto dto, CancellationToken cancellationToken)
    {
        var codeResult = await TryNormalizeOrAllocateCodeAsync(dto.Code, dto.Name, null, cancellationToken);
        if (codeResult.Error is { } err)
            return BadRequest(new { error = err });
        if (codeResult.Conflict)
            return Conflict(new { error = "That site code is already in use." });

        var orgId = await ResolveOrganizationIdForCreateAsync(cancellationToken);
        if (orgId is null)
            return BadRequest(new { error = "No organization found. Create an organization first." });

        var lot = new ParkingLot
        {
            Name = dto.Name.Trim(),
            Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim(),
            Code = codeResult.Code!,
            DefaultHourlyRateRwf = Math.Round(dto.DefaultHourlyRateRwf, 2),
            OrganizationId = orgId.Value,
        };
        _db.ParkingLots.Add(lot);
        await _db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = lot.Id }, lot);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateParkingLotDto dto, CancellationToken cancellationToken)
    {
        var lot = await _db.ParkingLots.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
        if (lot is null)
            return NotFound();

        var requestedCode = string.IsNullOrWhiteSpace(dto.Code) ? null : dto.Code;
        var codeResult = await TryNormalizeOrAllocateCodeAsync(requestedCode, dto.Name, lot.Code, cancellationToken, id);
        if (codeResult.Error is { } err)
            return BadRequest(new { error = err });
        if (codeResult.Conflict)
            return Conflict(new { error = "Another site already uses this code." });

        lot.Name = dto.Name.Trim();
        lot.Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim();
        lot.Code = codeResult.Code!;
        var siteRate = Math.Round(dto.DefaultHourlyRateRwf, 2);
        lot.DefaultHourlyRateRwf = siteRate;
        var spaces = await _db.ParkingSpaces.Where(s => s.ParkingLotId == id).ToListAsync(cancellationToken);
        foreach (var s in spaces)
            s.HourlyRate = siteRate;

        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    /// <summary>Sets the site default hourly rate (RWF) and applies it to all spaces in that site.</summary>
    [HttpPatch("{id:int}/default-hourly-rate-rwf")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ParkingManager}")]
    public async Task<IActionResult> PatchDefaultHourlyRateRwf(int id, [FromBody] PatchLotDefaultHourlyRateRwfDto dto, CancellationToken cancellationToken)
    {
        var rate = Math.Round(dto.DefaultHourlyRateRwf, 2);
        if (rate < 0)
            return BadRequest(new { error = "Rate cannot be negative." });

        var lot = await _db.ParkingLots.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
        if (lot is null)
            return NotFound();
        var actorUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isManagerOnly = User.IsInRole(AppRoles.ParkingManager) && !User.IsInRole(AppRoles.Admin) && !User.IsInRole(AppRoles.Attendant);
        if (isManagerOnly)
        {
            var hasAccess = await _db.ParkingSpaces.AnyAsync(s => s.ParkingLotId == id && s.ManagerUserId == actorUserId, cancellationToken);
            if (!hasAccess) return Forbid();
        }

        lot.DefaultHourlyRateRwf = rate;
        var spaces = await _db.ParkingSpaces.Where(s => s.ParkingLotId == id).ToListAsync(cancellationToken);
        foreach (var s in spaces)
            s.HourlyRate = rate;

        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private sealed record CodeOutcome(string? Code, string? Error, bool Conflict);

    private async Task<CodeOutcome> TryNormalizeOrAllocateCodeAsync(
        string? requested,
        string name,
        string? existingCode,
        CancellationToken cancellationToken,
        int? ignoreLotId = null)
    {
        if (!string.IsNullOrWhiteSpace(requested))
        {
            var c = requested.Trim().ToUpperInvariant();
            if (c.Length is < 2 or > 32)
                return new CodeOutcome(null, "Code must be 2–32 characters.", false);
            if (!Regex.IsMatch(c, @"^[A-Z0-9_-]+$"))
                return new CodeOutcome(null, "Code may only contain letters, digits, hyphen, and underscore.", false);
            var taken = await _db.ParkingLots.AnyAsync(
                l => l.Code == c && (!ignoreLotId.HasValue || l.Id != ignoreLotId.Value),
                cancellationToken);
            if (taken)
                return new CodeOutcome(null, null, true);
            return new CodeOutcome(c, null, false);
        }

        if (!string.IsNullOrWhiteSpace(existingCode))
            return new CodeOutcome(existingCode, null, false);

        var baseFromName = Regex.Replace(name.Trim().ToUpperInvariant(), @"[^A-Z0-9]", "");
        if (baseFromName.Length > 20)
            baseFromName = baseFromName[..20];
        if (baseFromName.Length < 2)
            baseFromName = "SITE";

        for (var i = 0; i < 80; i++)
        {
            var suffix = i == 0 ? "" : i.ToString();
            var raw = baseFromName + suffix;
            var candidate = raw.Length <= 32 ? raw : raw[..32];
            if (!await _db.ParkingLots.AnyAsync(l => l.Code == candidate, cancellationToken))
                return new CodeOutcome(candidate, null, false);
        }

        var fallback = ("L" + Guid.NewGuid().ToString("N"))[..9].ToUpperInvariant();
        return new CodeOutcome(fallback, null, false);
    }

    private async Task<int?> ResolveOrganizationIdForCreateAsync(CancellationToken cancellationToken)
    {
        var actorUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrWhiteSpace(actorUserId))
        {
            var actorOrgId = await _db.Users
                .AsNoTracking()
                .Where(u => u.Id == actorUserId)
                .Select(u => u.OrganizationId)
                .FirstOrDefaultAsync(cancellationToken);
            if (actorOrgId is int valid)
                return valid;
        }

        return await _db.Organizations
            .AsNoTracking()
            .OrderBy(o => o.Id)
            .Select(o => (int?)o.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
