namespace Dinner_Server.Models;

public class Ingredient
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string BaseUnit { get; set; } // g, ml, pcs

    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = [];
    public ICollection<IngredientPackage> Packages { get; set; } = [];
    public PantryItem? PantryItem { get; set; }
}
