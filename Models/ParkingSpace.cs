using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models
{
    public class ParkingSpace
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Space Number")]
        public string SpaceNumber { get; set; } = string.Empty;

        [Required]
        public string Status { get; set; } = "Available"; // Available or Occupied

        public string Location { get; set; } = string.Empty;

        public string Zone { get; set; } = "General";

        public decimal HourlyRate { get; set; } = 1000m;

        public int? MaxStayMinutes { get; set; }

        public int ParkingLotId { get; set; }

        public ParkingLot? ParkingLot { get; set; }

        /// <summary>Optional assigned manager account that can operate this space.</summary>
        public string? ManagerUserId { get; set; }

        public ApplicationUser? ManagerUser { get; set; }

        /// <summary>One of <see cref="SlotCategories"/>.</summary>
        public string SlotCategory { get; set; } = SlotCategories.Standard;

        public int? MapRow { get; set; }

        public int? MapColumn { get; set; }

        public bool IsUnderMaintenance { get; set; }

        /// <summary>Deck / level for multi-floor maps (null = ground).</summary>
        public int? Floor { get; set; }

        [MaxLength(128)]
        public string? CustomLabel { get; set; }

        public ICollection<ParkingSession> Sessions { get; set; } = new List<ParkingSession>();

        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}
