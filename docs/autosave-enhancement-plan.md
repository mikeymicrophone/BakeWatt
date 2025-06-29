# Enhanced Autosave System Design

## Current Storage Analysis
- ✅ **Basic game state**: pantry, store, recipes, level, tutorial
- ❌ **Missing**: cooking history, transaction history, user preferences
- ❌ **Missing**: session data, recipe scaling preferences, production history

## Proposed Enhanced GameState Structure

### 1. Transaction History
```typescript
interface TransactionHistory {
  id: string;
  timestamp: string;
  type: 'purchase' | 'sale' | 'production';
  details: {
    // For purchases
    ingredientId?: string;
    quantity?: number;
    unitPrice?: number;
    bulkDiscount?: number;
    
    // For sales  
    itemId?: string;
    sellQuantity?: number;
    sellPrice?: number;
    
    // For production
    recipeId?: string;
    producedQuantity?: number;
    producedItems?: string[];
  };
  totalAmount: number; // Revenue change
}

interface TransactionHistoryState {
  transactions: TransactionHistory[];
  dailyStats: Record<string, {
    revenue: number;
    purchases: number;
    sales: number;
    productions: number;
  }>;
}
```

### 2. Cooking History
```typescript
interface CookingSession {
  id: string;
  recipeId: string;
  startTime: string;
  endTime?: string;
  scalingFactor: number;
  ingredients: Array<{
    ingredientId: string;
    amountUsed: number;
    wasFlexible: boolean;
    minAmount?: number;
    maxAmount?: number;
  }>;
  status: 'completed' | 'cancelled' | 'in_progress';
  producedItems?: Array<{
    itemId: string;
    quantity: number;
  }>;
}

interface CookingHistoryState {
  sessions: CookingSession[];
  stats: {
    totalCookingSessions: number;
    completedRecipes: Record<string, number>; // Recipe ID -> times completed
    favoriteRecipes: string[]; // Most cooked recipes
    averageCookingTime: Record<string, number>; // Recipe ID -> avg time
  };
}
```

### 3. User Preferences & Settings
```typescript
interface UserPreferencesState {
  ui: {
    advancedMode: boolean;
    defaultTab: string;
    recipeScalings: Record<string, {
      preferredServings: number;
      lastUsedScaling: number;
    }>;
  };
  gameplay: {
    autoSaveInterval: number; // minutes
    showNotifications: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  display: {
    theme: 'light' | 'dark';
    animations: boolean;
    soundEffects: boolean;
  };
}
```

### 4. Production History
```typescript
interface ProductionHistoryState {
  sessions: Array<{
    id: string;
    recipeId: string;
    timestamp: string;
    initialItems: number;
    piecesPerItem: number;
    piecesPerPackage: number;
    totalPackagesProduced: number;
    remainingPieces: number;
  }>;
  stats: {
    totalProductions: number;
    mostProducedRecipe: string;
    averageEfficiency: number; // packages per production
  };
}
```

### 5. Enhanced GameStateData
```typescript
export interface EnhancedGameStateData extends GameStateData {
  // Existing fields
  pantry: PantryState;
  recipes: RecipeCollectionState;
  store: StoreState;
  currentLevel: number;
  tutorialCompleted: boolean;
  gameVersion: string;
  lastSaved: string;
  
  // New history fields
  transactionHistory: TransactionHistoryState;
  cookingHistory: CookingHistoryState;
  productionHistory: ProductionHistoryState;
  userPreferences: UserPreferencesState;
  
  // Session data (for resume functionality)
  currentSession?: {
    activeTab: string;
    currentRecipe?: {
      recipeId: string;
      currentStep: number;
      scalingFactor: number;
      usedIngredients: Record<string, number>;
    };
  };
  
  // Analytics data
  analytics: {
    totalPlayTime: number; // minutes
    sessionsCount: number;
    achievements: string[];
    milestones: Record<string, string>; // milestone -> timestamp
  };
}
```

## Implementation Priority

### Phase 1 (Essential for Autosave)
1. **Transaction History** - Track all purchases/sales for economic gameplay
2. **Cooking History** - Resume interrupted cooking sessions
3. **User Preferences** - Save UI state and preferences

### Phase 2 (Quality of Life)
4. **Production History** - Track production efficiency
5. **Session Resume** - Continue exactly where left off
6. **Analytics** - Game progression insights

### Phase 3 (Advanced Features)
7. **Achievement System** - Based on history data
8. **Statistics Dashboard** - Historical performance views
9. **Export/Import** - Share game saves

## Autosave Triggers

```typescript
// Trigger autosave on these events:
- Recipe completion
- Store purchase/sale
- Supplier purchase
- Level advancement
- Settings change
- Every 5 minutes (configurable)
- Before tab close/refresh
```

## Storage Optimization

```typescript
// Implement data pruning to prevent localStorage bloat:
- Keep last 100 transactions
- Keep last 50 cooking sessions  
- Keep last 30 production sessions
- Archive older data to IndexedDB for power users
```

## Migration Strategy

```typescript
// Version your save data for backward compatibility:
const SAVE_VERSIONS = {
  '1.0.0': BasicGameSave,      // Current
  '1.1.0': EnhancedGameSave,   // With history
  '1.2.0': AnalyticsGameSave   // With analytics
};
```

This enhanced system would provide:
- **Resume Capability**: Continue cooking exactly where you left off
- **Economic Intelligence**: Track spending patterns and profitability  
- **Progress Tracking**: See cooking improvement over time
- **Personalization**: Remember user preferences and optimal recipe scalings
- **Rich Analytics**: Understand player behavior and game balance