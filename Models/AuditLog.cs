using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models;

public class AuditLog
{
    public long Id { get; set; }

    [MaxLength(450)]
    public string? ActorUserId { get; set; }

    [Required]
    [MaxLength(128)]
    public string Action { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string EntityType { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string EntityKey { get; set; } = string.Empty;

    public string? BeforeJson { get; set; }

    public string? AfterJson { get; set; }

    public DateTime CreatedUtc { get; set; }

    [MaxLength(64)]
    public string? IpAddress { get; set; }
}
