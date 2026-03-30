namespace Dinner_Server.Models;

public class PantryItem
{
    public int Id { get; set; }
    public int IngredientId { get; set; }
    public double Quantity { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Ingredient? Ingredient { get; set; }
}
