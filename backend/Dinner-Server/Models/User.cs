namespace Dinner_Server.Models;

public class User
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Email { get; set; }
    public required string PasswordHash { get; set; }

    public ICollection<Recipe> Recipes { get; set; } = [];
    public ICollection<MealPlan> MealPlans { get; set; } = [];
}
