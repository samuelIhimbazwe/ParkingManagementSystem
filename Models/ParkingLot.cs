using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models;

public class ParkingLot
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public Organization? Organization { get; set; }

    [Required]
    [MaxLength(128)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(32)]
    public string Code { get; set; } = "MAIN";

    [MaxLength(256)]
    public string? Address { get; set; }

    /// <summary>Grace after reservation / max stay before flagging overstay (minutes).</summary>
    public int GracePeriodMinutes { get; set; } = 10;

    /// <summary>Default max stay for spaces without their own MaxStayMinutes (null = no default cap).</summary>
    public int? DefaultMaxStayMinutes { get; set; }

    /// <summary>Optional JSON for operating hours (per integration); not enforced in MVP logic.</summary>
    public string? OperatingHoursJson { get; set; }

    /// <summary>Default hourly parking fee for this site (Rwandan francs). Applied to all spaces when updated via site pricing.</summary>
    public decimal DefaultHourlyRateRwf { get; set; } = 1000m;

    public ICollection<ParkingSpace> Spaces { get; set; } = new List<ParkingSpace>();
}
