namespace Dinner_Server.Models;

public class IngredientPackage
{
    public int Id { get; set; }
    public int IngredientId { get; set; }
    public required string Label { get; set; }
    public double PackageQuantity { get; set; }
    public required string Unit { get; set; } // g, ml, pcs

    public Ingredient? Ingredient { get; set; }
}
