using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Options;
using ParkingManagementSystem.Data;
using ParkingManagementSystem.Hubs;
using ParkingManagementSystem.Models;
using ParkingManagementSystem.Options;
using ParkingManagementSystem.Services;
using ParkingManagementSystem.Services.Authz;
using System.Text.Json;


var builder = WebApplication.CreateBuilder(args);

// ✅ PORT FIX FOR RENDER
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://*:{port}");

builder.Services.AddOptions<JwtOptions>()
    .BindConfiguration(JwtOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

// ✅ FIX: Use ENV VARIABLE for Render PostgreSQL
var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION")
    ?? throw new InvalidOperationException("DB_CONNECTION not found");

// ✅ FIX: PostgreSQL (RENDER)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.User.RequireUniqueEmail = true;
    options.Lockout.AllowedForNewUsers = true;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<IParkingBroadcast, ParkingBroadcast>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IWebhookPublisher, WebhookPublisher>();
builder.Services.AddHttpClient(nameof(WebhookPublisher));
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddSignalR();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer();

builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((jwtBearerOptions, jwtAccessor) =>
    {
        var jwt = jwtAccessor.Value;

        jwtBearerOptions.SaveToken = true;
        jwtBearerOptions.RequireHttpsMetadata = !builder.Environment.IsDevelopment();

        jwtBearerOptions.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        jwtBearerOptions.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var path = context.HttpContext.Request.Path;

                if (path.StartsWithSegments("/hubs"))
                {
                    var accessToken = context.Request.Query["access_token"].ToString();
                    if (!string.IsNullOrEmpty(accessToken))
                        context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    foreach (var permission in AppPermissions.All)
    {
        options.AddPolicy(AppPermissions.Policy(permission), policy =>
            policy.Requirements.Add(new PermissionRequirement(permission)));
    }
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 20;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// ✅ CORS FOR FRONTEND
builder.Services.AddCors(policyOptions =>
{
    policyOptions.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// ===================== DB + SEED =====================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var db = services.GetRequiredService<ApplicationDbContext>();

    // ✅ Safe migration for Render
    db.Database.Migrate();

    var cfg = services.GetRequiredService<IConfiguration>();

    var adminEmail = cfg["SeedData:AdminEmail"] ?? "admin@parking.local";
    var adminPassword = cfg["SeedData:AdminPassword"] ?? "Admin@123";
    var managerEmail = cfg["SeedData:ManagerEmail"] ?? "manager@parking.local";
    var managerPassword = cfg["SeedData:ManagerPassword"] ?? "Manager@123";

    await SeedData.InitializeAsync(
        services,
        adminEmail: adminEmail,
        adminPassword: adminPassword,
        managerEmail: managerEmail,
        managerPassword: managerPassword);

    await ParkingLotBootstrap.EnsureAsync(db);
}

// ===================== MIDDLEWARE =====================
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(handler =>
    {
        handler.Run(async context =>
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                error = "An unexpected error occurred."
            });
        });
    });

    app.UseHsts();
    app.UseHttpsRedirection();
}

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

    await next();
});

app.UseRouting();

app.UseCors("AllowFrontend");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ParkingEventsHub>("/hubs/parking");

// Health check
app.MapGet("/", () => Results.Json(new
{
    name = "ParkingManagementSystem",
    status = "running",
    docs = "Use /api/* endpoints"
}));

app.Run();