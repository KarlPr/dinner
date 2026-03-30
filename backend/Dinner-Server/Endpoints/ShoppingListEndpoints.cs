using Dinner_Server.Data;
using Dinner_Server.Dtos;
using Dinner_Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Dinner_Server.Endpoints;

public static class ShoppingListEndpoints
{
    public static void MapShoppingListEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/shopping-list");

        group.MapPost("/generate", async (GenerateShoppingListRequest req, AppDbContext db) =>
        {
            if (req.MealPlanIds.Count == 0)
                return Results.BadRequest(new { error = "At least one meal plan ID is required." });

            var mealPlans = await db.MealPlans
                .Include(m => m.Recipe).ThenInclude(r => r!.Ingredients).ThenInclude(ri => ri.Ingredient)
                .Where(m => req.MealPlanIds.Contains(m.Id))
                .ToListAsync();

            if (mealPlans.Count == 0)
                return Results.BadRequest(new { error = "No valid meal plan entries found." });

            // Aggregate ingredients
            var aggregated = new Dictionary<int, (string Name, string Unit, double Quantity)>();
            foreach (var mp in mealPlans)
            {
                if (mp.Recipe is null) continue;
                var scale = (double)mp.Servings / mp.Recipe.Servings;
                foreach (var ri in mp.Recipe.Ingredients)
                {
                    var qty = ri.Quantity * scale;
                    if (aggregated.TryGetValue(ri.IngredientId, out var existing))
                    {
                        aggregated[ri.IngredientId] = (existing.Name, existing.Unit, existing.Quantity + qty);
                    }
                    else
                    {
                        aggregated[ri.IngredientId] = (
                            ri.Ingredient?.Name ?? "Unknown",
                            ri.Ingredient?.BaseUnit ?? "g",
                            qty);
                    }
                }
            }

            // Get pantry quantities
            var pantryItems = req.SubtractPantry
                ? await db.PantryItems
                    .Where(p => aggregated.Keys.Contains(p.IngredientId))
                    .ToDictionaryAsync(p => p.IngredientId, p => p.Quantity)
                : new Dictionary<int, double>();

            // Get packages if needed
            var packages = req.ApplyPackages
                ? await db.IngredientPackages
                    .Where(p => aggregated.Keys.Contains(p.IngredientId))
                    .ToListAsync()
                : [];

            var items = new List<GeneratedShoppingItem>();
            foreach (var (ingredientId, (name, unit, requiredQty)) in aggregated)
            {
                var pantryQty = pantryItems.GetValueOrDefault(ingredientId, 0);
                var neededQty = Math.Max(0, requiredQty - pantryQty);

                List<ShoppingListPackageInfo>? packageInfos = null;
                if (req.ApplyPackages && neededQty > 0)
                {
                    var ingredientPackages = packages
                        .Where(p => p.IngredientId == ingredientId)
                        .OrderByDescending(p => p.PackageQuantity)
                        .ToList();

                    if (ingredientPackages.Count > 0)
                    {
                        packageInfos = CalculatePackages(neededQty, ingredientPackages);
                    }
                }

                items.Add(new GeneratedShoppingItem(
                    ingredientId, name, requiredQty, pantryQty, neededQty, unit, packageInfos));
            }

            // Only include items that are actually needed
            items = items.Where(i => i.NeededQuantity > 0).OrderBy(i => i.IngredientName).ToList();

            return Results.Ok(new GeneratedShoppingListResponse(items, DateTime.UtcNow));
        });

        group.MapPost("/save", async (SaveShoppingListRequest req, AppDbContext db) =>
        {
            // Remove any existing shopping list (only one at a time)
            var existing = await db.ShoppingLists.Include(s => s.Items).ToListAsync();
            db.ShoppingLists.RemoveRange(existing);

            var list = new ShoppingList
            {
                CreatedAt = DateTime.UtcNow,
                Items = req.Items.Select(i => new ShoppingListItem
                {
                    IngredientId = i.IngredientId,
                    Quantity = i.Quantity,
                    Checked = i.Checked
                }).ToList()
            };

            db.ShoppingLists.Add(list);
            await db.SaveChangesAsync();

            var saved = await db.ShoppingLists
                .Include(s => s.Items).ThenInclude(i => i.Ingredient)
                .FirstAsync(s => s.Id == list.Id);

            return Results.Created($"/api/shopping-list", MapToResponse(saved));
        });

        group.MapGet("/", async (AppDbContext db) =>
        {
            var list = await db.ShoppingLists
                .Include(s => s.Items).ThenInclude(i => i.Ingredient)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            if (list is null) return Results.Ok((ShoppingListResponse?)null);

            return Results.Ok(MapToResponse(list));
        });

        group.MapPatch("/items/{id:int}", async (int id, UpdateShoppingListItemRequest req, AppDbContext db) =>
        {
            var item = await db.ShoppingListItems
                .Include(i => i.Ingredient)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (item is null) return Results.NotFound(new { error = "Shopping list item not found." });

            item.Checked = req.Checked;
            await db.SaveChangesAsync();

            return Results.Ok(new ShoppingListItemResponse(
                item.Id, item.IngredientId,
                item.Ingredient?.Name ?? "Unknown",
                item.Quantity,
                item.Ingredient?.BaseUnit ?? "g",
                item.Checked));
        });

        group.MapDelete("/", async (AppDbContext db) =>
        {
            var lists = await db.ShoppingLists.Include(s => s.Items).ToListAsync();
            db.ShoppingLists.RemoveRange(lists);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }

    private static List<ShoppingListPackageInfo> CalculatePackages(
        double neededQty, List<IngredientPackage> packages)
    {
        var result = new List<ShoppingListPackageInfo>();
        var remaining = neededQty;

        // Greedy: use largest packages first
        foreach (var pkg in packages.OrderByDescending(p => p.PackageQuantity))
        {
            if (remaining <= 0) break;
            var count = (int)Math.Ceiling(remaining / pkg.PackageQuantity);
            var totalFromPkg = count * pkg.PackageQuantity;
            var leftover = totalFromPkg - remaining;

            result.Add(new ShoppingListPackageInfo(
                pkg.Id, pkg.Label, pkg.PackageQuantity, count, leftover));

            remaining = 0; // Simple approach: fill with first viable package
        }

        return result;
    }

    private static ShoppingListResponse MapToResponse(ShoppingList list) => new(
        list.Id,
        list.CreatedAt,
        list.Items.Select(i => new ShoppingListItemResponse(
            i.Id, i.IngredientId,
            i.Ingredient?.Name ?? "Unknown",
            i.Quantity,
            i.Ingredient?.BaseUnit ?? "g",
            i.Checked
        )).ToList()
    );
}
