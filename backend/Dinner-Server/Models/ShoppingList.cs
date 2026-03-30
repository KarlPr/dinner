namespace Dinner_Server.Models;

public class ShoppingList
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ShoppingListItem> Items { get; set; } = [];
}
