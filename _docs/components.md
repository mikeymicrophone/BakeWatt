# BakeWatt Component Architecture Design

## Overview

This document outlines a proposed component-based architecture to replace the current Application.ts-centric approach. The goal is to eliminate duplication, improve maintainability, and create clear separation of concerns while preserving all existing functionality.

## Core Principles

1. **Smart Components**: Each component manages its own state and logic
2. **Event-Driven Communication**: Components emit events up, receive props down
3. **Service Integration**: Components inject and use services directly
4. **Reactive State**: MobX observables flow through component tree
5. **Single Responsibility**: Each component has one clear purpose

## Component Hierarchy

```
<app-shell>
├── <tab-navigation>
├── <three-scene-container>
├── <math-panel> (tab 1)
├── <pantry-transfer-panel> (tab 2)
├── <recipe-collection-panel> (tab 3)
│   ├── <recipe-shop-modal>
│   └── <recipe-detail-modal>
├── <cooking-workflow-panel>
├── <production-panel>
├── <store-panel>
├── <supplier-panel>
└── <notification-system>
```

---

## 1. Core Application Components

### `<app-shell>`
**Purpose**: Main application container and navigation coordinator
**Replaces**: Application.ts coordination logic

```typescript
@customElement('app-shell')
export class AppShell extends LitElement {
  @observe private gameState = inject(GameState);
  
  private currentTab = 'math';
  
  render() {
    return html`
      <tab-navigation 
        .currentTab=${this.currentTab}
        @tab-changed=${this.handleTabChange}>
      </tab-navigation>
      
      <three-scene-container></three-scene-container>
      
      ${this.renderCurrentPanel()}
      
      <notification-system></notification-system>
    `;
  }
}
```

### `<tab-navigation>`
**Purpose**: Tab switching and visual state
**Replaces**: Manual tab event handling in Application.ts

```typescript
@customElement('tab-navigation')
export class TabNavigation extends LitElement {
  @property() currentTab = 'math';
  
  private tabs = [
    { id: 'math', icon: '🔢', label: 'Math Practice' },
    { id: 'transfer', icon: '📦', label: 'Ingredient Transfer' },
    { id: 'recipes', icon: '📚', label: 'Recipe Collection' },
    { id: 'supplier', icon: '🚚', label: 'Supplier' },
    { id: 'store', icon: '🏪', label: 'Store' }
  ];
  
  private handleTabClick(tabId: string) {
    this.dispatchEvent(new CustomEvent('tab-changed', {
      detail: { tabId },
      bubbles: true
    }));
  }
}
```

### `<three-scene-container>`
**Purpose**: Three.js scene management and coordination
**Replaces**: SceneManager coordination in Application.ts

```typescript
@customElement('three-scene-container')
export class ThreeSceneContainer extends LitElement {
  @observe private mathService = inject(MultiplicationService);
  @observe private sceneManager = inject(SceneManager);
  
  private cubeGrid?: CubeGrid;
  
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('create-grid', this.handleCreateGrid);
    this.addEventListener('create-subtraction', this.handleCreateSubtraction);
  }
}
```

---

## 2. Math and Visualization Components

### `<math-panel>`
**Purpose**: Multiplication practice interface
**Replaces**: Math panel logic in Application.ts + UIManager.ts

```typescript
@customElement('math-panel')
export class MathPanel extends LitElement {
  @observe private mathService = inject(MultiplicationService);
  @observe private zoomManager = inject(CameraZoomManager);
  
  @state() private factor1 = 4;
  @state() private factor2 = 3;
  @state() private showResult = false;
  
  private handleVisualize() {
    const problem = this.mathService.createProblem(this.factor1, this.factor2);
    this.dispatchEvent(new CustomEvent('create-grid', {
      detail: { rows: this.factor1, columns: this.factor2 },
      bubbles: true
    }));
  }
  
  render() {
    return html`
      <factor-input-group
        .factor1=${this.factor1}
        .factor2=${this.factor2}
        @factors-changed=${this.handleFactorsChanged}>
      </factor-input-group>
      
      <math-control-buttons
        @visualize=${this.handleVisualize}
        @calculate=${this.handleCalculate}>
      </math-control-buttons>
      
      <zoom-control
        .zoomManager=${this.zoomManager}>
      </zoom-control>
      
      ${this.showResult ? html`
        <result-display .result=${this.mathService.formatResult()}></result-display>
      ` : ''}
    `;
  }
}
```

