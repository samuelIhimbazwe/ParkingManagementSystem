using Microsoft.EntityFrameworkCore;
using ParkingManagementSystem.Models;

namespace ParkingManagementSystem.Data;

public static class ParkingLotBootstrap
{
    /// <summary>Ensures a MAIN lot exists and spaces have map coordinates for the live map.</summary>
    public static async Task EnsureAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        var orgId = await db.Organizations.OrderBy(o => o.Id).Select(o => o.Id).FirstAsync(cancellationToken);
        var lot = await db.ParkingLots.FirstOrDefaultAsync(l => l.Code == "MAIN", cancellationToken);
        if (lot is null)
        {
            lot = new ParkingLot
            {
                Name = "Main garage",
                Code = "MAIN",
                Address = "Demo location",
                OrganizationId = orgId,
                DefaultHourlyRateRwf = 1000m,
            };
            db.ParkingLots.Add(lot);
            await db.SaveChangesAsync(cancellationToken);
        }
        else if (lot.OrganizationId == 0)
        {
            lot.OrganizationId = orgId;
            await db.SaveChangesAsync(cancellationToken);
        }

        var spaces = await db.ParkingSpaces.OrderBy(s => s.Id).ToListAsync(cancellationToken);
        const int cols = 6;
        for (var i = 0; i < spaces.Count; i++)
        {
            var s = spaces[i];
            if (s.ParkingLotId == 0)
                s.ParkingLotId = lot.Id;
            if (s.MapRow is null || s.MapColumn is null)
            {
                s.MapRow = i / cols;
                s.MapColumn = i % cols;
            }

            if (string.IsNullOrWhiteSpace(s.SlotCategory))
                s.SlotCategory = SlotCategories.Standard;
        }

        if (spaces.Count > 0)
            await db.SaveChangesAsync(cancellationToken);
    }
}
