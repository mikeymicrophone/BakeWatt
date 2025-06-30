/**
 * Tests for template-based example recipes
 * Verifies integration between templates, JSON config, and recipe creation
 */

import { vi } from 'vitest';
import { 
  createModernChocolateChipCookies, 
  createSpicedBrownSugarCookies,
  createTemplatedVanillaCupcakes,
  createAdvancedLayerCake,
  TemplateRecipeLibrary
} from '../TemplateExampleRecipes';
import { IngredientConfigService } from '@/domain/inventory/IngredientConfigService';
import { Ingredient } from '@/domain/inventory/Ingredient';

// Mock the IngredientConfigService
vi.mock('@/domain/inventory/IngredientConfigService', () => ({
  IngredientConfigService: {
    getIngredient: vi.fn()
  }
}));

describe('Template Example Recipes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createModernChocolateChipCookies', () => {
    it('should create recipe with baking soda from JSON config', async () => {
      const mockBakingSoda = new Ingredient('baking-soda', 'Baking Soda', 'teaspoons', '🧂', 0.1);
      (IngredientConfigService.getIngredient as any).mockReturnValue(mockBakingSoda);

      const recipe = await createModernChocolateChipCookies();

      expect(recipe.name).toBe('Modern Chocolate Chip Cookies');
      expect(recipe.steps).toHaveLength(7); // 4 prep steps + 3 baking steps
      expect(recipe.tags).toContain('templated');

      // Check that the dry ingredients step includes baking soda
      const dryStep = recipe.getStep(1);
      expect(dryStep?.groups[0].ingredients).toHaveLength(2); // flour + baking soda
      
      // Verify formatted instructions contain baking soda
      const formattedInstructions = dryStep?.getFormattedInstructions();
      expect(formattedInstructions?.[0]).toContain('Baking Soda');
    });

    it('should create recipe without baking soda if not available', async () => {
      (IngredientConfigService.getIngredient as any).mockReturnValue(null);

      const recipe = await createModernChocolateChipCookies();

      expect(recipe.name).toBe('Modern Chocolate Chip Cookies');
      expect(recipe.steps).toHaveLength(7);

      // Check that the dry ingredients step only has flour
      const dryStep = recipe.getStep(1);
      expect(dryStep?.groups[0].ingredients).toHaveLength(1); // only flour
    });

    it('should have properly formatted template instructions', async () => {
      (IngredientConfigService.getIngredient as any).mockReturnValue(null);

      const recipe = await createModernChocolateChipCookies();

      // Check baking step has temperature and time parameters
      const bakeStep = recipe.steps.find(step => step.name === 'Bake');
      expect(bakeStep?.parameters.temp).toBe(375);
      expect(bakeStep?.parameters.time).toBe(12);

      const formattedInstructions = bakeStep?.getFormattedInstructions();
      expect(formattedInstructions?.[0]).toBe('Bake for 12 minutes at 375°F');
    });
  });

  describe('createSpicedBrownSugarCookies', () => {
    it('should create recipe with JSON config ingredients', async () => {
      const mockBrownSugar = new Ingredient('brown-sugar', 'Brown Sugar', 'cups', '🟫', 0.8);
      const mockNutmeg = new Ingredient('nutmeg', 'Nutmeg', 'teaspoons', '🌰', 2.5);
      const mockBakingSoda = new Ingredient('baking-soda', 'Baking Soda', 'teaspoons', '🧂', 0.1);

      (IngredientConfigService.getIngredient as any).mockImplementation((id: string) => {
        switch (id) {
          case 'brown-sugar': return mockBrownSugar;
          case 'nutmeg': return mockNutmeg;
          case 'baking-soda': return mockBakingSoda;
          default: return null;
        }
      });

      const recipe = await createSpicedBrownSugarCookies();

      expect(recipe.name).toBe('Spiced Brown Sugar Cookies');
      expect(recipe.steps).toHaveLength(7);
      expect(recipe.tags).toContain('json-config');

      // Check that brown sugar is in the creaming step
      const creamStep = recipe.steps.find(step => step.name === 'Cream Butter & Brown Sugar');
      expect(creamStep?.groups[0].ingredients[1].ingredient.name).toBe('Brown Sugar');

      // Check nutmeg in dry ingredients
      const dryStep = recipe.getStep(1);
      expect(dryStep?.groups[0].ingredients.some(ing => ing.ingredient.name === 'Nutmeg')).toBe(true);
    });

    it('should throw error if required JSON config ingredients missing', async () => {
      (IngredientConfigService.getIngredient as any).mockReturnValue(null);

      await expect(createSpicedBrownSugarCookies()).rejects.toThrow(
        'Required JSON config ingredients not available'
      );
    });

    it('should have custom temperature for brown sugar baking', async () => {
      const mockBrownSugar = new Ingredient('brown-sugar', 'Brown Sugar', 'cups', '🟫', 0.8);
      const mockNutmeg = new Ingredient('nutmeg', 'Nutmeg', 'teaspoons', '🌰', 2.5);

      (IngredientConfigService.getIngredient as any).mockImplementation((id: string) => {
        switch (id) {
          case 'brown-sugar': return mockBrownSugar;
          case 'nutmeg': return mockNutmeg;
          default: return null;
        }
      });

      const recipe = await createSpicedBrownSugarCookies();

      // Should use 350°F instead of standard 375°F for brown sugar
      const preheatStep = recipe.steps.find(step => step.name === 'Preheat Oven');
      expect(preheatStep?.parameters.temp).toBe(350);

      const bakeStep = recipe.steps.find(step => step.name === 'Bake');
      expect(bakeStep?.parameters.temp).toBe(350);
    });
  });

  describe('createTemplatedVanillaCupcakes', () => {
    it('should create standardized cupcake recipe', () => {
      const recipe = createTemplatedVanillaCupcakes();

      expect(recipe.name).toBe('Templated Vanilla Cupcakes');
      expect(recipe.steps).toHaveLength(7); // mix dry, mix wet, combine, prep pans, bake, cool
      expect(recipe.tags).toContain('templated');

      // Should have customized pan prep for cupcakes
      const prepStep = recipe.steps.find(step => step.name === 'Prepare Pans');
      const formattedInstructions = prepStep?.getFormattedInstructions();
      expect(formattedInstructions?.[0]).toContain('muffin tin');
      expect(formattedInstructions?.[0]).toContain('cupcake papers');
    });

    it('should use cupcake-appropriate baking parameters', () => {
      const recipe = createTemplatedVanillaCupcakes();

      const bakeStep = recipe.steps.find(step => step.name === 'Bake');
      expect(bakeStep?.parameters.temp).toBe(350);
      expect(bakeStep?.parameters.time).toBe(18); // Cupcake baking time
    });
  });

  describe('createAdvancedLayerCake', () => {
    it('should create complex recipe with multiple groups and parameters', () => {
      const recipe = createAdvancedLayerCake();

      expect(recipe.name).toBe('Advanced Layer Cake');
      expect(recipe.difficulty).toBe('hard');
      expect(recipe.skillLevel).toBe('advanced');

      // Check complex mixing step with multiple groups
      const mixingStep = recipe.steps.find(step => step.name === 'Multi-Stage Mixing');
      expect(mixingStep?.groups).toHaveLength(3); // dry, fats, liquids
      expect(mixingStep?.parameters.consistency).toBe('light and fluffy');
      expect(mixingStep?.parameters.speed).toBe('low');

      // Check advanced baking step with temperature changes
      const bakeStep = recipe.steps.find(step => step.name === 'Advanced Layer Baking');
      expect(bakeStep?.parameters.startTemp).toBe(375);
      expect(bakeStep?.parameters.finishTemp).toBe(350);
      expect(bakeStep?.parameters.totalTime).toBe(30);

      // Check decoration step with multiple decoration groups
      const decorationStep = recipe.steps.find(step => step.name === 'Layer Assembly & Decoration');
      expect(decorationStep?.groups).toHaveLength(3); // filling, frosting, garnish
    });

    it('should have properly formatted complex instructions', () => {
      const recipe = createAdvancedLayerCake();

      const mixingStep = recipe.steps.find(step => step.name === 'Multi-Stage Mixing');
      const formattedInstructions = mixingStep?.getFormattedInstructions();
      
      expect(formattedInstructions?.[1]).toContain('light and fluffy');
      expect(formattedInstructions?.[3]).toContain('low speed');
      expect(formattedInstructions?.[4]).toContain('3 minutes');

      const bakeStep = recipe.steps.find(step => step.name === 'Advanced Layer Baking');
      const bakeInstructions = bakeStep?.getFormattedInstructions();
      
      expect(bakeInstructions?.[0]).toBe('Start baking at 375°F for first 10 minutes');
      expect(bakeInstructions?.[1]).toBe('Reduce temperature to 350°F');
      expect(bakeInstructions?.[3]).toBe('Total baking time: 30 minutes');
    });
  });
});

