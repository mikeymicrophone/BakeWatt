import { IngredientAmount } from '@/domain/inventory';
import { RecipeMetadata, RecipeDifficulty } from './Recipe';
import { RecipeStep } from './RecipeStep';
import { FlexibleIngredient } from './FlexibleIngredient';

export interface MultiStepRecipeMetadata extends RecipeMetadata {
  totalSteps?: number;
  skillLevel?: string; // e.g., "beginner", "intermediate", "advanced"
  tags?: string[]; // e.g., ["vegetarian", "gluten-free", "holiday"]
}

export class MultiStepRecipe {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly baseServings: number;
  public readonly difficulty: RecipeDifficulty;
  public readonly bakingTime: number;
  public readonly icon: string;
  public readonly steps: ReadonlyArray<RecipeStep>;
  public readonly skillLevel?: string;
  public readonly tags: ReadonlyArray<string>;

  // Legacy compatibility
  public readonly ingredients: ReadonlyArray<IngredientAmount>;

  constructor(
    metadata: MultiStepRecipeMetadata,
    steps: RecipeStep[]
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
    if (!steps || steps.length === 0) {
      throw new Error('Recipe must have at least one step');
    }

    // Sort steps by order
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
    
    // Validate step order continuity
    sortedSteps.forEach((step, index) => {
      if (step.order !== index + 1) {
        throw new Error(`Step order must be continuous. Expected step ${index + 1}, got ${step.order}`);
      }
    });

    this.id = metadata.id;
    this.name = metadata.name;
    this.description = metadata.description;
    this.baseServings = metadata.baseServings;
    this.difficulty = metadata.difficulty;
    this.bakingTime = metadata.bakingTime;
    this.icon = metadata.icon;
    this.steps = Object.freeze(sortedSteps);
    this.skillLevel = metadata.skillLevel;
    this.tags = Object.freeze(metadata.tags || []);

    // Create legacy ingredients list for backward compatibility
    this.ingredients = Object.freeze(this.getAllIngredients());
  }

  /**
   * Get all ingredients across all steps (for legacy compatibility)
   */
  private getAllIngredients(): IngredientAmount[] {
    const ingredientMap = new Map<string, number>();

    this.steps.forEach(step => {
      const amounts = step.getDefaultIngredientAmounts();
      amounts.forEach((amount, ingredientId) => {
        const currentAmount = ingredientMap.get(ingredientId) || 0;
        ingredientMap.set(ingredientId, currentAmount + amount);
      });
    });

    const ingredients: IngredientAmount[] = [];
    ingredientMap.forEach((totalAmount, ingredientId) => {
      // Find the ingredient object from any step
      const flexibleIngredient = this.findIngredientInSteps(ingredientId);
      if (flexibleIngredient) {
        ingredients.push(new IngredientAmount(flexibleIngredient.ingredient, totalAmount));
      }
    });

    return ingredients;
  }

  /**
   * Find a FlexibleIngredient across all steps
   */
  private findIngredientInSteps(ingredientId: string): FlexibleIngredient | null {
    for (const step of this.steps) {
      const ingredient = step.getIngredient(ingredientId);
      if (ingredient) {
        return ingredient;
      }
    }
    return null;
  }

  /**
   * Get a specific step by order number
   */
  public getStep(stepNumber: number): RecipeStep | null {
    return this.steps.find(step => step.order === stepNumber) || null;
  }

  /**
   * Get total estimated time for all steps
   */
  public getTotalEstimatedTime(): number {
    return this.steps.reduce((total, step) => {
      return total + (step.estimatedTime || 0);
    }, 0);
  }

  /**
   * Get all ingredients needed for a specific step
   */
  public getStepIngredients(stepNumber: number): FlexibleIngredient[] {
    const step = this.getStep(stepNumber);
    return step ? [...step.ingredients] : [];
  }

  /**
   * Get total ingredient requirements with custom amounts per step
   */
  public getTotalIngredientRequirements(customAmountsByStep?: Map<number, Map<string, number>>): Map<string, number> {
    const totalRequirements = new Map<string, number>();

    this.steps.forEach(step => {
      const customAmounts = customAmountsByStep?.get(step.order);
      const stepAmounts = step.getIngredientAmounts(customAmounts);
      
      stepAmounts.forEach((amount, ingredientId) => {
        const currentTotal = totalRequirements.get(ingredientId) || 0;
        totalRequirements.set(ingredientId, currentTotal + amount);
      });
    });

    return totalRequirements;
  }

  /**
   * Scale the entire recipe by a factor
   */
  public scaleToServings(targetServings: number): MultiStepRecipe {
    if (targetServings <= 0) {
      throw new Error('Target servings must be positive');
    }

    const scalingFactor = targetServings / this.baseServings;
    const scaledSteps = this.steps.map(step => step.scale(scalingFactor));

    const scaledMetadata: MultiStepRecipeMetadata = {
      ...this,
      name: `${this.name} (${targetServings} servings)`,
      baseServings: targetServings,
      tags: [...this.tags]
    };

    return new MultiStepRecipe(scaledMetadata, scaledSteps);
  }

  /**
   * Check if recipe can be made with available ingredients
   */
  public canBeMadeWith(availableIngredients: Map<string, number>, customAmountsByStep?: Map<number, Map<string, number>>): boolean {
    const totalRequirements = this.getTotalIngredientRequirements(customAmountsByStep);
    
    for (const [ingredientId, required] of totalRequirements) {
      const available = availableIngredients.get(ingredientId) || 0;
      if (available < required) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get missing ingredients for this recipe
   */
  public getMissingIngredients(availableIngredients: Map<string, number>, customAmountsByStep?: Map<number, Map<string, number>>): IngredientAmount[] {
    const totalRequirements = this.getTotalIngredientRequirements(customAmountsByStep);
    const missing: IngredientAmount[] = [];

    totalRequirements.forEach((required, ingredientId) => {
      const available = availableIngredients.get(ingredientId) || 0;
      if (available < required) {
        const ingredient = this.findIngredientInSteps(ingredientId);
        if (ingredient) {
          missing.push(new IngredientAmount(ingredient.ingredient, required - available));
        }
      }
    });

    return missing;
  }

  /**
   * Get steps that use a specific ingredient
   */
  public getStepsUsingIngredient(ingredientId: string): RecipeStep[] {
    return this.steps.filter(step => step.usesIngredient(ingredientId));
  }

  /**
   * Get recipe overview for display
   */
  public getOverview(): {
    totalSteps: number;
    totalTime: number;
    difficulty: RecipeDifficulty;
    tags: string[];
    servings: number;
  } {
    return {
      totalSteps: this.steps.length,
      totalTime: this.getTotalEstimatedTime(),
      difficulty: this.difficulty,
      tags: [...this.tags],
      servings: this.baseServings
    };
  }

  /**
   * Legacy compatibility methods
   */
  public getScalingFactor(targetServings: number): number {
    if (targetServings <= 0) {
      throw new Error('Target servings must be positive');
    }
    return targetServings / this.baseServings;
  }

  public hasIngredient(ingredientId: string): boolean {
    return this.steps.some(step => step.usesIngredient(ingredientId));
  }

  public equals(other: MultiStepRecipe): boolean {
    return this.id === other.id;
  }

  public toString(): string {
    return `${this.name} (${this.baseServings} servings, ${this.steps.length} steps, ${this.difficulty})`;
  }
}