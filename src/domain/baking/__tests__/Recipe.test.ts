import { Recipe, RecipeDifficulty } from '../Recipe';
import { IngredientAmount } from '@/domain/inventory/IngredientAmount';
import { STARTER_INGREDIENTS } from '@/domain/inventory/Ingredient';

describe('Recipe', () => {
  const sampleMetadata = {
    id: 'test-recipe',
    name: 'Test Recipe',
    description: 'A test recipe',
    baseServings: 4,
    difficulty: RecipeDifficulty.Easy,
    bakingTime: 30,
    icon: '🧪'
  };

  const sampleIngredients = [
    new IngredientAmount(STARTER_INGREDIENTS.FLOUR, 2),
    new IngredientAmount(STARTER_INGREDIENTS.BUTTER, 1)
  ];

  describe('constructor', () => {
    it('should create recipe with valid metadata and ingredients', () => {
      const recipe = new Recipe(sampleMetadata, sampleIngredients);
      
      expect(recipe.id).toBe('test-recipe');
      expect(recipe.name).toBe('Test Recipe');
      expect(recipe.baseServings).toBe(4);
      expect(recipe.ingredients.length).toBe(2);
    });

    it('should throw error for empty id', () => {
      const invalidMetadata = { ...sampleMetadata, id: '' };
      expect(() => new Recipe(invalidMetadata, sampleIngredients))
        .toThrow('Recipe id cannot be empty');
    });

    it('should throw error for empty name', () => {
      const invalidMetadata = { ...sampleMetadata, name: '' };
      expect(() => new Recipe(invalidMetadata, sampleIngredients))
        .toThrow('Recipe name cannot be empty');
    });

    it('should throw error for non-positive servings', () => {
      const invalidMetadata = { ...sampleMetadata, baseServings: 0 };
      expect(() => new Recipe(invalidMetadata, sampleIngredients))
        .toThrow('Base servings must be positive');
    });

    it('should throw error for empty ingredients', () => {
      expect(() => new Recipe(sampleMetadata, []))
        .toThrow('Recipe must have at least one ingredient');
    });
  });

  describe('scaleToServings', () => {
    let recipe: Recipe;

    beforeEach(() => {
      recipe = new Recipe(sampleMetadata, sampleIngredients);
    });

    it('should scale recipe correctly for 2x servings', () => {
      const scaled = recipe.scaleToServings(8); // 4 -> 8 = 2x
      
      expect(scaled.baseServings).toBe(8);
      expect(scaled.name).toBe('Test Recipe (8 servings)');
      expect(scaled.ingredients[0].quantity).toBe(4); // 2 * 2
      expect(scaled.ingredients[1].quantity).toBe(2); // 1 * 2
    });

    it('should scale recipe correctly for fractional servings', () => {
      const scaled = recipe.scaleToServings(2); // 4 -> 2 = 0.5x
      
      expect(scaled.baseServings).toBe(2);
      expect(scaled.ingredients[0].quantity).toBe(1); // 2 * 0.5
      expect(scaled.ingredients[1].quantity).toBe(0.5); // 1 * 0.5
    });

    it('should throw error for non-positive target servings', () => {
      expect(() => recipe.scaleToServings(0))
        .toThrow('Target servings must be positive');
      expect(() => recipe.scaleToServings(-1))
        .toThrow('Target servings must be positive');
    });
  });

  describe('getScalingFactor', () => {
    let recipe: Recipe;

    beforeEach(() => {
      recipe = new Recipe(sampleMetadata, sampleIngredients);
    });

    it('should calculate scaling factor correctly', () => {
      expect(recipe.getScalingFactor(8)).toBe(2);    // 8/4 = 2
      expect(recipe.getScalingFactor(2)).toBe(0.5);  // 2/4 = 0.5
      expect(recipe.getScalingFactor(4)).toBe(1);    // 4/4 = 1
    });
  });

  describe('ingredient methods', () => {
    let recipe: Recipe;

    beforeEach(() => {
      recipe = new Recipe(sampleMetadata, sampleIngredients);
    });

    it('should find ingredient by id', () => {
      const flourAmount = recipe.getIngredientAmount('flour');
      expect(flourAmount).not.toBeNull();
      expect(flourAmount!.quantity).toBe(2);
    });

    it('should return null for non-existent ingredient', () => {
      const eggAmount = recipe.getIngredientAmount('eggs');
      expect(eggAmount).toBeNull();
    });

    it('should check if recipe has ingredient', () => {
      expect(recipe.hasIngredient('flour')).toBe(true);
      expect(recipe.hasIngredient('eggs')).toBe(false);
    });
  });

  describe('pantry compatibility', () => {
    let recipe: Recipe;

    beforeEach(() => {
      recipe = new Recipe(sampleMetadata, sampleIngredients);
    });

    it('should detect when recipe can be made', () => {
      const pantryStock = new Map([
        ['flour', 5],
        ['butter', 2]
      ]);

      expect(recipe.canBeMadeWith(pantryStock)).toBe(true);
    });

    it('should detect when recipe cannot be made', () => {
      const pantryStock = new Map([
        ['flour', 1], // Not enough flour
        ['butter', 2]
      ]);

      expect(recipe.canBeMadeWith(pantryStock)).toBe(false);
    });

    it('should calculate missing ingredients', () => {
      const pantryStock = new Map([
        ['flour', 1], // Need 2, have 1 = missing 1
        ['butter', 0] // Need 1, have 0 = missing 1
      ]);

      const missing = recipe.getMissingIngredients(pantryStock);
      
      expect(missing.length).toBe(2);
      expect(missing[0].quantity).toBe(1); // Missing 1 flour
      expect(missing[1].quantity).toBe(1); // Missing 1 butter
    });
  });
});