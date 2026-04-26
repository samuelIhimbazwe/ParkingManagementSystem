using System.ComponentModel.DataAnnotations;

namespace ParkingManagementSystem.Models;

public class WebhookSubscription
{
    public int Id { get; set; }

    public int OrganizationId { get; set; }

    public Organization? Organization { get; set; }

    [Required]
    [MaxLength(512)]
    public string TargetUrl { get; set; } = string.Empty;

    [MaxLength(128)]
    public string Secret { get; set; } = string.Empty;

    /// <summary>Comma-separated event ids: session.started,session.ended,space.updated</summary>
    [MaxLength(512)]
    public string SubscribedEvents { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
