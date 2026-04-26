using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Models;

namespace ParkingManagementSystem.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(
            IServiceProvider serviceProvider,
            string adminEmail,
            string adminPassword,
            string managerEmail,
            string managerPassword)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var db = serviceProvider.GetRequiredService<ApplicationDbContext>();

            foreach (var roleName in AppRoles.All)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            await EnsureDefaultOrganizationAsync(db);
            await EnsureRolePermissionsAsync(db);

            var orgId = await db.Organizations.OrderBy(o => o.Id).Select(o => o.Id).FirstAsync();

            await EnsureUserInRoleAsync(userManager, db, orgId, adminEmail, adminPassword, "System Administrator", AppRoles.Admin);
            await EnsureUserInRoleAsync(userManager, db, orgId, managerEmail, managerPassword, "Lead attendant", AppRoles.Attendant);

            await AssignDefaultOrganizationToUsersAsync(userManager, db);
        }

        private static async Task EnsureDefaultOrganizationAsync(ApplicationDbContext db)
        {
            if (await db.Organizations.AnyAsync())
                return;
            db.Organizations.Add(new Organization { Name = "Default organization" });
            await db.SaveChangesAsync();
        }

        private static async Task EnsureRolePermissionsAsync(ApplicationDbContext db)
        {
            if (await db.RolePermissions.AnyAsync())
                return;

            void Add(string role, string perm) => db.RolePermissions.Add(new RolePermission { RoleName = role, Permission = perm });

            foreach (var p in AppPermissions.All)
                Add(AppRoles.Admin, p);

            foreach (var p in new[]
                     {
                         AppPermissions.SessionsCheckIn, AppPermissions.SessionsCheckOut, AppPermissions.SessionsSearch,
                         AppPermissions.SessionsUpdateIncident, AppPermissions.SessionsReassign,
                         AppPermissions.SessionsForceCheckout,
                         AppPermissions.SpacesRead, AppPermissions.ReservationsViewAll, AppPermissions.WaitlistUse,
                         AppPermissions.ReportsExport,
                     })
            {
                Add(AppRoles.Attendant, p);
                Add(AppRoles.ParkingManager, p);
            }

            foreach (var p in new[] { AppPermissions.SpacesRead, AppPermissions.WaitlistUse, AppPermissions.ReportsExport })
                Add(AppRoles.Driver, p);

            await db.SaveChangesAsync();
        }

        private static async Task AssignDefaultOrganizationToUsersAsync(UserManager<ApplicationUser> userManager, ApplicationDbContext db)
        {
            var orgId = await db.Organizations.OrderBy(o => o.Id).Select(o => o.Id).FirstAsync();
            foreach (var user in userManager.Users.Where(u => u.OrganizationId == null).ToList())
            {
                user.OrganizationId = orgId;
                await userManager.UpdateAsync(user);
            }
        }

        private static async Task EnsureUserInRoleAsync(
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext db,
            int organizationId,
            string email,
            string password,
            string fullName,
            string role)
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FullName = fullName,
                    EmailConfirmed = true,
                    OrganizationId = organizationId,
                };
                var created = await userManager.CreateAsync(user, password);
                if (created.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, role);
                }
            }
            else
            {
                if (user.OrganizationId is null)
                {
                    user.OrganizationId = organizationId;
                    await userManager.UpdateAsync(user);
                }

                if (!await userManager.IsInRoleAsync(user, role))
                {
                    await userManager.AddToRoleAsync(user, role);
                }
            }
        }
    }
}
