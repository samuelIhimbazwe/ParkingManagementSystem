using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Data;
using ParkingManagementSystem.Models;

namespace ParkingManagementSystem.Controllers;

[Authorize(Policy = AppPermissions.Policies.WebhooksManage)]
[ApiController]
[Route("api/admin/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public WebhooksController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WebhookSubscription>>> List(CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        return await _db.WebhookSubscriptions
            .AsNoTracking()
            .Where(w => w.OrganizationId == orgId)
            .OrderBy(w => w.Id)
            .ToListAsync(cancellationToken);
    }

    [HttpPost]
    public async Task<ActionResult<WebhookSubscription>> Create([FromBody] CreateWebhookSubscriptionDto dto, CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var row = new WebhookSubscription
        {
            OrganizationId = orgId,
            TargetUrl = dto.TargetUrl.Trim(),
            Secret = dto.Secret?.Trim() ?? string.Empty,
            SubscribedEvents = dto.SubscribedEvents?.Trim() ?? string.Empty,
            IsActive = true,
        };
        _db.WebhookSubscriptions.Add(row);
        await _db.SaveChangesAsync(cancellationToken);
        return row;
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Patch(int id, [FromBody] PatchWebhookSubscriptionDto dto, CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var row = await _db.WebhookSubscriptions.FirstOrDefaultAsync(w => w.Id == id && w.OrganizationId == orgId, cancellationToken);
        if (row is null)
            return NotFound();

        if (dto.IsActive is bool active)
            row.IsActive = active;
        if (dto.SubscribedEvents is not null)
            row.SubscribedEvents = dto.SubscribedEvents.Trim();

        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var row = await _db.WebhookSubscriptions.FirstOrDefaultAsync(w => w.Id == id && w.OrganizationId == orgId, cancellationToken);
        if (row is null)
            return NotFound();

        _db.WebhookSubscriptions.Remove(row);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<int> ResolveOrganizationIdAsync(CancellationToken cancellationToken)
    {
        var claim = User.FindFirstValue("organization_id");
        if (int.TryParse(claim, out var id))
            return id;

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            var fromUser = await _db.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.OrganizationId)
                .FirstOrDefaultAsync(cancellationToken);
            if (fromUser is int oid)
                return oid;
        }

        return await _db.Organizations.OrderBy(o => o.Id).Select(o => o.Id).FirstAsync(cancellationToken);
    }
}
