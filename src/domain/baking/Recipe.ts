import { IngredientAmount } from '@/domain/inventory';

export enum RecipeDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard'
}

export interface RecipeMetadata {
  id: string;
  name: string;
  description: string;
  baseServings: number;
  difficulty: RecipeDifficulty;
  bakingTime: number; // in minutes
  icon: string;
}

export class Recipe {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly baseServings: number;
  public readonly ingredients: ReadonlyArray<IngredientAmount>;
  public readonly difficulty: RecipeDifficulty;
  public readonly bakingTime: number;
  public readonly icon: string;

  constructor(
    metadata: RecipeMetadata,
    ingredients: IngredientAmount[]
  ) {
    // Validation
    if (!metadata.id || metadata.id.trim().length === 0) {
      throw new Error('Recipe id cannot be empty');
    }
    if (!metadata.name || metadata.name.trim().length === 0) {
      throw new Error('Recipe name cannot be empty');
    }
    if (metadata.baseServings <= 0) {
      throw new Error('Base servings must be positive');
    }
    if (metadata.bakingTime < 0) {
      throw new Error('Baking time cannot be negative');
    }
    if (!ingredients || ingredients.length === 0) {
      throw new Error('Recipe must have at least one ingredient');
    }

    this.id = metadata.id;
    this.name = metadata.name;
    this.description = metadata.description;
    this.baseServings = metadata.baseServings;
    this.difficulty = metadata.difficulty;
    this.bakingTime = metadata.bakingTime;
    this.icon = metadata.icon;
    this.ingredients = Object.freeze([...ingredients]);
  }

  public scaleToServings(targetServings: number): Recipe {
    if (targetServings <= 0) {
      throw new Error('Target servings must be positive');
    }

    const scalingFactor = targetServings / this.baseServings;
    const scaledIngredients = this.ingredients.map(ingredient => 
      ingredient.multiply(scalingFactor)
    );

    const scaledMetadata: RecipeMetadata = {
      ...this,
      name: `${this.name} (${targetServings} servings)`,
      baseServings: targetServings
    };

    return new Recipe(scaledMetadata, scaledIngredients);
  }

  public getScalingFactor(targetServings: number): number {
    if (targetServings <= 0) {
      throw new Error('Target servings must be positive');
    }
    return targetServings / this.baseServings;
  }

  public getIngredientAmount(ingredientId: string): IngredientAmount | null {
    return this.ingredients.find(ing => ing.ingredient.id === ingredientId) || null;
  }

  public hasIngredient(ingredientId: string): boolean {
    return this.ingredients.some(ing => ing.ingredient.id === ingredientId);
  }

  public getTotalIngredientCount(): number {
    return this.ingredients.length;
  }

  public equals(other: Recipe): boolean {
    return this.id === other.id;
  }

  public toString(): string {
    return `${this.name} (${this.baseServings} servings, ${this.difficulty})`;
  }

  public toDisplayString(): string {
    const ingredientList = this.ingredients
      .map(ing => `${ing.toDisplayString()}`)
      .join(', ');
    
    return `${this.name} - ${this.description}\n` +
           `Servings: ${this.baseServings} | Time: ${this.bakingTime}min | Difficulty: ${this.difficulty}\n` +
           `Ingredients: ${ingredientList}`;
  }

  // Helper method for creating scaled ingredient lists (useful for math problems)
  public createScaledIngredientList(targetServings: number): IngredientAmount[] {
    const scalingFactor = this.getScalingFactor(targetServings);
    return this.ingredients.map(ingredient => ingredient.multiply(scalingFactor));
  }

  // Method to check if recipe can be made with given pantry amounts
  public canBeMadeWith(availableIngredients: Map<string, number>): boolean {
    return this.ingredients.every(required => {
      const available = availableIngredients.get(required.ingredient.id) || 0;
      return available >= required.quantity;
    });
  }

  // Get missing ingredients for this recipe
  public getMissingIngredients(availableIngredients: Map<string, number>): IngredientAmount[] {
    return this.ingredients.filter(required => {
      const available = availableIngredients.get(required.ingredient.id) || 0;
      return available < required.quantity;
    }).map(required => {
      const available = availableIngredients.get(required.ingredient.id) || 0;
      const needed = Math.max(0, required.quantity - available);
      return new IngredientAmount(required.ingredient, needed);
    });
  }
}