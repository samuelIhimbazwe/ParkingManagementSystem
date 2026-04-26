using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models;

public class WaitlistEntry
{
    public int Id { get; set; }

    [Required]
    [MaxLength(450)]
    public string ApplicationUserId { get; set; } = string.Empty;

    public int ParkingLotId { get; set; }

    public ParkingLot? ParkingLot { get; set; }

    public int? ParkingSpaceIdPreferred { get; set; }

    public DateTime RequestedStartUtc { get; set; }

    public DateTime RequestedEndUtc { get; set; }

    [Required]
    [MaxLength(32)]
    public string LicensePlate { get; set; } = string.Empty;

    public DateTime CreatedUtc { get; set; }

    [MaxLength(32)]
    public string Status { get; set; } = "Waiting";
}
