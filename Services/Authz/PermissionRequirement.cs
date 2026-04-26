using Microsoft.AspNetCore.Authorization;

namespace ParkingManagementSystem.Services.Authz;

public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission) => Permission = permission;
}
