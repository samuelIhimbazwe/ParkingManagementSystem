namespace ParkingManagementSystem.Services;

public interface IParkingBroadcast
{
    Task NotifySlotsChangedAsync(CancellationToken cancellationToken = default);
}
