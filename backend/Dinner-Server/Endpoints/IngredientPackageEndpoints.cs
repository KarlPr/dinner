using Dinner_Server.Data;
using Dinner_Server.Dtos;
using Dinner_Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Dinner_Server.Endpoints;

public static class IngredientPackageEndpoints
{
    public static void MapIngredientPackageEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/ingredients/{ingredientId:int}/packages");

        group.MapGet("/", async (int ingredientId, AppDbContext db) =>
        {
            if (!await db.Ingredients.AnyAsync(i => i.Id == ingredientId))
                return Results.NotFound(new { error = "Ingredient not found." });

            var packages = await db.IngredientPackages
                .Where(p => p.IngredientId == ingredientId)
                .OrderByDescending(p => p.PackageQuantity)
                .Select(p => new IngredientPackageResponse(p.Id, p.IngredientId, p.Label, p.PackageQuantity, p.Unit))
                .ToListAsync();

            return Results.Ok(packages);
        });

        group.MapPost("/", async (int ingredientId, CreateIngredientPackageRequest req, AppDbContext db) =>
        {
            if (!await db.Ingredients.AnyAsync(i => i.Id == ingredientId))
                return Results.NotFound(new { error = "Ingredient not found." });

            if (string.IsNullOrWhiteSpace(req.Label) || req.Label.Length > 100)
                return Results.BadRequest(new { error = "Label is required and must be 1-100 characters." });
            if (req.PackageQuantity <= 0)
                return Results.BadRequest(new { error = "PackageQuantity must be > 0." });

            string[] validUnits = ["g", "ml", "pcs"];
            if (!validUnits.Contains(req.Unit))
                return Results.BadRequest(new { error = "Unit must be one of: g, ml, pcs." });

            var package = new IngredientPackage
            {
                IngredientId = ingredientId,
                Label = req.Label.Trim(),
                PackageQuantity = req.PackageQuantity,
                Unit = req.Unit
            };

            db.IngredientPackages.Add(package);
            await db.SaveChangesAsync();

            return Results.Created(
                $"/api/ingredients/{ingredientId}/packages/{package.Id}",
                new IngredientPackageResponse(package.Id, package.IngredientId, package.Label, package.PackageQuantity, package.Unit));
        });

        group.MapPut("/{id:int}", async (int ingredientId, int id, UpdateIngredientPackageRequest req, AppDbContext db) =>
        {
            var package = await db.IngredientPackages.FirstOrDefaultAsync(p => p.Id == id && p.IngredientId == ingredientId);
            if (package is null) return Results.NotFound(new { error = "Package not found." });

            if (string.IsNullOrWhiteSpace(req.Label) || req.Label.Length > 100)
                return Results.BadRequest(new { error = "Label is required and must be 1-100 characters." });
            if (req.PackageQuantity <= 0)
                return Results.BadRequest(new { error = "PackageQuantity must be > 0." });

            string[] validUnits = ["g", "ml", "pcs"];
            if (!validUnits.Contains(req.Unit))
                return Results.BadRequest(new { error = "Unit must be one of: g, ml, pcs." });

            package.Label = req.Label.Trim();
            package.PackageQuantity = req.PackageQuantity;
            package.Unit = req.Unit;
            await db.SaveChangesAsync();

            return Results.Ok(new IngredientPackageResponse(package.Id, package.IngredientId, package.Label, package.PackageQuantity, package.Unit));
        });

        group.MapDelete("/{id:int}", async (int ingredientId, int id, AppDbContext db) =>
        {
            var package = await db.IngredientPackages.FirstOrDefaultAsync(p => p.Id == id && p.IngredientId == ingredientId);
            if (package is null) return Results.NotFound(new { error = "Package not found." });

            db.IngredientPackages.Remove(package);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }
}
