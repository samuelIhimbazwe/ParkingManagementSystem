using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models;

public class Vehicle
{
    public int Id { get; set; }

    [Required]
    [MaxLength(450)]
    public string ApplicationUserId { get; set; } = string.Empty;

    public ApplicationUser? User { get; set; }

    [Required]
    [MaxLength(32)]
    public string PlateNumber { get; set; } = string.Empty;

    [MaxLength(64)]
    public string? Label { get; set; }
}
