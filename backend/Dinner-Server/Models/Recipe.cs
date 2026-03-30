namespace Dinner_Server.Models;

public class Recipe
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Instructions { get; set; }
    public int Servings { get; set; }
    public string? ImagePath { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? Creator { get; set; }
    public ICollection<RecipeIngredient> Ingredients { get; set; } = [];
    public ICollection<MealPlan> MealPlans { get; set; } = [];
}
