# BakeWatt Game Flow - Annotated for Greenfield Rewrite

> **Algorithmic Documentation**: This document captures the key innovations and algorithms developed during the BakeWatt prototype phase. These patterns should be preserved and modernized in the greenfield rewrite using Supabase.

---

## 🧠 Core Mathematical Visualization Algorithms

### 1. Three.js Cube Grid System

**Innovation**: Dynamic 3D multiplication visualization using spatial metaphors

```typescript
// Key algorithms to preserve:
createGrid(rows: number, columns: number) // NxM cube layouts
adjustCameraForGrid(rows: number, columns: number) // Smart camera positioning  
setZoomLevel(level: number, animated: boolean) // Range 0.3-8x with parallax
createNumberedMaterial(text: string, baseColor: Color) // Educational cube labels
getVisualizationDimensions() // Convert math factors to 3D spatial layouts
```

**Visual Pattern**: Cubes arranged in grids where users can zoom from overview (see pattern) to detail (read individual numbers), making abstract multiplication concrete and explorable.

### 2. Subtraction Animation System

**Innovation**: Visual metaphor for ingredient transfer using cube removal

```typescript
// Key algorithms:
visualizeTransfer(totalAmount: number, removeAmount: number)
animateSubtraction(removeAmount: number) // Staggered cube removal timing
validateTransferAmount(transferAmount: number, availableAmount: number)
```

**Educational Value**: Real-time equation display "pantry - transfer = remaining" synchronized with 3D cube animations.

---

## 🍪 Recipe Step Templating & Parameterization System

### 3. Template Parameter Substitution Engine

**Innovation**: Reusable recipe steps with runtime parameter injection

```typescript
// Template syntax patterns:
instructions: [
  'In separate bowl, cream {group:fats} until {consistency}',
  'Gradually fold dry mixture into wet at {speed} speed', 
  'Mix just until combined - about {time} minutes total'
]

parameters: {
  consistency: 'light and fluffy',
  speed: 'low', 
  time: 3
}
```

**Benefits**: Single template creates infinite recipe variations. No code duplication. JSON-configurable recipes.

### 4. Flexible Ingredient System

**Innovation**: Range-based ingredient amounts for user customization

```typescript
// Fixed amount
new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 2.5)

// Range with customization hints  
new FlexibleIngredient(
  STARTER_INGREDIENTS.SUGAR,
  { min: 20, max: 35, recommended: 28, step: 1 },
  'Adjust sweetness to taste'
)
```

**Pattern**: Ingredients can be exact (salt) or customizable (spice level), with smart defaults and scaling support.

### 5. Ingredient Groups & Semantic Organization

**Innovation**: Logical ingredient grouping with template references

```typescript
groups: [
  { name: 'dry', ingredients: [flour, sugar], description: 'Dry base ingredients' },
  { name: 'fats', ingredients: [butter], description: 'Fat ingredients for creaming' },
  { name: 'liquids', ingredients: [eggs, vanilla], description: 'Liquid ingredients' }
]

// Reference in instructions: '{group:dry}' resolves to formatted ingredient list
```

---

## 🏭 Production Flow Mathematics

### 6. Multi-Stage Division Engine

**Innovation**: Complex item→pieces→packages transformations with remainder handling

```typescript
// Two-stage division process
stage1: items × piecesPerItem = totalPieces
stage2: totalPieces ÷ piecesPerPackage = packages (with remainder)

// Real-time equation updates
updateEquation: "2 items × 24 pieces/item ÷ 4 pieces/package = 12 packages"
```

**Visual Pattern**: Grid transformations showing item subdivisions, with remainder handling for packaging optimization.

### 7. Dynamic Pricing Algorithm

**Innovation**: Multi-factor pricing with real-time market simulation

```typescript
calculatePrice(item: StoreItem, location: StoreLocation): number {
  const factors = {
    nutrition: calculateNutritionFactor(item.nutrition),
    complexity: getRecipeComplexityMultiplier(item.recipe),
    sophistication: getIngredientSophisticationWeight(item.ingredients),
    portioning: getPortioningOptimizationFactor(item.portioning),
    location: getLocationModifier(location),
    market: getMarketDemandFactor(item.type, location)
  };
  
  return basePrice * Object.values(factors).reduce((a, b) => a * b, 1);
}
```

**Features**: Location-based pricing, bulk discounts (1-unit, 10-pack, 100-pack), freshness factors.

---

## 🎮 Interactive UI Patterns

### 8. 10×10 Flexible Ingredient Grid

**Innovation**: Grid-based quantity selection using factor multiplication

