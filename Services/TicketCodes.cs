using System.Security.Cryptography;

namespace ParkingManagementSystem.Services;

public static class TicketCodes
{
    public static string New()
    {
        Span<byte> buf = stackalloc byte[16];
        RandomNumberGenerator.Fill(buf);
        return Convert.ToHexString(buf).ToLowerInvariant();
    }
}
