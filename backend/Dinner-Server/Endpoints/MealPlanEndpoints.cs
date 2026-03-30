using Dinner_Server.Data;
using Dinner_Server.Dtos;
using Dinner_Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Dinner_Server.Endpoints;

public static class MealPlanEndpoints
{
    private static readonly string[] ValidMealTypes = ["breakfast", "lunch", "dinner", "snack"];

    public static void MapMealPlanEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/mealplan");

        group.MapGet("/", async (string from, string to, AppDbContext db) =>
        {
            if (!DateOnly.TryParse(from, out _) || !DateOnly.TryParse(to, out _))
                return Results.BadRequest(new { error = "Invalid date format. Use ISO date (e.g., 2026-03-30)." });

            var entries = await db.MealPlans
                .Include(m => m.Recipe)
                .Include(m => m.User)
                .Where(m => string.Compare(m.Date, from) >= 0 && string.Compare(m.Date, to) <= 0)
                .OrderBy(m => m.Date)
                .Select(m => new MealPlanResponse(
                    m.Id, m.Date, m.MealType, m.RecipeId,
                    m.Recipe != null ? m.Recipe.Name : "Unknown",
                    m.Servings, m.UserId,
                    m.User != null ? m.User.Name : null))
                .ToListAsync();

            return Results.Ok(entries);
        });

        group.MapPost("/", async (CreateMealPlanRequest req, AppDbContext db) =>
        {
            if (!DateOnly.TryParse(req.Date, out _))
                return Results.BadRequest(new { error = "Invalid date format." });
            if (!ValidMealTypes.Contains(req.MealType))
                return Results.BadRequest(new { error = "MealType must be one of: breakfast, lunch, dinner, snack." });
            if (req.Servings < 1)
                return Results.BadRequest(new { error = "Servings must be at least 1." });
            if (!await db.Recipes.AnyAsync(r => r.Id == req.RecipeId))
                return Results.BadRequest(new { error = "Recipe not found." });
            if (req.UserId.HasValue && !await db.Users.AnyAsync(u => u.Id == req.UserId.Value))
                return Results.BadRequest(new { error = "User not found." });

            var entry = new MealPlan
            {
                Date = req.Date,
                MealType = req.MealType,
                RecipeId = req.RecipeId,
                Servings = req.Servings,
                UserId = req.UserId
            };

            db.MealPlans.Add(entry);
            await db.SaveChangesAsync();

            var created = await db.MealPlans
                .Include(m => m.Recipe)
                .Include(m => m.User)
                .FirstAsync(m => m.Id == entry.Id);

            return Results.Created($"/api/mealplan/{created.Id}", new MealPlanResponse(
                created.Id, created.Date, created.MealType, created.RecipeId,
                created.Recipe?.Name ?? "Unknown", created.Servings,
                created.UserId, created.User?.Name));
        });

        group.MapPut("/{id:int}", async (int id, UpdateMealPlanRequest req, AppDbContext db) =>
        {
            var entry = await db.MealPlans.FindAsync(id);
            if (entry is null) return Results.NotFound(new { error = "Meal plan entry not found." });

            if (!DateOnly.TryParse(req.Date, out _))
                return Results.BadRequest(new { error = "Invalid date format." });
            if (!ValidMealTypes.Contains(req.MealType))
                return Results.BadRequest(new { error = "MealType must be one of: breakfast, lunch, dinner, snack." });
            if (req.Servings < 1)
                return Results.BadRequest(new { error = "Servings must be at least 1." });
            if (!await db.Recipes.AnyAsync(r => r.Id == req.RecipeId))
                return Results.BadRequest(new { error = "Recipe not found." });

            entry.Date = req.Date;
            entry.MealType = req.MealType;
            entry.RecipeId = req.RecipeId;
            entry.Servings = req.Servings;
            entry.UserId = req.UserId;
            await db.SaveChangesAsync();

            var updated = await db.MealPlans
                .Include(m => m.Recipe)
                .Include(m => m.User)
                .FirstAsync(m => m.Id == id);

            return Results.Ok(new MealPlanResponse(
                updated.Id, updated.Date, updated.MealType, updated.RecipeId,
                updated.Recipe?.Name ?? "Unknown", updated.Servings,
                updated.UserId, updated.User?.Name));
        });

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var entry = await db.MealPlans.FindAsync(id);
            if (entry is null) return Results.NotFound(new { error = "Meal plan entry not found." });

            db.MealPlans.Remove(entry);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
