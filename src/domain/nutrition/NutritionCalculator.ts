import { UnitConversionService } from './UnitConversion';

export interface RecipeNutrition {
  totalCalories: number;
  caloriesPerServing: number;
  totalGrams: number;
  gramsPerServing: number;
  macronutrients: {
    protein: number;
    fat: number;
    carbs: number;
  };
  macronutrientsPerServing: {
    protein: number;
    fat: number;
    carbs: number;
  };
  ingredientBreakdown: IngredientNutritionInfo[];
}

export interface IngredientNutritionInfo {
  ingredientId: string;
  ingredientName: string;
  amount: number;
  unit: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  percentOfTotal: number;
}

export class NutritionCalculator {
  
  /**
   * Calculate complete nutrition information for a recipe
   */
  public static calculateRecipeNutrition(
    ingredients: Array<{
      ingredientId: string;
      ingredientName: string;
      amount: number;
      unit: string;
    }>,
    servings: number
  ): RecipeNutrition {
    
    const ingredientBreakdown: IngredientNutritionInfo[] = [];
    let totalCalories = 0;
    let totalGrams = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    // Calculate nutrition for each ingredient
    for (const ingredient of ingredients) {
      const grams = UnitConversionService.toGrams(
        ingredient.ingredientId, 
        ingredient.amount, 
        ingredient.unit
      );
      
      const nutrition = UnitConversionService.getNutrition(ingredient.ingredientId);
      
      if (nutrition) {
        const calories = grams * nutrition.caloriesPerGram;
        const protein = grams * (nutrition.proteinPerGram || 0);
        const fat = grams * (nutrition.fatPerGram || 0);
        const carbs = grams * (nutrition.carbsPerGram || 0);

        ingredientBreakdown.push({
          ingredientId: ingredient.ingredientId,
          ingredientName: ingredient.ingredientName,
          amount: ingredient.amount,
          unit: ingredient.unit,
          grams,
          calories,
          protein,
          fat,
          carbs,
          percentOfTotal: 0 // Will be calculated after totals
        });

        totalCalories += calories;
        totalGrams += grams;
        totalProtein += protein;
        totalFat += fat;
        totalCarbs += carbs;
      }
    }

    // Calculate percentages
    ingredientBreakdown.forEach(item => {
      item.percentOfTotal = totalCalories > 0 ? (item.calories / totalCalories) * 100 : 0;
    });

    return {
      totalCalories: Math.round(totalCalories),
      caloriesPerServing: Math.round(totalCalories / servings),
      totalGrams: Math.round(totalGrams),
      gramsPerServing: Math.round(totalGrams / servings),
      macronutrients: {
        protein: Math.round(totalProtein * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10
      },
      macronutrientsPerServing: {
        protein: Math.round((totalProtein / servings) * 10) / 10,
        fat: Math.round((totalFat / servings) * 10) / 10,
        carbs: Math.round((totalCarbs / servings) * 10) / 10
      },
      ingredientBreakdown
    };
  }

  /**
   * Calculate scaled nutrition for a recipe with different serving size
   */
  public static calculateScaledNutrition(
    baseNutrition: RecipeNutrition,
    originalServings: number,
    newServings: number
  ): RecipeNutrition {
    const scalingFactor = newServings / originalServings;
    
    return {
      totalCalories: Math.round(baseNutrition.totalCalories * scalingFactor),
      caloriesPerServing: baseNutrition.caloriesPerServing, // Per serving stays the same
      totalGrams: Math.round(baseNutrition.totalGrams * scalingFactor),
      gramsPerServing: baseNutrition.gramsPerServing, // Per serving stays the same
      macronutrients: {
        protein: Math.round((baseNutrition.macronutrients.protein * scalingFactor) * 10) / 10,
        fat: Math.round((baseNutrition.macronutrients.fat * scalingFactor) * 10) / 10,
        carbs: Math.round((baseNutrition.macronutrients.carbs * scalingFactor) * 10) / 10
      },
      macronutrientsPerServing: baseNutrition.macronutrientsPerServing, // Per serving stays the same
      ingredientBreakdown: baseNutrition.ingredientBreakdown.map(item => ({
        ...item,
        amount: Math.round((item.amount * scalingFactor) * 100) / 100,
        grams: Math.round((item.grams * scalingFactor) * 10) / 10,
        calories: Math.round(item.calories * scalingFactor),
        protein: Math.round((item.protein * scalingFactor) * 10) / 10,
        fat: Math.round((item.fat * scalingFactor) * 10) / 10,
        carbs: Math.round((item.carbs * scalingFactor) * 10) / 10
        // percentOfTotal stays the same since all ingredients scale equally
      }))
    };
  }

  /**
   * Format calories for display
   */
  public static formatCalories(calories: number): string {
    if (calories < 1000) {
      return `${Math.round(calories)} cal`;
    } else {
      return `${Math.round(calories / 100) / 10}k cal`;
    }
  }

  /**
   * Format macronutrients for display
   */
  public static formatMacros(protein: number, fat: number, carbs: number): string {
    return `P: ${protein}g | F: ${fat}g | C: ${carbs}g`;
  }

  /**
   * Get calorie density category for educational purposes
   */
  public static getCalorieDensityCategory(caloriesPerGram: number): {
    category: string;
    description: string;
    color: string;
  } {
    if (caloriesPerGram < 1.5) {
      return {
        category: 'Low',
        description: 'Low calorie density - great for volume!',
        color: '#4caf50'
      };
    } else if (caloriesPerGram < 4) {
      return {
        category: 'Medium',
        description: 'Medium calorie density - balanced nutrition',
        color: '#ff9800'
      };
    } else {
      return {
        category: 'High',
        description: 'High calorie density - use sparingly for flavor',
        color: '#f44336'
      };
    }
  }
}