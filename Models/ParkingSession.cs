using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models;

public class ParkingSession
{
    public int Id { get; set; }

    public int ParkingSpaceId { get; set; }

    public ParkingSpace? ParkingSpace { get; set; }

    public string? ApplicationUserId { get; set; }

    public ApplicationUser? User { get; set; }

    public int? ReservationId { get; set; }

    public Reservation? Reservation { get; set; }

    [Required]
    public string LicensePlate { get; set; } = string.Empty;

    /// <summary>Unique ticket id for QR / exit kiosk (set at check-in).</summary>
    [Required]
    [MaxLength(48)]
    public string TicketCode { get; set; } = string.Empty;

    public bool IsVisitor { get; set; }

    public DateTime CheckInUtc { get; set; } = DateTime.UtcNow;

    public DateTime? CheckOutUtc { get; set; }

    public decimal? TotalDue { get; set; }

    public string? Notes { get; set; }

    /// <summary>Operational incident classification (lost ticket, dispute, overstay flag).</summary>
    public SessionIncidentKind IncidentKind { get; set; } = SessionIncidentKind.None;

    public DateTime? IncidentUpdatedUtc { get; set; }

    public DateTime? OverstayFlaggedUtc { get; set; }
}

public enum SessionIncidentKind
{
    None = 0,
    LostTicket = 1,
    Dispute = 2,
    Overstay = 3,
}
