import { observable, action, computed } from 'mobx';
import { Ingredient, IngredientAmount } from './index';

export interface CounterState {
  [ingredientId: string]: number;
}

export interface IngredientTransfer {
  ingredient: Ingredient;
  amount: number;
  fromAmount: number;
  toAmount: number;
  remainingInPantry: number;
}

export interface SubtractionProblem {
  ingredient: Ingredient;
  pantryAmount: number;
  transferAmount: number;
  remainingAmount: number;
  problem: string; // "10 cups flour - 6 cups = 4 cups remaining"
  isValid: boolean;
}

export class BakingCounter {
  @observable private _stagedIngredients: Map<string, IngredientAmount> = new Map();

  constructor(initialState?: CounterState) {
    if (initialState) {
      this.loadFromState(initialState);
    }
  }

  @computed
  get stagedIngredients(): IngredientAmount[] {
    return Array.from(this._stagedIngredients.values());
  }

  @computed
  get isEmpty(): boolean {
    return this._stagedIngredients.size === 0;
  }

  @computed
  get totalItems(): number {
    return Array.from(this._stagedIngredients.values())
      .reduce((total, amount) => total + amount.quantity, 0);
  }

  @action
  public stageIngredient(ingredient: Ingredient, amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const existing = this._stagedIngredients.get(ingredient.id);
    if (existing) {
      // Add to existing amount
      this._stagedIngredients.set(
        ingredient.id,
        new IngredientAmount(ingredient, existing.quantity + amount)
      );
    } else {
      // Create new staged ingredient
      this._stagedIngredients.set(
        ingredient.id,
        new IngredientAmount(ingredient, amount)
      );
    }
  }

  @action
  public removeIngredient(ingredientId: string, amount: number): boolean {
    const existing = this._stagedIngredients.get(ingredientId);
    if (!existing || existing.quantity < amount) {
      return false;
    }

    if (existing.quantity === amount) {
      this._stagedIngredients.delete(ingredientId);
    } else {
      this._stagedIngredients.set(
        ingredientId,
        new IngredientAmount(existing.ingredient, existing.quantity - amount)
      );
    }

    return true;
  }

  @action
  public clearIngredient(ingredientId: string): void {
    this._stagedIngredients.delete(ingredientId);
  }

  @action
  public clearAll(): void {
    this._stagedIngredients.clear();
  }

  public getIngredientAmount(ingredientId: string): number {
    const ingredient = this._stagedIngredients.get(ingredientId);
    return ingredient ? ingredient.quantity : 0;
  }

  public hasIngredient(ingredientId: string): boolean {
    return this._stagedIngredients.has(ingredientId);
  }

  public hasRequiredAmount(ingredientId: string, requiredAmount: number): boolean {
    const available = this.getIngredientAmount(ingredientId);
    return available >= requiredAmount;
  }

  @computed
  get counterState(): CounterState {
    const state: CounterState = {};
    this._stagedIngredients.forEach((amount, ingredientId) => {
      state[ingredientId] = amount.quantity;
    });
    return state;
  }

  @action
  private loadFromState(state: CounterState): void {
    // Note: This requires ingredient lookup by ID
    // Implementation depends on how ingredients are globally accessible
    Object.entries(state).forEach(([ingredientId, _quantity]) => {
      // For now, create placeholder - will be implemented with proper ingredient lookup
      console.warn(`BakingCounter.loadFromState: Ingredient lookup not implemented for ${ingredientId}`);
    });
  }

  /**
   * Validates if a transfer is possible and creates a subtraction problem
   */
  public createTransferProblem(
    ingredient: Ingredient,
    pantryAmount: number,
    transferAmount: number
  ): SubtractionProblem {
    const isValid = pantryAmount >= transferAmount && transferAmount > 0;
    const remainingAmount = isValid ? pantryAmount - transferAmount : pantryAmount;
    
    const problem = `${pantryAmount} ${ingredient.unit} ${ingredient.name} - ${transferAmount} ${ingredient.unit} = ${remainingAmount} ${ingredient.unit} remaining`;

    return {
      ingredient,
      pantryAmount,
      transferAmount,
      remainingAmount,
      problem,
      isValid
    };
  }

  /**
   * Check if counter meets recipe requirements
   */
  public meetsRecipeRequirements(requiredIngredients: IngredientAmount[]): {
    isSufficient: boolean;
    missing: IngredientAmount[];
    excess: IngredientAmount[];
  } {
    const missing: IngredientAmount[] = [];
    const excess: IngredientAmount[] = [];

    // Check each required ingredient
    requiredIngredients.forEach(required => {
      const available = this.getIngredientAmount(required.ingredient.id);
      
      if (available < required.quantity) {
        missing.push(new IngredientAmount(
          required.ingredient,
          required.quantity - available
        ));
      } else if (available > required.quantity) {
        excess.push(new IngredientAmount(
          required.ingredient,
          available - required.quantity
        ));
      }
    });

    return {
      isSufficient: missing.length === 0,
      missing,
      excess
    };
  }
}