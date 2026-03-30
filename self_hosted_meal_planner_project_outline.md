# Self-Hosted Meal Planner & Shopping App

## Overview
A self-hosted meal planning and shopping list application designed for small multi-user households (e.g., a family). The app supports recipe management, meal planning, pantry tracking, automatic shopping list generation, and optional price comparison.

---

## Goals
- Self-hosted and private
- Multi-user (small family)
- Accessible via Tailscale
- Automatic shopping list generation
- Pantry inventory tracking
- Package-size aware shopping recommendations
- Optional store price comparison (future)

---

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Fetch / Axios for API calls

### Backend
- ASP.NET Core (Minimal API)
- Entity Framework Core
- SQLite database

### Infrastructure
- Docker (optional but recommended)
- Tailscale for remote access
- Local file storage for images

---

## Core Features

### 1. Recipe Management
- Create, edit, delete recipes
- Ingredients with quantities and units
- Servings support
- Instructions
- Optional images

### 2. Meal Planning
- Assign recipes to calendar dates
- Multiple meals per day
- Assign meals to users (optional)

### 3. Pantry Tracking
- Track ingredient quantities
- Add/remove/update items
- Optional expiry dates (future)
- Adjust quantities when cooking

### 4. Shopping List Generation
- Aggregate ingredients from selected recipes
- Scale by servings
- Subtract pantry inventory
- Combine duplicate ingredients

### 5. Package Size Conversion
- Define purchasable package sizes
- Round required quantities to nearest package
- Support multiple package sizes per ingredient
- Track leftovers back to pantry

### 6. Multi-User Support
- Simple authentication (JWT or cookie)
- Shared pantry
- Shared meal plan
- Shared shopping list

---

## Future Features
- Store price scraping
- Price comparison between stores
- Barcode scanning
- Pantry low-stock alerts
- Recipe import (URL parsing)
- Offline support (PWA)
- Realtime sync

---

## Database Schema (High-Level)

### Users
- Id
- Name
- Email (optional)
- PasswordHash (optional)

### Recipes
- Id
- Name
- Instructions
- Servings
- CreatedBy

### Ingredients
- Id
- Name
- BaseUnit

### RecipeIngredients
- Id
- RecipeId
- IngredientId
- Quantity

### MealPlans
- Id
- Date
- RecipeId
- UserId (optional)

### PantryItems
- Id
- IngredientId
- Quantity
- UpdatedAt

### IngredientPackages
- Id
- IngredientId
- PackageQuantity
- Unit
- Label

### ShoppingListItems (optional persistence)
- Id
- IngredientId
- Quantity
- Checked

---

## Shopping List Generation Flow

1. Select recipes from meal plan
2. Aggregate ingredients
3. Scale quantities by servings
4. Subtract pantry quantities
5. Apply package conversion
6. Return final shopping list

---

## API Endpoints (Example)

### Recipes
- GET /recipes
- POST /recipes
- PUT /recipes/{id}
- DELETE /recipes/{id}

### Meal Plan
- GET /mealplan
- POST /mealplan

### Pantry
- GET /pantry
- PUT /pantry/{ingredientId}

### Shopping List
- POST /shopping-list/generate
- GET /shopping-list

---

## Deployment

### Local Development
- Run ASP.NET backend
- Run Vite frontend
- SQLite stored locally

### Docker (Optional)
- Single container for API + frontend
- Volume mount for database

### Remote Access
- Install Tailscale on server
- Access via private network

---

## Folder Structure

```
mealplanner/
  frontend/
    src/
    components/
    pages/
  backend/
    Models/
    Data/
    Services/
    Endpoints/
  data/
    mealplanner.db
```

---

## Non-Goals (for v1)
- Public multi-tenant hosting
- Complex user roles
- Payment integration
- Advanced analytics

---

## MVP Scope
- Recipes
- Meal planning
- Pantry tracking
- Shopping list generation
- Package conversion
- Tailscale access

---

## Nice-to-Have After MVP
- Price scraping
- Store comparison
- Leftover tracking
- Mobile UI optimizations

---

## Notes
- Use base units (g, ml, pcs) internally
- Normalize ingredients
- Avoid free-text ingredient entries
- Enable SQLite WAL mode for concurrency

---

## Summary
This project aims to build a private, family-oriented meal planning system that automates grocery shopping by combining recipes, pantry inventory, and smart package-aware purchasing logic, with optional future expansion into price comparison and store integration.

