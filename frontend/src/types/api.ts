// === Auth ===
export interface RegisterRequest {
  name: string;
  email?: string;
  password: string;
}

export interface LoginRequest {
  name: string;
  password: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string | null;
}

// === Ingredients ===
export interface IngredientResponse {
  id: number;
  name: string;
  baseUnit: string;
  categoryId: number | null;
  categoryName: string | null;
}

export interface CreateIngredientRequest {
  name: string;
  baseUnit: string;
  categoryId?: number | null;
}

export interface UpdateIngredientRequest {
  name: string;
  baseUnit: string;
  categoryId?: number | null;
}

// === Ingredient Categories ===
export interface IngredientCategoryResponse {
  id: number;
  name: string;
}

export interface IngredientCategoryDetailResponse {
  id: number;
  name: string;
  ingredients: IngredientResponse[];
}

export interface CreateIngredientCategoryRequest {
  name: string;
}

export interface UpdateIngredientCategoryRequest {
  name: string;
}

// === Ingredient Substitutions ===
export interface IngredientSubstitutionResponse {
  id: number;
  ingredientId: number;
  ingredientName: string;
  substituteId: number;
  substituteName: string;
  note: string | null;
}

export interface CreateIngredientSubstitutionRequest {
  substituteId: number;
  note?: string | null;
}

export interface UpdateIngredientSubstitutionRequest {
  note?: string | null;
}

// === Recipes ===
export interface RecipeListResponse {
  id: number;
  name: string;
  servings: number;
  createdBy: number;
  createdByName: string;
  createdAt: string;
}

export interface RecipeDetailResponse {
  id: number;
  name: string;
  instructions: string | null;
  servings: number;
  imagePath: string | null;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  ingredients: RecipeIngredientResponse[];
}

export interface RecipeIngredientResponse {
  id: number;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface RecipeIngredientInput {
  ingredientId: number;
  quantity: number;
}

export interface CreateRecipeRequest {
  name: string;
  instructions?: string;
  servings: number;
  ingredients: RecipeIngredientInput[];
}

export interface UpdateRecipeRequest {
  name: string;
  instructions?: string;
  servings: number;
  ingredients: RecipeIngredientInput[];
}

// === Meal Plan ===
export interface MealPlanResponse {
  id: number;
  date: string;
  mealType: string;
  recipeId: number;
  recipeName: string;
  servings: number;
  userId: number | null;
  userName: string | null;
}

export interface CreateMealPlanRequest {
  date: string;
  mealType: string;
  recipeId: number;
  servings: number;
  userId?: number;
}

export interface UpdateMealPlanRequest {
  date: string;
  mealType: string;
  recipeId: number;
  servings: number;
  userId?: number;
}

// === Pantry ===
export interface PantryItemResponse {
  id: number;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  updatedAt: string;
}

export interface SetPantryQuantityRequest {
  quantity: number;
}

export interface PantryAdjustment {
  ingredientId: number;
  delta: number;
}

export interface AdjustPantryRequest {
  adjustments: PantryAdjustment[];
}

export interface ConsumeRecipeRequest {
  recipeId: number;
  servings: number;
}

// === Shopping List ===
export interface GenerateShoppingListRequest {
  mealPlanIds: number[];
  subtractPantry?: boolean;
  applyPackages?: boolean;
}

export interface ShoppingListPackageInfo {
  packageId: number;
  label: string;
  packageQuantity: number;
  count: number;
  leftover: number;
}

export interface GeneratedShoppingItem {
  ingredientId: number;
  ingredientName: string;
  requiredQuantity: number;
  pantryQuantity: number;
  neededQuantity: number;
  unit: string;
  packages: ShoppingListPackageInfo[] | null;
}

export interface GeneratedShoppingListResponse {
  items: GeneratedShoppingItem[];
  generatedAt: string;
}

export interface SaveShoppingListItemInput {
  ingredientId: number;
  quantity: number;
  checked?: boolean;
}

export interface SaveShoppingListRequest {
  items: SaveShoppingListItemInput[];
}

export interface ShoppingListItemResponse {
  id: number;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  checked: boolean;
}

export interface ShoppingListResponse {
  id: number;
  createdAt: string;
  items: ShoppingListItemResponse[];
}

export interface UpdateShoppingListItemRequest {
  checked: boolean;
}

// === Users ===
export interface UpdateUserRequest {
  name: string;
  email?: string;
}

// === Ingredient Packages ===
export interface IngredientPackageResponse {
  id: number;
  ingredientId: number;
  label: string;
  packageQuantity: number;
  unit: string;
}

export interface CreateIngredientPackageRequest {
  label: string;
  packageQuantity: number;
  unit: string;
}

export interface UpdateIngredientPackageRequest {
  label: string;
  packageQuantity: number;
  unit: string;
}

// === Error ===
export interface ApiError {
  error: string;
  details?: string;
}
