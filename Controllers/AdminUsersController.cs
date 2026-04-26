using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Models;

namespace ParkingManagementSystem.Controllers;

[Authorize(Roles = AppRoles.Admin)]
[ApiController]
[Route("api/admin/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UsersController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListItemDto>>> List(CancellationToken cancellationToken)
    {
        var users = await _userManager.Users
            .AsNoTracking()
            .OrderBy(u => u.Email)
            .ToListAsync(cancellationToken);

        var list = new List<UserListItemDto>();
        foreach (var u in users)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var roles = await _userManager.GetRolesAsync(u);
            list.Add(new UserListItemDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                LockoutEnabled = u.LockoutEnabled,
                LockoutEnd = u.LockoutEnd,
                Roles = roles
            });
        }

        return list;
    }

    public class SetActiveDto
    {
        public bool Active { get; set; }
    }

    /// <summary>Deactivate = lock account indefinitely; activate = clear lockout.</summary>
    [HttpPost("{id}/active")]
    public async Task<IActionResult> SetActive(string id, [FromBody] SetActiveDto dto, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound();

        if (dto.Active)
        {
            await _userManager.SetLockoutEndDateAsync(user, null);
        }
        else
        {
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
        }

        await _userManager.UpdateAsync(user);
        return NoContent();
    }
}
