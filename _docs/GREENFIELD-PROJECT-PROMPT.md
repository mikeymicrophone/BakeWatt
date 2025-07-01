# BakeWatt Greenfield Project - Claude Code Session Prompt

> **Context**: This is a complete rewrite of the BakeWatt math education game, preserving key algorithmic innovations while modernizing the architecture with Supabase + React.

---

## 🎯 Project Mission

Create a **modern, scalable math education game** that teaches multiplication, division, fractions, and scaling through interactive baking simulations. The game combines **Three.js 3D visualizations** with **real-world recipe mathematics** to make abstract concepts concrete and engaging.

**Target Audience**: Elementary/middle school students learning multiplication, division, and fractions through hands-on baking scenarios.

---

## 🧠 Core Educational Algorithms to Preserve

### **1. Three.js Mathematical Visualization Engine**

**Innovation**: Spatial metaphors make abstract math concrete

```typescript
// Key algorithms to implement:
- createCubeGrid(rows: number, columns: number) // NxM multiplication grids
- animateSubtraction(total: number, remove: number) // Ingredient transfer visualization  
- parallaxZoom(level: 0.3-8.0) // Educational detail revelation at different zoom levels
- smartCameraPositioning(gridSize: Dimensions) // Optimal viewing angles
```

**Educational Pattern**: Students see multiplication as spatial arrangements (4×3 = 12 cubes in 4 rows of 3), then zoom in to count individual units, connecting abstract numbers to concrete visual quantities.

### **2. Recipe Step Templating System**

**Innovation**: Reusable, parameterized recipe steps with JSON configuration

```typescript
// Template syntax to implement:
instructions: [
  'Cream {group:fats} until {consistency}',
  'Mix at {speed} speed for {time} minutes',
  'Fold in {group:dry} ingredients gradually'
]

parameters: {
  consistency: 'light and fluffy',
  speed: 'medium', 
  time: 3
}

// Flexible ingredient amounts:
ingredients: [
  { id: 'sugar', amount: 25 }, // fixed amount
  { id: 'vanilla', amount: { min: 0.5, max: 2.0, recommended: 1.0 }} // user customizable
]
```

**Benefits**: Single template creates infinite recipe variations. Recipes defined in JSON. No code duplication.

### **3. Multi-Stage Production Mathematics**

**Innovation**: Complex division with remainders through item→pieces→packages flow

```typescript
// Two-stage division to implement:
stage1: items × piecesPerItem = totalPieces
stage2: totalPieces ÷ piecesPerPackage = packages (+ remainder)

// Visual equation: "2 cookies × 24 pieces each ÷ 4 per package = 12 packages"
```

**Educational Value**: Students see division-with-remainder in practical context, understanding why 50÷7=7R1 matters for packaging decisions.

### **4. Interactive Grid-Based Quantity Selection**

**Innovation**: 10×10 grid for spatial quantity selection using factor multiplication

```typescript
// Grid interaction to implement:
- clickableGrid(10, 10) // Visual quantity selection
- factorCalculation(selectedCells) // Find factors of selected amount
- availabilityColorCoding(required, available) // Red/yellow/blue ingredient status
- realTimeEquationDisplay() // Live math as user selects
```

**Pattern**: Students select ingredient amounts by clicking grid cells, seeing factors and products visually while building spatial number sense.

---

## 🛠 Modern Technology Stack

### **Frontend Architecture**
- **Lit 3.0** + TypeScript + Vite (preserve existing component innovations)
- **Valtio** for simple reactive state (replace MobX complexity)
- **Three.js** + vanilla approach for 3D visualizations (existing patterns work)
- **Existing CSS Architecture** + CSS custom properties for theming
- **Web Animations API** for smooth micro-interactions
- **Supabase Client** for data fetching with real-time subscriptions

### **Backend Architecture**  
- **Supabase** for database, auth, real-time sync
- **Supabase Edge Functions** for complex calculations
- **PostgreSQL** for relational data (recipes, ingredients, user progress)
- **Supabase Storage** for recipe images and 3D assets
- **Row Level Security** for multi-tenant data isolation

### **Database Schema Design**

