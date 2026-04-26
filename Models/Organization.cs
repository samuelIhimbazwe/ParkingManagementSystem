using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models;

public class Organization
{
    public int Id { get; set; }

    [Required]
    [MaxLength(128)]
    public string Name { get; set; } = string.Empty;

    public ICollection<ParkingLot> ParkingLots { get; set; } = new List<ParkingLot>();

    public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
}
