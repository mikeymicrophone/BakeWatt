export interface UnitConversion {
  unit: string;
  gramsPerUnit: number;
  displayName: string;
  abbreviation: string;
}

export interface IngredientNutrition {
  caloriesPerGram: number;
  proteinPerGram?: number;
  fatPerGram?: number;
  carbsPerGram?: number;
}

export interface IngredientUnit {
  id: string;
  name: string;
  icon: string;
  defaultUnit: string;
  supportedUnits: UnitConversion[];
  nutrition: IngredientNutrition;
}

/**
 * Comprehensive unit conversion system for baking ingredients
 * All conversions are to grams as the base unit
 */
export class UnitConversionService {
  
  // Common baking unit conversions (approximate, suitable for educational purposes)
  private static readonly COMMON_CONVERSIONS: Record<string, UnitConversion[]> = {
    flour: [
      { unit: 'cups', gramsPerUnit: 120, displayName: 'cups', abbreviation: 'cup' },
      { unit: 'tablespoons', gramsPerUnit: 7.5, displayName: 'tablespoons', abbreviation: 'tbsp' },
      { unit: 'teaspoons', gramsPerUnit: 2.5, displayName: 'teaspoons', abbreviation: 'tsp' },
      { unit: 'grams', gramsPerUnit: 1, displayName: 'grams', abbreviation: 'g' },
      { unit: 'bowls', gramsPerUnit: 240, displayName: 'bowls (2 cups)', abbreviation: 'bowl' }
    ],
    butter: [
      { unit: 'sticks', gramsPerUnit: 113, displayName: 'sticks', abbreviation: 'stick' },
      { unit: 'cups', gramsPerUnit: 227, displayName: 'cups', abbreviation: 'cup' },
      { unit: 'tablespoons', gramsPerUnit: 14, displayName: 'tablespoons', abbreviation: 'tbsp' },
      { unit: 'teaspoons', gramsPerUnit: 4.7, displayName: 'teaspoons', abbreviation: 'tsp' },
      { unit: 'grams', gramsPerUnit: 1, displayName: 'grams', abbreviation: 'g' }
    ],
    sugar: [
      { unit: 'cups', gramsPerUnit: 200, displayName: 'cups', abbreviation: 'cup' },
      { unit: 'tablespoons', gramsPerUnit: 12.5, displayName: 'tablespoons', abbreviation: 'tbsp' },
      { unit: 'teaspoons', gramsPerUnit: 4.2, displayName: 'teaspoons', abbreviation: 'tsp' },
      { unit: 'grams', gramsPerUnit: 1, displayName: 'grams', abbreviation: 'g' },
      { unit: 'spoonfuls', gramsPerUnit: 12.5, displayName: 'spoonfuls (1 tbsp)', abbreviation: 'spoon' }
    ],
    eggs: [
      { unit: 'pieces', gramsPerUnit: 50, displayName: 'whole eggs', abbreviation: 'egg' },
      { unit: 'cups', gramsPerUnit: 243, displayName: 'cups (beaten)', abbreviation: 'cup' },
      { unit: 'tablespoons', gramsPerUnit: 15, displayName: 'tablespoons (beaten)', abbreviation: 'tbsp' },
      { unit: 'grams', gramsPerUnit: 1, displayName: 'grams', abbreviation: 'g' }
    ],
    chocolate: [
      { unit: 'chips', gramsPerUnit: 0.5, displayName: 'chocolate chips', abbreviation: 'chip' },
      { unit: 'cups', gramsPerUnit: 175, displayName: 'cups (chips)', abbreviation: 'cup' },
      { unit: 'tablespoons', gramsPerUnit: 11, displayName: 'tablespoons (chips)', abbreviation: 'tbsp' },
      { unit: 'ounces', gramsPerUnit: 28.35, displayName: 'ounces', abbreviation: 'oz' },
      { unit: 'grams', gramsPerUnit: 1, displayName: 'grams', abbreviation: 'g' }
    ],
    vanilla: [
      { unit: 'drops', gramsPerUnit: 0.05, displayName: 'drops', abbreviation: 'drop' },
      { unit: 'teaspoons', gramsPerUnit: 4.2, displayName: 'teaspoons', abbreviation: 'tsp' },
      { unit: 'tablespoons', gramsPerUnit: 12.6, displayName: 'tablespoons', abbreviation: 'tbsp' },
      { unit: 'milliliters', gramsPerUnit: 1, displayName: 'milliliters', abbreviation: 'ml' },
      { unit: 'grams', gramsPerUnit: 1, displayName: 'grams', abbreviation: 'g' }
    ]
  };

