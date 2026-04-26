using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ParkingManagementSystem.Data;
using ParkingManagementSystem.Models;
using ParkingManagementSystem.Options;
using ParkingManagementSystem.Services;

namespace ParkingManagementSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly JwtOptions _jwtOptions;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext db,
        IJwtTokenService jwt,
        IOptions<JwtOptions> jwtOptions)
    {
        _userManager = userManager;
        _db = db;
        _jwt = jwt;
        _jwtOptions = jwtOptions.Value;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
            return Conflict(new { error = "An account with this email already exists." });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = true
        };

        var create = await _userManager.CreateAsync(user, request.Password);
        if (!create.Succeeded)
            return BadRequest(new { errors = create.Errors.Select(e => e.Description) });

        var orgId = await _db.Organizations.OrderBy(o => o.Id).Select(o => o.Id).FirstAsync(cancellationToken);
        user.OrganizationId = orgId;
        await _userManager.UpdateAsync(user);

        await _userManager.AddToRoleAsync(user, AppRoles.Driver);

        return await IssueTokensAsync(user, cancellationToken, Request.Headers["User-Agent"].ToString());
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return Unauthorized(new { error = "Invalid email or password." });

        if (await _userManager.IsLockedOutAsync(user))
            return Unauthorized(new { error = "Account is locked. Try again later." });

        var valid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!valid)
        {
            await _userManager.AccessFailedAsync(user);
            return Unauthorized(new { error = "Invalid email or password." });
        }

        await _userManager.ResetAccessFailedCountAsync(user);

        var ipLogin = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers["User-Agent"].ToString();
        if (!string.IsNullOrEmpty(user.LastLoginIp) && user.LastLoginIp != ipLogin)
        {
            _db.AppNotifications.Add(new AppNotification
            {
                UserId = user.Id,
                Title = "New sign-in detected",
                Body = $"Your account was used from a different address than last time ({ipLogin}). If this was not you, change your password and use Sign out everywhere.",
                Kind = "security",
                CreatedUtc = DateTime.UtcNow,
            });
        }

        user.LastLoginUtc = DateTime.UtcNow;
        user.LastLoginIp = ipLogin;
        await _userManager.UpdateAsync(user);

        return await IssueTokensAsync(user, cancellationToken, ua);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        var hash = _jwt.HashRefreshToken(request.RefreshToken);
        var existing = await _db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);

        if (existing is null || !existing.IsActive || existing.User is null)
            return Unauthorized(new { error = "Invalid or expired refresh token." });

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var newPlain = _jwt.CreateRefreshTokenPlainText();
            var newHash = _jwt.HashRefreshToken(newPlain);
            var roles = await _userManager.GetRolesAsync(existing.User);

            existing.RevokedUtc = DateTime.UtcNow;
            existing.RevokedIp = ip;
            existing.ReplacedByHash = newHash;

            var newEntity = new RefreshToken
            {
                ApplicationUserId = existing.ApplicationUserId,
                TokenHash = newHash,
                CreatedUtc = DateTime.UtcNow,
                CreatedIp = ip,
                ExpiresUtc = DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenExpirationDays),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                DeviceLabel = Request.Headers["X-Device-Label"].ToString(),
            };

            _db.RefreshTokens.Add(newEntity);
            await _db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            var permClaims = await BuildPermissionClaimsAsync(roles, cancellationToken);
            var access = _jwt.CreateAccessToken(existing.User, roles, permClaims);
            var accessExpires = DateTime.UtcNow.AddMinutes(_jwtOptions.AccessTokenExpirationMinutes);

            return new AuthResponse
            {
                AccessToken = access,
                RefreshToken = newPlain,
                AccessTokenExpiresUtc = accessExpires
            };
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout([FromBody] RevokeRequest request, CancellationToken cancellationToken)
    {
        var hash = _jwt.HashRefreshToken(request.RefreshToken);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
        if (token is null || !token.IsActive)
            return Ok();

        token.RevokedUtc = DateTime.UtcNow;
        token.RevokedIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is not null)
        {
            await _userManager.GeneratePasswordResetTokenAsync(user);
            // Production: send email with reset link containing token. Kept server-side only here.
        }

        return Ok(new
        {
            message = "If an account exists for this email, password reset instructions will be sent shortly."
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserProfileResponse>> Me(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        return new UserProfileResponse
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Roles = roles
        };
    }

    [HttpPost("logout-all")]
    [Authorize]
    public async Task<IActionResult> LogoutAll(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var now = DateTime.UtcNow;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        await _db.RefreshTokens
            .Where(t => t.ApplicationUserId == userId && t.RevokedUtc == null && now < t.ExpiresUtc)
            .ExecuteUpdateAsync(
                s => s.SetProperty(t => t.RevokedUtc, now).SetProperty(t => t.RevokedIp, ip),
                cancellationToken);

        return NoContent();
    }

    private async Task<List<Claim>> BuildPermissionClaimsAsync(IList<string> roles, CancellationToken cancellationToken)
    {
        var perms = await _db.RolePermissions
            .AsNoTracking()
            .Where(rp => roles.Contains(rp.RoleName))
            .Select(rp => rp.Permission)
            .Distinct()
            .ToListAsync(cancellationToken);
        return perms.Select(p => new Claim("permission", p)).ToList();
    }

    private async Task<AuthResponse> IssueTokensAsync(ApplicationUser user, CancellationToken cancellationToken, string? userAgent = null)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var permClaims = await BuildPermissionClaimsAsync(roles, cancellationToken);
        var access = _jwt.CreateAccessToken(user, roles, permClaims);
        var plainRefresh = _jwt.CreateRefreshTokenPlainText();
        var refreshHash = _jwt.HashRefreshToken(plainRefresh);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        _db.RefreshTokens.Add(new RefreshToken
        {
            ApplicationUserId = user.Id,
            TokenHash = refreshHash,
            CreatedUtc = DateTime.UtcNow,
            CreatedIp = ip,
            ExpiresUtc = DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenExpirationDays),
            UserAgent = userAgent,
            DeviceLabel = Request.Headers["X-Device-Label"].ToString(),
        });

        await _db.SaveChangesAsync(cancellationToken);

        return new AuthResponse
        {
            AccessToken = access,
            RefreshToken = plainRefresh,
            AccessTokenExpiresUtc = DateTime.UtcNow.AddMinutes(_jwtOptions.AccessTokenExpirationMinutes)
        };
    }
}
