using Dinner_Server.Data;
using Dinner_Server.Dtos;
using Dinner_Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Dinner_Server.Endpoints;

public static class IngredientSubstitutionEndpoints
{
    public static void MapIngredientSubstitutionEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/ingredients/{ingredientId:int}/substitutions");

        group.MapGet("/", async (int ingredientId, AppDbContext db) =>
        {
            if (!await db.Ingredients.AnyAsync(i => i.Id == ingredientId))
                return Results.NotFound(new { error = "Ingredient not found." });

            var substitutions = await db.IngredientSubstitutions
                .Where(s => s.IngredientId == ingredientId || s.SubstituteId == ingredientId)
                .Include(s => s.Ingredient)
                .Include(s => s.Substitute)
                .Select(s => new IngredientSubstitutionResponse(
                    s.Id, s.IngredientId, s.Ingredient.Name, s.SubstituteId, s.Substitute.Name, s.Note))
                .ToListAsync();

            return Results.Ok(substitutions);
        });

        group.MapPost("/", async (int ingredientId, CreateIngredientSubstitutionRequest req, AppDbContext db) =>
        {
            var ingredient = await db.Ingredients.FindAsync(ingredientId);
            if (ingredient is null)
                return Results.NotFound(new { error = "Ingredient not found." });

            if (ingredientId == req.SubstituteId)
                return Results.BadRequest(new { error = "An ingredient cannot be a substitute for itself." });

            var substitute = await db.Ingredients.FindAsync(req.SubstituteId);
            if (substitute is null)
                return Results.BadRequest(new { error = "Substitute ingredient not found." });

            var exists = await db.IngredientSubstitutions.AnyAsync(s =>
                (s.IngredientId == ingredientId && s.SubstituteId == req.SubstituteId) ||
                (s.IngredientId == req.SubstituteId && s.SubstituteId == ingredientId));
            if (exists)
                return Results.Conflict(new { error = "This substitution already exists." });

            var substitution = new IngredientSubstitution
            {
                IngredientId = ingredientId,
                SubstituteId = req.SubstituteId,
                Note = req.Note?.Trim()
            };
            db.IngredientSubstitutions.Add(substitution);
            await db.SaveChangesAsync();

            return Results.Created($"/api/ingredients/{ingredientId}/substitutions/{substitution.Id}",
                new IngredientSubstitutionResponse(
                    substitution.Id, ingredientId, ingredient.Name, req.SubstituteId, substitute.Name, substitution.Note));
        });

        group.MapPut("/{id:int}", async (int ingredientId, int id, UpdateIngredientSubstitutionRequest req, AppDbContext db) =>
        {
            var substitution = await db.IngredientSubstitutions
                .Include(s => s.Ingredient)
                .Include(s => s.Substitute)
                .FirstOrDefaultAsync(s => s.Id == id &&
                    (s.IngredientId == ingredientId || s.SubstituteId == ingredientId));

            if (substitution is null)
                return Results.NotFound(new { error = "Substitution not found." });

            substitution.Note = req.Note?.Trim();
            await db.SaveChangesAsync();

            return Results.Ok(new IngredientSubstitutionResponse(
                substitution.Id, substitution.IngredientId, substitution.Ingredient.Name,
                substitution.SubstituteId, substitution.Substitute.Name, substitution.Note));
        });

        group.MapDelete("/{id:int}", async (int ingredientId, int id, AppDbContext db) =>
        {
            var substitution = await db.IngredientSubstitutions
                .FirstOrDefaultAsync(s => s.Id == id &&
                    (s.IngredientId == ingredientId || s.SubstituteId == ingredientId));

            if (substitution is null)
                return Results.NotFound(new { error = "Substitution not found." });

            db.IngredientSubstitutions.Remove(substitution);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
