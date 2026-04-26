using System.Security.Claims;

namespace ParkingManagementSystem.Models;

public static class AppRoles
{
    public const string Admin = "Admin";

    /// <summary>Staff: check-in/out, assign slots, scan tickets.</summary>
    public const string Attendant = "Attendant";

    /// <summary>Registered parker: book, history, vehicles.</summary>
    public const string Driver = "Driver";

    /// <summary>Legacy name — still honored in authorization until DB is migrated.</summary>
    public const string ParkingManager = "ParkingManager";

    /// <summary>Legacy name — still honored in authorization until DB is migrated.</summary>
    public const string User = "User";

    public static readonly string[] All = { Admin, Attendant, ParkingManager, Driver };

    public const string StaffRolesCsv = $"{Admin},{Attendant},{ParkingManager}";

    public const string DriverRolesCsv = $"{Driver},{User}";

    public static bool IsStaff(ClaimsPrincipal user) =>
        user.IsInRole(Admin) || user.IsInRole(Attendant) || user.IsInRole(ParkingManager);

    public static bool IsDriver(ClaimsPrincipal user) =>
        user.IsInRole(Driver) || user.IsInRole(User);
}