```typescript
// Smart grid dimensions calculation
getGridDimensions(factor1: number, factor2: number): { width: number, height: number }
// Color-coded availability states
getAvailabilityColor(amount: number, required: number): Color
// Real-time visual feedback
updateGridVisualization(selectedCells: number, requiredAmount: number)
```

**Visual Pattern**: Interactive grid where users select quantities spatially, with color coding for ingredient availability (red: insufficient, yellow: tight, blue: abundant).

### 9. Smart Camera & Zoom Management

**Innovation**: Parallax zoom with educational detail revelation

```typescript
// Zoom levels with distinct information density
zoom_0_3_to_1: overview_pattern_recognition
zoom_1_to_3: individual_cube_identification  
zoom_3_to_8: number_reading_and_counting

adjustCameraForOptimalViewing(gridDimensions: Dimensions, zoomLevel: number)
```

**Educational Value**: Different zoom levels reveal different aspects of mathematical concepts.

---

## 📊 Data Management Patterns

### 10. Multi-Location Inventory System

**Innovation**: Atomic cross-location transfers with validation

```typescript
// Inventory locations with transfer validation
locations: ['pantry', 'counter', 'store']
transferValidation: canTransfer(item, fromLocation, toLocation, amount)
atomicTransfer: executeTransfer(item, from, to, amount) // with rollback
```

### 11. Recipe Scaling Mathematics

**Innovation**: Persistent scaling factors across production pipeline

```typescript
// Scaling propagation through entire system
recipeScaling: {
  baseServings: number,
  targetServings: number, 
  scaleFactor: number // targetServings / baseServings
}

// All components scale proportionally
ingredients.scale(scaleFactor)
cookingTimes.scale(scaleFactor)  
equipmentSizes.scale(scaleFactor)
```

---

## 🛠 Component Architecture Innovations

### 12. Event-Driven Component System

**Innovation**: Reactive UI updates with custom events

```typescript
// Component communication pattern
childComponent.dispatchEvent(new CustomEvent('data-changed', { 
  detail: { newValue }, 
  bubbles: true 
}));

parentComponent.addEventListener('data-changed', (e) => {
  this.handleDataChange(e.detail.newValue);
});
```

### 13. Light DOM Component Strategy

**Innovation**: Components that integrate with global CSS while maintaining encapsulation

```typescript
// Components render to light DOM for CSS integration
protected createRenderRoot() {
  return this; // light DOM instead of shadow DOM
}
```

**Benefits**: Global CSS themes work, easier integration with existing styles, maintains component boundaries through custom elements.

---

## 🎯 Key Preservation Priorities for Greenfield

### **Critical Innovations to Preserve**

1. **Three.js Mathematical Metaphors**: Cube grids for multiplication, subtraction animations for transfers
2. **Recipe Templating System**: Parameter injection, ingredient groups, JSON configuration
3. **Flexible Ingredient Ranges**: User customization with smart defaults
4. **Multi-Stage Production Math**: Item→pieces→packages with remainder handling
5. **Dynamic Pricing Engine**: Multi-factor calculations with market simulation
6. **Interactive Grid Selection**: 10×10 spatial quantity selection UI pattern
7. **Parallax Educational Zoom**: Different zoom levels reveal different learning aspects

### **Architecture Patterns to Modernize**

1. **Replace MobX + Custom State** → **Supabase Real-time + React Query**
2. **Replace Manual DOM Updates** → **React Components with Suspense**
3. **Replace Local Storage** → **Supabase Auth + Database**
4. **Replace Inversify Container** → **React Context + Custom Hooks**
5. **Replace Custom Events** → **React State + Callback Props**
6. **Replace CSS-in-JS** → **Tailwind CSS + CSS Modules**

### **Technical Debt to Eliminate**

1. **Application.ts God Object**: Split into focused React components
2. **Manual State Synchronization**: Use React state + Supabase sync  
3. **Duplicate Display Logic**: Single source of truth with computed properties
4. **CSS Coupling**: Component-scoped styles with design system
5. **Complex Build Configuration**: Vite + TypeScript with minimal config

---

## 🚀 Greenfield Success Metrics

1. **Mathematical Visualizations**: All Three.js cube algorithms preserved and improved
2. **Recipe System**: Template-based recipes with 100% JSON configurability  
3. **User Experience**: Smooth 60fps animations, <100ms interaction latency
4. **Developer Experience**: Hot reloading, TypeScript strict mode, component testing
5. **Data Architecture**: Real-time sync, offline support, multiplayer capability
6. **Performance**: Lighthouse 90+ scores, tree-shaking, code splitting

---

*This annotated documentation captures 18 months of algorithmic innovation. The greenfield rewrite should preserve these mathematical and educational patterns while modernizing the architecture with Supabase + React.*