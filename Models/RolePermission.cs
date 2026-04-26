using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models;

/// <summary>Maps Identity role names to fine-grained permission strings (also emitted as JWT claims).</summary>
public class RolePermission
{
    public int Id { get; set; }

    [Required]
    [MaxLength(128)]
    public string RoleName { get; set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public string Permission { get; set; } = string.Empty;
}
