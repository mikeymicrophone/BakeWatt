# Issue #3: Multiplication Math - Recipe Scaling

**Type:** Feature  
**Priority:** High  
**Labels:** `math-mechanics`, `multiplication`, `frontend`

## Description

Implement the multiplication math game mechanics that teach scaling recipes for different serving sizes through visual cube representation.

## User Story

As a player, I want to scale recipes to different serving sizes using multiplication so that I can learn math while understanding proportional cooking.

## Acceptance Criteria

### Game Mechanics
- [ ] Create recipe scaling interface:
  - Display current recipe with base serving size
  - Allow player to select target serving size (1-10)
  - Show multiplication problem: "Base × Scale = Target"
- [ ] Visual multiplication representation:
  - Use existing cube grid system
  - Factor 1: Base ingredient amount (e.g., 2 cups flour)
  - Factor 2: Scaling multiplier (e.g., 3x recipe)
  - Result: Total needed amount (e.g., 6 cups flour)
- [ ] Integration with recipe system:
  - Display ingredient before scaling
  - Show step-by-step scaling for each ingredient
  - Generate scaled recipe as output

### Math Learning Elements  
- [ ] Problem generation:
  - Create multiplication problems from recipe scaling
  - Range: 1×1 to 10×10 (based on recipe complexity)
  - Progressive difficulty as player advances
- [ ] Visual feedback:
  - Cube animation for scaling visualization
  - Clear before/after ingredient amounts
  - Success celebrations for correct answers

### UI Components
- [ ] Recipe scaling panel:
  - Recipe selection dropdown
  - Serving size input/slider
  - "Scale Recipe" button
- [ ] Math problem display:
  - Clear problem statement
  - Visual cube representation
  - Answer input/verification
- [ ] Results display:
  - Scaled ingredient list
  - Math problem solution
  - "Use Scaled Recipe" action button

## Technical Notes

- Extend existing `CubeGrid` and `MultiplicationService`
- Integrate with recipe and ingredient systems
- Use existing zoom and numbering features
- Store in `/src/domain/baking/` and `/src/presentation/scenes/`

## Example Flow

1. Player selects "Simple Cookies" recipe (2 servings)
2. Player wants to make 6 servings (3× scale)  
3. Game shows: "2 cups flour × 3 = ?" with cube visualization
4. Player solves multiplication problem
5. Game displays scaled recipe: 6 cups flour, 3 sticks butter, 3 eggs

## Definition of Done

- [ ] Recipe scaling UI implemented
- [ ] Multiplication problems generated from recipes
- [ ] Cube visualization works for scaling
- [ ] Integration with existing math system
- [ ] Responsive design for touch devices

## Related Issues

- Depends on: #2 (Recipe System), existing multiplication visualization
- Blocks: #7 (Game Flow Integration)

## Estimated Effort

**4-5 hours** - UI components, game logic, and integration