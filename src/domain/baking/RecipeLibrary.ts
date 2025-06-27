import { Recipe, RecipeDifficulty } from './Recipe';
import { IngredientAmount } from '@/domain/inventory/IngredientAmount';
import { STARTER_INGREDIENTS } from '@/domain/inventory/Ingredient';

// Starter Recipe: Simple Cookies (as specified in Issue #2)
export const SIMPLE_COOKIES_RECIPE = new Recipe(
  {
    id: 'simple-cookies',
    name: 'Simple Cookies',
    description: 'Easy cookies perfect for learning math through baking',
    baseServings: 2,
    difficulty: RecipeDifficulty.Easy,
    bakingTime: 15,
    icon: '🍪'
  },
  [
    new IngredientAmount(STARTER_INGREDIENTS.FLOUR, 2),   // 2 cups flour
    new IngredientAmount(STARTER_INGREDIENTS.BUTTER, 1),  // 1 stick butter
    new IngredientAmount(STARTER_INGREDIENTS.EGGS, 1)     // 1 egg
  ]
);

// Additional recipes for variety and progression
export const CHOCOLATE_MUFFINS_RECIPE = new Recipe(
  {
    id: 'chocolate-muffins',
    name: 'Chocolate Muffins',
    description: 'Fluffy muffins great for addition math practice',
    baseServings: 6,
    difficulty: RecipeDifficulty.Easy,
    bakingTime: 20,
    icon: '🧁'
  },
  [
    new IngredientAmount(STARTER_INGREDIENTS.FLOUR, 3),   // 3 cups flour
    new IngredientAmount(STARTER_INGREDIENTS.BUTTER, 2),  // 2 sticks butter
    new IngredientAmount(STARTER_INGREDIENTS.EGGS, 2)     // 2 eggs
  ]
);

export const BIRTHDAY_CAKE_RECIPE = new Recipe(
  {
    id: 'birthday-cake',
    name: 'Birthday Cake',
    description: 'Special cake for celebrations and advanced math',
    baseServings: 8,
    difficulty: RecipeDifficulty.Medium,
    bakingTime: 45,
    icon: '🎂'
  },
  [
    new IngredientAmount(STARTER_INGREDIENTS.FLOUR, 4),   // 4 cups flour
    new IngredientAmount(STARTER_INGREDIENTS.BUTTER, 3),  // 3 sticks butter
    new IngredientAmount(STARTER_INGREDIENTS.EGGS, 4)     // 4 eggs
  ]
);

// Recipe registry for easy lookup and state restoration
export const RECIPE_REGISTRY = new Map<string, Recipe>([
  [SIMPLE_COOKIES_RECIPE.id, SIMPLE_COOKIES_RECIPE],
  [CHOCOLATE_MUFFINS_RECIPE.id, CHOCOLATE_MUFFINS_RECIPE],
  [BIRTHDAY_CAKE_RECIPE.id, BIRTHDAY_CAKE_RECIPE]
]);

// Helper functions for recipe management
export class RecipeLibrary {
  public static getStarterRecipe(): Recipe {
    return SIMPLE_COOKIES_RECIPE;
  }

  public static getAllRecipes(): Recipe[] {
    return Array.from(RECIPE_REGISTRY.values());
  }

  public static getRecipeById(id: string): Recipe | null {
    return RECIPE_REGISTRY.get(id) || null;
  }

  public static getRecipesByDifficulty(difficulty: RecipeDifficulty): Recipe[] {
    return this.getAllRecipes().filter(recipe => recipe.difficulty === difficulty);
  }

  public static getEasyRecipes(): Recipe[] {
    return this.getRecipesByDifficulty(RecipeDifficulty.Easy);
  }

  // Create common recipe scaling examples for math problems
  public static createScalingExamples(): Array<{
    recipe: Recipe;
    targetServings: number;
    scalingFactor: number;
    scaledIngredients: IngredientAmount[];
  }> {
    const examples: Array<{
      recipe: Recipe;
      targetServings: number;
      scalingFactor: number;
      scaledIngredients: IngredientAmount[];
    }> = [];
    const baseRecipe = SIMPLE_COOKIES_RECIPE;
    
    // Common scaling scenarios for math practice
    const scalingTargets = [4, 6, 8, 10]; // 2x, 3x, 4x, 5x multipliers
    
    scalingTargets.forEach(targetServings => {
      const scalingFactor = targetServings / baseRecipe.baseServings;
      const scaledIngredients = baseRecipe.createScaledIngredientList(targetServings);
      
      examples.push({
        recipe: baseRecipe,
        targetServings,
        scalingFactor,
        scaledIngredients
      });
    });
    
    return examples;
  }

  // Create addition math examples using multiple recipes
  public static createAdditionExamples(): Array<{
    recipes: Recipe[];
    combinedIngredients: Map<string, number>;
    mathProblem: string;
  }> {
    const examples: Array<{
      recipes: Recipe[];
      combinedIngredients: Map<string, number>;
      mathProblem: string;
    }> = [];
    
    // Example 1: Cookies + Muffins
    const cookiesAndMuffins = [SIMPLE_COOKIES_RECIPE, CHOCOLATE_MUFFINS_RECIPE];
    const combined1 = new Map<string, number>();
    
    cookiesAndMuffins.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        const current = combined1.get(ingredient.ingredient.id) || 0;
        combined1.set(ingredient.ingredient.id, current + ingredient.quantity);
      });
    });
    
    examples.push({
      recipes: cookiesAndMuffins,
      combinedIngredients: combined1,
      mathProblem: 'Cookies need 2 cups flour + Muffins need 3 cups flour = ? cups total'
    });
    
    // Example 2: All three recipes
    const allRecipes = [SIMPLE_COOKIES_RECIPE, CHOCOLATE_MUFFINS_RECIPE, BIRTHDAY_CAKE_RECIPE];
    const combined2 = new Map<string, number>();
    
    allRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        const current = combined2.get(ingredient.ingredient.id) || 0;
        combined2.set(ingredient.ingredient.id, current + ingredient.quantity);
      });
    });
    
    examples.push({
      recipes: allRecipes,
      combinedIngredients: combined2,
      mathProblem: 'Cookies (2) + Muffins (3) + Cake (4) = ? cups flour total'
    });
    
    return examples;
  }

  // Validate recipe library integrity
  public static validateLibrary(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const recipes = this.getAllRecipes();
    
    // Check for duplicate IDs
    const ids = new Set<string>();
    recipes.forEach(recipe => {
      if (ids.has(recipe.id)) {
        errors.push(`Duplicate recipe ID: ${recipe.id}`);
      }
      ids.add(recipe.id);
    });
    
    // Check that all recipes use starter ingredients
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        const starterIngredientIds = Object.values(STARTER_INGREDIENTS).map(ing => ing.id);
        if (!starterIngredientIds.includes(ingredient.ingredient.id)) {
          errors.push(`Recipe '${recipe.name}' uses non-starter ingredient: ${ingredient.ingredient.id}`);
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}