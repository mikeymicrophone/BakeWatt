import { injectable } from 'inversify';
import { observable, action } from 'mobx';
import { Ingredient, STARTER_INGREDIENTS } from './Ingredient';
import { IngredientAmount } from './IngredientAmount';
import { Pantry, PantryState } from './Pantry';

export interface IngredientRepository {
  getIngredient(id: string): Ingredient | null;
  getAllIngredients(): Ingredient[];
  savePantryState(state: PantryState): void;
  loadPantryState(): PantryState | null;
}

@injectable()
export class LocalStorageIngredientRepository implements IngredientRepository {
  private static readonly PANTRY_STORAGE_KEY = 'bakewatt-pantry';
  private ingredients = new Map<string, Ingredient>();

  constructor() {
    this.initializeIngredients();
  }

  private initializeIngredients(): void {
    Object.values(STARTER_INGREDIENTS).forEach(ingredient => {
      this.ingredients.set(ingredient.id, ingredient);
    });
  }

  public getIngredient(id: string): Ingredient | null {
    return this.ingredients.get(id) || null;
  }

  public getAllIngredients(): Ingredient[] {
    return Array.from(this.ingredients.values());
  }

  public savePantryState(state: PantryState): void {
    try {
      localStorage.setItem(
        LocalStorageIngredientRepository.PANTRY_STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.warn('Failed to save pantry state to localStorage:', error);
    }
  }

  public loadPantryState(): PantryState | null {
    try {
      const saved = localStorage.getItem(LocalStorageIngredientRepository.PANTRY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load pantry state from localStorage:', error);
      return null;
    }
  }
}

@injectable()
export class IngredientService {
  @observable private pantry: Pantry;

  constructor(private repository: IngredientRepository = new LocalStorageIngredientRepository()) {
    const savedState = this.repository.loadPantryState();
    this.pantry = new Pantry(savedState || this.getInitialPantryState());
  }

  private getInitialPantryState(): PantryState {
    return {
      [STARTER_INGREDIENTS.FLOUR.id]: 15,  // 15 cups flour
      [STARTER_INGREDIENTS.BUTTER.id]: 6,  // 6 sticks butter  
      [STARTER_INGREDIENTS.EGGS.id]: 12    // 12 eggs
    };
  }

  public getPantry(): Pantry {
    return this.pantry;
  }

  public getIngredient(id: string): Ingredient | null {
    return this.repository.getIngredient(id);
  }

  public getAllIngredients(): Ingredient[] {
    return this.repository.getAllIngredients();
  }

  public getIngredientAmount(id: string): IngredientAmount | null {
    const ingredient = this.getIngredient(id);
    if (!ingredient) return null;

    const quantity = this.pantry.getStock(id);
    return new IngredientAmount(ingredient, quantity);
  }

  public getAllIngredientAmounts(): IngredientAmount[] {
    return this.pantry.ingredientIds
      .map(id => this.getIngredientAmount(id))
      .filter((amount): amount is IngredientAmount => amount !== null);
  }

  @action
  public addToPantry(ingredientId: string, amount: number): void {
    const ingredient = this.getIngredient(ingredientId);
    if (!ingredient) {
      throw new Error(`Unknown ingredient: ${ingredientId}`);
    }

    this.pantry.addIngredient(ingredientId, amount);
    this.savePantryState();
  }

  @action
  public removeFromPantry(ingredientId: string, amount: number): void {
    const ingredient = this.getIngredient(ingredientId);
    if (!ingredient) {
      throw new Error(`Unknown ingredient: ${ingredientId}`);
    }

    this.pantry.removeIngredient(ingredientId, amount);
    this.savePantryState();
  }

  @action
  public transferIngredients(ingredientAmounts: IngredientAmount[]): void {
    // Validate all ingredients exist
    ingredientAmounts.forEach(amount => {
      const ingredient = this.getIngredient(amount.ingredient.id);
      if (!ingredient) {
        throw new Error(`Unknown ingredient: ${amount.ingredient.id}`);
      }
    });

    this.pantry.transferIngredients(ingredientAmounts);
    this.savePantryState();
  }

  @action
  public resetPantry(): void {
    const initialState = this.getInitialPantryState();
    this.pantry = new Pantry(initialState);
    this.savePantryState();
  }

  private savePantryState(): void {
    this.repository.savePantryState(this.pantry.toState());
  }

  public validateIngredientOperation(ingredientId: string, amount: number, operation: 'add' | 'remove'): string | null {
    const ingredient = this.getIngredient(ingredientId);
    if (!ingredient) {
      return `Unknown ingredient: ${ingredientId}`;
    }

    if (amount <= 0) {
      return `Amount must be positive, got: ${amount}`;
    }

    if (!Number.isFinite(amount)) {
      return `Amount must be a valid number, got: ${amount}`;
    }

    if (operation === 'remove' && !this.pantry.hasEnough(ingredientId, amount)) {
      const available = this.pantry.getStock(ingredientId);
      return `Insufficient ${ingredient.name}: have ${available} ${ingredient.unit}, need ${amount} ${ingredient.unit}`;
    }

    return null; // Valid operation
  }
}