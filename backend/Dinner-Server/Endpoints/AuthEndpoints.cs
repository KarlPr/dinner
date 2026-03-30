using Dinner_Server.Data;
using Dinner_Server.Dtos;
using Dinner_Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Dinner_Server.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (RegisterRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 100)
                return Results.BadRequest(new { error = "Name is required and must be 1-100 characters." });
            if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 6)
                return Results.BadRequest(new { error = "Password must be at least 6 characters." });
            if (await db.Users.AnyAsync(u => u.Name == req.Name))
                return Results.Conflict(new { error = "A user with this name already exists." });

            var user = new User
            {
                Name = req.Name.Trim(),
                Email = req.Email?.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Results.Created($"/api/users/{user.Id}", new UserResponse(user.Id, user.Name, user.Email));
        });

        group.MapPost("/login", async (LoginRequest req, AppDbContext db, HttpContext http) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Name == req.Name);
            if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Results.Unauthorized();

            var cookieConfig = http.RequestServices.GetRequiredService<IConfiguration>();
            var sameSite = cookieConfig.GetValue("Cookie:SameSite", "Lax") switch
            {
                "None" => SameSiteMode.None,
                "Strict" => SameSiteMode.Strict,
                _ => SameSiteMode.Lax
            };
            var secure = cookieConfig.GetValue("Cookie:Secure", false);

            http.Response.Cookies.Append("user_id", user.Id.ToString(), new CookieOptions
            {
                HttpOnly = true,
                SameSite = sameSite,
                Secure = secure,
                MaxAge = TimeSpan.FromDays(30)
            });

            return Results.Ok(new UserResponse(user.Id, user.Name, user.Email));
        });

        group.MapGet("/me", async (HttpContext http, AppDbContext db) =>
        {
            if (!http.Request.Cookies.TryGetValue("user_id", out var userIdStr)
                || !int.TryParse(userIdStr, out var userId))
                return Results.Unauthorized();

            var user = await db.Users.FindAsync(userId);
            if (user is null)
                return Results.Unauthorized();

            return Results.Ok(new UserResponse(user.Id, user.Name, user.Email));
        });

        group.MapPost("/logout", (HttpContext http) =>
        {
            http.Response.Cookies.Delete("user_id");
            return Results.NoContent();
        });
    }
}
