# Meal Planner API Documentation

Base URL: `/api`

All request/response bodies use `application/json`.

---

## Table of Contents

- [Data Types & Conventions](#data-types--conventions)
- [Authentication](#authentication)
- [Ingredient Categories](#ingredient-categories)
- [Ingredients](#ingredients)
- [Ingredient Substitutions](#ingredient-substitutions)
- [Recipes](#recipes)
- [Meal Plans](#meal-plans)
- [Pantry](#pantry)
- [Shopping List](#shopping-list)
- [Users](#users)
- [Ingredient Packages](#ingredient-packages)

---

## Data Types & Conventions

### Base Units

All quantities are stored internally using base units:

| Unit   | Description       | Examples               |
| ------ | ----------------- | ---------------------- |
| `g`    | Grams             | Flour, sugar, chicken  |
| `ml`   | Millilitres        | Milk, oil, water       |
| `pcs`  | Pieces / count    | Eggs, onions, apples   |

### IDs

All entity IDs are integers, auto-incremented by the database.

### Timestamps

All timestamps are ISO 8601 format in UTC: `2026-03-30T14:30:00Z`

### Error Responses

All errors return a consistent shape:

```json
{
  "error": "string",
  "details": "string (optional)"
}
```

| Status Code | Meaning                    |
| ----------- | -------------------------- |
| 400         | Bad request / validation   |
| 401         | Unauthorized               |
| 404         | Resource not found         |
| 409         | Conflict (duplicate, etc.) |
| 500         | Internal server error      |

---

## Authentication

Simple cookie-based authentication for v1. All endpoints except login/register require authentication.

### POST `/api/auth/register`

Register a new user.

**Request:**

```json
{
  "name": "string (required, 1-100 chars)",
  "email": "string (optional)",
  "password": "string (required, min 6 chars)"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}
```

### POST `/api/auth/login`

**Request:**

```json
{
  "name": "string (required)",
  "password": "string (required)"
}
```

**Response:** `200 OK` — Sets authentication cookie.

```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}
```

### POST `/api/auth/logout`

**Response:** `204 No Content` — Clears authentication cookie.

### GET `/api/auth/me`

Get the currently authenticated user from the session cookie. Use this on page load to restore the session.

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}
```

**Response:** `401 Unauthorized` — No valid session cookie.

---

## Ingredient Categories

Categories group related ingredients together (e.g. "Rice" groups Basmati Rice, Jasmine Rice, etc.).

### GET `/api/ingredient-categories`

List all ingredient categories.

**Query Parameters:**

| Param    | Type   | Description                          |
| -------- | ------ | ------------------------------------ |
| `search` | string | Filter by name (case-insensitive)    |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Rice"
  },
  {
    "id": 2,
    "name": "Flour"
  }
]
```

### GET `/api/ingredient-categories/{id}`

Get a single category with its ingredients.

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Rice",
  "ingredients": [
    {
      "id": 5,
      "name": "Basmati Rice",
      "baseUnit": "g",
      "categoryId": 1,
      "categoryName": "Rice"
    },
    {
      "id": 6,
      "name": "Jasmine Rice",
      "baseUnit": "g",
      "categoryId": 1,
      "categoryName": "Rice"
    }
  ]
}
```

### POST `/api/ingredient-categories`

Create a new category.

**Request:**

```json
{
  "name": "string (required, 1-100 chars, unique)"
}
```

**Response:** `201 Created`

```json
{
  "id": 3,
  "name": "Oil"
}
```

### PUT `/api/ingredient-categories/{id}`

Update a category.

**Request:**

```json
{
  "name": "string (required, 1-100 chars)"
}
```

**Response:** `200 OK` — Returns updated category.

### DELETE `/api/ingredient-categories/{id}`

Delete a category. Fails with `409` if any ingredients are assigned to it.

**Response:** `204 No Content`

---

## Ingredients

Ingredients are shared across all recipes and the pantry. They are normalized (no free-text entries in recipes).

### GET `/api/ingredients`

List all ingredients.

**Query Parameters:**

| Param        | Type    | Description                          |
| ------------ | ------- | ------------------------------------ |
| `search`     | string  | Filter by name (case-insensitive)    |
| `categoryId` | integer | Filter by category ID                |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Flour",
    "baseUnit": "g",
    "categoryId": 2,
    "categoryName": "Flour"
  },
  {
    "id": 2,
    "name": "Milk",
    "baseUnit": "ml",
    "categoryId": null,
    "categoryName": null
  }
]
```

### GET `/api/ingredients/{id}`

Get a single ingredient by ID.

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Flour",
  "baseUnit": "g",
  "categoryId": 2,
  "categoryName": "Flour"
}
```

### POST `/api/ingredients`

Create a new ingredient.

**Request:**

```json
{
  "name": "string (required, 1-200 chars, unique)",
  "baseUnit": "string (required, one of: g, ml, pcs)",
  "categoryId": "integer (optional, must reference existing category)"
}
```

**Response:** `201 Created`

```json
{
  "id": 3,
  "name": "Eggs",
  "baseUnit": "pcs",
  "categoryId": null,
  "categoryName": null
}
```

### PUT `/api/ingredients/{id}`

Update an existing ingredient.

**Request:**

```json
{
  "name": "string (required)",
  "baseUnit": "string (required)",
  "categoryId": "integer (optional)"
}
```

**Response:** `200 OK` — Returns updated ingredient.

### DELETE `/api/ingredients/{id}`

Delete an ingredient. Fails with `409` if the ingredient is used in any recipe or pantry item.

**Response:** `204 No Content`

---

## Ingredient Substitutions

Define replacement relationships between ingredients (e.g., Basmati Rice can substitute for Jasmine Rice). Substitutions are bidirectional — creating one from A→B also makes B→A visible.

### GET `/api/ingredients/{ingredientId}/substitutions`

List all substitutions for an ingredient (both directions).

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "ingredientId": 5,
    "ingredientName": "Basmati Rice",
    "substituteId": 6,
    "substituteName": "Jasmine Rice",
    "note": "Similar cooking time; jasmine is slightly stickier"
  }
]
```

### POST `/api/ingredients/{ingredientId}/substitutions`

Add a substitution for an ingredient.

**Request:**

```json
{
  "substituteId": "integer (required, must reference a different existing ingredient)",
  "note": "string (optional, max 500 chars)"
}
```

**Response:** `201 Created` — Returns created substitution.

### PUT `/api/ingredients/{ingredientId}/substitutions/{id}`

Update a substitution's note.

**Request:**

```json
{
  "note": "string (optional)"
}
```

**Response:** `200 OK` — Returns updated substitution.

### DELETE `/api/ingredients/{ingredientId}/substitutions/{id}`

Delete a substitution.

**Response:** `204 No Content`

---

## Recipes

### GET `/api/recipes`

List all recipes.

**Query Parameters:**

| Param    | Type   | Description                        |
| -------- | ------ | ---------------------------------- |
| `search` | string | Filter by name (case-insensitive)  |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Pancakes",
    "servings": 4,
    "createdBy": 1,
    "createdByName": "Alice",
    "createdAt": "2026-03-30T10:00:00Z"
  }
]
```

### GET `/api/recipes/{id}`

Get full recipe details including ingredients and instructions.

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Pancakes",
  "instructions": "Mix flour and milk...",
  "servings": 4,
  "imagePath": "/uploads/recipes/1.jpg",
  "createdBy": 1,
  "createdByName": "Alice",
  "createdAt": "2026-03-30T10:00:00Z",
  "ingredients": [
    {
      "id": 1,
      "ingredientId": 1,
      "ingredientName": "Flour",
      "quantity": 200,
      "unit": "g"
    },
    {
      "id": 2,
      "ingredientId": 2,
      "ingredientName": "Milk",
      "quantity": 300,
      "unit": "ml"
    }
  ]
}
```

### POST `/api/recipes`

Create a new recipe.

**Request:**

```json
{
  "name": "string (required, 1-200 chars)",
  "instructions": "string (optional)",
  "servings": "integer (required, min 1)",
  "ingredients": [
    {
      "ingredientId": "integer (required)",
      "quantity": "number (required, > 0)"
    }
  ]
}
```

**Response:** `201 Created` — Returns full recipe (same shape as GET).

### PUT `/api/recipes/{id}`

Update a recipe. Replaces the full ingredient list.

**Request:** Same shape as POST.

**Response:** `200 OK` — Returns updated recipe.

### DELETE `/api/recipes/{id}`

Delete a recipe. Also removes associated meal plan entries.

**Response:** `204 No Content`

### POST `/api/recipes/{id}/image`

Upload a recipe image. Content-Type: `multipart/form-data`.

**Form field:** `image` — JPEG or PNG, max 5 MB.

**Response:** `200 OK`

```json
{
  "imagePath": "/uploads/recipes/1.jpg"
}
```

### DELETE `/api/recipes/{id}/image`

Remove a recipe's image.

**Response:** `204 No Content`

---

## Meal Plans

Meal plans assign recipes to calendar dates. The household shares a single meal plan.

### GET `/api/mealplan`

Get meal plan entries for a date range.

**Query Parameters (required):**

| Param  | Type   | Description               | Example      |
| ------ | ------ | ------------------------- | ------------ |
| `from` | string | Start date (ISO date)     | `2026-03-30` |
| `to`   | string | End date (ISO date)       | `2026-04-05` |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "date": "2026-03-30",
    "mealType": "dinner",
    "recipeId": 1,
    "recipeName": "Pancakes",
    "servings": 4,
    "userId": 1,
    "userName": "Alice"
  }
]
```

### POST `/api/mealplan`

Add a recipe to the meal plan.

**Request:**

```json
{
  "date": "string (required, ISO date)",
  "mealType": "string (required, one of: breakfast, lunch, dinner, snack)",
  "recipeId": "integer (required)",
  "servings": "integer (required, min 1)",
  "userId": "integer (optional, assign to specific user)"
}
```

**Response:** `201 Created` — Returns created entry (same shape as GET item).

### PUT `/api/mealplan/{id}`

Update a meal plan entry (change date, recipe, servings, etc.).

**Request:** Same shape as POST.

**Response:** `200 OK` — Returns updated entry.

### DELETE `/api/mealplan/{id}`

Remove a meal plan entry.

**Response:** `204 No Content`

---

## Pantry

The pantry is shared across all household users. Tracks current stock of ingredients.

### GET `/api/pantry`

List all pantry items.

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "ingredientId": 1,
    "ingredientName": "Flour",
    "quantity": 500,
    "unit": "g",
    "updatedAt": "2026-03-30T10:00:00Z"
  }
]
```

### PUT `/api/pantry/{ingredientId}`

Set the quantity of an ingredient in the pantry. Creates the entry if it doesn't exist.

**Request:**

```json
{
  "quantity": "number (required, >= 0)"
}
```

**Response:** `200 OK` — Returns updated pantry item.

### POST `/api/pantry/adjust`

Adjust pantry quantities by a delta (positive to add, negative to subtract). Useful for logging consumption after cooking.

**Request:**

```json
{
  "adjustments": [
    {
      "ingredientId": "integer (required)",
      "delta": "number (required)"
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "updated": [
    {
      "ingredientId": 1,
      "ingredientName": "Flour",
      "quantity": 300,
      "unit": "g"
    }
  ]
}
```

### POST `/api/pantry/consume-recipe`

Subtract the ingredients used by a recipe (scaled by servings) from the pantry.

**Request:**

```json
{
  "recipeId": "integer (required)",
  "servings": "integer (required, min 1)"
}
```

**Response:** `200 OK` — Returns list of updated pantry items.

### DELETE `/api/pantry/{ingredientId}`

Remove an ingredient from the pantry entirely.

**Response:** `204 No Content`

---

## Shopping List

The shopping list is generated from meal plan entries and pantry stock.

### POST `/api/shopping-list/generate`

Generate a shopping list from selected meal plan entries.

**Request:**

```json
{
  "mealPlanIds": ["integer array (required, at least 1)"],
  "subtractPantry": "boolean (default: true)",
  "applyPackages": "boolean (default: true)"
}
```

**Response:** `200 OK`

```json
{
  "items": [
    {
      "ingredientId": 1,
      "ingredientName": "Flour",
      "requiredQuantity": 400,
      "pantryQuantity": 200,
      "neededQuantity": 200,
      "unit": "g",
      "packages": [
        {
          "packageId": 1,
          "label": "1kg bag",
          "packageQuantity": 1000,
          "count": 1,
          "leftover": 800
        }
      ]
    }
  ],
  "generatedAt": "2026-03-30T14:30:00Z"
}
```

### POST `/api/shopping-list/save`

Save the current generated shopping list for later reference.

**Request:**

```json
{
  "items": [
    {
      "ingredientId": "integer (required)",
      "quantity": "number (required)",
      "checked": "boolean (default: false)"
    }
  ]
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "createdAt": "2026-03-30T14:30:00Z",
  "items": [...]
}
```

### GET `/api/shopping-list`

Get the current saved shopping list.

**Response:** `200 OK`

```json
{
  "id": 1,
  "createdAt": "2026-03-30T14:30:00Z",
  "items": [
    {
      "id": 1,
      "ingredientId": 1,
      "ingredientName": "Flour",
      "quantity": 1000,
      "unit": "g",
      "checked": false
    }
  ]
}
```

### PATCH `/api/shopping-list/items/{id}`

Toggle or update a shopping list item (e.g., mark as checked).

**Request:**

```json
{
  "checked": "boolean (required)"
}
```

**Response:** `200 OK` — Returns updated item.

### DELETE `/api/shopping-list`

Clear the saved shopping list.

**Response:** `204 No Content`

---

## Users

### GET `/api/users`

List all household users.

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com"
  }
]
```

### GET `/api/users/{id}`

Get a single user.

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}
```

### PUT `/api/users/{id}`

Update user profile (name, email). Users can only update their own profile.

**Request:**

```json
{
  "name": "string (required)",
  "email": "string (optional)"
}
```

**Response:** `200 OK` — Returns updated user.

---

## Ingredient Packages

Define purchasable package sizes for ingredients. Used during shopping list generation.

### GET `/api/ingredients/{ingredientId}/packages`

List all package sizes for an ingredient.

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "ingredientId": 1,
    "label": "1kg bag",
    "packageQuantity": 1000,
    "unit": "g"
  },
  {
    "id": 2,
    "ingredientId": 1,
    "label": "500g bag",
    "packageQuantity": 500,
    "unit": "g"
  }
]
```

### POST `/api/ingredients/{ingredientId}/packages`

Add a package size for an ingredient.

**Request:**

```json
{
  "label": "string (required, 1-100 chars)",
  "packageQuantity": "number (required, > 0)",
  "unit": "string (required, one of: g, ml, pcs)"
}
```

**Response:** `201 Created` — Returns created package.

### PUT `/api/ingredients/{ingredientId}/packages/{id}`

Update a package size.

**Request:** Same shape as POST.

**Response:** `200 OK` — Returns updated package.

### DELETE `/api/ingredients/{ingredientId}/packages/{id}`

Delete a package size.

**Response:** `204 No Content`

---

## Summary of Endpoints

| Method | Endpoint                                    | Description                        |
| ------ | ------------------------------------------- | ---------------------------------- |
| POST   | `/api/auth/register`                        | Register user                      |
| POST   | `/api/auth/login`                           | Login                              |
| POST   | `/api/auth/logout`                          | Logout                             |
| GET    | `/api/auth/me`                              | Get current user session           |
| GET    | `/api/ingredient-categories`                | List ingredient categories         |
| GET    | `/api/ingredient-categories/{id}`           | Get category with ingredients      |
| POST   | `/api/ingredient-categories`                | Create ingredient category         |
| PUT    | `/api/ingredient-categories/{id}`           | Update ingredient category         |
| DELETE | `/api/ingredient-categories/{id}`           | Delete ingredient category         |
| GET    | `/api/ingredients`                          | List ingredients                   |
| GET    | `/api/ingredients/{id}`                     | Get ingredient                     |
| POST   | `/api/ingredients`                          | Create ingredient                  |
| PUT    | `/api/ingredients/{id}`                     | Update ingredient                  |
| DELETE | `/api/ingredients/{id}`                     | Delete ingredient                  |
| GET    | `/api/ingredients/{id}/substitutions`       | List substitutions                 |
| POST   | `/api/ingredients/{id}/substitutions`       | Create substitution                |
| PUT    | `/api/ingredients/{id}/substitutions/{sId}` | Update substitution                |
| DELETE | `/api/ingredients/{id}/substitutions/{sId}` | Delete substitution                |
| GET    | `/api/recipes`                              | List recipes                       |
| GET    | `/api/recipes/{id}`                         | Get recipe with details            |
| POST   | `/api/recipes`                              | Create recipe                      |
| PUT    | `/api/recipes/{id}`                         | Update recipe                      |
| DELETE | `/api/recipes/{id}`                         | Delete recipe                      |
| POST   | `/api/recipes/{id}/image`                   | Upload recipe image                |
| DELETE | `/api/recipes/{id}/image`                   | Remove recipe image                |
| GET    | `/api/mealplan`                             | Get meal plan (date range)         |
| POST   | `/api/mealplan`                             | Add to meal plan                   |
| PUT    | `/api/mealplan/{id}`                        | Update meal plan entry             |
| DELETE | `/api/mealplan/{id}`                        | Remove meal plan entry             |
| GET    | `/api/pantry`                               | List pantry items                  |
| PUT    | `/api/pantry/{ingredientId}`                | Set pantry quantity                |
| POST   | `/api/pantry/adjust`                        | Batch adjust pantry                |
| POST   | `/api/pantry/consume-recipe`                | Subtract recipe from pantry        |
| DELETE | `/api/pantry/{ingredientId}`                | Remove from pantry                 |
| POST   | `/api/shopping-list/generate`               | Generate shopping list             |
| POST   | `/api/shopping-list/save`                   | Save shopping list                 |
| GET    | `/api/shopping-list`                        | Get saved shopping list            |
| PATCH  | `/api/shopping-list/items/{id}`             | Update shopping list item          |
| DELETE | `/api/shopping-list`                        | Clear shopping list                |
| GET    | `/api/users`                                | List users                         |
| GET    | `/api/users/{id}`                           | Get user                           |
| PUT    | `/api/users/{id}`                           | Update user profile                |
| GET    | `/api/ingredients/{id}/packages`            | List ingredient packages           |
| POST   | `/api/ingredients/{id}/packages`            | Create ingredient package          |
| PUT    | `/api/ingredients/{id}/packages/{pkgId}`    | Update ingredient package          |
| DELETE | `/api/ingredients/{id}/packages/{pkgId}`    | Delete ingredient package          |
