using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Data;
using ParkingManagementSystem.Models;

namespace ParkingManagementSystem.Services;

public class AuditService(ApplicationDbContext db) : IAuditService
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = false,
        ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,
    };

    public async Task WriteAsync(
        string? actorUserId,
        string action,
        string entityType,
        string entityKey,
        object? before,
        object? after,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        var row = new AuditLog
        {
            ActorUserId = actorUserId,
            Action = action,
            EntityType = entityType,
            EntityKey = entityKey,
            BeforeJson = before is null ? null : JsonSerializer.Serialize(before, JsonOpts),
            AfterJson = after is null ? null : JsonSerializer.Serialize(after, JsonOpts),
            CreatedUtc = DateTime.UtcNow,
            IpAddress = ipAddress,
        };
        db.AuditLogs.Add(row);
        await db.SaveChangesAsync(cancellationToken);
    }
}
