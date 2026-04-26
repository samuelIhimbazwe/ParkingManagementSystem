using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Data;

namespace ParkingManagementSystem.Services;

public class WebhookPublisher(ApplicationDbContext db, IHttpClientFactory httpClientFactory) : IWebhookPublisher
{
    public async Task PublishAsync(string eventId, object payload, int? organizationId = null, CancellationToken cancellationToken = default)
    {
        var q = db.WebhookSubscriptions.AsNoTracking().Where(w => w.IsActive);
        if (organizationId is int oid)
            q = q.Where(w => w.OrganizationId == oid);

        var subs = await q.ToListAsync(cancellationToken);
        if (subs.Count == 0)
            return;

        var json = JsonSerializer.Serialize(new { @event = eventId, payload, utc = DateTime.UtcNow });
        var bodyBytes = Encoding.UTF8.GetBytes(json);

        foreach (var s in subs)
        {
            var parts = s.SubscribedEvents.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (parts.Length > 0 && !parts.Contains(eventId, StringComparer.OrdinalIgnoreCase))
                continue;

            try
            {
                var client = httpClientFactory.CreateClient(nameof(WebhookPublisher));
                using var req = new HttpRequestMessage(HttpMethod.Post, s.TargetUrl);
                req.Content = new ByteArrayContent(bodyBytes);
                req.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                if (!string.IsNullOrEmpty(s.Secret))
                {
                    using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(s.Secret));
                    var sig = Convert.ToHexString(hmac.ComputeHash(bodyBytes));
                    req.Headers.TryAddWithoutValidation("X-ParkFlow-Signature", sig);
                }

                await client.SendAsync(req, cancellationToken);
            }
            catch
            {
                /* webhook delivery best-effort */
            }
        }
    }
}
