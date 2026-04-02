namespace Dinner_Server.Models;

public class IngredientCategory
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public ICollection<Ingredient> Ingredients { get; set; } = [];
}
