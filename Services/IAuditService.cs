namespace ParkingManagementSystem.Services;

public interface IAuditService
{
    Task WriteAsync(
        string? actorUserId,
        string action,
        string entityType,
        string entityKey,
        object? before,
        object? after,
        string? ipAddress,
        CancellationToken cancellationToken = default);
}