### `<factor-input-group>`
**Purpose**: Factor input controls with validation
**Replaces**: Input handling in math panel

### `<zoom-control>`
**Purpose**: Camera zoom control with Three.js integration
**Replaces**: Zoom control logic in Application.ts

---

## 3. Pantry and Transfer Components

### `<pantry-transfer-panel>`
**Purpose**: Ingredient transfer interface
**Replaces**: Transfer panel logic in Application.ts + SubtractionMathScene

```typescript
@customElement('pantry-transfer-panel')
export class PantryTransferPanel extends LitElement {
  @observe private pantry = inject(Pantry);
  @observe private bakingCounter = inject(BakingCounter);
  @observe private ingredientService = inject(IngredientService);
  
  @state() private selectedIngredientId: string | null = null;
  
  render() {
    return html`
      <pantry-inventory
        .pantry=${this.pantry}
        .selectedIngredientId=${this.selectedIngredientId}
        @ingredient-selected=${this.handleIngredientSelected}>
      </pantry-inventory>
      
      <baking-counter-display
        .bakingCounter=${this.bakingCounter}>
      </baking-counter-display>
      
      ${this.selectedIngredientId ? html`
        <transfer-controls
          .ingredientId=${this.selectedIngredientId}
          .pantry=${this.pantry}
          @transfer-confirmed=${this.handleTransfer}
          @transfer-cancelled=${this.handleCancel}>
        </transfer-controls>
      ` : ''}
    `;
  }
}
```

### `<pantry-inventory>`
**Purpose**: Display pantry ingredients with selection
**Replaces**: updatePantryDisplay() in SubtractionMathScene

### `<transfer-controls>`
**Purpose**: Transfer amount selection and confirmation
**Replaces**: Transfer controls logic in SubtractionMathScene

### `<baking-counter-display>`
**Purpose**: Show staged ingredients on counter
**Replaces**: updateCounterDisplay() in SubtractionMathScene

---

## 4. Recipe Management Components

### `<recipe-collection-panel>`
**Purpose**: Recipe browsing and management
**Replaces**: Recipe collection logic in Application.ts + UIManager.ts

```typescript
@customElement('recipe-collection-panel')
export class RecipeCollectionPanel extends LitElement {
  @observe private recipeLibrary = inject(RecipeLibrary);
  @observe private gameState = inject(GameState);
  
  @state() private sortBy = 'name';
  @state() private filterBy = 'all';
  @state() private showShop = false;
  @state() private selectedRecipeId: string | null = null;
  
  render() {
    const filteredRecipes = this.getFilteredRecipes();
    
    return html`
      <recipe-collection-header
        .sortBy=${this.sortBy}
        .filterBy=${this.filterBy}
        @sort-changed=${this.handleSortChanged}
        @filter-changed=${this.handleFilterChanged}
        @shop-opened=${() => this.showShop = true}>
      </recipe-collection-header>
      
      <recipe-grid
        .recipes=${filteredRecipes}
        .gameState=${this.gameState}
        @recipe-details=${this.handleShowDetails}
        @start-cooking=${this.handleStartCooking}>
      </recipe-grid>
      
      ${this.showShop ? html`
        <recipe-shop-modal
          @close=${() => this.showShop = false}
          @recipe-purchased=${this.handleRecipePurchased}>
        </recipe-shop-modal>
      ` : ''}
      
      ${this.selectedRecipeId ? html`
        <recipe-detail-modal
          .recipeId=${this.selectedRecipeId}
          @close=${() => this.selectedRecipeId = null}
          @start-cooking=${this.handleStartCooking}>
        </recipe-detail-modal>
      ` : ''}
    `;
  }
}
```

### `<recipe-card>`
**Purpose**: Individual recipe display with availability checking
**Replaces**: Recipe card generation in UIManager.ts

