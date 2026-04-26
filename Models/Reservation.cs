using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models;

public class Reservation
{
    public int Id { get; set; }

    [Required]
    public string ApplicationUserId { get; set; } = string.Empty;

    public ApplicationUser? User { get; set; }

    public int ParkingSpaceId { get; set; }

    public ParkingSpace? ParkingSpace { get; set; }

    public DateTime StartUtc { get; set; }

    public DateTime EndUtc { get; set; }

    /// <summary>Pending, Confirmed, Cancelled, Completed, NoShow</summary>
    [Required]
    public string Status { get; set; } = "Pending";

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
}
