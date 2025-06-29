import { Ingredient } from '@/domain/inventory';

export interface IngredientRange {
  min: number;
  max: number;
  recommended?: number;
  step?: number; // For UI slider/input increments
}

export class FlexibleIngredient {
  public readonly ingredient: Ingredient;
  public readonly isFixed: boolean;
  public readonly fixedAmount?: number;
  public readonly range?: IngredientRange;
  public readonly description?: string; // Optional description for flexibility

  constructor(
    ingredient: Ingredient,
    amount: number | IngredientRange,
    description?: string
  ) {
    this.ingredient = ingredient;
    this.description = description;

    if (typeof amount === 'number') {
      // Fixed amount ingredient
      this.isFixed = true;
      this.fixedAmount = amount;
      this.range = undefined;
    } else {
      // Flexible range ingredient
      this.isFixed = false;
      this.fixedAmount = undefined;
      this.range = {
        min: amount.min,
        max: amount.max,
        recommended: amount.recommended ?? (amount.min + amount.max) / 2,
        step: amount.step ?? 1
      };

      // Validation
      if (amount.min >= amount.max) {
        throw new Error(`Invalid range: min (${amount.min}) must be less than max (${amount.max})`);
      }
      if (amount.min < 0) {
        throw new Error('Range minimum cannot be negative');
      }
    }
  }

  /**
   * Get the amount to use - fixed amount or recommended amount for ranges
   */
  public getDefaultAmount(): number {
    return this.isFixed ? this.fixedAmount! : this.range!.recommended!;
  }

  /**
   * Get a specific amount within the range
   */
  public getAmount(amount?: number): number {
    if (this.isFixed) {
      return this.fixedAmount!;
    }

    if (amount === undefined) {
      return this.range!.recommended!;
    }

    // Clamp to range
    return Math.max(this.range!.min, Math.min(this.range!.max, amount));
  }

  /**
   * Check if a given amount is valid for this ingredient
   */
  public isValidAmount(amount: number): boolean {
    if (this.isFixed) {
      return amount === this.fixedAmount;
    }

    return amount >= this.range!.min && amount <= this.range!.max;
  }

  /**
   * Scale the ingredient by a factor (for recipe scaling)
   */
  public scale(factor: number): FlexibleIngredient {
    if (this.isFixed) {
      return new FlexibleIngredient(
        this.ingredient,
        this.fixedAmount! * factor,
        this.description
      );
    } else {
      const scaledRange: IngredientRange = {
        min: this.range!.min * factor,
        max: this.range!.max * factor,
        recommended: this.range!.recommended! * factor,
        step: this.range!.step! * factor
      };
      return new FlexibleIngredient(
        this.ingredient,
        scaledRange,
        this.description
      );
    }
  }

  /**
   * Convert to a display string
   */
  public toDisplayString(amount?: number): string {
    const actualAmount = amount ?? this.getDefaultAmount();
    const unit = this.ingredient.unit;
    const name = this.ingredient.name;

    if (this.isFixed) {
      return `${actualAmount} ${unit} ${name}`;
    } else {
      const min = this.range!.min;
      const max = this.range!.max;
      return `${actualAmount} ${unit} ${name} (${min}-${max} ${unit})`;
    }
  }

  /**
   * Get range description for UI
   */
  public getRangeDescription(): string {
    if (this.isFixed) {
      return `${this.fixedAmount} ${this.ingredient.unit}`;
    } else {
      const { min, max, recommended } = this.range!;
      return `${min}-${max} ${this.ingredient.unit} (recommended: ${recommended})`;
    }
  }

  /**
   * Calculate calories for this ingredient using default amount
   */
  public calculateCalories(amount?: number): number {
    const actualAmount = amount ?? this.getDefaultAmount();
    return this.ingredient.calculateCalories(actualAmount, this.ingredient.unit);
  }

  /**
   * Convert to grams using default amount
   */
  public toGrams(amount?: number): number {
    const actualAmount = amount ?? this.getDefaultAmount();
    return this.ingredient.toGrams(actualAmount, this.ingredient.unit);
  }

  /**
   * Get nutrition info for this ingredient amount
   */
  public getNutritionInfo(amount?: number): {
    grams: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  } {
    const actualAmount = amount ?? this.getDefaultAmount();
    const grams = this.ingredient.toGrams(actualAmount, this.ingredient.unit);
    const nutrition = this.ingredient.getNutrition();
    
    if (!nutrition) {
      return { grams, calories: 0, protein: 0, fat: 0, carbs: 0 };
    }

    return {
      grams,
      calories: grams * nutrition.caloriesPerGram,
      protein: grams * (nutrition.proteinPerGram || 0),
      fat: grams * (nutrition.fatPerGram || 0),
      carbs: grams * (nutrition.carbsPerGram || 0)
    };
  }
}