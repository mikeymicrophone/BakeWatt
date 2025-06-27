# Issue #1: Core Ingredient System

**Type:** Epic  
**Priority:** High  
**Labels:** `core-feature`, `ingredient-system`, `backend`

## Description

Implement the foundational ingredient management system that allows players to track, store, and use ingredients for baking recipes.

## User Story

As a player, I want to manage a pantry of ingredients so that I can use them in recipes and understand resource management through mathematical operations.

## Acceptance Criteria

- [ ] Create `Ingredient` domain model with properties:
  - `id: string` - unique identifier
  - `name: string` - display name (e.g., "Flour", "Butter")
  - `unit: string` - measurement unit (cups, sticks, pieces)
  - `icon: string` - icon path for UI display
- [ ] Create `IngredientAmount` value object:
  - `ingredient: Ingredient` - reference to ingredient
  - `quantity: number` - amount needed/available
- [ ] Implement `Pantry` aggregate:
  - `ingredients: Map<string, number>` - ingredient stock levels
  - `addIngredient(id: string, amount: number)` - increase stock
  - `removeIngredient(id: string, amount: number)` - decrease stock
  - `hasEnough(id: string, amount: number): boolean` - check availability
  - `getStock(id: string): number` - get current amount
- [ ] Create ingredient repository/service for data persistence
- [ ] Implement basic validation for ingredient operations

## Technical Notes

- Use domain-driven design patterns as established in project structure
- Store ingredients in `/src/domain/inventory/`
- Use MobX for reactive state management
- Follow TypeScript strict mode and existing patterns

## Definition of Done

- [ ] All acceptance criteria completed
- [ ] Unit tests written with 80%+ coverage
- [ ] TypeScript compilation passes
- [ ] Code follows established patterns and conventions
- [ ] Documented in code comments where necessary

## Related Issues

- Depends on: None (foundational)
- Blocks: #2 (Recipe System), #4 (Subtraction Math), #6 (Initial Game State)

## Estimated Effort

**2-3 hours** - Core domain models and basic operations