namespace ParkingManagementSystem.Models;

/// <summary>Fine-grained permissions (JWT claim type: <c>permission</c>, value = constant).</summary>
public static class AppPermissions
{
    public const string SessionsCheckIn = "sessions.checkin";
    public const string SessionsCheckOut = "sessions.checkout";
    public const string SessionsSearch = "sessions.search";
    public const string SessionsUpdateIncident = "sessions.incident";
    public const string SessionsForceCheckout = "sessions.force_checkout";
    public const string SessionsReassign = "sessions.reassign";
    public const string SpacesRead = "spaces.read";
    public const string SpacesWrite = "spaces.write";
    public const string SpacesDelete = "spaces.delete";
    public const string LotsManage = "lots.manage";
    public const string UsersManage = "users.manage";
    public const string ReservationsViewAll = "reservations.view_all";
    public const string WaitlistUse = "waitlist.use";
    public const string AuditRead = "audit.read";
    public const string WebhooksManage = "webhooks.manage";
    public const string ReportsExport = "reports.export";

    public static readonly string[] All =
    {
        SessionsCheckIn, SessionsCheckOut, SessionsSearch, SessionsUpdateIncident,
        SessionsForceCheckout, SessionsReassign,
        SpacesRead, SpacesWrite, SpacesDelete,
        LotsManage, UsersManage, ReservationsViewAll, WaitlistUse,
        AuditRead, WebhooksManage, ReportsExport,
    };

    public static string Policy(string permission) => $"perm:{permission}";

    /// <summary>Authorization policy names (for <c>[Authorize(Policy = ...)]</c> attributes).</summary>
    public static class Policies
    {
        public const string SessionsCheckIn = "perm:sessions.checkin";
        public const string SessionsCheckOut = "perm:sessions.checkout";
        public const string SessionsSearch = "perm:sessions.search";
        public const string SessionsUpdateIncident = "perm:sessions.incident";
        public const string SessionsForceCheckout = "perm:sessions.force_checkout";
        public const string SessionsReassign = "perm:sessions.reassign";
        public const string SpacesRead = "perm:spaces.read";
        public const string SpacesWrite = "perm:spaces.write";
        public const string SpacesDelete = "perm:spaces.delete";
        public const string LotsManage = "perm:lots.manage";
        public const string UsersManage = "perm:users.manage";
        public const string ReservationsViewAll = "perm:reservations.view_all";
        public const string WaitlistUse = "perm:waitlist.use";
        public const string AuditRead = "perm:audit.read";
        public const string WebhooksManage = "perm:webhooks.manage";
        public const string ReportsExport = "perm:reports.export";
    }
}
