# Issue #6: Initial Game State & Tutorial

**Type:** Feature  
**Priority:** High  
**Labels:** `game-setup`, `tutorial`, `onboarding`

## Description

Implement the initial game state that gives players starter ingredients and a recipe, along with a brief tutorial to introduce core mechanics.

## User Story

As a new player, I want to start the game with basic ingredients and a simple recipe so that I can immediately begin learning math through baking activities.

## Acceptance Criteria

### Initial Game State
- [ ] Starter ingredients in pantry:
  - **Flour**: 15 cups (enough for multiple recipes/scaling)
  - **Butter**: 6 sticks (allows for recipe experimentation)
  - **Eggs**: 12 pieces (common ingredient for most recipes)
- [ ] Starter recipe collection:
  - **"Simple Cookies"** (Base: 2 servings)
    - 2 cups flour
    - 1 stick butter  
    - 1 egg
  - Recipe marked as "starter" or "tutorial" recipe
- [ ] Save/load system for game state:
  - Persist pantry contents
  - Persist recipe collection
  - Persist player progress

### Tutorial System
- [ ] Welcome sequence:
  - Brief introduction to BakeWatt concept
  - Explanation of math-through-baking approach
  - Overview of main game areas (pantry, recipes, counter)
- [ ] Guided first recipe:
  - Walk through recipe scaling (multiplication)
  - Demonstrate ingredient transfer (subtraction)
  - Show completion and celebration
- [ ] Interactive tooltips:
  - Highlight key UI elements during tutorial
  - Contextual help for first-time actions
  - Skip option for returning players

### Game State Management
- [ ] Create `GameState` aggregate:
  - `pantry: Pantry` - player's ingredient storage
  - `recipes: RecipeCollection` - unlocked recipes
  - `currentLevel: number` - progression tracking
  - `tutorialCompleted: boolean` - tutorial state
- [ ] Implement persistence layer:
  - Local storage for web version
  - JSON serialization of game state
  - Migration system for future updates
- [ ] State validation and recovery:
  - Handle corrupted save data gracefully
  - Provide reset to default state option
  - Validate ingredient amounts and recipe integrity

### Progressive Disclosure
- [ ] Feature introduction timing:
  - Start with basic multiplication (recipe scaling)
  - Introduce subtraction (ingredient transfer) after first success
  - Add addition (multi-recipe) after player comfort
- [ ] UI complexity management:
  - Hide advanced features initially
  - Unlock UI elements as player progresses
  - Clear visual indicators for new features

## Technical Notes

- Create in `/src/domain/progression/` for game state management
- Use MobX for reactive state updates
- Integrate with existing ingredient and recipe systems
- Consider using `localStorage` for web persistence
- Plan for future mobile app storage migration

## Tutorial Flow

1. **Welcome**: "Welcome to BakeWatt! Learn math by baking delicious recipes."
2. **Pantry Tour**: "This is your pantry. You start with flour, butter, and eggs."
3. **Recipe Introduction**: "Here's your first recipe: Simple Cookies!"
4. **Scaling Challenge**: "Let's make 6 servings instead of 2. That's 3 times bigger!"
5. **Multiplication Practice**: "2 cups flour × 3 = ? Use the cubes to help you!"
6. **Ingredient Transfer**: "Great! Now move 6 cups flour from pantry to counter."
7. **Completion**: "Perfect! You've learned multiplication and subtraction through baking!"

## Definition of Done

- [ ] Initial game state properly configured
- [ ] Tutorial sequence implemented and tested
- [ ] Save/load system functional
- [ ] Integration with all existing systems
- [ ] New player experience validated

## Related Issues

- Depends on: #1 (Ingredient System), #2 (Recipe System)
- Blocks: #7 (Game Flow Integration)

## Estimated Effort

**3-4 hours** - Game state setup, tutorial implementation, persistence layer