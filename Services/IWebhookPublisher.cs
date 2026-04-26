namespace ParkingManagementSystem.Services;

public interface IWebhookPublisher
{
    /// <param name="organizationId">When set, only subscriptions for that organization receive the event.</param>
    Task PublishAsync(string eventId, object payload, int? organizationId = null, CancellationToken cancellationToken = default);
}