```typescript
@customElement('recipe-card')
export class RecipeCard extends LitElement {
  @property({ type: Object }) recipe!: Recipe;
  @observe private pantry = inject(Pantry);
  @observe private recipeLibrary = inject(RecipeLibrary);
  
  @computed get canMake() {
    return this.recipeLibrary.canMakeRecipe(this.recipe.id, this.pantry);
  }
  
  @computed get availabilityClass() {
    return this.canMake ? 'available' : 'unavailable';
  }
  
  render() {
    return html`
      <div class="recipe-card ${this.availabilityClass}" @click=${this.handleCardClick}>
        <recipe-card-header
          .recipe=${this.recipe}>
        </recipe-card-header>
        
        <recipe-card-meta
          .recipe=${this.recipe}>
        </recipe-card-meta>
        
        <recipe-card-actions
          .recipe=${this.recipe}
          .canMake=${this.canMake}
          @show-details=${this.handleShowDetails}
          @start-cooking=${this.handleStartCooking}>
        </recipe-card-actions>
      </div>
    `;
  }
}
```

### `<recipe-detail-modal>`
**Purpose**: Recipe details with scaling
**Replaces**: Recipe modal logic in Application.ts

```typescript
@customElement('recipe-detail-modal')
export class RecipeDetailModal extends LitElement {
  @property() recipeId!: string;
  @observe private recipeLibrary = inject(RecipeLibrary);
  @observe private pantry = inject(Pantry);
  
  @state() private scalingFactor = 1;
  
  @computed get recipe() {
    return this.recipeLibrary.getRecipe(this.recipeId);
  }
  
  @computed get scaledRecipe() {
    return this.recipeLibrary.scaleRecipe(this.recipe, this.scalingFactor);
  }
  
  render() {
    return html`
      <modal-overlay @close=${this.handleClose}>
        <recipe-detail-header
          .recipe=${this.scaledRecipe}>
        </recipe-detail-header>
        
        <recipe-scaling-controls
          .currentServings=${this.scaledRecipe.servings}
          .baseServings=${this.recipe.servings}
          @scale-changed=${this.handleScaleChanged}>
        </recipe-scaling-controls>
        
        <recipe-ingredient-list
          .ingredients=${this.scaledRecipe.ingredients}
          .pantry=${this.pantry}>
        </recipe-ingredient-list>
        
        <recipe-instructions
          .steps=${this.scaledRecipe.steps}>
        </recipe-instructions>
      </modal-overlay>
    `;
  }
}
```

---

## 5. Cooking Workflow Components

### `<cooking-workflow-panel>`
**Purpose**: Multi-step cooking process
**Replaces**: Cooking logic in Application.ts

```typescript
@customElement('cooking-workflow-panel')
export class CookingWorkflowPanel extends LitElement {
  @observe private cookingSession = inject(CookingSession);
  
  @computed get currentStep() {
    return this.cookingSession.currentStep;
  }
  
  @computed get canProceed() {
    return this.cookingSession.canProceedToNextStep();
  }
  
  render() {
    if (!this.cookingSession.isActive) {
      return html`<div>No active cooking session</div>`;
    }
    
    return html`
      <cooking-step-header
        .step=${this.currentStep}
        .recipe=${this.cookingSession.recipe}>
      </cooking-step-header>
      
      <cooking-step-body
        .step=${this.currentStep}
        .bakingCounter=${this.cookingSession.bakingCounter}
        @ingredient-transferred=${this.handleIngredientTransferred}>
      </cooking-step-body>
      
      <cooking-step-controls
        .canProceed=${this.canProceed}
        @proceed=${this.handleProceed}
        @cancel=${this.handleCancel}>
      </cooking-step-controls>
    `;
  }
}
```

### `<ingredient-zone>`
**Purpose**: Individual ingredient requirement
**Replaces**: Ingredient zone generation in Application.ts

```typescript
@customElement('ingredient-zone')
export class IngredientZone extends LitElement {
  @property({ type: Object }) requirement!: IngredientRequirement;
  @observe private pantry = inject(Pantry);
  
  @computed get isFlexible() {
    return this.requirement.type === 'flexible';
  }
  
  @computed get isTransferred() {
    return this.requirement.isTransferred;
  }
  
  render() {
    return html`
      <div class="ingredient-zone ${this.isTransferred ? 'transferred' : 'needed'}">
        <ingredient-zone-header
          .requirement=${this.requirement}>
        </ingredient-zone-header>
        
        ${this.isFlexible ? html`
          <flexible-ingredient-grid
            .ingredient=${this.requirement}
            @amount-changed=${this.handleAmountChanged}
            @transfer-ingredient=${this.handleTransfer}>
          </flexible-ingredient-grid>
        ` : html`
          <fixed-ingredient-controls
            .requirement=${this.requirement}
            .pantry=${this.pantry}
            @transfer-ingredient=${this.handleTransfer}>
          </fixed-ingredient-controls>
        `}
      </div>
    `;
  }
}
```

