using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models;

public class AppNotification
{
    public int Id { get; set; }

    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    [MaxLength(64)]
    public string Kind { get; set; } = "info";

    public DateTime CreatedUtc { get; set; }

    public DateTime? ReadUtc { get; set; }
}
