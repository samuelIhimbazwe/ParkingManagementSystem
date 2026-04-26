using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models;

public class RefreshToken
{
    public int Id { get; set; }

    public string ApplicationUserId { get; set; } = string.Empty;

    public ApplicationUser? User { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresUtc { get; set; }

    public DateTime CreatedUtc { get; set; }

    public string? CreatedIp { get; set; }

    public DateTime? RevokedUtc { get; set; }

    public string? RevokedIp { get; set; }

    public string? ReplacedByHash { get; set; }

    [MaxLength(512)]
    public string? UserAgent { get; set; }

    [MaxLength(128)]
    public string? DeviceLabel { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresUtc;

    public bool IsRevoked => RevokedUtc.HasValue;

    public bool IsActive => !IsRevoked && !IsExpired;
}
