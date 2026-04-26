using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public string Issuer { get; set; } = string.Empty;

    [Required]
    public string Audience { get; set; } = string.Empty;

    /// <summary>HMAC signing key; must be at least 32 bytes for HS256.</summary>
    [Required]
    [MinLength(32)]
    public string Secret { get; set; } = string.Empty;

    [Range(1, 1440)]
    public int AccessTokenExpirationMinutes { get; set; } = 15;

    [Range(1, 365)]
    public int RefreshTokenExpirationDays { get; set; } = 14;
}
