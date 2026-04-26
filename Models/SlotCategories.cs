namespace ParkingManagementSystem.Models;

/// <summary>Slot type labels stored in <see cref="ParkingSpace.SlotCategory"/>.</summary>
public static class SlotCategories
{
    public const string Standard = "Standard";
    public const string Vip = "Vip";
    public const string Disabled = "Disabled";
    public const string EvCharging = "EvCharging";

    public static readonly string[] All = { Standard, Vip, Disabled, EvCharging };
}
