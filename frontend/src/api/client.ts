import type {
  ApiError,
  RegisterRequest,
  LoginRequest,
  UserResponse,
  IngredientResponse,
  CreateIngredientRequest,
  UpdateIngredientRequest,
  RecipeListResponse,
  RecipeDetailResponse,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  MealPlanResponse,
  CreateMealPlanRequest,
  UpdateMealPlanRequest,
  PantryItemResponse,
  SetPantryQuantityRequest,
  AdjustPantryRequest,
  ConsumeRecipeRequest,
  GenerateShoppingListRequest,
  GeneratedShoppingListResponse,
  SaveShoppingListRequest,
  ShoppingListResponse,
  UpdateShoppingListItemRequest,
  ShoppingListItemResponse,
  UpdateUserRequest,
  IngredientPackageResponse,
  CreateIngredientPackageRequest,
  UpdateIngredientPackageRequest,
} from '@/types/api';

const BASE = '/api';

class ApiClientError extends Error {
  status: number;
  details?: string;

  constructor(status: number, error: string, details?: string) {
    super(error);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorBody: ApiError = { error: res.statusText };
    try {
      errorBody = await res.json();
    } catch {
      // response body not JSON
    }
    throw new ApiClientError(res.status, errorBody.error, errorBody.details);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

async function requestNoContentType<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    let errorBody: ApiError = { error: res.statusText };
    try {
      errorBody = await res.json();
    } catch {
      // response body not JSON
    }
    throw new ApiClientError(res.status, errorBody.error, errorBody.details);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// === Auth ===
export const auth = {
  register: (data: RegisterRequest) =>
    request<UserResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: LoginRequest) =>
    request<UserResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),

  me: () =>
    request<UserResponse>('/auth/me'),
};

// === Ingredients ===
export const ingredients = {
  list: (search?: string) =>
    request<IngredientResponse[]>(`/ingredients${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  get: (id: number) =>
    request<IngredientResponse>(`/ingredients/${id}`),

  create: (data: CreateIngredientRequest) =>
    request<IngredientResponse>('/ingredients', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: UpdateIngredientRequest) =>
    request<IngredientResponse>(`/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number) =>
    request<void>(`/ingredients/${id}`, { method: 'DELETE' }),
};

// === Recipes ===
export const recipes = {
  list: (search?: string) =>
    request<RecipeListResponse[]>(`/recipes${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  get: (id: number) =>
    request<RecipeDetailResponse>(`/recipes/${id}`),

  create: (data: CreateRecipeRequest) =>
    request<RecipeDetailResponse>('/recipes', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: UpdateRecipeRequest) =>
    request<RecipeDetailResponse>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number) =>
    request<void>(`/recipes/${id}`, { method: 'DELETE' }),

  uploadImage: (id: number, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return requestNoContentType<{ imagePath: string }>(`/recipes/${id}/image`, { method: 'POST', body: form });
  },

  deleteImage: (id: number) =>
    request<void>(`/recipes/${id}/image`, { method: 'DELETE' }),
};

// === Meal Plans ===
export const mealPlans = {
  list: (from: string, to: string) =>
    request<MealPlanResponse[]>(`/mealplan?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),

  create: (data: CreateMealPlanRequest) =>
    request<MealPlanResponse>('/mealplan', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: UpdateMealPlanRequest) =>
    request<MealPlanResponse>(`/mealplan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number) =>
    request<void>(`/mealplan/${id}`, { method: 'DELETE' }),
};

// === Pantry ===
export const pantry = {
  list: () =>
    request<PantryItemResponse[]>('/pantry'),

  set: (ingredientId: number, data: SetPantryQuantityRequest) =>
    request<PantryItemResponse>(`/pantry/${ingredientId}`, { method: 'PUT', body: JSON.stringify(data) }),

  adjust: (data: AdjustPantryRequest) =>
    request<{ updated: PantryItemResponse[] }>('/pantry/adjust', { method: 'POST', body: JSON.stringify(data) }),

  consumeRecipe: (data: ConsumeRecipeRequest) =>
    request<{ updated: PantryItemResponse[] }>('/pantry/consume-recipe', { method: 'POST', body: JSON.stringify(data) }),

  delete: (ingredientId: number) =>
    request<void>(`/pantry/${ingredientId}`, { method: 'DELETE' }),
};

// === Shopping List ===
export const shoppingList = {
  generate: (data: GenerateShoppingListRequest) =>
    request<GeneratedShoppingListResponse>('/shopping-list/generate', { method: 'POST', body: JSON.stringify(data) }),

  save: (data: SaveShoppingListRequest) =>
    request<ShoppingListResponse>('/shopping-list/save', { method: 'POST', body: JSON.stringify(data) }),

  get: () =>
    request<ShoppingListResponse>('/shopping-list'),

  updateItem: (id: number, data: UpdateShoppingListItemRequest) =>
    request<ShoppingListItemResponse>(`/shopping-list/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  clear: () =>
    request<void>('/shopping-list', { method: 'DELETE' }),
};

// === Users ===
export const users = {
  list: () =>
    request<UserResponse[]>('/users'),

  get: (id: number) =>
    request<UserResponse>(`/users/${id}`),

  update: (id: number, data: UpdateUserRequest) =>
    request<UserResponse>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// === Ingredient Packages ===
export const ingredientPackages = {
  list: (ingredientId: number) =>
    request<IngredientPackageResponse[]>(`/ingredients/${ingredientId}/packages`),

  create: (ingredientId: number, data: CreateIngredientPackageRequest) =>
    request<IngredientPackageResponse>(`/ingredients/${ingredientId}/packages`, { method: 'POST', body: JSON.stringify(data) }),

  update: (ingredientId: number, id: number, data: UpdateIngredientPackageRequest) =>
    request<IngredientPackageResponse>(`/ingredients/${ingredientId}/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (ingredientId: number, id: number) =>
    request<void>(`/ingredients/${ingredientId}/packages/${id}`, { method: 'DELETE' }),
};

export { ApiClientError };
