using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Data;
using ParkingManagementSystem.Models;

namespace ParkingManagementSystem.Controllers;

[Authorize(Policy = AppPermissions.Policies.AuditRead)]
[ApiController]
[Route("api/[controller]")]
public class AuditLogsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public AuditLogsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditLog>>> List(
        CancellationToken cancellationToken,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100)
    {
        take = Math.Clamp(take, 1, 500);
        skip = Math.Max(0, skip);

        return await _db.AuditLogs
            .AsNoTracking()
            .OrderByDescending(a => a.CreatedUtc)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);
    }
}
