# BakeWatt: Project Documentation

## Project Requirements

### Core Concept
**BakeWatt** - An educational game that teaches math through baking activities while introducing energy consumption concepts. Players help characters bake recipes by solving math problems and managing energy resources.

### Target Audience
- Primary: Children ages 5-8 (with focus on Skylo's current skill level)
- Secondary: Parents who want to engage with educational content alongside their children

### Game Features

#### 1. Math Mechanics
- **Addition Arena**: Ingredient combining puzzles (3 cups + 2 cups = ?)
- **Multiplication Mixer**: Scaling recipes up (need 2x this recipe)
- **Subtraction Station**: Using ingredients from inventory
- **Visual Number Representation**: 
  - Ingredients appear as countable objects
  - Number lines on measuring cups
  - Grid-based multiplication visualization

#### 2. Baking Integration
- **Recipe System**: Real recipes broken into math challenges
- **Measurement Mini-Games**: Pour, scoop, and measure with visual feedback
- **Kitchen Timer Challenges**: Time-based math problems
- **Ingredient Inventory**: Track and manage pantry items

#### 3. Energy Awareness
- **Power Meter**: Visual gauge showing oven/fridge energy use
- **Eco Points**: Rewards for efficient baking strategies
- **Temperature Puzzles**: Math problems about preheating and cooling
- **Energy Budget**: Daily watt allowance for kitchen appliances

#### 4. Progression System
- **Chef Levels**: Unlock new recipes and kitchen tools
- **Difficulty Scaling**: Problems adapt to player performance
- **Achievement Bakery**: Visual trophy room of completed dishes
- **Daily Challenges**: Special recipes with unique constraints

### User Experience Requirements
- Touch-first interface design
- Large, colorful buttons with haptic feedback
- Voice-over for problem reading (optional)
- Celebration animations for correct answers
- Gentle failure states with hints
- Parent dashboard for progress tracking

## Tech Stack

### Core Technologies
- **TypeScript 5.x**: Type safety and modern JS features
- **Three.js**: 3D graphics for engaging visuals
- **Vite**: Fast build tooling and hot module replacement
- **Capacitor**: Native app deployment for iOS/Android

### Architecture Libraries
- **MobX**: State management with OOP-friendly decorators
- **inversify**: Dependency injection container
- **class-transformer**: Serialization with decorators
- **fp-ts**: Functional programming utilities (Ruby-like pipelines)

### Game-Specific Libraries
- **@tweenjs/tween.js**: Smooth animations
- **howler.js**: Sound effects and background music
- **seedrandom**: Deterministic random generation
- **mathjs**: Advanced math operations

### Development Tools
- **Vitest**: Testing framework
- **Storybook**: Component development
- **ESLint + Prettier**: Code quality
- **Husky**: Git hooks for quality gates

## Code Conventions

### Project Structure
```
src/
├── core/                 # Core game engine
│   ├── engine/          # Game loop, scene management
│   ├── math/            # Math problem generators
│   ├── physics/         # Three.js physics wrapper
│   └── audio/           # Sound management
├── domain/              # Business logic
│   ├── baking/          # Recipe system
│   ├── energy/          # Power consumption logic
│   ├── progression/     # Player progress tracking
│   └── inventory/       # Ingredient management
├── presentation/        # UI layer
│   ├── scenes/          # Three.js scenes
│   ├── components/      # Reusable 3D components
│   ├── ui/              # 2D UI overlays
│   └── effects/         # Visual effects
├── infrastructure/      # External concerns
│   ├── storage/         # Local data persistence
│   ├── platform/        # Capacitor integrations
│   └── analytics/       # Usage tracking
└── shared/              # Shared utilities
    ├── decorators/      # Custom TypeScript decorators
    ├── mixins/          # Ruby-style mixins
    └── extensions/      # Prototype extensions
```

### OOP Patterns

#### Base Game Object (Ruby-inspired)
```typescript
@injectable()
abstract class GameObject {
  @observable protected _position: Vector3;
  @observable protected _rotation: Euler;
  
  constructor(@inject(SceneManager) protected scene: SceneManager) {
    this.initialize();
  }
  
  // Ruby-style hooks
  protected beforeInitialize(): void {}
  protected afterInitialize(): void {}
  
  @final
  private initialize(): void {
    this.beforeInitialize();
    this.setup();
    this.afterInitialize();
  }
  
  protected abstract setup(): void;
  
  // Ruby-style attribute readers
  get position(): Readonly<Vector3> { return this._position; }
  get rotation(): Readonly<Euler> { return this._rotation; }
}
```

#### Domain Modeling
```typescript
// Rich domain objects with behavior
@entity()
class Recipe {
  @primaryKey() id: string;
  @property() name: string;
  @property() difficulty: Difficulty;
  @embedded(() => Ingredient) ingredients: Ingredient[];
  @embedded(() => MathChallenge) challenges: MathChallenge[];
  
  // Business logic lives with data
  canBakeWith(inventory: Inventory): boolean {
    return this.ingredients.every(ing => 
      inventory.has(ing.type, ing.amount)
    );
  }
  
  // Ruby-style enumerable methods
  get totalCost(): WattHours {
    return this.ingredients
      .map(i => i.energyCost)
      .reduce((sum, cost) => sum + cost, 0);
  }
}
```

#### Service Layer Pattern
```typescript
@singleton()
class BakingService {
  constructor(
    @inject(RecipeRepository) private recipes: RecipeRepository,
    @inject(InventoryService) private inventory: InventoryService,
    @inject(EnergyMeter) private energy: EnergyMeter
  ) {}
  
  async startBaking(recipeId: string): Promise<BakingSession> {
    const recipe = await this.recipes.find(recipeId);
    
    return pipe(
      recipe,
      O.fromNullable,
      O.filter(r => this.inventory.canSupport(r)),
      O.filter(r => this.energy.canAfford(r.totalCost)),
      O.map(r => new BakingSession(r)),
      O.getOrElseW(() => {
        throw new InsufficientResourcesError();
      })
    );
  }
}
```

### Coding Standards

1. **TypeScript Strict Mode**: Always enabled
2. **Immutability First**: Use `readonly` and `Readonly<T>` extensively
3. **Decorators for Cross-Cutting Concerns**:
   - `@memoize` for expensive computations
   - `@throttle` for rate-limited methods
   - `@transaction` for atomic operations
4. **Error Handling**: Result types over exceptions where possible
5. **Testing**: 80% coverage minimum, focus on domain logic

### Ruby-Inspired Patterns

#### Mixins via TypeScript
```typescript
// Define mixin
const Enumerable = <T extends Constructor>(Base: T) => {
  return class extends Base {
    *[Symbol.iterator](): Iterator<any> {
      yield* this.toArray();
    }
    
    map<U>(fn: (item: any) => U): U[] {
      return Array.from(this).map(fn);
    }
    
    select(fn: (item: any) => boolean): any[] {
      return Array.from(this).filter(fn);
    }
    
    abstract toArray(): any[];
  };
};

// Use mixin
class IngredientCollection extends Enumerable(BaseCollection) {
  toArray(): Ingredient[] {
    return [...this.ingredients];
  }
}
```

#### Method Chaining
```typescript
class MathProblemBuilder {
  private problem: Partial<MathProblem> = {};
  
  withType(type: ProblemType): this {
    this.problem.type = type;
    return this;
  }
  
  withDifficulty(level: number): this {
    this.problem.difficulty = level;
    return this;
  }
  
  withVisuals(style: VisualStyle): this {
    this.problem.visualStyle = style;
    return this;
  }
  
  build(): MathProblem {
    return new MathProblem(this.problem);
  }
}
```

## Integration Strategy

### Phase 1: Web Development (Weeks 1-4)
1. **Local Development**: Vite dev server with hot reload
2. **Testing Environment**: Vitest for unit/integration tests
3. **Preview Deployment**: Netlify/Vercel for stakeholder review
4. **Device Testing**: Chrome DevTools device emulation

### Phase 2: Mobile Preparation (Weeks 5-6)
1. **Responsive Design**: Touch-first UI implementation
2. **Performance Optimization**: 
   - Texture atlasing for Three.js
   - Audio sprite sheets
   - Code splitting by scene
3. **Offline Support**: Service worker for asset caching
4. **Mobile Controls**: Gesture recognition library integration

### Phase 3: Native Deployment (Weeks 7-8)
1. **Capacitor Setup**:
   ```bash
   npm install @capacitor/core @capacitor/ios @capacitor/android
   npx cap init
   npx cap add ios
   npx cap add android
   ```

2. **iOS Deployment**:
   - Xcode project configuration
   - Provisioning profile setup
   - TestFlight beta distribution
   - App Store submission prep

3. **Platform-Specific Features**:
   ```typescript
   import { Haptics, ImpactStyle } from '@capacitor/haptics';
   import { Storage } from '@capacitor/storage';
   
   class PlatformService {
     async vibrate(style: ImpactStyle = ImpactStyle.Light) {
       if (Capacitor.isNativePlatform()) {
         await Haptics.impact({ style });
       }
     }
     
     async saveProgress(data: GameSave) {
       await Storage.set({
         key: 'game-progress',
         value: JSON.stringify(data)
       });
     }
   }
   ```

### Development Workflow
1. **Feature Branch Strategy**: `feature/math-multiplication`
2. **PR Requirements**: Tests, screenshots, performance metrics
3. **CI/CD Pipeline**: GitHub Actions for automated builds
4. **Release Process**: Semantic versioning with changelogs

### Performance Targets
- **Load Time**: < 3 seconds on 4G
- **Frame Rate**: Stable 60fps on iPhone 12+
- **Memory Usage**: < 200MB active
- **Battery Impact**: < 5% per 30-minute session