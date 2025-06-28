import { GameState } from './GameState';
import { Pantry } from '@/domain/inventory';
import { RecipeCollection } from '@/domain/baking';
import { Store } from '@/domain/store';
import { RecipeLibrary, RECIPE_REGISTRY } from '@/domain/baking/RecipeLibrary';
import { STARTER_INGREDIENTS } from '@/domain/inventory/Ingredient';

export class GameStateFactory {
  /**
   * Create initial game state with starter ingredients and recipe
   * As specified in Issue #6: Initial Game State & Tutorial
   */
  public static createInitialGameState(): GameState {
    // Create pantry with starter ingredients (Issue #6 specs + additions)
    const pantry = new Pantry();
    pantry.addIngredient(STARTER_INGREDIENTS.FLOUR.id, 15);      // 15 cups flour
    pantry.addIngredient(STARTER_INGREDIENTS.BUTTER.id, 6);      // 6 sticks butter
    pantry.addIngredient(STARTER_INGREDIENTS.EGGS.id, 12);       // 12 eggs
    pantry.addIngredient(STARTER_INGREDIENTS.SUGAR.id, 99);      // 99 teaspoons sugar
    pantry.addIngredient(STARTER_INGREDIENTS.CHOCOLATE.id, 50);  // 50 pieces chocolate
    pantry.addIngredient(STARTER_INGREDIENTS.VANILLA.id, 10);    // 10 grams vanilla

    // Create recipe collection with starter recipe
    const recipes = new RecipeCollection();
    recipes.addRecipe(RecipeLibrary.getStarterRecipe()); // Simple Cookies

    // Create empty store
    const store = new Store();

    // Create initial game state
    const gameState = new GameState(
      pantry,
      recipes,
      store,
      1,     // level 1
      false  // tutorial not completed
    );

    return gameState;
  }

  /**
   * Create a default/empty game state for testing or reset
   */
  public static createEmptyGameState(): GameState {
    return new GameState(new Pantry(), new RecipeCollection(), new Store());
  }

  /**
   * Create game state for testing with specified ingredients
   */
  public static createTestGameState(
    flour: number = 10,
    butter: number = 4,
    eggs: number = 8
  ): GameState {
    const pantry = new Pantry();
    pantry.addIngredient(STARTER_INGREDIENTS.FLOUR.id, flour);
    pantry.addIngredient(STARTER_INGREDIENTS.BUTTER.id, butter);
    pantry.addIngredient(STARTER_INGREDIENTS.EGGS.id, eggs);

    const recipes = new RecipeCollection();
    recipes.addRecipe(RecipeLibrary.getStarterRecipe());

    const store = new Store();

    return new GameState(pantry, recipes, store, 1, false);
  }

  /**
   * Create advanced game state with all recipes unlocked
   */
  public static createAdvancedGameState(): GameState {
    const pantry = new Pantry();
    pantry.addIngredient(STARTER_INGREDIENTS.FLOUR.id, 25);  // More ingredients
    pantry.addIngredient(STARTER_INGREDIENTS.BUTTER.id, 10);
    pantry.addIngredient(STARTER_INGREDIENTS.EGGS.id, 20);

    const recipes = new RecipeCollection();
    RecipeLibrary.getAllRecipes().forEach(recipe => {
      recipes.addRecipe(recipe);
    });

    const store = new Store();

    return new GameState(pantry, recipes, store, 5, true); // Higher level, tutorial complete
  }

  /**
   * Validate initial game state meets requirements
   */
  public static validateInitialGameState(gameState: GameState): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check pantry has required starter ingredients
    if (!gameState.pantry.hasEnough(STARTER_INGREDIENTS.FLOUR.id, 15)) {
      errors.push('Missing required flour: need 15 cups');
    }
    if (!gameState.pantry.hasEnough(STARTER_INGREDIENTS.BUTTER.id, 6)) {
      errors.push('Missing required butter: need 6 sticks');
    }
    if (!gameState.pantry.hasEnough(STARTER_INGREDIENTS.EGGS.id, 12)) {
      errors.push('Missing required eggs: need 12 pieces');
    }
    if (!gameState.pantry.hasEnough(STARTER_INGREDIENTS.SUGAR.id, 99)) {
      errors.push('Missing required sugar: need 99 teaspoons');
    }
    if (!gameState.pantry.hasEnough(STARTER_INGREDIENTS.CHOCOLATE.id, 50)) {
      errors.push('Missing required chocolate: need 50 pieces');
    }
    if (!gameState.pantry.hasEnough(STARTER_INGREDIENTS.VANILLA.id, 10)) {
      errors.push('Missing required vanilla: need 10 grams');
    }

    // Check has starter recipe
    if (!gameState.recipes.hasRecipe('simple-cookies')) {
      errors.push('Missing Simple Cookies starter recipe');
    }

    // Check initial settings
    if (gameState.currentLevel !== 1) {
      errors.push('Initial level should be 1');
    }
    if (gameState.tutorialCompleted) {
      errors.push('Tutorial should not be completed initially');
    }

    // Check can make starter recipe
    if (!gameState.hasRequiredStarterIngredients()) {
      errors.push('Cannot make starter recipe with current pantry');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}