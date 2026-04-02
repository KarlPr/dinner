using Dinner_Server.Data;
using Dinner_Server.Dtos;
using Dinner_Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Dinner_Server.Endpoints;

public static class IngredientCategoryEndpoints
{
    public static void MapIngredientCategoryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/ingredient-categories");

        group.MapGet("/", async (string? search, AppDbContext db) =>
        {
            var query = db.IngredientCategories.AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(c => c.Name.ToLower().Contains(search.ToLower()));

            var categories = await query
                .OrderBy(c => c.Name)
                .Select(c => new IngredientCategoryResponse(c.Id, c.Name))
                .ToListAsync();

            return Results.Ok(categories);
        });

        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var category = await db.IngredientCategories
                .Include(c => c.Ingredients)
                .ThenInclude(i => i.Category)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category is null) return Results.NotFound(new { error = "Category not found." });

            return Results.Ok(new IngredientCategoryDetailResponse(
                category.Id,
                category.Name,
                category.Ingredients
                    .OrderBy(i => i.Name)
                    .Select(i => new IngredientResponse(i.Id, i.Name, i.BaseUnit, i.CategoryId, category.Name))
                    .ToList()));
        });

        group.MapPost("/", async (CreateIngredientCategoryRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 100)
                return Results.BadRequest(new { error = "Name is required and must be 1-100 characters." });
            if (await db.IngredientCategories.AnyAsync(c => c.Name.ToLower() == req.Name.Trim().ToLower()))
                return Results.Conflict(new { error = "A category with this name already exists." });

            var category = new IngredientCategory { Name = req.Name.Trim() };
            db.IngredientCategories.Add(category);
            await db.SaveChangesAsync();

            return Results.Created($"/api/ingredient-categories/{category.Id}",
                new IngredientCategoryResponse(category.Id, category.Name));
        });

        group.MapPut("/{id:int}", async (int id, UpdateIngredientCategoryRequest req, AppDbContext db) =>
        {
            var category = await db.IngredientCategories.FindAsync(id);
            if (category is null) return Results.NotFound(new { error = "Category not found." });
            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 100)
                return Results.BadRequest(new { error = "Name is required and must be 1-100 characters." });

            var duplicate = await db.IngredientCategories.AnyAsync(c => c.Id != id && c.Name.ToLower() == req.Name.Trim().ToLower());
            if (duplicate)
                return Results.Conflict(new { error = "A category with this name already exists." });

            category.Name = req.Name.Trim();
            await db.SaveChangesAsync();

            return Results.Ok(new IngredientCategoryResponse(category.Id, category.Name));
        });

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var category = await db.IngredientCategories.FindAsync(id);
            if (category is null) return Results.NotFound(new { error = "Category not found." });

            var inUse = await db.Ingredients.AnyAsync(i => i.CategoryId == id);
            if (inUse)
                return Results.Conflict(new { error = "Cannot delete category that has ingredients assigned." });

            db.IngredientCategories.Remove(category);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
