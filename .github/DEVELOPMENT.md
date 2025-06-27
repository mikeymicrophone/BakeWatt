# BakeWatt Development Guide

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# App runs at http://localhost:3750

# Type checking
npm run typecheck

# Run tests (when implemented)
npm test
```

## 📁 Project Structure

```
src/
├── core/                 # Game engine & math
│   ├── engine/          # Scene management, zoom, camera
│   ├── math/            # Math problem generation
│   └── physics/         # Three.js physics (future)
├── domain/              # Business logic (DDD)
│   ├── baking/          # Recipe system (Issue #2)
│   ├── inventory/       # Ingredient & pantry (Issue #1)
│   └── progression/     # Game state (Issue #6)
├── presentation/        # UI & 3D components
│   ├── scenes/          # Game views/screens
│   ├── components/      # 3D objects (CubeGrid)
│   └── ui/              # 2D interfaces
└── shared/              # DI container, utilities
```

## 🔧 Development Workflow

### 1. Issue-Driven Development
- Each GitHub issue represents a complete feature
- Follow acceptance criteria exactly
- Create feature branch: `feature/001-ingredient-system`

### 2. Domain-First Approach
```typescript
// 1. Start with domain models
export class Ingredient {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly unit: string
  ) {}
}

// 2. Add business logic
export class Pantry {
  private ingredients = new Map<string, number>();
  
  addIngredient(id: string, amount: number): void {
    // Business rules here
  }
}

// 3. Create services
@injectable()
export class IngredientService {
  // Application logic
}

// 4. Build UI components last
```

### 3. Testing Strategy
```typescript
// Unit tests for domain logic
describe('Pantry', () => {
  it('should add ingredients correctly', () => {
    // Test business logic
  });
});

// Integration tests for services
describe('RecipeScalingService', () => {
  it('should scale recipe ingredients by multiplier', () => {
    // Test service interactions
  });
});
```

## 🎯 Current Development Focus

### Active Issues (Ready to Start)
- **Issue #1**: Core Ingredient System (Foundation)
- **Issue #2**: Recipe Collection System (Depends on #1)

### Implementation Order
1. **Domain Models First**: `Ingredient`, `Pantry`, `Recipe`
2. **Services Second**: Business logic and operations  
3. **UI Integration**: Connect to existing visualization
4. **Math Integration**: Extend existing cube system

## 🛠️ Key Technical Patterns

### Dependency Injection
```typescript
// Register in container
container.bind<PantryService>(PantryService).toSelf().inSingletonScope();

// Inject in components
constructor(@inject(PantryService) private pantryService: PantryService) {}
```

### MobX State Management
```typescript
@injectable()
export class GameStore {
  @observable pantry = new Pantry();
  @observable recipes = new RecipeCollection();
  
  @action
  transferIngredient(id: string, amount: number): void {
    // Reactive state updates
  }
}
```

### Math Integration
```typescript
// Extend existing math service
export class BakingMathService extends MultiplicationService {
  generateRecipeScalingProblem(recipe: Recipe, targetServings: number): MathProblem {
    // Create math problems from recipes
  }
}
```

## 🔍 Debugging & Development Tools

### Browser DevTools
- **MobX DevTools**: Monitor state changes
- **Three.js Inspector**: Debug 3D scenes
- **React DevTools**: Component hierarchy (future)

### VS Code Extensions
- TypeScript Hero
- MobX DevTools
- Three.js Snippets

### Testing Current Features
1. Open http://localhost:3750
2. Enter multiplication factors (e.g., 4 × 6)
3. Test zoom slider and pinch-to-zoom
4. Verify cube numbering at zoom > 1.5x

## 📋 Definition of Done Checklist

For each issue:
- [ ] Acceptance criteria 100% complete
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] Code follows existing patterns
- [ ] Integration with existing systems works
- [ ] Manual testing completed
- [ ] Documentation updated (if needed)

## 🚨 Common Pitfalls

1. **Circular Dependencies**: Keep domain models pure, services in middle, UI on top
2. **Memory Leaks**: Dispose Three.js materials and textures properly
3. **State Mutations**: Use MobX @action for all state changes
4. **Type Safety**: Maintain strict TypeScript, avoid `any`

## 🎨 UI/UX Guidelines

### Visual Consistency
- Maintain dark theme (#1a1a1a background)
- Use blue (#007acc) for interactive elements
- Keep cube-based visual metaphor
- Responsive design for mobile

### Accessibility
- Keyboard navigation support
- Clear visual feedback
- Screen reader friendly labels
- Touch-friendly hit targets (44px minimum)

## 📞 Getting Help

1. **Technical Issues**: Check existing code patterns in `src/`
2. **Design Questions**: Refer to project documentation in `_docs/`
3. **Math Integration**: Study `MultiplicationService` and `CubeGrid`
4. **Three.js Issues**: Check `SceneManager` and related classes

---

**Ready to start? Begin with Issue #1 (Ingredient System)!**