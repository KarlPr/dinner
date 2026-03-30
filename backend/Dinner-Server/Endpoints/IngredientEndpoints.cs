using Dinner_Server.Data;
using Dinner_Server.Dtos;
using Dinner_Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Dinner_Server.Endpoints;

public static class IngredientEndpoints
{
    private static readonly string[] ValidUnits = ["g", "ml", "pcs"];

    public static void MapIngredientEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/ingredients");

        group.MapGet("/", async (string? search, AppDbContext db) =>
        {
            var query = db.Ingredients.AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(i => i.Name.ToLower().Contains(search.ToLower()));

            var ingredients = await query
                .OrderBy(i => i.Name)
                .Select(i => new IngredientResponse(i.Id, i.Name, i.BaseUnit))
                .ToListAsync();

            return Results.Ok(ingredients);
        });

        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var ingredient = await db.Ingredients.FindAsync(id);
            if (ingredient is null) return Results.NotFound(new { error = "Ingredient not found." });
            return Results.Ok(new IngredientResponse(ingredient.Id, ingredient.Name, ingredient.BaseUnit));
        });

        group.MapPost("/", async (CreateIngredientRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 200)
                return Results.BadRequest(new { error = "Name is required and must be 1-200 characters." });
            if (!ValidUnits.Contains(req.BaseUnit))
                return Results.BadRequest(new { error = "BaseUnit must be one of: g, ml, pcs." });
            if (await db.Ingredients.AnyAsync(i => i.Name.ToLower() == req.Name.Trim().ToLower()))
                return Results.Conflict(new { error = "An ingredient with this name already exists." });

            var ingredient = new Ingredient { Name = req.Name.Trim(), BaseUnit = req.BaseUnit };
            db.Ingredients.Add(ingredient);
            await db.SaveChangesAsync();

            return Results.Created($"/api/ingredients/{ingredient.Id}",
                new IngredientResponse(ingredient.Id, ingredient.Name, ingredient.BaseUnit));
        });

        group.MapPut("/{id:int}", async (int id, UpdateIngredientRequest req, AppDbContext db) =>
        {
            var ingredient = await db.Ingredients.FindAsync(id);
            if (ingredient is null) return Results.NotFound(new { error = "Ingredient not found." });
            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 200)
                return Results.BadRequest(new { error = "Name is required and must be 1-200 characters." });
            if (!ValidUnits.Contains(req.BaseUnit))
                return Results.BadRequest(new { error = "BaseUnit must be one of: g, ml, pcs." });

            var duplicate = await db.Ingredients.AnyAsync(i => i.Id != id && i.Name.ToLower() == req.Name.Trim().ToLower());
            if (duplicate)
                return Results.Conflict(new { error = "An ingredient with this name already exists." });

            ingredient.Name = req.Name.Trim();
            ingredient.BaseUnit = req.BaseUnit;
            await db.SaveChangesAsync();

            return Results.Ok(new IngredientResponse(ingredient.Id, ingredient.Name, ingredient.BaseUnit));
        });

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var ingredient = await db.Ingredients.FindAsync(id);
            if (ingredient is null) return Results.NotFound(new { error = "Ingredient not found." });

            var inUse = await db.RecipeIngredients.AnyAsync(ri => ri.IngredientId == id)
                     || await db.PantryItems.AnyAsync(p => p.IngredientId == id);
            if (inUse)
                return Results.Conflict(new { error = "Cannot delete ingredient that is in use." });

            db.Ingredients.Remove(ingredient);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
