using Dinner_Server.Data;
using Dinner_Server.Dtos;
using Dinner_Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Dinner_Server.Endpoints;

public static class RecipeEndpoints
{
    public static void MapRecipeEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/recipes");

        group.MapGet("/", async (string? search, AppDbContext db) =>
        {
            var query = db.Recipes.Include(r => r.Creator).AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(r => r.Name.ToLower().Contains(search.ToLower()));

            var recipes = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new RecipeListResponse(
                    r.Id, r.Name, r.Servings, r.CreatedBy,
                    r.Creator != null ? r.Creator.Name : "Unknown", r.CreatedAt))
                .ToListAsync();

            return Results.Ok(recipes);
        });

        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var recipe = await db.Recipes
                .Include(r => r.Creator)
                .Include(r => r.Ingredients).ThenInclude(ri => ri.Ingredient)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (recipe is null) return Results.NotFound(new { error = "Recipe not found." });

            return Results.Ok(MapToDetail(recipe));
        });

        group.MapPost("/", async (CreateRecipeRequest req, AppDbContext db, HttpContext http) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 200)
                return Results.BadRequest(new { error = "Name is required and must be 1-200 characters." });
            if (req.Servings < 1)
                return Results.BadRequest(new { error = "Servings must be at least 1." });

            var userId = GetUserId(http);
            if (userId is null) return Results.Unauthorized();

            var recipe = new Recipe
            {
                Name = req.Name.Trim(),
                Instructions = req.Instructions,
                Servings = req.Servings,
                CreatedBy = userId.Value,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var ing in req.Ingredients)
            {
                if (ing.Quantity <= 0) return Results.BadRequest(new { error = "Ingredient quantity must be > 0." });
                if (!await db.Ingredients.AnyAsync(i => i.Id == ing.IngredientId))
                    return Results.BadRequest(new { error = $"Ingredient {ing.IngredientId} not found." });

                recipe.Ingredients.Add(new RecipeIngredient
                {
                    IngredientId = ing.IngredientId,
                    Quantity = ing.Quantity
                });
            }

            db.Recipes.Add(recipe);
            await db.SaveChangesAsync();

            // Reload with navigation properties
            var created = await db.Recipes
                .Include(r => r.Creator)
                .Include(r => r.Ingredients).ThenInclude(ri => ri.Ingredient)
                .FirstAsync(r => r.Id == recipe.Id);

            return Results.Created($"/api/recipes/{created.Id}", MapToDetail(created));
        });

        group.MapPut("/{id:int}", async (int id, UpdateRecipeRequest req, AppDbContext db) =>
        {
            var recipe = await db.Recipes
                .Include(r => r.Ingredients)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (recipe is null) return Results.NotFound(new { error = "Recipe not found." });
            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 200)
                return Results.BadRequest(new { error = "Name is required and must be 1-200 characters." });
            if (req.Servings < 1)
                return Results.BadRequest(new { error = "Servings must be at least 1." });

            recipe.Name = req.Name.Trim();
            recipe.Instructions = req.Instructions;
            recipe.Servings = req.Servings;

            // Replace ingredient list
            db.RecipeIngredients.RemoveRange(recipe.Ingredients);
            recipe.Ingredients.Clear();

            foreach (var ing in req.Ingredients)
            {
                if (ing.Quantity <= 0) return Results.BadRequest(new { error = "Ingredient quantity must be > 0." });
                if (!await db.Ingredients.AnyAsync(i => i.Id == ing.IngredientId))
                    return Results.BadRequest(new { error = $"Ingredient {ing.IngredientId} not found." });

                recipe.Ingredients.Add(new RecipeIngredient
                {
                    IngredientId = ing.IngredientId,
                    Quantity = ing.Quantity
                });
            }

            await db.SaveChangesAsync();

            var updated = await db.Recipes
                .Include(r => r.Creator)
                .Include(r => r.Ingredients).ThenInclude(ri => ri.Ingredient)
                .FirstAsync(r => r.Id == id);

            return Results.Ok(MapToDetail(updated));
        });

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var recipe = await db.Recipes.FindAsync(id);
            if (recipe is null) return Results.NotFound(new { error = "Recipe not found." });

            db.Recipes.Remove(recipe); // Cascades to RecipeIngredients and MealPlans
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapPost("/{id:int}/image", async (int id, HttpRequest request, AppDbContext db) =>
        {
            var recipe = await db.Recipes.FindAsync(id);
            if (recipe is null) return Results.NotFound(new { error = "Recipe not found." });

            if (!request.HasFormContentType)
                return Results.BadRequest(new { error = "Expected multipart/form-data." });

            var form = await request.ReadFormAsync();
            var file = form.Files.GetFile("image");
            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "No image file provided." });
            if (file.Length > 5 * 1024 * 1024)
                return Results.BadRequest(new { error = "Image must be 5 MB or less." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext is not ".jpg" and not ".jpeg" and not ".png")
                return Results.BadRequest(new { error = "Only JPG and PNG images are supported." });

            var uploadsDir = Path.Combine("uploads", "recipes");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{id}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            recipe.ImagePath = $"/uploads/recipes/{fileName}";
            await db.SaveChangesAsync();

            return Results.Ok(new { imagePath = recipe.ImagePath });
        }).DisableAntiforgery();

        group.MapDelete("/{id:int}/image", async (int id, AppDbContext db) =>
        {
            var recipe = await db.Recipes.FindAsync(id);
            if (recipe is null) return Results.NotFound(new { error = "Recipe not found." });

            if (recipe.ImagePath is not null)
            {
                var filePath = recipe.ImagePath.TrimStart('/');
                if (File.Exists(filePath)) File.Delete(filePath);
                recipe.ImagePath = null;
                await db.SaveChangesAsync();
            }

            return Results.NoContent();
        });
    }

    private static int? GetUserId(HttpContext http)
    {
        if (http.Request.Cookies.TryGetValue("user_id", out var val) && int.TryParse(val, out var id))
            return id;
        return null;
    }

    private static RecipeDetailResponse MapToDetail(Recipe r) => new(
        r.Id, r.Name, r.Instructions, r.Servings, r.ImagePath,
        r.CreatedBy, r.Creator?.Name ?? "Unknown", r.CreatedAt,
        r.Ingredients.Select(ri => new RecipeIngredientResponse(
            ri.Id, ri.IngredientId, ri.Ingredient?.Name ?? "Unknown",
            ri.Quantity, ri.Ingredient?.BaseUnit ?? "")).ToList());
}
