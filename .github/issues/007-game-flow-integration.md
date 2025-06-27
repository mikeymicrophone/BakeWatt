# Issue #7: Game Flow Integration & Navigation

**Type:** Epic  
**Priority:** High  
**Labels:** `integration`, `navigation`, `frontend`, `ux`

## Description

Integrate all math mechanics and game systems into a cohesive game flow with intuitive navigation between pantry management, recipe selection, and math challenges.

## User Story

As a player, I want seamless navigation between different game activities so that I can focus on learning math through an engaging baking experience.

## Acceptance Criteria

### Navigation System
- [ ] Main game navigation:
  - **Pantry View**: Manage ingredient inventory
  - **Recipe Book**: Browse and select recipes  
  - **Baking Counter**: Active recipe workspace
  - **Math Challenge**: Current math problem area (cube visualization)
- [ ] Navigation state management:
  - Preserve context when switching views
  - Remember player's place in current recipe
  - Handle navigation during active math problems

### Unified Game Flow
- [ ] Recipe workflow integration:
  1. **Select Recipe** → Recipe Book view
  2. **Scale Recipe** → Multiplication math challenge
  3. **Gather Ingredients** → Subtraction math (pantry transfers)
  4. **Complete Recipe** → Success celebration & rewards
- [ ] Multi-recipe workflow:
  1. **Plan Multiple Recipes** → Recipe selection
  2. **Calculate Combined Needs** → Addition math challenge
  3. **Efficient Ingredient Gathering** → Optimized subtraction challenges
- [ ] Context-aware transitions:
  - Smooth animations between views
  - Progress indicators for multi-step processes
  - Clear "next step" guidance

### Enhanced UI Layout
- [ ] Responsive layout system:
  - Sidebar navigation for desktop
  - Bottom tab navigation for mobile
  - Adaptive content area for different screen sizes
- [ ] State visualization:
  - Current recipe progress in header/nav
  - Pantry summary (quick ingredient counts)
  - Achievement/progress indicators
- [ ] Quick actions:
  - "Quick Bake" for familiar recipes
  - Emergency pantry restocking
  - Recipe favoriting and recent access

### Math Challenge Integration
- [ ] Seamless math transitions:
  - Contextual math problems within workflows
  - Clear problem framing ("To scale this recipe...")
  - Smooth return to workflow after solving
- [ ] Visual consistency:
  - Maintain cube visualization theme across all math types
  - Consistent color coding for ingredients
  - Unified success/failure feedback

### Performance & UX
- [ ] State persistence across views:
  - Remember zoom levels and preferences
  - Preserve partially completed recipes
  - Maintain undo/redo history where applicable
- [ ] Loading states and feedback:
  - Smooth transitions with loading indicators
  - Progress feedback for longer operations
  - Clear error messages and recovery options

## Technical Notes

- Implement routing system (consider React Router or similar)
- Create unified state management for navigation
- Update existing components to work with navigation system
- Store navigation components in `/src/presentation/navigation/`
- Ensure accessibility for keyboard navigation

## User Experience Flow Examples

### New Player Journey
1. Tutorial introduction
2. Navigate to Recipe Book → select Simple Cookies
3. Navigate to Math Challenge → solve scaling multiplication
4. Navigate to Pantry → transfer ingredients (subtraction)
5. Return to Baking Counter → complete first recipe

### Experienced Player Journey  
1. Navigate to Recipe Book → select multiple recipes
2. Navigate to Math Challenge → solve addition for combined ingredients
3. Navigate to Pantry → efficient ingredient gathering
4. Navigate between Counter and Math as needed
5. Complete multiple recipes efficiently

## Definition of Done

- [ ] Navigation system implemented and tested
- [ ] All existing features integrated into unified flow
- [ ] Responsive design working on desktop and mobile
- [ ] Smooth transitions and state management
- [ ] User testing validates intuitive navigation
- [ ] Performance benchmarks met

## Related Issues

- Depends on: #1-#6 (All previous features)
- Enables: Future recipe unlocking, achievement systems, advanced features

## Estimated Effort

**5-6 hours** - Navigation implementation, integration work, UX polishing

## Future Considerations

- Social features (sharing recipes, leaderboards)
- Advanced recipe unlocking system
- Seasonal/themed recipe collections
- Achievement and progression systems
- Accessibility enhancements