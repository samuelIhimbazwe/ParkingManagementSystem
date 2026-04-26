using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;

namespace ParkingManagementSystem.Hubs;

[DisableRateLimiting]
public class ParkingEventsHub : Hub
{
}
