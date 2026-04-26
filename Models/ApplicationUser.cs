using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace ParkingManagementSystem.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FullName { get; set; }

        /// <summary>Tenant scope; null = legacy/global until assigned.</summary>
        public int? OrganizationId { get; set; }

        public Organization? Organization { get; set; }

        public DateTime? LastLoginUtc { get; set; }

        [MaxLength(64)]
        public string? LastLoginIp { get; set; }

        public int FailedLoginCountSnapshot { get; set; }

        public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
    }
}
