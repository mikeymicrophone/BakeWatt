# Issue #4: Subtraction Math - Pantry to Counter

**Type:** Feature  
**Priority:** High  
**Labels:** `math-mechanics`, `subtraction`, `frontend`

## Description

Implement subtraction math mechanics that teach ingredient management by moving ingredients from pantry storage to the baking counter.

## User Story

As a player, I want to move ingredients from my pantry to the baking counter using subtraction so that I can learn math while managing kitchen resources.

## Acceptance Criteria

### Game Mechanics
- [ ] Pantry transfer interface:
  - Display pantry stock levels for each ingredient
  - Show recipe requirements on baking counter
  - Allow player to transfer specific amounts
- [ ] Subtraction problem generation:
  - Format: "Pantry Stock - Amount Needed = Remaining"
  - Example: "10 cups flour - 6 cups = 4 cups remaining"
  - Verify player has enough ingredients before allowing transfer
- [ ] Visual representation options:
  - **Option A**: Use cube grid (pantry cubes → counter cubes)
  - **Option B**: Inventory-style drag & drop with math verification
  - **Option C**: Number line visualization for subtraction

### Resource Management
- [ ] Pantry state management:
  - Track current stock levels
  - Update after successful transfers  
  - Prevent over-withdrawal (insufficient ingredients)
- [ ] Baking counter state:
  - Show ingredients ready for baking
  - Display progress toward recipe completion
  - Clear counter after baking or canceling

### Error Handling & Learning
- [ ] Insufficient ingredient scenarios:
  - Show clear error message: "Not enough flour! You have 4 cups but need 6."
  - Suggest alternative: scale recipe down or find more ingredients
- [ ] Math verification:
  - Check subtraction calculation before allowing transfer
  - Provide hints for incorrect answers
  - Educational feedback on subtraction concepts

### UI Components
- [ ] Pantry inventory panel:
  - Grid/list view of ingredients with quantities
  - "Transfer" buttons for each ingredient
- [ ] Transfer modal/panel:
  - Amount input with validation
  - Subtraction problem display
  - "Confirm Transfer" action
- [ ] Baking counter display:
  - Recipe requirements vs. available amounts
  - Progress indicators for recipe completion

## Technical Notes

- Integrate with `Pantry` aggregate from Issue #1
- Create new `BakingCounter` aggregate for staging ingredients
- Use existing math visualization components where applicable
- Store in `/src/domain/inventory/` and `/src/presentation/scenes/`

## Example Flow

1. Player wants to make scaled cookies (needs 6 cups flour)
2. Pantry shows 10 cups flour available
3. Player initiates transfer of 6 cups
4. Game presents: "10 - 6 = ?" with visual representation
5. Player solves subtraction problem
6. Flour moves from pantry (4 remaining) to counter (6 ready)

## Visual Design Considerations

- Clear visual distinction between pantry and counter
- Progress bars or completion indicators
- Color coding for sufficient/insufficient ingredients
- Smooth animations for ingredient transfers

## Definition of Done

- [ ] Pantry to counter transfer system implemented
- [ ] Subtraction problems generated from transfers
- [ ] Visual feedback for resource management
- [ ] Error handling for insufficient ingredients
- [ ] Integration with existing game systems

## Related Issues

- Depends on: #1 (Ingredient System), #2 (Recipe System)
- Blocks: #7 (Game Flow Integration)

## Estimated Effort

**4-5 hours** - Transfer mechanics, subtraction visualization, UI components