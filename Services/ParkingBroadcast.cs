using Microsoft.AspNetCore.SignalR;
using ParkingManagementSystem.Hubs;

namespace ParkingManagementSystem.Services;

public class ParkingBroadcast(IHubContext<ParkingEventsHub> hubContext) : IParkingBroadcast
{
    public Task NotifySlotsChangedAsync(CancellationToken cancellationToken = default) =>
        hubContext.Clients.All.SendAsync("slotsUpdated", cancellationToken: cancellationToken);
}
