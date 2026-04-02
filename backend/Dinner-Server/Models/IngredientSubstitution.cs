namespace Dinner_Server.Models;

public class IngredientSubstitution
{
    public int Id { get; set; }
    public int IngredientId { get; set; }
    public int SubstituteId { get; set; }
    public string? Note { get; set; }

    public Ingredient Ingredient { get; set; } = null!;
    public Ingredient Substitute { get; set; } = null!;
}
