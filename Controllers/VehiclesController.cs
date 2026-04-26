using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Data;
using ParkingManagementSystem.Models;

namespace ParkingManagementSystem.Controllers;

[Authorize(Roles = AppRoles.DriverRolesCsv)]
[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public VehiclesController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VehicleDto>>> List(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        return await _db.Vehicles
            .AsNoTracking()
            .Where(v => v.ApplicationUserId == userId)
            .OrderBy(v => v.PlateNumber)
            .Select(v => new VehicleDto { Id = v.Id, PlateNumber = v.PlateNumber, Label = v.Label })
            .ToListAsync(cancellationToken);
    }

    [HttpPost]
    public async Task<ActionResult<VehicleDto>> Create([FromBody] CreateVehicleDto dto, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var plate = dto.PlateNumber.Trim().ToUpperInvariant();
        var exists = await _db.Vehicles.AnyAsync(
            v => v.ApplicationUserId == userId && v.PlateNumber == plate,
            cancellationToken);
        if (exists)
            return Conflict(new { error = "That plate is already registered to your account." });

        var v = new Vehicle
        {
            ApplicationUserId = userId,
            PlateNumber = plate,
            Label = dto.Label?.Trim()
        };
        _db.Vehicles.Add(v);
        await _db.SaveChangesAsync(cancellationToken);

        return new VehicleDto { Id = v.Id, PlateNumber = v.PlateNumber, Label = v.Label };
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var v = await _db.Vehicles.FirstOrDefaultAsync(x => x.Id == id && x.ApplicationUserId == userId, cancellationToken);
        if (v is null)
            return NotFound();

        _db.Vehicles.Remove(v);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
