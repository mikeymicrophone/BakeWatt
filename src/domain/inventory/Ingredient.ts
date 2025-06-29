import { UnitConversionService, UnitConversion, IngredientNutrition } from '@/domain/nutrition/UnitConversion';

export class Ingredient {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly defaultUnit: string,
    public readonly icon: string = '',
    public readonly basePrice: number = 0.5
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Ingredient id cannot be empty');
    }
    if (!name || name.trim().length === 0) {
      throw new Error('Ingredient name cannot be empty');
    }
    if (!defaultUnit || defaultUnit.trim().length === 0) {
      throw new Error('Ingredient default unit cannot be empty');
    }
  }

  /**
   * Get all supported units for this ingredient
   */
  public getSupportedUnits(): UnitConversion[] {
    return UnitConversionService.getSupportedUnits(this.id);
  }

  /**
   * Get nutrition information for this ingredient
   */
  public getNutrition(): IngredientNutrition | null {
    return UnitConversionService.getNutrition(this.id);
  }

  /**
   * Convert an amount from one unit to another
   */
  public convert(amount: number, fromUnit: string, toUnit: string): number {
    return UnitConversionService.convert(this.id, amount, fromUnit, toUnit);
  }

  /**
   * Convert amount to grams
   */
  public toGrams(amount: number, unit: string): number {
    return UnitConversionService.toGrams(this.id, amount, unit);
  }

  /**
   * Convert grams to a specific unit
   */
  public fromGrams(grams: number, toUnit: string): number {
    return UnitConversionService.fromGrams(this.id, grams, toUnit);
  }

  /**
   * Calculate calories for a given amount and unit
   */
  public calculateCalories(amount: number, unit: string): number {
    return UnitConversionService.calculateCalories(this.id, amount, unit);
  }

  /**
   * Get the best display unit for a given gram amount
   */
  public getBestDisplayUnit(grams: number): { unit: string; amount: number } {
    return UnitConversionService.getBestDisplayUnit(this.id, grams);
  }

  /**
   * Get display name for a unit
   */
  public getUnitDisplayName(unit: string): string {
    return UnitConversionService.getUnitDisplayName(this.id, unit);
  }

  /**
   * Get abbreviation for a unit
   */
  public getUnitAbbreviation(unit: string): string {
    return UnitConversionService.getUnitAbbreviation(this.id, unit);
  }

  /**
   * Backward compatibility: returns default unit
   */
  public get unit(): string {
    return this.defaultUnit;
  }

  public equals(other: Ingredient): boolean {
    return this.id === other.id;
  }

  public toString(): string {
    return `${this.name} (${this.defaultUnit})`;
  }
}

export const STARTER_INGREDIENTS = {
  FLOUR: new Ingredient('flour', 'Flour', 'cups', '🌾', 0.5),
  BUTTER: new Ingredient('butter', 'Butter', 'sticks', '🧈', 1.2),
  EGGS: new Ingredient('eggs', 'Eggs', 'pieces', '🥚', 0.8),
  SUGAR: new Ingredient('sugar', 'Sugar', 'teaspoons', '🍯', 0.2),
  CHOCOLATE: new Ingredient('chocolate', 'Chocolate', 'pieces', '🍫', 2.5),
  VANILLA: new Ingredient('vanilla', 'Vanilla', 'teaspoons', '🌿', 3.0)
} as const;