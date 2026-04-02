namespace Dinner_Server.Dtos;

// === Auth ===
public record RegisterRequest(string Name, string? Email, string Password);
public record LoginRequest(string Name, string Password);
public record UserResponse(int Id, string Name, string? Email);

// === Ingredients ===
public record IngredientResponse(int Id, string Name, string BaseUnit, int? CategoryId, string? CategoryName);
public record CreateIngredientRequest(string Name, string BaseUnit, int? CategoryId);
public record UpdateIngredientRequest(string Name, string BaseUnit, int? CategoryId);

// === Recipes ===
public record RecipeListResponse(int Id, string Name, int Servings, int CreatedBy, string CreatedByName, DateTime CreatedAt);

public record RecipeDetailResponse(
    int Id, string Name, string? Instructions, int Servings, string? ImagePath,
    int CreatedBy, string CreatedByName, DateTime CreatedAt,
    List<RecipeIngredientResponse> Ingredients);

public record RecipeIngredientResponse(int Id, int IngredientId, string IngredientName, double Quantity, string Unit);

public record RecipeIngredientInput(int IngredientId, double Quantity);
public record CreateRecipeRequest(string Name, string? Instructions, int Servings, List<RecipeIngredientInput> Ingredients);
public record UpdateRecipeRequest(string Name, string? Instructions, int Servings, List<RecipeIngredientInput> Ingredients);

// === Meal Plan ===
public record MealPlanResponse(int Id, string Date, string MealType, int RecipeId, string RecipeName, int Servings, int? UserId, string? UserName);
public record CreateMealPlanRequest(string Date, string MealType, int RecipeId, int Servings, int? UserId);
public record UpdateMealPlanRequest(string Date, string MealType, int RecipeId, int Servings, int? UserId);

// === Pantry ===
public record PantryItemResponse(int Id, int IngredientId, string IngredientName, double Quantity, string Unit, DateTime UpdatedAt);
public record SetPantryQuantityRequest(double Quantity);
public record PantryAdjustment(int IngredientId, double Delta);
public record AdjustPantryRequest(List<PantryAdjustment> Adjustments);
public record ConsumeRecipeRequest(int RecipeId, int Servings);

// === Shopping List ===
public record GenerateShoppingListRequest(List<int> MealPlanIds, bool SubtractPantry = true, bool ApplyPackages = true);

public record ShoppingListPackageInfo(int PackageId, string Label, double PackageQuantity, int Count, double Leftover);
public record GeneratedShoppingItem(int IngredientId, string IngredientName, double RequiredQuantity, double PantryQuantity, double NeededQuantity, string Unit, List<ShoppingListPackageInfo>? Packages);
public record GeneratedShoppingListResponse(List<GeneratedShoppingItem> Items, DateTime GeneratedAt);

public record SaveShoppingListItemInput(int IngredientId, double Quantity, bool Checked = false);
public record SaveShoppingListRequest(List<SaveShoppingListItemInput> Items);

public record ShoppingListItemResponse(int Id, int IngredientId, string IngredientName, double Quantity, string Unit, bool Checked);
public record ShoppingListResponse(int Id, DateTime CreatedAt, List<ShoppingListItemResponse> Items);

public record UpdateShoppingListItemRequest(bool Checked);

// === Users ===
public record UpdateUserRequest(string Name, string? Email);

// === Ingredient Packages ===
public record IngredientPackageResponse(int Id, int IngredientId, string Label, double PackageQuantity, string Unit);
public record CreateIngredientPackageRequest(string Label, double PackageQuantity, string Unit);
public record UpdateIngredientPackageRequest(string Label, double PackageQuantity, string Unit);

// === Ingredient Categories ===
public record IngredientCategoryResponse(int Id, string Name);
public record IngredientCategoryDetailResponse(int Id, string Name, List<IngredientResponse> Ingredients);
public record CreateIngredientCategoryRequest(string Name);
public record UpdateIngredientCategoryRequest(string Name);

// === Ingredient Substitutions ===
public record IngredientSubstitutionResponse(int Id, int IngredientId, string IngredientName, int SubstituteId, string SubstituteName, string? Note);
public record CreateIngredientSubstitutionRequest(int SubstituteId, string? Note);
public record UpdateIngredientSubstitutionRequest(string? Note);
