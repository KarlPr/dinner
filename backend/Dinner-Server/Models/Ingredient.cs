namespace Dinner_Server.Models;

public class Ingredient
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string BaseUnit { get; set; } // g, ml, pcs

    public int? CategoryId { get; set; }
    public IngredientCategory? Category { get; set; }

    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = [];
    public ICollection<IngredientPackage> Packages { get; set; } = [];
    public PantryItem? PantryItem { get; set; }
    public ICollection<IngredientSubstitution> Substitutions { get; set; } = [];
    public ICollection<IngredientSubstitution> SubstitutedBy { get; set; } = [];
}
