/**
 * Integration test for JSON ingredient configuration system
 * Tests the complete flow from JSON loading to Application integration
 */

import { vi } from 'vitest';
import { GameStateFactory } from '@/core/factory/GameStateFactory';
import { IngredientConfigService } from '@/domain/inventory/IngredientConfigService';
import { ConfigLoader } from '@/core/config/ConfigLoader';
import { STARTER_INGREDIENTS } from '@/domain/inventory/Ingredient';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Ingredient Configuration Integration', () => {
  beforeEach(() => {
    // Clear all caches and state
    ConfigLoader.clearCache();
    (IngredientConfigService as any).configIngredients.clear();
    (IngredientConfigService as any).isLoaded = false;
    vi.clearAllMocks();
  });

  it('should initialize game with both starter and config ingredients', async () => {
    // Mock JSON data for config ingredients
    const mockConfigData = {
      ingredients: [
        {
          id: 'baking-soda',
          name: 'Baking Soda',
          defaultUnit: 'teaspoons',
          icon: '🧂',
          basePrice: 0.1,
          description: 'A leavening agent that helps baked goods rise',
          category: 'leavening',
          nutrition: { caloriesPerUnit: 0, density: 4.8 },
          conversions: [{ unit: 'teaspoons', gramsPerUnit: 4.8 }]
        },
        {
          id: 'nutmeg',
          name: 'Nutmeg',
          defaultUnit: 'teaspoons',
          icon: '🌰',
          basePrice: 2.5,
          description: 'A warm, aromatic spice',
          category: 'spice',
          nutrition: { caloriesPerUnit: 12, density: 2.2 },
          conversions: [{ unit: 'teaspoons', gramsPerUnit: 2.2 }]
        },
        {
          id: 'brown-sugar',
          name: 'Brown Sugar',
          defaultUnit: 'cups',
          icon: '🟫',
          basePrice: 0.8,
          description: 'Soft sugar with molasses',
          category: 'sweetener',
          nutrition: { caloriesPerUnit: 829, density: 220 },
          conversions: [{ unit: 'cups', gramsPerUnit: 220 }]
        }
      ]
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockConfigData)
    });

    // Initialize the config service
    await IngredientConfigService.initialize();

    // Verify config ingredients were loaded
    const configIngredients = IngredientConfigService.getAllIngredients();
    expect(configIngredients).toHaveLength(3);
    
    const configIngredientIds = configIngredients.map(i => i.id);
    expect(configIngredientIds).toEqual(['baking-soda', 'nutmeg', 'brown-sugar']);

    // Test specific ingredients
    const bakingSoda = IngredientConfigService.getIngredient('baking-soda');
    expect(bakingSoda).not.toBeNull();
    expect(bakingSoda!.name).toBe('Baking Soda');
    expect(bakingSoda!.basePrice).toBe(0.1);
    expect(bakingSoda!.unit).toBe('teaspoons');

    const nutmeg = IngredientConfigService.getIngredient('nutmeg');
    expect(nutmeg).not.toBeNull();
    expect(nutmeg!.name).toBe('Nutmeg');
    expect(nutmeg!.basePrice).toBe(2.5);

    const brownSugar = IngredientConfigService.getIngredient('brown-sugar');
    expect(brownSugar).not.toBeNull();
    expect(brownSugar!.name).toBe('Brown Sugar');
    expect(brownSugar!.unit).toBe('cups');
  });

  it('should merge config ingredients with starter ingredients', async () => {
    // Mock minimal config data
    const mockConfigData = {
      ingredients: [
        {
          id: 'baking-soda',
          name: 'Baking Soda',
          defaultUnit: 'teaspoons',
          icon: '🧂',
          basePrice: 0.1,
          description: 'A leavening agent',
          category: 'leavening',
          nutrition: { caloriesPerUnit: 0, density: 4.8 },
          conversions: [{ unit: 'teaspoons', gramsPerUnit: 4.8 }]
        }
      ]
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockConfigData)
    });

    // Initialize config service
    await IngredientConfigService.initialize();

    // Test merging with starter ingredients
    const mergedIngredients = IngredientConfigService.getMergedIngredients(STARTER_INGREDIENTS);
    
    // Should have both starter and config ingredients
    expect(mergedIngredients.size).toBeGreaterThan(1);
    
    // Should have the config ingredient
    expect(mergedIngredients.has('baking-soda')).toBe(true);
    
    // Should have starter ingredients too
    const starterIngredientIds = Object.values(STARTER_INGREDIENTS).map(ingredient => ingredient.id);
    starterIngredientIds.forEach(id => {
      expect(mergedIngredients.has(id)).toBe(true);
    });
  });

  it('should handle fallback data when network fails', async () => {
    // Mock network failure
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    // Initialize should still work with fallback data
    await IngredientConfigService.initialize();

    const ingredients = IngredientConfigService.getAllIngredients();
    expect(ingredients).toHaveLength(3); // Fallback has 3 ingredients

    // Should still have the requested ingredients in fallback
    const ingredientIds = ingredients.map(i => i.id);
    expect(ingredientIds).toEqual(['baking-soda', 'nutmeg', 'brown-sugar']);
  });

  it('should provide ingredient summary information', async () => {
    const mockConfigData = {
      ingredients: [
        {
          id: 'test-ingredient',
          name: 'Test Ingredient',
          defaultUnit: 'cups',
          icon: '🧪',
          basePrice: 1.0,
          description: 'Test ingredient for summary',
          category: 'test',
          nutrition: { caloriesPerUnit: 100, density: 1.0 },
          conversions: [{ unit: 'cups', gramsPerUnit: 100 }]
        }
      ]
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockConfigData)
    });

    await IngredientConfigService.initialize();

    const summary = IngredientConfigService.getSummary();
    expect(summary.isLoaded).toBe(true);
    expect(summary.count).toBe(1);
    expect(summary.ingredients).toHaveLength(1);
    expect(summary.ingredients[0]).toEqual({
      id: 'test-ingredient',
      name: 'Test Ingredient'
    });
  });

  it('should reload ingredients when requested', async () => {
    // Initial load
    const initialData = {
      ingredients: [
        {
          id: 'initial',
          name: 'Initial',
          defaultUnit: 'cups',
          icon: '1️⃣',
          basePrice: 1.0,
          description: 'Initial ingredient',
          category: 'test',
          nutrition: { caloriesPerUnit: 100, density: 1.0 },
          conversions: [{ unit: 'cups', gramsPerUnit: 100 }]
        }
      ]
    };

    const reloadedData = {
      ingredients: [
        {
          id: 'reloaded',
          name: 'Reloaded',
          defaultUnit: 'cups',
          icon: '2️⃣',
          basePrice: 2.0,
          description: 'Reloaded ingredient',
          category: 'test',
          nutrition: { caloriesPerUnit: 200, density: 2.0 },
          conversions: [{ unit: 'cups', gramsPerUnit: 200 }]
        }
      ]
    };

    // Mock initial fetch
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialData)
    });

    await IngredientConfigService.initialize();
    
    let ingredients = IngredientConfigService.getAllIngredients();
    expect(ingredients).toHaveLength(1);
    expect(ingredients[0].name).toBe('Initial');

    // Mock reload fetch
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(reloadedData)
    });

    // Reload
    await IngredientConfigService.reload();

    ingredients = IngredientConfigService.getAllIngredients();
    expect(ingredients).toHaveLength(1);
    expect(ingredients[0].name).toBe('Reloaded');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should access original config data for detailed information', async () => {
    const mockConfigData = {
      ingredients: [
        {
          id: 'detailed-ingredient',
          name: 'Detailed Ingredient',
          defaultUnit: 'tablespoons',
          icon: '📊',
          basePrice: 3.5,
          description: 'An ingredient with detailed nutritional information',
          category: 'detailed',
          nutrition: { caloriesPerUnit: 45, density: 15.2 },
          conversions: [
            { unit: 'tablespoons', gramsPerUnit: 15.2 },
            { unit: 'teaspoons', gramsPerUnit: 5.07 }
          ]
        }
      ]
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockConfigData)
    });

    await IngredientConfigService.initialize();

    // Get detailed config data
    const detailedConfig = await IngredientConfigService.getIngredientConfig('detailed-ingredient');
    
    expect(detailedConfig).not.toBeNull();
    expect(detailedConfig!.description).toBe('An ingredient with detailed nutritional information');
    expect(detailedConfig!.category).toBe('detailed');
    expect(detailedConfig!.nutrition.caloriesPerUnit).toBe(45);
    expect(detailedConfig!.nutrition.density).toBe(15.2);
    expect(detailedConfig!.conversions).toHaveLength(2);
  });
});