```sql
-- Core tables to implement:
CREATE TABLE ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL,
  icon text,
  nutrition_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE recipe_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  instructions jsonb NOT NULL, -- Array with parameter placeholders
  parameters jsonb NOT NULL, -- Default parameter values
  ingredient_groups jsonb NOT NULL, -- Semantic groupings
  estimated_time_minutes integer,
  difficulty_level text CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES recipe_templates(id),
  custom_parameters jsonb, -- User customizations
  custom_ingredients jsonb, -- Ingredient amount overrides
  scale_factor decimal DEFAULT 1.0, -- Recipe scaling multiplier
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  math_concept text NOT NULL, -- 'multiplication', 'division', 'fractions'
  difficulty_level integer, -- 1-10 progression
  problems_completed integer DEFAULT 0,
  accuracy_percentage decimal,
  last_activity timestamptz DEFAULT now()
);

CREATE TABLE game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES user_recipes(id),
  current_step integer DEFAULT 1,
  pantry_inventory jsonb, -- Current ingredient amounts
  counter_ingredients jsonb, -- Staged ingredients
  session_data jsonb, -- UI state, zoom levels, etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## 🎮 Game Flow Implementation Priority

### **Phase 1: Fix State Management & Preserve Components**
```typescript
// Replace MobX with Valtio for simple reactivity:
import { proxy, subscribe } from 'valtio'

const gameState = proxy({
  pantry: new Map<string, number>(),
  selectedIngredient: null,
  currentRecipe: null,
  scaleFactor: 1.0
})

// Keep existing Lit components, fix state subscription:
@customElement('pantry-transfer-panel')
export class PantryTransferPanel extends LitElement {
  connectedCallback() {
    super.connectedCallback()
    // Simple state subscription without MobX complexity
    subscribe(gameState, () => this.requestUpdate())
  }
  
  render() {
    return html`
      <pantry-inventory 
        .ingredients=${Array.from(gameState.pantry.entries())}
        @ingredient-selected=${this.handleSelection}>
      </pantry-inventory>
    `
  }
}
```

### **Phase 2: Preserve Existing CSS Architecture**
```css
/* Keep the excellent modular CSS system already developed: */
src/styles/
├── base.css              # Core design tokens and ui-panel system
├── tab-navigation.css    # Sophisticated tab system with animations
├── transfer-panel.css    # Pantry transfer interactions  
├── recipe-collection.css # Recipe grid and filtering
├── cooking-step.css      # Step-by-step cooking interface
├── production.css        # Production flow mathematics
├── store.css            # Store management and pricing
└── supplier.css         # Supplier interface with bulk pricing

/* Existing design system strengths to preserve: */
.ui-panel {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Color semantics already perfected: */
:root {
  --bg-primary: #1a1a1a;
  --accent-blue: #007acc;
  --success-green: #4caf50;
  --warning-orange: #ff9800;
  --error-red: #f44336;
  --math-yellow: #ffeb3b;
}
```

### **Phase 3: Migrate to Supabase Gradually**
```typescript
// Replace localStorage with Supabase, keep existing Lit components:
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Existing components work with new data layer:
@customElement('recipe-collection-panel')
export class RecipeCollectionPanel extends LitElement {
  private recipes = []
  
  async connectedCallback() {
    super.connectedCallback()
    
    // Load recipes from Supabase instead of hardcoded data
    const { data } = await supabase
      .from('recipe_templates')
      .select('*')
      .order('name')
    
    this.recipes = data || []
    this.requestUpdate()
  }
  
  // Existing render logic works unchanged
  render() {
    return html`
      <div class="recipe-grid">
        ${this.recipes.map(recipe => html`
          <div class="recipe-card" @click=${() => this.selectRecipe(recipe)}>
            <div class="recipe-icon">${recipe.icon}</div>
            <h3>${recipe.name}</h3>
          </div>
        `)}
      </div>
    `
  }
}
```

### **Phase 4: Add Real-time Features**
```typescript
// Real-time multiplayer without changing component architecture:
@customElement('baking-session-manager')
export class BakingSessionManager extends LitElement {
  connectedCallback() {
    super.connectedCallback()
    
    // Real-time subscriptions for multiplayer baking
    supabase
      .channel('baking-session')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_sessions'
      }, (payload) => {
        // Update Valtio state, components auto-update
        gameState.collaborators = payload.new.participants
        gameState.sharedPantry = payload.new.pantry_inventory
      })
      .subscribe()
  }
}
```

---

## 🏗 Development Setup & Architecture

### **Project Structure** 
```
bakewatt-v2/
├── src/
│   ├── components/          # Lit web components (preserve existing innovations)
│   │   ├── pantry/         # Pantry transfer components (already developed)
│   │   ├── recipes/        # Recipe templating components  
│   │   ├── math/           # Three.js cube grid components
│   │   ├── production/     # Production flow mathematics
│   │   └── ui/             # Generic UI components
│   ├── styles/             # Preserve existing modular CSS architecture
│   │   ├── base.css        # Core design tokens and ui-panel system
│   │   ├── components/     # Component-specific stylesheets
│   │   └── themes/         # CSS custom properties for theming
│   ├── lib/                # Utility libraries
│   │   ├── supabase.ts     # Supabase client configuration
│   │   ├── valtio-state.ts # Simple reactive state (replace MobX)
│   │   ├── three-utils.ts  # Three.js helper functions (preserve existing)
│   │   └── math-engine.ts  # Mathematical calculation utilities
│   ├── data/               # Static data and configuration
│   ├── types/              # TypeScript type definitions
│   └── main.ts             # Application entry point
├── supabase/
│   ├── migrations/         # Database schema migrations
│   ├── functions/          # Edge functions for complex calculations
│   └── seed.sql           # Initial data setup (preserve recipe templates)
└── public/
    ├── models/             # 3D assets (GLTF/GLB files)
    └── textures/           # Three.js textures and materials