---

## 6. Production and Packaging Components

### `<production-panel>`
**Purpose**: Production workflow with math visualization
**Replaces**: ProductionService interface logic

```typescript
@customElement('production-panel')
export class ProductionPanel extends LitElement {
  @observe private productionService = inject(ProductionService);
  
  @computed get productionData() {
    return this.productionService.productionData;
  }
  
  render() {
    return html`
      <production-header
        .recipe=${this.productionService.currentRecipe}>
      </production-header>
      
      <production-flow
        .productionData=${this.productionData}
        @cutting-changed=${this.handleCuttingChanged}
        @packaging-changed=${this.handlePackagingChanged}>
      </production-flow>
      
      <production-actions
        @finish-production=${this.handleFinishProduction}
        @back-to-cooking=${this.handleBackToCooking}>
      </production-actions>
    `;
  }
}
```

### `<production-step>`
**Purpose**: Individual production step (items → pieces → packages)
**Replaces**: Production step logic in ProductionService

```typescript
@customElement('production-step')
export class ProductionStep extends LitElement {
  @property() type!: 'initial' | 'cutting' | 'packaging';
  @property({ type: Object }) data!: ProductionStepData;
  
  render() {
    return html`
      <production-step-header
        .type=${this.type}
        .data=${this.data}>
      </production-step-header>
      
      ${this.type !== 'initial' ? html`
        <production-step-controls
          .type=${this.type}
          .value=${this.getValue()}
          @value-changed=${this.handleValueChanged}>
        </production-step-controls>
      ` : ''}
      
      <production-step-visualization
        .type=${this.type}
        .data=${this.data}>
      </production-step-visualization>
      
      <production-step-total
        .type=${this.type}
        .data=${this.data}>
      </production-step-total>
    `;
  }
}
```

---

## 7. Store and Commerce Components

### `<store-panel>`
**Purpose**: Store management interface
**Replaces**: Store logic in Application.ts

```typescript
@customElement('store-panel')
export class StorePanel extends LitElement {
  @observe private store = inject(Store);
  
  @computed get itemsByCategory() {
    return {
      baked_goods: this.store.getItemsByCategory('baked_goods'),
      packages: this.store.getItemsByCategory('packages'),
      ingredients: this.store.getItemsByCategory('ingredients')
    };
  }
  
  render() {
    return html`
      <store-header
        .revenue=${this.store.getTotalRevenue()}
        .itemCount=${this.store.getAllItems().length}
        .storeValue=${this.store.getInventoryValue()}>
      </store-header>
      
      <store-controls
        @location-changed=${this.handleLocationChanged}>
      </store-controls>
      
      <store-inventory
        .itemsByCategory=${this.itemsByCategory}
        @item-sold=${this.handleItemSold}
        @pricing-info=${this.handleShowPricingInfo}>
      </store-inventory>
    `;
  }
}
```

### `<store-item-card>` (Already exists - enhance)
**Purpose**: Individual store item with pricing
**Replaces**: Store item HTML generation

---

## 8. Supplier and Purchasing Components

### `<supplier-panel>`
**Purpose**: Ingredient purchasing interface
**Replaces**: Supplier logic in Application.ts

```typescript
@customElement('supplier-panel')
export class SupplierPanel extends LitElement {
  @observe private store = inject(Store);
  @observe private pantry = inject(Pantry);
  @observe private ingredientService = inject(IngredientService);
  
  @computed get availableCoins() {
    return this.store.getTotalRevenue();
  }
  
  @computed get supplierIngredients() {
    return this.ingredientService.getAllIngredients();
  }
  
  render() {
    return html`
      <supplier-header
        .availableCoins=${this.availableCoins}>
      </supplier-header>
      
      <bulk-pricing-guide></bulk-pricing-guide>
      
      <supplier-inventory
        .ingredients=${this.supplierIngredients}
        .availableCoins=${this.availableCoins}
        .currentStock=${this.pantry.getAllStock()}
        @ingredient-purchased=${this.handlePurchase}>
      </supplier-inventory>
    `;
  }
}
```

