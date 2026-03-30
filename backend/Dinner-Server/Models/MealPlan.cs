namespace Dinner_Server.Models;

public class MealPlan
{
    public int Id { get; set; }
    public required string Date { get; set; } // ISO date string: 2026-03-30
    public required string MealType { get; set; } // breakfast, lunch, dinner, snack
    public int RecipeId { get; set; }
    public int Servings { get; set; }
    public int? UserId { get; set; }

    public Recipe? Recipe { get; set; }
    public User? User { get; set; }
}
