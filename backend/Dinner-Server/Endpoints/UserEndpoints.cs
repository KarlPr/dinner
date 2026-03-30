using Dinner_Server.Data;
using Dinner_Server.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Dinner_Server.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/users");

        group.MapGet("/", async (AppDbContext db) =>
        {
            var users = await db.Users
                .OrderBy(u => u.Name)
                .Select(u => new UserResponse(u.Id, u.Name, u.Email))
                .ToListAsync();

            return Results.Ok(users);
        });

        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound(new { error = "User not found." });
            return Results.Ok(new UserResponse(user.Id, user.Name, user.Email));
        });

        group.MapPut("/{id:int}", async (int id, UpdateUserRequest req, AppDbContext db, HttpContext http) =>
        {
            var currentUserId = GetUserId(http);
            if (currentUserId is null) return Results.Unauthorized();
            if (currentUserId != id) return Results.Forbid();

            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound(new { error = "User not found." });

            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 100)
                return Results.BadRequest(new { error = "Name is required and must be 1-100 characters." });

            var duplicate = await db.Users.AnyAsync(u => u.Id != id && u.Name == req.Name.Trim());
            if (duplicate)
                return Results.Conflict(new { error = "A user with that name already exists." });

            user.Name = req.Name.Trim();
            user.Email = req.Email?.Trim();
            await db.SaveChangesAsync();

            return Results.Ok(new UserResponse(user.Id, user.Name, user.Email));
        });
    }

    private static int? GetUserId(HttpContext http)
    {
        var cookie = http.Request.Cookies["user_id"];
        return int.TryParse(cookie, out var id) ? id : null;
    }
}
