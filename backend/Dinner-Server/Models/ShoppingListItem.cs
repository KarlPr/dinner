namespace Dinner_Server.Models;

public class ShoppingListItem
{
    public int Id { get; set; }
    public int ShoppingListId { get; set; }
    public int IngredientId { get; set; }
    public double Quantity { get; set; }
    public bool Checked { get; set; }

    public ShoppingList? ShoppingList { get; set; }
    public Ingredient? Ingredient { get; set; }
}
