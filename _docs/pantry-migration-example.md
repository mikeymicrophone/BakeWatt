# Pantry Transfer Component Migration Example

## What We've Created

We've componentized the pantry transfer functionality from `SubtractionMathScene.ts` into four Lit components:

1. **`<pantry-transfer-panel>`** - Main container (replaces SubtractionMathScene)
2. **`<pantry-inventory>`** - Ingredient grid display (replaces updatePantryDisplay())
3. **`<baking-counter-display>`** - Counter display (replaces updateCounterDisplay())
4. **`<transfer-controls>`** - Transfer UI (replaces transfer controls logic)

## Key Improvements

### **Eliminated Duplication**
- **Before**: Manual DOM manipulation in `updatePantryDisplay()`, `updateCounterDisplay()`, etc.
- **After**: Reactive components that auto-update when data changes

### **Clear Separation of Concerns**
- **Before**: All logic mixed in SubtractionMathScene (~385 lines)
- **After**: Each component handles one responsibility (~100 lines each)

### **Event-Driven Communication**
- **Before**: Direct method calls and property access
- **After**: Custom events bubble up, properties flow down

## Integration Steps

### 1. Import the Components

```typescript
// In Application.ts or main.ts
import '@/presentation/components/pantry';
```

### 2. Update the HTML

Replace the existing transfer panel HTML in `index.html`:

```html
<!-- OLD: Static HTML -->
<div class="transfer-panel" id="transfer-panel" style="display: none;">
  <h3>📦 Pantry Transfer</h3>
  <!-- ... lots of static HTML ... -->
</div>

<!-- NEW: Component -->
<pantry-transfer-panel id="pantry-transfer-panel" hidden></pantry-transfer-panel>
```

### 3. Update Application.ts Tab Switching

```typescript
// In Application.ts switchToTab method:
@action
public switchToTab(tabName: string): void {
  console.log(`🎯 Switching to ${tabName} tab`);
  
  // Update current tab
  this._currentTab = tabName;
  
  // Get panels
  const mathPanel = document.getElementById('math-panel');
  const pantryPanel = document.querySelector('pantry-transfer-panel') as any;
  const recipePanel = document.getElementById('recipe-collection-panel');
  const supplierPanel = document.getElementById('supplier-panel');
  const storePanel = document.getElementById('store-panel');
  
  // Hide all panels
  if (mathPanel) mathPanel.style.display = 'none';
  if (pantryPanel) pantryPanel.hide();
  if (recipePanel) recipePanel.style.display = 'none';
  if (supplierPanel) supplierPanel.style.display = 'none';
  if (storePanel) storePanel.style.display = 'none';
  
  // Show current panel
  switch (tabName) {
    case 'math':
      if (mathPanel) mathPanel.style.display = 'block';
      break;
    case 'transfer':
      if (pantryPanel) {
        pantryPanel.show();
        pantryPanel.setGameState(this._gameState);
      }
      break;
    // ... other cases
  }
  
  // Update tab visual state
  this.updateTabButtons();
}
```

### 4. Connect Three.js Visualization

```typescript
// In Application.ts, add event listener for subtraction visualization
public initialize(): Promise<void> {
  // ... existing initialization
  
  // Listen for subtraction visualization requests
  document.addEventListener('create-subtraction-visualization', this.handleSubtractionVisualization.bind(this));
}

private handleSubtractionVisualization(e: CustomEvent) {
  const { totalAmount, removeAmount } = e.detail;
  
  // Clear existing cube grid
  if (this.cubeGrid) {
    this.cubeGrid.destroy();
  }
  
  // Create subtraction visualization
  this.cubeGrid = new CubeGrid(this.sceneManager, this.zoomManager);
  this.cubeGrid.createSubtractionGrid(totalAmount, removeAmount);
  
  // Animate after delay
  setTimeout(() => {
    if (this.cubeGrid) {
      this.cubeGrid.animateSubtraction(removeAmount);
    }
  }, 1000);
}
```

### 5. Handle Success/Error Notifications

```typescript
// In Application.ts, add event listeners for transfer results
public initialize(): Promise<void> {
  // ... existing initialization
  
  document.addEventListener('transfer-success', this.handleTransferSuccess.bind(this));
  document.addEventListener('transfer-error', this.handleTransferError.bind(this));
}

private handleTransferSuccess(e: CustomEvent) {
  const { ingredientId, amount } = e.detail;
  // Show success notification
  this.showSalesNotification(`✅ Transferred ${amount} ${ingredientId}`);
}

private handleTransferError(e: CustomEvent) {
  const { message } = e.detail;
  // Show error notification
  this.showSalesNotification(`❌ ${message}`);
}
```

## Code Elimination

### **Remove from Application.ts:**
- `subtractionScene` property and initialization
- All `SubtractionMathScene` method calls
- Manual transfer panel show/hide logic

### **Files That Can Be Removed Eventually:**
- `SubtractionMathScene.ts` (385 lines eliminated!)
- Transfer panel HTML from `index.html`
- Transfer panel CSS (already componentized)

### **Functions Eliminated:**
- `updatePantryDisplay()` - replaced by reactive `<pantry-inventory>`
- `updateCounterDisplay()` - replaced by reactive `<baking-counter-display>`
- `updateTransferControls()` - replaced by `<transfer-controls>`
- `setupEventListeners()` - handled by component lifecycle
- `cleanup()` - handled by component lifecycle

## Benefits Achieved

### **Reactive Updates**
```typescript
// OLD: Manual updates required
this.updatePantryDisplay();
this.updateCounterDisplay();
this.updateSubtractionDisplay();

// NEW: Automatic updates
// Components automatically re-render when @observable state changes
```

### **Cleaner Event Handling**
```typescript
// OLD: Manual event listener management
setupEventListeners() {
  const btn = document.getElementById('visualize-transfer-btn');
  btn.addEventListener('click', this.handleVisualize.bind(this));
  this.disposers.push(() => btn.removeEventListener('click', this.handleVisualize.bind(this)));
}

// NEW: Declarative event handling
<button @click=${this.handleVisualize}>Show Subtraction</button>
```

### **Testable Components**
```typescript
// Can now test components in isolation
const pantryInventory = new PantryInventory();
pantryInventory.ingredients = mockIngredients;
// Test rendering, event handling, etc.
```

## Migration Result

- **SubtractionMathScene.ts**: 385 lines → **DELETED**
- **Application.ts**: Removes ~200 lines of transfer logic
- **New Components**: 4 focused components (~400 lines total, but reusable and testable)
- **Net Result**: Cleaner, more maintainable code with same functionality

This migration demonstrates the component architecture benefits:
1. **Eliminates duplication** (manual DOM updates)
2. **Improves maintainability** (single responsibility)
3. **Enables testability** (isolated components)
4. **Reduces Application.ts complexity** (fewer concerns)

The pattern can be applied to all other sections following the same approach!