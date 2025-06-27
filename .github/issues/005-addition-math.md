# Issue #5: Addition Math - Multi-Recipe Planning

**Type:** Feature  
**Priority:** Medium  
**Labels:** `math-mechanics`, `addition`, `frontend`

## Description

Implement addition math mechanics that teach resource planning by combining ingredient requirements from multiple recipes.

## User Story

As a player, I want to plan baking multiple recipes simultaneously using addition so that I can learn math while optimizing my ingredient shopping and preparation.

## Acceptance Criteria

### Game Mechanics
- [ ] Multi-recipe selection:
  - Allow player to select 2-4 recipes to bake together
  - Display each recipe's ingredient requirements separately
  - Show combined shopping list with addition problems
- [ ] Addition problem generation:
  - Format: "Recipe A + Recipe B = Total Needed"
  - Example: "Cookies need 6 cups flour + Cake needs 4 cups flour = 10 cups total"
  - Handle different recipes requiring same ingredients
- [ ] Visual representation:
  - Use cube grid to show recipe combination
  - Factor 1: Recipe A requirement (e.g., 6 cubes for cookies)
  - Factor 2: Recipe B requirement (e.g., 4 cubes for cake)  
  - Result: Total needed (10 cubes total)

### Planning Features
- [ ] Shopping list generation:
  - Combine all ingredient requirements across selected recipes
  - Show current pantry vs. total needed
  - Calculate what needs to be "purchased" (pantry replenishment)
- [ ] Batch planning optimization:
  - Suggest efficient ingredient usage
  - Highlight shared ingredients across recipes
  - Show potential cost/time savings

### Math Learning Elements
- [ ] Progressive addition complexity:
  - Start with 2 recipes (simple addition)
  - Progress to 3-4 recipes (multi-term addition)
  - Include decimal amounts for advanced players (2.5 + 1.5 = 4.0)
- [ ] Real-world context:
  - Frame problems as meal planning scenarios
  - Connect to practical kitchen math skills
  - Reinforce addition concepts through repetition

### UI Components
- [ ] Recipe selection panel:
  - Checkbox list of available recipes
  - Preview of selected recipes' requirements
- [ ] Combination calculator:
  - Side-by-side recipe comparison
  - Addition problem display with visual aids
  - "Calculate Total" button with verification
- [ ] Shopping list display:
  - Combined ingredient requirements
  - Pantry comparison (have vs. need)
  - Action buttons for ingredient acquisition

## Technical Notes

- Integrate with `Recipe` and `Pantry` systems
- Create `BakingPlan` aggregate for multi-recipe management
- Extend existing math visualization for addition
- Store in `/src/domain/baking/` and `/src/presentation/scenes/`

## Example Flow

1. Player selects "Cookies" (6 cups flour) and "Muffins" (3 cups flour)
2. Game shows addition problem: "6 + 3 = ?" with cube visualization
3. Player solves addition to get 9 cups total flour needed
4. Game generates shopping list showing 9 cups flour requirement
5. Player can proceed to gather ingredients or modify recipe selection

## Advanced Features (Future)
- Recipe scaling within multi-recipe planning
- Ingredient substitution suggestions
- Nutritional information combination
- Cost calculation and budgeting

## Definition of Done

- [ ] Multi-recipe selection system implemented
- [ ] Addition problems generated from recipe combinations
- [ ] Shopping list generation with pantry comparison
- [ ] Visual cube representation for addition
- [ ] Integration with existing recipe and pantry systems

## Related Issues

- Depends on: #1 (Ingredient System), #2 (Recipe System)
- Blocks: #7 (Game Flow Integration)

## Estimated Effort

**3-4 hours** - Planning interface, addition mechanics, shopping list generation