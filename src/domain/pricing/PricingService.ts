import { UnitConversionService } from '@/domain/nutrition/UnitConversion';
import { IngredientService } from '@/domain/inventory';
import { ProductionData } from '@/domain/production/ProductionService';

export class PricingService {
  constructor(
    private ingredientService: IngredientService,
    private getUsedIngredients: () => Map<string, number>,
    private calculateRecipeCalories: () => number
  ) {}

  /**
   * Calculate the base price for a recipe package
   * @param recipe The recipe being priced
   * @param productionData Production details (items, pieces per item, pieces per package)
   * @returns Final base price in dollars
   */
  public calculateBasePrice(recipe: any, productionData?: ProductionData): number {
    // --- Base Calorie Calculation ---
    const totalCalories = this.calculateRecipeCalories();
    const pricePerCalorie = 0.05;
    const calorieBasedPrice = totalCalories * pricePerCalorie;

    // --- Apply All Pricing Factors ---
    const nutritionMultiplier = this.calculateNutritionFactor(totalCalories);
    const complexityMultiplier = this.calculateComplexityFactor(recipe);
    const sophisticationMultiplier = this.calculateSophisticationFactor();
    const portioningMultiplier = this.calculatePortioningFactor(totalCalories, productionData);

    // --- Final Calculation ---
    const multipliedPrice = calorieBasedPrice * nutritionMultiplier * complexityMultiplier * sophisticationMultiplier * portioningMultiplier;
    const finalBasePrice = Math.max(multipliedPrice, 0.50);

    // --- Logging ---
    console.log(`💰 Price calculation for ${recipe.name}:`);
    console.log(`  - Calorie-based price: ${totalCalories.toFixed(1)} cal * ${pricePerCalorie}/cal = ${calorieBasedPrice.toFixed(2)}`);
    console.log(`  - Nutrition Multiplier: ${nutritionMultiplier.toFixed(2)}x (from ${totalCalories.toFixed(0)} total calories)`);
    console.log(`  - Complexity Multiplier: ${complexityMultiplier.toFixed(2)}x`);
    console.log(`  - Sophistication Multiplier: ${sophisticationMultiplier.toFixed(2)}x (from ingredient gram variance)`);
    console.log(`  - Portioning Multiplier: ${portioningMultiplier.toFixed(2)}x`);
    console.log(`  - Combined Multipliers Total: ${(nutritionMultiplier * complexityMultiplier * sophisticationMultiplier * portioningMultiplier).toFixed(2)}x`);
    console.log(`  - Price after multipliers: ${multipliedPrice.toFixed(2)}`);
    console.log(`  - Final base price (min $0.50): ${finalBasePrice.toFixed(2)}`);

    return finalBasePrice;
  }

  /**
   * Calculate nutrition-based pricing factor
   * Based on total calories of the batch
   */
  private calculateNutritionFactor(totalCalories: number): number {
    return 1 + Math.log10(Math.max(1, totalCalories / 1000));
  }

  /**
   * Calculate complexity-based pricing factor
   * Based on number of steps and instructions
   */
  private calculateComplexityFactor(recipe: any): number {
    const numberOfSteps = recipe.steps.length > 0 ? recipe.steps.length : 1;
    const totalInstructions = recipe.steps.reduce((sum: any, step: any) => sum + (step.instructions?.length || 0), 0) || 1;
    const complexityScore = Math.log(numberOfSteps) * Math.log10(totalInstructions);
    return 1 + complexityScore / 10;
  }

  /**
   * Calculate sophistication-based pricing factor
   * Based on variance in ingredient gram amounts (more balanced = more sophisticated)
   */
  private calculateSophisticationFactor(): number {
    const gramAmounts: number[] = [];
    const usedIngredients = this.getUsedIngredients();
    
    usedIngredients.forEach((amount, ingredientId) => {
      const ingredient = this.ingredientService.getIngredient(ingredientId);
      if (ingredient) {
        const grams = UnitConversionService.toGrams(ingredientId, amount, ingredient.unit);
        gramAmounts.push(grams);
      }
    });

    let sophisticationMultiplier = 1.0;
    if (gramAmounts.length >= 2) {
      const mean = gramAmounts.reduce((sum, val) => sum + val, 0) / gramAmounts.length;
      if (mean > 0) {
        const variance = gramAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / gramAmounts.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / mean;
        sophisticationMultiplier = Math.max(0.5, 1.2 - cv);
      }
    }
    return sophisticationMultiplier;
  }

  /**
   * Calculate portioning-based pricing factor
   * Based on calories per piece and pieces per package optimization
   */
  private calculatePortioningFactor(totalCalories: number, productionData?: ProductionData): number {
    const { initialItems, piecesPerItem, piecesPerPackage } = productionData || { initialItems: 2, piecesPerItem: 24, piecesPerPackage: 4 };
    const totalPieces = initialItems * piecesPerItem;

    // Score for calories per piece (target: 100)
    const caloriesPerPiece = totalPieces > 0 ? totalCalories / totalPieces : 0;
    const calorieDistance = Math.abs(caloriesPerPiece - 100);
    const calorieScore = Math.max(0, 1 - calorieDistance / 100); // Score from 0-1

    // Score for pieces per package (target: 4)
    const pieceCountDistance = Math.abs(piecesPerPackage - 4);
    const pieceCountScore = Math.max(0, 1 - pieceCountDistance / 4); // Score from 0-1

    const portioningScore = (calorieScore + pieceCountScore) / 2;
    return 1 + portioningScore * 0.2; // Max multiplier 1.2
  }
}