### `<supplier-item-card>`
**Purpose**: Individual ingredient purchase options
**Replaces**: Supplier item HTML generation

```typescript
@customElement('supplier-item-card')
export class SupplierItemCard extends LitElement {
  @property({ type: Object }) ingredient!: Ingredient;
  @property({ type: Number }) availableCoins!: number;
  @property({ type: Number }) currentStock = 0;
  
  private quantities = [1, 10, 100] as const;
  
  private calculatePrice(quantity: typeof this.quantities[number]) {
    return this.ingredient.basePrice * quantity * this.getBulkDiscount(quantity);
  }
  
  private getBulkDiscount(quantity: typeof this.quantities[number]) {
    switch (quantity) {
      case 1: return 1.0;
      case 10: return 0.85;
      case 100: return 0.70;
    }
  }
  
  render() {
    return html`
      <supplier-item-header
        .ingredient=${this.ingredient}
        .currentStock=${this.currentStock}>
      </supplier-item-header>
      
      <supplier-quantity-options
        .quantities=${this.quantities}
        .ingredient=${this.ingredient}
        .availableCoins=${this.availableCoins}
        @purchase=${this.handlePurchase}>
      </supplier-quantity-options>
    `;
  }
}
```

---

## 9. Shared/Utility Components

### `<modal-overlay>`
**Purpose**: Reusable modal container
**Replaces**: Modal management in various places

### `<notification-system>`
**Purpose**: Toast notifications and alerts
**Replaces**: Notification logic scattered throughout

### `<currency-display>`
**Purpose**: Consistent currency formatting
**Replaces**: formatCurrency() duplication

### `<amount-formatter>`
**Purpose**: Consistent amount formatting (advanced vs basic mode)
**Replaces**: formatAmount() duplication

---

## Component Communication Patterns

### Event Flow (Bottom-Up)
```typescript
// Child components emit events
this.dispatchEvent(new CustomEvent('ingredient-transferred', {
  detail: { ingredientId, amount },
  bubbles: true
}));

// Parent components handle events
@handleIngredientTransferred(e: CustomEvent) {
  const { ingredientId, amount } = e.detail;
  this.bakingCounter.stageIngredient(ingredientId, amount);
}
```

### State Flow (Top-Down)
```typescript
// Observable state flows down through properties
<ingredient-zone
  .requirement=${this.currentStep.requirements[0]}
  .pantry=${this.pantry}>
</ingredient-zone>

// Components react to state changes
@observe private pantry = inject(Pantry);
// Automatically re-renders when pantry changes
```

### Service Integration
```typescript
// Components inject services directly
@observe private recipeLibrary = inject(RecipeLibrary);
@observe private mathService = inject(MultiplicationService);

// No more Application.ts wrapper functions needed
```

## Migration Strategy

### Phase 1: Core Components
1. Create `<app-shell>` and `<tab-navigation>`
2. Migrate `<math-panel>` (simplest)
3. Create Three.js integration components

### Phase 2: Recipe Components  
1. Create `<recipe-collection-panel>` and `<recipe-card>`
2. Create `<recipe-detail-modal>`
3. Create `<recipe-shop-modal>`

### Phase 3: Cooking Components
1. Create `<cooking-workflow-panel>`
2. Create `<ingredient-zone>` components
3. Enhance existing `<flexible-ingredient-grid>`

### Phase 4: Production & Commerce
1. Create `<production-panel>` components
2. Create `<store-panel>` components  
3. Create `<supplier-panel>` components

### Phase 5: Cleanup
1. Remove Application.ts wrapper functions
2. Remove UIManager.ts duplication
3. Consolidate service layer

## Benefits of This Architecture

1. **Eliminates Duplication**: No more wrapper functions in Application.ts
2. **Clear Boundaries**: Each component has single responsibility
3. **Testable**: Components can be tested in isolation
4. **Reusable**: Shared components reduce code duplication
5. **Maintainable**: Changes localized to specific components
6. **Scalable**: Easy to add new features as new components

This architecture transforms the codebase from coordination-heavy to composition-based, making it much more maintainable and eliminating the duplication issues we identified.