  // Nutritional information (calories per gram, approximate values for education)
  private static readonly NUTRITION_DATA: Record<string, IngredientNutrition> = {
    flour: {
      caloriesPerGram: 3.64,
      proteinPerGram: 0.10,
      fatPerGram: 0.01,
      carbsPerGram: 0.76
    },
    butter: {
      caloriesPerGram: 7.17,
      proteinPerGram: 0.01,
      fatPerGram: 0.81,
      carbsPerGram: 0.01
    },
    sugar: {
      caloriesPerGram: 3.87,
      proteinPerGram: 0,
      fatPerGram: 0,
      carbsPerGram: 1.0
    },
    eggs: {
      caloriesPerGram: 1.55,
      proteinPerGram: 0.13,
      fatPerGram: 0.11,
      carbsPerGram: 0.01
    },
    chocolate: {
      caloriesPerGram: 5.46,
      proteinPerGram: 0.06,
      fatPerGram: 0.31,
      carbsPerGram: 0.61
    },
    vanilla: {
      caloriesPerGram: 2.88,
      proteinPerGram: 0.01,
      fatPerGram: 0.01,
      carbsPerGram: 0.13
    }
  };

  /**
   * Convert from one unit to another for a specific ingredient
   */
  public static convert(
    ingredientId: string, 
    amount: number, 
    fromUnit: string, 
    toUnit: string
  ): number {
    const conversions = this.COMMON_CONVERSIONS[ingredientId];
    if (!conversions) {
      console.warn(`No conversions found for ingredient: ${ingredientId}`);
      return amount; // Return original amount if no conversions available
    }

    const fromConversion = conversions.find(c => c.unit === fromUnit);
    const toConversion = conversions.find(c => c.unit === toUnit);

    if (!fromConversion || !toConversion) {
      console.warn(`Conversion not found: ${fromUnit} to ${toUnit} for ${ingredientId}`);
      return amount;
    }

    // Convert through grams as intermediary
    const grams = amount * fromConversion.gramsPerUnit;
    return grams / toConversion.gramsPerUnit;
  }

  /**
   * Convert any amount to grams
   */
  public static toGrams(ingredientId: string, amount: number, unit: string): number {
    return this.convert(ingredientId, amount, unit, 'grams');
  }

  /**
   * Convert grams to any unit
   */
  public static fromGrams(ingredientId: string, grams: number, toUnit: string): number {
    return this.convert(ingredientId, grams, 'grams', toUnit);
  }

  /**
   * Get all supported units for an ingredient
   */
  public static getSupportedUnits(ingredientId: string): UnitConversion[] {
    return this.COMMON_CONVERSIONS[ingredientId] || [];
  }

  /**
   * Get nutrition information for an ingredient
   */
  public static getNutrition(ingredientId: string): IngredientNutrition | null {
    return this.NUTRITION_DATA[ingredientId] || null;
  }

  /**
   * Calculate calories for an amount of ingredient
   */
  public static calculateCalories(ingredientId: string, amount: number, unit: string): number {
    const grams = this.toGrams(ingredientId, amount, unit);
    const nutrition = this.getNutrition(ingredientId);
    
    if (!nutrition) {
      return 0;
    }

    return grams * nutrition.caloriesPerGram;
  }

  /**
   * Get the best unit to display for a given gram amount
   * (chooses the unit that results in a reasonable number, preferring common baking units)
   */
  public static getBestDisplayUnit(ingredientId: string, grams: number): { unit: string; amount: number } {
    const conversions = this.getSupportedUnits(ingredientId);
    if (!conversions.length) {
      return { unit: 'grams', amount: grams };
    }

    // Preference order for display units
    const preferredUnits = ['cups', 'sticks', 'pieces', 'tablespoons', 'teaspoons', 'ounces', 'grams'];
    
    for (const preferredUnit of preferredUnits) {
      const conversion = conversions.find(c => c.unit === preferredUnit);
      if (!conversion) continue;
      
      const amount = grams / conversion.gramsPerUnit;
      
      // Choose this unit if the amount is in a reasonable range
      if (amount >= 0.25 && amount <= 20) {
        return { unit: preferredUnit, amount };
      }
    }

    // Fall back to grams if no good unit found
    return { unit: 'grams', amount: grams };
  }

  /**
   * Get display name for a unit
   */
  public static getUnitDisplayName(ingredientId: string, unit: string): string {
    const conversions = this.getSupportedUnits(ingredientId);
    const conversion = conversions.find(c => c.unit === unit);
    return conversion?.displayName || unit;
  }

  /**
   * Get abbreviation for a unit
   */
  public static getUnitAbbreviation(ingredientId: string, unit: string): string {
    const conversions = this.getSupportedUnits(ingredientId);
    const conversion = conversions.find(c => c.unit === unit);
    return conversion?.abbreviation || unit;
  }
}