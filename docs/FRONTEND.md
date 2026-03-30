# Frontend Architecture Documentation

## Overview

The frontend is a React single-page application built with Vite, TypeScript, and React Router. It provides a complete UI for the Dinner meal planning system, including authentication, recipe management, meal planning, pantry tracking, shopping list generation, ingredient management, and user profiles.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Routing](#routing)
- [Authentication](#authentication)
- [API Client](#api-client)
- [TypeScript Types](#typescript-types)
- [Pages](#pages)
  - [Login Page](#login-page)
  - [Register Page](#register-page)
  - [Recipes Page](#recipes-page)
  - [Recipe Detail Page](#recipe-detail-page)
  - [Meal Plan Page](#meal-plan-page)
  - [Pantry Page](#pantry-page)
  - [Shopping List Page](#shopping-list-page)
  - [Ingredients Page](#ingredients-page)
  - [Users Page](#users-page)
- [Layouts](#layouts)
- [Styling](#styling)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [File Reference](#file-reference)

---

## Tech Stack

| Technology      | Version   | Purpose                          |
| --------------- | --------- | -------------------------------- |
| React           | ^19.2.4   | UI framework                     |
| React DOM       | ^19.2.4   | DOM rendering                    |
| React Router    | ^7.13.2   | Client-side routing              |
| TypeScript      | ~5.9.3    | Type safety                      |
| Vite            | ^8.0.1    | Build tool & dev server          |
| @vitejs/plugin-react | ^6.0.1 | React Fast Refresh for Vite   |

No additional UI libraries, state management libraries, or CSS frameworks are used. The app uses plain CSS with CSS custom properties.

---

## Project Structure

```
frontend/
├── index.html                    # HTML entry point
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript project references
├── tsconfig.app.json             # App TypeScript config (with @ alias)
├── tsconfig.node.json            # Node TypeScript config (vite.config)
├── vite.config.ts                # Vite configuration (proxy, aliases)
├── eslint.config.js              # ESLint configuration
├── public/                       # Static assets (served as-is)
└── src/
    ├── main.tsx                  # Application entry point
    ├── App.tsx                   # Root component (routing setup)
    ├── index.css                 # Global styles & design system
    ├── App.css                   # (unused, can be removed)
    ├── api/
    │   └── client.ts             # API client (all HTTP calls)
    ├── types/
    │   └── api.ts                # TypeScript interfaces for API DTOs
    ├── contexts/
    │   └── AuthContext.tsx        # Authentication context provider
    ├── layouts/
    │   └── AppLayout.tsx         # Main app shell (sidebar + content)
    └── pages/
        ├── LoginPage.tsx         # Login form
        ├── RegisterPage.tsx      # Registration form
        ├── RecipesPage.tsx       # Recipe list with search
        ├── RecipeDetailPage.tsx  # Recipe view/create/edit
        ├── MealPlanPage.tsx      # Weekly meal plan calendar
        ├── PantryPage.tsx        # Pantry inventory management
        ├── ShoppingListPage.tsx  # Shopping list generation & management
        ├── IngredientsPage.tsx   # Ingredient CRUD + packages
        └── UsersPage.tsx         # User list & profile editing
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm
- Backend server running on `http://localhost:5052`

### Install Dependencies

```bash
cd frontend
npm install
```

### Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173`. API calls are proxied to the backend.

### Production Build

```bash
npm run build
```

Output goes to `frontend/dist/`.

### Type Check

```bash
npx tsc -b
```

### Lint

```bash
npm run lint
```

---

## Configuration

### Vite Config (`vite.config.ts`)

| Setting | Value | Description |
| ------- | ----- | ----------- |
| `resolve.alias.@` | `./src` | Path alias for clean imports |
| `server.proxy./api` | `http://localhost:5052` | Proxies API calls to backend |
| `server.proxy./uploads` | `http://localhost:5052` | Proxies image file requests |

### TypeScript Config (`tsconfig.app.json`)

- **Target**: ES2023
- **Module**: ESNext with bundler resolution
- **Strict mode**: Enabled
- **Path alias**: `@/*` → `./src/*`
- **JSX**: react-jsx (automatic runtime)
- **No unused locals/params**: Enforced

---

## Architecture

### Data Flow

```
User Action → Page Component → API Client → Backend API
                    ↓
              State Update → Re-render
```

### Patterns Used

1. **Container Pages**: Each page manages its own data fetching and state
2. **Context for Auth**: Global auth state via React Context
3. **Centralized API Client**: All HTTP calls go through `api/client.ts`
4. **Typed API Layer**: Every request/response has a TypeScript interface
5. **Modal Dialogs**: CRUD operations use in-page modal overlays
6. **Optimistic UI**: Lists refresh after mutations via callback

---

## Routing

Defined in `App.tsx` using React Router v7.

### Public Routes (unauthenticated)

| Path | Component | Description |
| ---- | --------- | ----------- |
| `/login` | `LoginPage` | User login form |
| `/register` | `RegisterPage` | User registration form |

### Protected Routes (authenticated)

| Path | Component | Description |
| ---- | --------- | ----------- |
| `/` | Redirect | Redirects to `/recipes` |
| `/recipes` | `RecipesPage` | Recipe list |
| `/recipes/new` | `RecipeDetailPage` | Create new recipe |
| `/recipes/:id` | `RecipeDetailPage` | View/edit recipe |
| `/meal-plan` | `MealPlanPage` | Weekly meal plan calendar |
| `/pantry` | `PantryPage` | Pantry inventory |
| `/shopping-list` | `ShoppingListPage` | Shopping list |
| `/ingredients` | `IngredientsPage` | Ingredient management |
| `/users` | `UsersPage` | User profiles |

### Route Guards

- `ProtectedRoutes`: Checks `useAuth().user` — redirects to `/login` if not authenticated
- `AuthRoutes`: Checks `useAuth().user` — redirects to `/recipes` if already authenticated

---

## Authentication

### Implementation (`contexts/AuthContext.tsx`)

Uses React Context to provide auth state globally.

#### State

| Field | Type | Description |
| ----- | ---- | ----------- |
| `user` | `UserResponse \| null` | Currently logged-in user |
| `loading` | `boolean` | True during session validation on mount |

#### Methods

| Method | Parameters | Description |
| ------ | ---------- | ----------- |
| `login` | `name: string, password: string` | Calls `POST /api/auth/login`, sets user in state |
| `register` | `name: string, password: string, email?: string` | Calls register then auto-login |
| `logout` | none | Calls `POST /api/auth/logout`, clears user state |

#### Session Persistence

- The backend sets an `httponly` cookie (`user_id`) on login — not readable by JavaScript
- On app mount, the context calls `GET /api/auth/me` to restore the session from the cookie
- If the cookie is missing or invalid, `/auth/me` returns 401 and the user sees the login page
- No client-side storage (sessionStorage/localStorage) is used for auth state

#### Usage

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  // user is UserResponse | null
}
```

---

## API Client

### Location: `src/api/client.ts`

Centralized HTTP client wrapping the `fetch` API. All methods use the Vite proxy (requests go to `/api/...`).

### Configuration

- **Base URL**: `/api` (proxied to backend)
- **Credentials**: `include` (sends cookies cross-origin)
- **Content-Type**: `application/json` (except file uploads)

### Error Handling

All API errors throw `ApiClientError`:

```typescript
class ApiClientError extends Error {
  status: number;      // HTTP status code
  details?: string;    // Optional error details from API
}
```

### Available Namespaces

#### `auth`

| Method | API Call | Returns |
| ------ | -------- | ------- |
| `auth.register(data)` | `POST /api/auth/register` | `UserResponse` |
| `auth.login(data)` | `POST /api/auth/login` | `UserResponse` |
| `auth.logout()` | `POST /api/auth/logout` | `void` |
| `auth.me()` | `GET /api/auth/me` | `UserResponse` |

#### `ingredients`

| Method | API Call | Returns |
| ------ | -------- | ------- |
| `ingredients.list(search?)` | `GET /api/ingredients` | `IngredientResponse[]` |
| `ingredients.get(id)` | `GET /api/ingredients/{id}` | `IngredientResponse` |
| `ingredients.create(data)` | `POST /api/ingredients` | `IngredientResponse` |
| `ingredients.update(id, data)` | `PUT /api/ingredients/{id}` | `IngredientResponse` |
| `ingredients.delete(id)` | `DELETE /api/ingredients/{id}` | `void` |

#### `recipes`

| Method | API Call | Returns |
| ------ | -------- | ------- |
| `recipes.list(search?)` | `GET /api/recipes` | `RecipeListResponse[]` |
| `recipes.get(id)` | `GET /api/recipes/{id}` | `RecipeDetailResponse` |
| `recipes.create(data)` | `POST /api/recipes` | `RecipeDetailResponse` |
| `recipes.update(id, data)` | `PUT /api/recipes/{id}` | `RecipeDetailResponse` |
| `recipes.delete(id)` | `DELETE /api/recipes/{id}` | `void` |
| `recipes.uploadImage(id, file)` | `POST /api/recipes/{id}/image` | `{ imagePath }` |
| `recipes.deleteImage(id)` | `DELETE /api/recipes/{id}/image` | `void` |

#### `mealPlans`

| Method | API Call | Returns |
| ------ | -------- | ------- |
| `mealPlans.list(from, to)` | `GET /api/mealplan?from=&to=` | `MealPlanResponse[]` |
| `mealPlans.create(data)` | `POST /api/mealplan` | `MealPlanResponse` |
| `mealPlans.update(id, data)` | `PUT /api/mealplan/{id}` | `MealPlanResponse` |
| `mealPlans.delete(id)` | `DELETE /api/mealplan/{id}` | `void` |

#### `pantry`

| Method | API Call | Returns |
| ------ | -------- | ------- |
| `pantry.list()` | `GET /api/pantry` | `PantryItemResponse[]` |
| `pantry.set(ingredientId, data)` | `PUT /api/pantry/{id}` | `PantryItemResponse` |
| `pantry.adjust(data)` | `POST /api/pantry/adjust` | `{ updated: PantryItemResponse[] }` |
| `pantry.consumeRecipe(data)` | `POST /api/pantry/consume-recipe` | `{ updated: PantryItemResponse[] }` |
| `pantry.delete(ingredientId)` | `DELETE /api/pantry/{id}` | `void` |

#### `shoppingList`

| Method | API Call | Returns |
| ------ | -------- | ------- |
| `shoppingList.generate(data)` | `POST /api/shopping-list/generate` | `GeneratedShoppingListResponse` |
| `shoppingList.save(data)` | `POST /api/shopping-list/save` | `ShoppingListResponse` |
| `shoppingList.get()` | `GET /api/shopping-list` | `ShoppingListResponse` |
| `shoppingList.updateItem(id, data)` | `PATCH /api/shopping-list/items/{id}` | `ShoppingListItemResponse` |
| `shoppingList.clear()` | `DELETE /api/shopping-list` | `void` |

#### `users`

| Method | API Call | Returns |
| ------ | -------- | ------- |
| `users.list()` | `GET /api/users` | `UserResponse[]` |
| `users.get(id)` | `GET /api/users/{id}` | `UserResponse` |
| `users.update(id, data)` | `PUT /api/users/{id}` | `UserResponse` |

#### `ingredientPackages`

| Method | API Call | Returns |
| ------ | -------- | ------- |
| `ingredientPackages.list(ingredientId)` | `GET /api/ingredients/{id}/packages` | `IngredientPackageResponse[]` |
| `ingredientPackages.create(ingredientId, data)` | `POST /api/ingredients/{id}/packages` | `IngredientPackageResponse` |
| `ingredientPackages.update(ingredientId, id, data)` | `PUT /api/ingredients/{id}/packages/{pkgId}` | `IngredientPackageResponse` |
| `ingredientPackages.delete(ingredientId, id)` | `DELETE /api/ingredients/{id}/packages/{pkgId}` | `void` |

---

## TypeScript Types

### Location: `src/types/api.ts`

All types mirror the backend DTOs exactly. They are organized by domain:

#### Auth Types

| Type | Fields | Usage |
| ---- | ------ | ----- |
| `RegisterRequest` | name, email?, password | Registration form payload |
| `LoginRequest` | name, password | Login form payload |
| `UserResponse` | id, name, email | Auth response & user display |

#### Ingredient Types

| Type | Fields | Usage |
| ---- | ------ | ----- |
| `IngredientResponse` | id, name, baseUnit | Ingredient display |
| `CreateIngredientRequest` | name, baseUnit | Create form payload |
| `UpdateIngredientRequest` | name, baseUnit | Edit form payload |

#### Recipe Types

| Type | Fields | Usage |
| ---- | ------ | ----- |
| `RecipeListResponse` | id, name, servings, createdBy, createdByName, createdAt | Recipe list cards |
| `RecipeDetailResponse` | ...all fields + ingredients[] | Recipe detail view |
| `RecipeIngredientResponse` | id, ingredientId, ingredientName, quantity, unit | Ingredient list in recipe |
| `RecipeIngredientInput` | ingredientId, quantity | Create/update recipe payload |
| `CreateRecipeRequest` | name, instructions?, servings, ingredients[] | Create form payload |
| `UpdateRecipeRequest` | name, instructions?, servings, ingredients[] | Edit form payload |

#### Meal Plan Types

| Type | Fields | Usage |
| ---- | ------ | ----- |
| `MealPlanResponse` | id, date, mealType, recipeId, recipeName, servings, userId?, userName? | Calendar display |
| `CreateMealPlanRequest` | date, mealType, recipeId, servings, userId? | Add meal payload |
| `UpdateMealPlanRequest` | date, mealType, recipeId, servings, userId? | Edit meal payload |

#### Pantry Types

| Type | Fields | Usage |
| ---- | ------ | ----- |
| `PantryItemResponse` | id, ingredientId, ingredientName, quantity, unit, updatedAt | Pantry list |
| `SetPantryQuantityRequest` | quantity | Set quantity payload |
| `PantryAdjustment` | ingredientId, delta | Individual adjustment |
| `AdjustPantryRequest` | adjustments[] | Batch adjust payload |
| `ConsumeRecipeRequest` | recipeId, servings | Consume recipe payload |

#### Shopping List Types

| Type | Fields | Usage |
| ---- | ------ | ----- |
| `GenerateShoppingListRequest` | mealPlanIds[], subtractPantry?, applyPackages? | Generation params |
| `GeneratedShoppingListResponse` | items[], generatedAt | Generated result |
| `GeneratedShoppingItem` | ingredientId, ingredientName, requiredQuantity, pantryQuantity, neededQuantity, unit, packages? | Generated item |
| `ShoppingListPackageInfo` | packageId, label, packageQuantity, count, leftover | Package recommendation |
| `SaveShoppingListRequest` | items[] | Save payload |
| `ShoppingListResponse` | id, createdAt, items[] | Saved list |
| `ShoppingListItemResponse` | id, ingredientId, ingredientName, quantity, unit, checked | Saved item |
| `UpdateShoppingListItemRequest` | checked | Toggle check payload |

#### User Types

| Type | Fields | Usage |
| ---- | ------ | ----- |
| `UpdateUserRequest` | name, email? | Profile update payload |

#### Package Types

| Type | Fields | Usage |
| ---- | ------ | ----- |
| `IngredientPackageResponse` | id, ingredientId, label, packageQuantity, unit | Package display |
| `CreateIngredientPackageRequest` | label, packageQuantity, unit | Create payload |
| `UpdateIngredientPackageRequest` | label, packageQuantity, unit | Update payload |

#### Error Type

| Type | Fields | Usage |
| ---- | ------ | ----- |
| `ApiError` | error, details? | Error response shape |

---

## Pages

### Login Page

**File**: `src/pages/LoginPage.tsx`  
**Route**: `/login`

- Username and password form
- Calls `auth.login()` on submit
- Displays error messages from API
- Link to registration page
- Redirects to `/recipes` on success

### Register Page

**File**: `src/pages/RegisterPage.tsx`  
**Route**: `/register`

- Username, email (optional), password, confirm password form
- Client-side password match validation
- Calls `auth.register()` which auto-logs in
- Displays API error messages
- Link to login page

### Recipes Page

**File**: `src/pages/RecipesPage.tsx`  
**Route**: `/recipes`

- Displays all recipes in a 2-column card grid
- Search bar filters by name (server-side)
- Each card shows name, servings, creator, and delete button
- Click card to navigate to recipe detail
- "New Recipe" button navigates to `/recipes/new`

### Recipe Detail Page

**File**: `src/pages/RecipeDetailPage.tsx`  
**Route**: `/recipes/:id` and `/recipes/new`

**View Mode** (when viewing existing recipe):
- Two-column layout: Details + Ingredients
- Shows name, servings, creator, instructions
- Image display with upload/delete buttons
- Edit button switches to edit mode

**Edit/Create Mode**:
- Form with name, servings, instructions
- Dynamic ingredient rows (add/remove)
- Ingredient dropdown populated from all ingredients
- Quantity input per ingredient
- Save creates or updates recipe

### Meal Plan Page

**File**: `src/pages/MealPlanPage.tsx`  
**Route**: `/meal-plan`

- Weekly calendar view (Monday–Sunday)
- Navigation arrows to move between weeks
- Date range displayed in header
- Today's cell highlighted
- Meal entries color-coded by type:
  - Breakfast: yellow
  - Lunch: green
  - Dinner: blue
  - Snack: pink
- Each meal chip shows recipe name with delete (×) button
- Click chip to edit, click "+ Add" to add new meal
- Add/Edit modal with date, meal type, recipe, servings, user assignment

### Pantry Page

**File**: `src/pages/PantryPage.tsx`  
**Route**: `/pantry`

- Table view of all pantry items
- Color-coded quantity badges:
  - Green: quantity > 100
  - Yellow: quantity 1–100
  - Red: quantity ≤ 0
- Edit button to set exact quantity
- Remove button to delete item
- "Add Item" button with ingredient selector and quantity
- "Consume Recipe" button opens modal to deduct recipe ingredients
  - Select recipe and servings
  - Subtracts scaled quantities from pantry

### Shopping List Page

**File**: `src/pages/ShoppingListPage.tsx`  
**Route**: `/shopping-list`

**Generation Flow**:
1. Click "Generate from Meal Plan"
2. Modal shows next 2 weeks of meal plan entries
3. Select/deselect entries with checkboxes
4. Toggle "Subtract pantry stock" and "Apply package sizes"
5. Click "Generate" → displays result table

**Generated List View**:
- Table with required, pantry, needed quantities per ingredient
- Package recommendations (e.g., "1x 1kg bag")
- "Save List" button persists the list

**Saved List View**:
- Checklist with ingredient name and quantity
- Click checkbox to toggle checked state
- Checked items show strikethrough and reduced opacity
- "Clear List" button deletes saved list

### Ingredients Page

**File**: `src/pages/IngredientsPage.tsx`  
**Route**: `/ingredients`

- Table view of all ingredients with name and base unit
- Search bar for filtering
- "Add Ingredient" button → modal with name and unit selector
- Edit button → same modal pre-filled
- Delete button with confirmation (fails if ingredient is in use)
- "Packages" button → secondary modal showing:
  - Table of existing packages for the ingredient
  - Add/edit form for package (label, quantity, unit)
  - Delete package button

### Users Page

**File**: `src/pages/UsersPage.tsx`  
**Route**: `/users`

- Table of all household users
- Shows name, email, and "You" badge for current user
- Edit button (only for own profile)
- Edit modal allows changing name and email

---

## Layouts

### AppLayout (`src/layouts/AppLayout.tsx`)

The main application shell wrapping all authenticated pages.

**Structure**:
```
┌──────────────┬──────────────────────────────┐
│   Sidebar    │       Main Content           │
│              │       (Outlet)               │
│  • Logo      │                              │
│  • Nav Links │                              │
│  • User Info │                              │
│  • Logout    │                              │
└──────────────┴──────────────────────────────┘
```

**Sidebar Navigation Links**:
- Recipes → `/recipes`
- Meal Plan → `/meal-plan`
- Pantry → `/pantry`
- Shopping List → `/shopping-list`
- Ingredients → `/ingredients`
- Users → `/users`

Active link is highlighted with indigo left border and background.

Footer shows current user name and logout button.

On mobile (< 768px), the sidebar is hidden and content fills full width.

---

## Styling

### Location: `src/index.css`

The project uses a custom design system built with CSS custom properties. No CSS framework is used.

### Design Tokens (CSS Variables)

#### Colors

| Variable | Light | Dark | Usage |
| -------- | ----- | ---- | ----- |
| `--color-bg` | `#f8f9fa` | `#111827` | Page background |
| `--color-surface` | `#ffffff` | `#1f2937` | Cards, sidebar, modals |
| `--color-primary` | `#6366f1` | same | Buttons, links, accents |
| `--color-primary-hover` | `#4f46e5` | same | Button hover |
| `--color-primary-light` | `#eef2ff` | `#312e81` | Active states, highlights |
| `--color-danger` | `#ef4444` | same | Delete buttons, errors |
| `--color-text` | `#1f2937` | `#f9fafb` | Body text |
| `--color-text-muted` | `#6b7280` | `#9ca3af` | Secondary text |
| `--color-border` | `#e5e7eb` | `#374151` | Borders |

#### Spacing

| Variable | Value |
| -------- | ----- |
| `--space-xs` | 0.25rem |
| `--space-sm` | 0.5rem |
| `--space-md` | 1rem |
| `--space-lg` | 1.5rem |
| `--space-xl` | 2rem |
| `--space-2xl` | 3rem |

#### Other Tokens

| Variable | Value | Purpose |
| -------- | ----- | ------- |
| `--radius-sm/md/lg` | 0.375/0.5/0.75rem | Border radius |
| `--shadow-sm/md/lg` | various | Box shadows |
| `--sidebar-width` | 240px | Fixed sidebar width |

### Component Classes

| Class | Description |
| ----- | ----------- |
| `.btn` `.btn-primary/secondary/danger/ghost` | Button variants |
| `.btn-sm` `.btn-icon` | Button size modifiers |
| `.card` `.card-header` `.card-body` | Card container |
| `.form-group` `.form-label` `.form-input` `.form-select` `.form-textarea` | Form elements |
| `.form-row` | Horizontal form layout |
| `.modal-overlay` `.modal` `.modal-header/body/footer` | Modal dialogs |
| `.modal-wide` | Wider modal variant (700px) |
| `.alert` `.alert-error` `.alert-success` | Alert messages |
| `.badge` `.badge-success/warning/danger` | Status badges |
| `.loading-spinner` `.spinner` | Loading indicator |
| `.empty-state` | Empty content placeholder |
| `.calendar-grid` `.calendar-cell` `.calendar-meal` | Calendar components |
| `.shopping-item` | Shopping list checkbox items |
| `.grid-2` `.grid-3` | Grid layouts |

### Dark Mode

Automatically follows system preference via `prefers-color-scheme: dark`. No manual toggle.

### Responsive Breakpoints

| Breakpoint | Behavior |
| ---------- | -------- |
| `> 768px` | Full layout with sidebar |
| `≤ 768px` | Sidebar hidden, single-column layout, stacked forms |

---

## State Management

The app uses **local component state** for all page-level data and **React Context** for auth only.

| Concern | Solution |
| ------- | -------- |
| Authentication | `AuthContext` (React Context + `/auth/me` cookie validation) |
| Page data | `useState` + `useEffect` + `useCallback` per page |
| Form state | `useState` per form field |
| Modals | `useState<boolean>` for visibility |
| Loading | `useState<boolean>` per page |
| Errors | `useState<string>` per page/modal |

No global state management library (Redux, Zustand, etc.) is used. Each page fetches its own data on mount and re-fetches after mutations.

---

## Error Handling

### API Errors

The API client throws `ApiClientError` for all non-2xx responses. Pages catch these and display the error message.

```typescript
try {
  await someApiCall();
} catch (err) {
  if (err instanceof ApiClientError) {
    setError(err.message);  // e.g., "A user with this name already exists."
  } else {
    setError('Something went wrong');
  }
}
```

### Validation

- Client-side validation uses HTML5 form attributes (`required`, `minLength`, `maxLength`, `min`, `type`)
- Server-side validation provides specific error messages via the error response format
- Password confirmation is validated client-side before submission

### 401 Handling

- If a user's session expires (cookie invalid), `GET /api/auth/me` returns 401 on next page load
- The auth context sets `user` to `null`, which triggers the route guard redirect to `/login`
- No automatic retry or token refresh

---

## File Reference

| File | Lines | Description |
| ---- | ----- | ----------- |
| `src/main.tsx` | Entry point, renders App into `#root` |
| `src/App.tsx` | Router setup, auth/protected route guards |
| `src/index.css` | Complete design system and component styles |
| `src/types/api.ts` | All TypeScript interfaces matching backend DTOs |
| `src/api/client.ts` | HTTP client with typed methods for every endpoint |
| `src/contexts/AuthContext.tsx` | Auth state management with session persistence |
| `src/layouts/AppLayout.tsx` | Sidebar + content shell for authenticated pages |
| `src/pages/LoginPage.tsx` | Login form |
| `src/pages/RegisterPage.tsx` | Registration form |
| `src/pages/RecipesPage.tsx` | Recipe list with grid and search |
| `src/pages/RecipeDetailPage.tsx` | Recipe view/create/edit with ingredients |
| `src/pages/MealPlanPage.tsx` | Weekly calendar with meal planning |
| `src/pages/PantryPage.tsx` | Pantry inventory with consume recipe |
| `src/pages/ShoppingListPage.tsx` | Shopping list generation and management |
| `src/pages/IngredientsPage.tsx` | Ingredient and package management |
| `src/pages/UsersPage.tsx` | User profiles |
| `vite.config.ts` | Vite config with proxy and path alias |
| `tsconfig.app.json` | TypeScript config with `@/` path alias |
