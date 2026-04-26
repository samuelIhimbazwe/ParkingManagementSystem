using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Data;
using ParkingManagementSystem.Models;
using System.Security.Claims;

namespace ParkingManagementSystem.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ParkingSpacesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public ParkingSpacesController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ParkingSpace>>> GetParkingSpaces(
            [FromQuery] int? parkingLotId,
            CancellationToken cancellationToken)
        {
            var q = _context.ParkingSpaces.AsNoTracking().AsQueryable();
            var actorUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isManagerOnly = User.IsInRole(AppRoles.ParkingManager) && !User.IsInRole(AppRoles.Admin) && !User.IsInRole(AppRoles.Attendant);
            if (isManagerOnly)
                q = q.Where(s => s.ManagerUserId == actorUserId);
            if (parkingLotId is int lid)
                q = q.Where(s => s.ParkingLotId == lid);
            return await q.OrderBy(s => s.Zone).ThenBy(s => s.SpaceNumber).ToListAsync(cancellationToken);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ParkingSpace>> GetParkingSpace(int id, CancellationToken cancellationToken)
        {
            var parkingSpace = await _context.ParkingSpaces.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

            if (parkingSpace is null)
            {
                return NotFound();
            }
            var actorUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isManagerOnly = User.IsInRole(AppRoles.ParkingManager) && !User.IsInRole(AppRoles.Admin) && !User.IsInRole(AppRoles.Attendant);
            if (isManagerOnly && parkingSpace.ManagerUserId != actorUserId)
                return Forbid();

            return parkingSpace;
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ParkingManager}")]
        public async Task<IActionResult> PutParkingSpace(int id, ParkingSpace parkingSpace, CancellationToken cancellationToken)
        {
            if (id != parkingSpace.Id)
            {
                return BadRequest();
            }

            var entity = await _context.ParkingSpaces.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
            if (entity is null)
            {
                return NotFound();
            }
            var actorUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isManagerOnly = User.IsInRole(AppRoles.ParkingManager) && !User.IsInRole(AppRoles.Admin) && !User.IsInRole(AppRoles.Attendant);
            if (isManagerOnly && entity.ManagerUserId != actorUserId)
                return Forbid();

            entity.SpaceNumber = parkingSpace.SpaceNumber;
            entity.Location = parkingSpace.Location;
            entity.Status = parkingSpace.Status;
            entity.Zone = parkingSpace.Zone;
            entity.HourlyRate = parkingSpace.HourlyRate;
            entity.MaxStayMinutes = parkingSpace.MaxStayMinutes;
            entity.ParkingLotId = parkingSpace.ParkingLotId;
            entity.SlotCategory = string.IsNullOrWhiteSpace(parkingSpace.SlotCategory) ? SlotCategories.Standard : parkingSpace.SlotCategory;
            entity.MapRow = parkingSpace.MapRow;
            entity.MapColumn = parkingSpace.MapColumn;
            entity.IsUnderMaintenance = parkingSpace.IsUnderMaintenance;

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await ParkingSpaceExistsAsync(id, cancellationToken))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpPost]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<ActionResult<object>> PostParkingSpace([FromBody] CreateParkingSpaceDto dto, CancellationToken cancellationToken)
        {
            var parkingSpace = new ParkingSpace
            {
                SpaceNumber = dto.SpaceNumber,
                Status = dto.Status,
                Location = dto.Location,
                Zone = dto.Zone,
                HourlyRate = dto.HourlyRate,
                MaxStayMinutes = dto.MaxStayMinutes,
                ParkingLotId = dto.ParkingLotId,
                SlotCategory = dto.SlotCategory,
                MapRow = dto.MapRow,
                MapColumn = dto.MapColumn,
                IsUnderMaintenance = dto.IsUnderMaintenance,
                Floor = dto.Floor,
                CustomLabel = dto.CustomLabel,
            };
            parkingSpace.Status = string.IsNullOrWhiteSpace(parkingSpace.Status) ? "Available" : parkingSpace.Status;
            if (parkingSpace.ParkingLotId == 0)
            {
                var firstLot = await _context.ParkingLots.OrderBy(l => l.Id).Select(l => l.Id).FirstOrDefaultAsync(cancellationToken);
                if (firstLot == 0)
                    return BadRequest(new { error = "Create a parking lot first (bootstrap should add MAIN)." });
                parkingSpace.ParkingLotId = firstLot;
            }

            if (string.IsNullOrWhiteSpace(parkingSpace.SlotCategory))
                parkingSpace.SlotCategory = SlotCategories.Standard;

            var lotForRate = await _context.ParkingLots.FirstOrDefaultAsync(l => l.Id == parkingSpace.ParkingLotId, cancellationToken);
            if (lotForRate is not null && parkingSpace.HourlyRate <= 0)
                parkingSpace.HourlyRate = lotForRate.DefaultHourlyRateRwf;

            string? managerInitialPassword = null;
            if (dto.ManagerAccount is not null && !string.IsNullOrWhiteSpace(dto.ManagerAccount.Email))
            {
                var email = dto.ManagerAccount.Email.Trim();
                var existing = await _userManager.FindByEmailAsync(email);
                if (existing is null)
                {
                    var user = new ApplicationUser
                    {
                        UserName = email,
                        Email = email,
                        FullName = string.IsNullOrWhiteSpace(dto.ManagerAccount.FullName) ? "Parking Manager" : dto.ManagerAccount.FullName.Trim(),
                        EmailConfirmed = true,
                        OrganizationId = lotForRate?.OrganizationId,
                    };
                    var create = await _userManager.CreateAsync(user, dto.ManagerAccount.Password);
                    if (!create.Succeeded)
                        return BadRequest(new { error = string.Join("; ", create.Errors.Select(e => e.Description)) });
                    await _userManager.AddToRoleAsync(user, AppRoles.ParkingManager);
                    parkingSpace.ManagerUserId = user.Id;
                    managerInitialPassword = dto.ManagerAccount.Password;
                }
                else
                {
                    if (!await _userManager.IsInRoleAsync(existing, AppRoles.ParkingManager))
                        await _userManager.AddToRoleAsync(existing, AppRoles.ParkingManager);
                    parkingSpace.ManagerUserId = existing.Id;
                }
            }

            _context.ParkingSpaces.Add(parkingSpace);
            await _context.SaveChangesAsync(cancellationToken);

            return CreatedAtAction(nameof(GetParkingSpace), new { id = parkingSpace.Id }, new
            {
                space = parkingSpace,
                managerCredentials = dto.ManagerAccount is null ? null : new
                {
                    email = dto.ManagerAccount.Email,
                    initialPassword = managerInitialPassword,
                }
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<IActionResult> DeleteParkingSpace(int id, CancellationToken cancellationToken)
        {
            var parkingSpace = await _context.ParkingSpaces.FindAsync(new object[] { id }, cancellationToken);
            if (parkingSpace is null)
            {
                return NotFound();
            }

            var hasOpenSession = await _context.ParkingSessions.AnyAsync(
                s => s.ParkingSpaceId == id && s.CheckOutUtc == null,
                cancellationToken);
            if (hasOpenSession)
            {
                return Conflict(new { error = "Cannot delete a space with an active parking session." });
            }

            _context.ParkingSpaces.Remove(parkingSpace);
            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        private Task<bool> ParkingSpaceExistsAsync(int id, CancellationToken cancellationToken)
        {
            return _context.ParkingSpaces.AnyAsync(e => e.Id == id, cancellationToken);
        }
    }
}
