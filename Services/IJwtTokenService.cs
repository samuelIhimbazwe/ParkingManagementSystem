using System.Security.Claims;
using ParkingManagementSystem.Models;

namespace ParkingManagementSystem.Services;

public interface IJwtTokenService
{
    string CreateAccessToken(ApplicationUser user, IList<string> roles, IEnumerable<Claim>? extraClaims = null);

    string CreateRefreshTokenPlainText();

    string HashRefreshToken(string plainText);
}
