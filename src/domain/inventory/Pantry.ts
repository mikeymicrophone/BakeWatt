import { observable, action, computed } from 'mobx';
import { IngredientAmount } from './IngredientAmount';

export interface PantryState {
  [ingredientId: string]: number;
}

export class Pantry {
  @observable private ingredients = new Map<string, number>();

  constructor(initialState?: PantryState) {
    if (initialState) {
      Object.entries(initialState).forEach(([id, amount]) => {
        this.ingredients.set(id, amount);
      });
    }
  }

  @action
  public addIngredient(ingredientId: string, amount: number): void {
    if (amount < 0) {
      throw new Error('Cannot add negative amount to pantry');
    }
    
    const currentAmount = this.ingredients.get(ingredientId) || 0;
    this.ingredients.set(ingredientId, currentAmount + amount);
  }

  @action
  public removeIngredient(ingredientId: string, amount: number): void {
    if (amount < 0) {
      throw new Error('Cannot remove negative amount from pantry');
    }

    const currentAmount = this.ingredients.get(ingredientId) || 0;
    if (currentAmount < amount) {
      throw new Error(`Insufficient ${ingredientId}: have ${currentAmount}, need ${amount}`);
    }

    const newAmount = currentAmount - amount;
    if (newAmount === 0) {
      this.ingredients.delete(ingredientId);
    } else {
      this.ingredients.set(ingredientId, newAmount);
    }
  }

  public hasEnough(ingredientId: string, amount: number): boolean {
    const currentAmount = this.ingredients.get(ingredientId) || 0;
    return currentAmount >= amount;
  }

  public getStock(ingredientId: string): number {
    return this.ingredients.get(ingredientId) || 0;
  }

  @computed
  public get isEmpty(): boolean {
    return this.ingredients.size === 0;
  }

  @computed
  public get ingredientIds(): string[] {
    return Array.from(this.ingredients.keys());
  }

  public getAllStock(): Map<string, number> {
    return new Map(this.ingredients);
  }

  @action
  public setStock(ingredientId: string, amount: number): void {
    if (amount < 0) {
      throw new Error('Stock amount cannot be negative');
    }
    
    if (amount === 0) {
      this.ingredients.delete(ingredientId);
    } else {
      this.ingredients.set(ingredientId, amount);
    }
  }

  @action
  public clear(): void {
    this.ingredients.clear();
  }

  public canSupport(ingredientAmounts: IngredientAmount[]): boolean {
    return ingredientAmounts.every(ingredientAmount => 
      this.hasEnough(ingredientAmount.ingredient.id, ingredientAmount.quantity)
    );
  }

  public getMissingIngredients(ingredientAmounts: IngredientAmount[]): IngredientAmount[] {
    return ingredientAmounts.filter(ingredientAmount => {
      const available = this.getStock(ingredientAmount.ingredient.id);
      return available < ingredientAmount.quantity;
    }).map(ingredientAmount => {
      const available = this.getStock(ingredientAmount.ingredient.id);
      const needed = ingredientAmount.quantity - available;
      return new IngredientAmount(ingredientAmount.ingredient, needed);
    });
  }

  @action
  public transferIngredients(ingredientAmounts: IngredientAmount[]): void {
    // Validate all transfers first
    ingredientAmounts.forEach(ingredientAmount => {
      if (!this.hasEnough(ingredientAmount.ingredient.id, ingredientAmount.quantity)) {
        throw new Error(
          `Insufficient ${ingredientAmount.ingredient.name}: ` +
          `have ${this.getStock(ingredientAmount.ingredient.id)} ${ingredientAmount.ingredient.unit}, ` +
          `need ${ingredientAmount.quantity} ${ingredientAmount.ingredient.unit}`
        );
      }
    });

    // Perform all transfers
    ingredientAmounts.forEach(ingredientAmount => {
      this.removeIngredient(ingredientAmount.ingredient.id, ingredientAmount.quantity);
    });
  }

  public toState(): PantryState {
    const state: PantryState = {};
    this.ingredients.forEach((amount, id) => {
      state[id] = amount;
    });
    return state;
  }

  public clone(): Pantry {
    return new Pantry(this.toState());
  }
}