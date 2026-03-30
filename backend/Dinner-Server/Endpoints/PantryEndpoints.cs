using Dinner_Server.Data;
using Dinner_Server.Dtos;
using Dinner_Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Dinner_Server.Endpoints;

public static class PantryEndpoints
{
    public static void MapPantryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/pantry");

        group.MapGet("/", async (AppDbContext db) =>
        {
            var items = await db.PantryItems
                .Include(p => p.Ingredient)
                .OrderBy(p => p.Ingredient!.Name)
                .Select(p => new PantryItemResponse(
                    p.Id, p.IngredientId, p.Ingredient!.Name,
                    p.Quantity, p.Ingredient.BaseUnit, p.UpdatedAt))
                .ToListAsync();

            return Results.Ok(items);
        });

        group.MapPut("/{ingredientId:int}", async (int ingredientId, SetPantryQuantityRequest req, AppDbContext db) =>
        {
            if (req.Quantity < 0)
                return Results.BadRequest(new { error = "Quantity must be >= 0." });

            var ingredient = await db.Ingredients.FindAsync(ingredientId);
            if (ingredient is null) return Results.NotFound(new { error = "Ingredient not found." });

            var pantryItem = await db.PantryItems
                .Include(p => p.Ingredient)
                .FirstOrDefaultAsync(p => p.IngredientId == ingredientId);

            if (pantryItem is null)
            {
                pantryItem = new PantryItem
                {
                    IngredientId = ingredientId,
                    Quantity = req.Quantity,
                    UpdatedAt = DateTime.UtcNow
                };
                db.PantryItems.Add(pantryItem);
                await db.SaveChangesAsync();

                pantryItem = await db.PantryItems
                    .Include(p => p.Ingredient)
                    .FirstAsync(p => p.Id == pantryItem.Id);
            }
            else
            {
                pantryItem.Quantity = req.Quantity;
                pantryItem.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }

            return Results.Ok(new PantryItemResponse(
                pantryItem.Id, pantryItem.IngredientId, pantryItem.Ingredient!.Name,
                pantryItem.Quantity, pantryItem.Ingredient.BaseUnit, pantryItem.UpdatedAt));
        });

        group.MapPost("/adjust", async (AdjustPantryRequest req, AppDbContext db) =>
        {
            var updated = new List<object>();

            foreach (var adj in req.Adjustments)
            {
                var ingredient = await db.Ingredients.FindAsync(adj.IngredientId);
                if (ingredient is null) continue;

                var pantryItem = await db.PantryItems.FirstOrDefaultAsync(p => p.IngredientId == adj.IngredientId);
                if (pantryItem is null)
                {
                    pantryItem = new PantryItem
                    {
                        IngredientId = adj.IngredientId,
                        Quantity = Math.Max(0, adj.Delta),
                        UpdatedAt = DateTime.UtcNow
                    };
                    db.PantryItems.Add(pantryItem);
                }
                else
                {
                    pantryItem.Quantity = Math.Max(0, pantryItem.Quantity + adj.Delta);
                    pantryItem.UpdatedAt = DateTime.UtcNow;
                }

                updated.Add(new
                {
                    ingredientId = adj.IngredientId,
                    ingredientName = ingredient.Name,
                    quantity = pantryItem.Quantity,
                    unit = ingredient.BaseUnit
                });
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { updated });
        });

        group.MapPost("/consume-recipe", async (ConsumeRecipeRequest req, AppDbContext db) =>
        {
            if (req.Servings < 1)
                return Results.BadRequest(new { error = "Servings must be at least 1." });

            var recipe = await db.Recipes
                .Include(r => r.Ingredients).ThenInclude(ri => ri.Ingredient)
                .FirstOrDefaultAsync(r => r.Id == req.RecipeId);

            if (recipe is null) return Results.NotFound(new { error = "Recipe not found." });

            var scale = (double)req.Servings / recipe.Servings;
            var updated = new List<object>();

            foreach (var ri in recipe.Ingredients)
            {
                var needed = ri.Quantity * scale;
                var pantryItem = await db.PantryItems.FirstOrDefaultAsync(p => p.IngredientId == ri.IngredientId);

                if (pantryItem is not null)
                {
                    pantryItem.Quantity = Math.Max(0, pantryItem.Quantity - needed);
                    pantryItem.UpdatedAt = DateTime.UtcNow;

                    updated.Add(new
                    {
                        ingredientId = ri.IngredientId,
                        ingredientName = ri.Ingredient?.Name,
                        quantity = pantryItem.Quantity,
                        unit = ri.Ingredient?.BaseUnit
                    });
                }
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { updated });
        });

        group.MapDelete("/{ingredientId:int}", async (int ingredientId, AppDbContext db) =>
        {
            var pantryItem = await db.PantryItems.FirstOrDefaultAsync(p => p.IngredientId == ingredientId);
            if (pantryItem is null) return Results.NotFound(new { error = "Pantry item not found." });

            db.PantryItems.Remove(pantryItem);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