```

### **Key Development Principles**

1. **Preserve Existing Innovations**: Don't rewrite working component architecture - fix the state friction
2. **Mathematics-First Design**: Every feature starts with the educational math concept, then builds UI around it
3. **Lit Component Composability**: Small, focused web components using existing patterns
4. **Simple State Management**: Valtio proxy for reactivity without MobX complexity
5. **CSS Architecture Preservation**: Keep the excellent modular stylesheet system already developed
6. **Gradual Supabase Migration**: Replace localStorage first, add real-time features incrementally
7. **Performance Optimization**: 60fps Three.js animations, efficient Lit rendering, CSS containment
8. **Web Standards Approach**: Custom elements, shadow DOM, platform APIs over framework abstractions

---

## 📊 Success Metrics & Validation

### **Technical Metrics**
- **Performance**: Lighthouse score 90+, 60fps Three.js animations
- **Code Quality**: TypeScript strict mode, 90%+ test coverage
- **User Experience**: <100ms interaction latency, smooth mobile experience

### **Educational Metrics**  
- **Engagement**: Students complete 80%+ of started recipes
- **Learning**: Measurable improvement in multiplication/division test scores
- **Retention**: Students return to complete multiple recipes over time

### **Algorithm Preservation Checklist**
- ✅ Three.js cube grid multiplication visualization
- ✅ Subtraction animation for ingredient transfers
- ✅ Recipe template parameter injection system
- ✅ Flexible ingredient ranges with user customization
- ✅ Multi-stage production mathematics (item→pieces→packages)
- ✅ Dynamic pricing with multiple factors
- ✅ Interactive 10×10 grid quantity selection
- ✅ Parallax zoom for educational detail revelation

---

## 🚀 Getting Started Instructions

1. **Initialize Project**: `npm create vite@latest bakewatt-v2 -- --template vanilla-ts`
2. **Copy Existing Assets**: Migrate `src/components/pantry/` and `src/styles/` from prototype
3. **Install Dependencies**: `npm install lit valtio @supabase/supabase-js three`
4. **Replace MobX with Valtio**: Simple proxy state without decorator complexity
5. **Setup Supabase**: `npx supabase init` + migrate database schema
6. **Test Existing Components**: Verify pantry components work with new state management
7. **Gradual Data Migration**: Replace localStorage with Supabase incrementally
8. **Add Real-time Features**: Supabase subscriptions for multiplayer sessions

---

## 💡 Preservation Strategy Summary

### **What's Being Preserved from 18 Months of Innovation**
1. **Lit Component Architecture**: Your pantry components work - just fix the state layer
2. **CSS Design System**: Modular stylesheets with glass morphism and color semantics
3. **Three.js Cube Algorithms**: Mathematical visualization patterns that make math tangible  
4. **Recipe Template System**: Parameter injection and flexible ingredient patterns
5. **Production Mathematics**: Multi-stage division with remainder handling
6. **Interactive Grid Patterns**: 10×10 spatial quantity selection innovation

### **What's Being Modernized**
1. **State Management**: MobX → Valtio (same reactivity, simpler setup)
2. **Data Layer**: localStorage → Supabase (real-time, collaborative, persistent)
3. **Dependency Injection**: Inversify → Simple ES6 imports and Valtio global state
4. **Build System**: Complex config → Vite defaults with minimal setup

### **Why This Approach Succeeds**
- ✅ **Fixes the friction point** (MobX complexity) without throwing away working code
- ✅ **Preserves 18 months of algorithmic innovation** in Three.js and educational patterns  
- ✅ **Keeps your excellent CSS architecture** and design system
- ✅ **Maintains web standards approach** with custom elements and platform APIs
- ✅ **Adds modern database capabilities** with Supabase real-time features
- ✅ **Enables multiplayer education** while preserving single-player experience

---

*This strategy respects the significant innovation already achieved while eliminating the complexity that was causing friction. The result is a modern, scalable educational platform built on proven mathematical visualization algorithms and excellent design patterns.*