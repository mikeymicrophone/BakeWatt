# Issue #2: Recipe Collection System

**Type:** Epic  
**Priority:** High  
**Labels:** `core-feature`, `recipe-system`, `backend`

## Description

Implement the recipe management system that allows players to collect, store, and use baking recipes with ingredient requirements.

## User Story

As a player, I want to collect and manage baking recipes so that I can choose what to bake and understand ingredient requirements.

## Acceptance Criteria

- [ ] Create `Recipe` domain model:
  - `id: string` - unique identifier
  - `name: string` - recipe name (e.g., "Chocolate Chip Cookies")
  - `description: string` - brief description
  - `baseServings: number` - default serving size
  - `ingredients: IngredientAmount[]` - required ingredients with amounts
  - `difficulty: RecipeDifficulty` - enum (Easy, Medium, Hard)
  - `bakingTime: number` - time in minutes
  - `icon: string` - recipe image/icon path
- [ ] Create `RecipeCollection` aggregate:
  - `recipes: Map<string, Recipe>` - owned recipes
  - `addRecipe(recipe: Recipe)` - collect new recipe
  - `getRecipe(id: string): Recipe | null` - retrieve recipe
  - `getAllRecipes(): Recipe[]` - list all collected recipes
  - `canMake(recipeId: string, pantry: Pantry): boolean` - check if makeable
- [ ] Implement recipe scaling for different serving sizes:
  - `scaleRecipe(recipe: Recipe, servings: number): Recipe` - multiplication math
- [ ] Create predefined recipe library with starter recipes
- [ ] Recipe repository/service for persistence

## Technical Notes

- Store in `/src/domain/baking/`
- Integrate with ingredient system from Issue #1
- Use immutable patterns for recipe scaling
- Consider recipe unlocking progression for future features

## Starter Recipe (Default)

**Simple Cookies** (Base: 2 servings)
- Flour: 2 cups
- Butter: 1 stick  
- Eggs: 1 piece

## Definition of Done

- [ ] All acceptance criteria completed
- [ ] Recipe scaling math correctly implemented
- [ ] Integration tests with ingredient system
- [ ] TypeScript compilation passes
- [ ] Unit tests with 80%+ coverage

## Related Issues

- Depends on: #1 (Ingredient System)
- Blocks: #3 (Multiplication Math), #5 (Addition Math), #6 (Initial Game State)

## Estimated Effort

**3-4 hours** - Domain models, scaling logic, and integration