describe('TemplateRecipeLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllRecipes', () => {
    it('should return all available template recipes', async () => {
      // Mock JSON config ingredients for brown sugar recipe
      const mockBrownSugar = new Ingredient('brown-sugar', 'Brown Sugar', 'cups', '🟫', 0.8);
      const mockNutmeg = new Ingredient('nutmeg', 'Nutmeg', 'teaspoons', '🌰', 2.5);

      (IngredientConfigService.getIngredient as any).mockImplementation((id: string) => {
        switch (id) {
          case 'brown-sugar': return mockBrownSugar;
          case 'nutmeg': return mockNutmeg;
          default: return null;
        }
      });

      const recipes = await TemplateRecipeLibrary.getAllRecipes();

      expect(recipes).toHaveLength(4);
      expect(recipes.map(r => r.id)).toEqual([
        'modern-chocolate-chip-cookies',
        'spiced-brown-sugar-cookies', 
        'templated-vanilla-cupcakes',
        'advanced-layer-cake'
      ]);
    });

    it('should handle failures gracefully and continue with other recipes', async () => {
      // Make one recipe fail (brown sugar recipe needs JSON config)
      (IngredientConfigService.getIngredient as any).mockReturnValue(null);

      const recipes = await TemplateRecipeLibrary.getAllRecipes();

      // Should have 3 recipes (all except spiced brown sugar)
      expect(recipes).toHaveLength(3);
      expect(recipes.map(r => r.id)).not.toContain('spiced-brown-sugar-cookies');
    });
  });

  describe('getRecipeById', () => {
    it('should return specific recipe by ID', async () => {
      const recipe = await TemplateRecipeLibrary.getRecipeById('templated-vanilla-cupcakes');

      expect(recipe).not.toBeNull();
      expect(recipe?.name).toBe('Templated Vanilla Cupcakes');
    });

    it('should return null for non-existent recipe', async () => {
      const recipe = await TemplateRecipeLibrary.getRecipeById('non-existent');

      expect(recipe).toBeNull();
    });

    it('should handle recipe creation failures', async () => {
      (IngredientConfigService.getIngredient as any).mockReturnValue(null);

      const recipe = await TemplateRecipeLibrary.getRecipeById('spiced-brown-sugar-cookies');

      expect(recipe).toBeNull();
    });
  });

  describe('utility methods', () => {
    it('should check if recipe exists', () => {
      expect(TemplateRecipeLibrary.hasRecipe('modern-chocolate-chip-cookies')).toBe(true);
      expect(TemplateRecipeLibrary.hasRecipe('non-existent')).toBe(false);
    });

    it('should return all recipe IDs', () => {
      const ids = TemplateRecipeLibrary.getRecipeIds();

      expect(ids).toHaveLength(4);
      expect(ids).toContain('modern-chocolate-chip-cookies');
      expect(ids).toContain('spiced-brown-sugar-cookies');
      expect(ids).toContain('templated-vanilla-cupcakes');
      expect(ids).toContain('advanced-layer-cake');
    });
  });
});