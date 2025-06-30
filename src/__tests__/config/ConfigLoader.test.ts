/**
 * Tests for ConfigLoader and JSON ingredient configuration system
 */

import { ConfigLoader, type IngredientsData, type IngredientConfig } from '@/core/config/ConfigLoader';
import { IngredientConfigService } from '@/domain/inventory/IngredientConfigService';

import { vi } from 'vitest';

// Mock fetch for testing
global.fetch = vi.fn();

describe('ConfigLoader', () => {
  beforeEach(() => {
    // Clear cache before each test
    ConfigLoader.clearCache();
    vi.clearAllMocks();
  });

  describe('loadIngredients', () => {
    it('should load ingredients from JSON successfully', async () => {
      const mockData: IngredientsData = {
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
        json: () => Promise.resolve(mockData)
      });

      const result = await ConfigLoader.loadIngredients();

      expect(fetch).toHaveBeenCalledWith('/data/ingredients.json');
      expect(result).toEqual(mockData);
      expect(result.ingredients).toHaveLength(1);
      expect(result.ingredients[0].name).toBe('Baking Soda');
    });

    it('should return fallback data when fetch fails', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await ConfigLoader.loadIngredients();

      expect(result.ingredients).toHaveLength(3);
      expect(result.ingredients.map(i => i.id)).toEqual(['baking-soda', 'nutmeg', 'brown-sugar']);
    });

    it('should cache results on subsequent calls', async () => {
      const mockData: IngredientsData = {
        ingredients: [
          {
            id: 'test-ingredient',
            name: 'Test',
            defaultUnit: 'cups',
            icon: '🧪',
            basePrice: 1.0,
            description: 'Test ingredient',
            category: 'test',
            nutrition: { caloriesPerUnit: 100, density: 1.0 },
            conversions: [{ unit: 'cups', gramsPerUnit: 100 }]
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      // First call
      const result1 = await ConfigLoader.loadIngredients();
      // Second call
      const result2 = await ConfigLoader.loadIngredients();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2); // Same object reference (cached)
    });
  });

  describe('getIngredientById', () => {
    it('should return specific ingredient by ID', async () => {
      const mockData: IngredientsData = {
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
          },
          {
            id: 'nutmeg',
            name: 'Nutmeg',
            defaultUnit: 'teaspoons',
            icon: '🌰',
            basePrice: 2.5,
            description: 'A warm spice',
            category: 'spice',
            nutrition: { caloriesPerUnit: 12, density: 2.2 },
            conversions: [{ unit: 'teaspoons', gramsPerUnit: 2.2 }]
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const ingredient = await ConfigLoader.getIngredientById('nutmeg');

      expect(ingredient).not.toBeNull();
      expect(ingredient!.name).toBe('Nutmeg');
      expect(ingredient!.category).toBe('spice');
    });

    it('should return null for non-existent ingredient', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const ingredient = await ConfigLoader.getIngredientById('non-existent');

      expect(ingredient).toBeNull();
    });
  });

  describe('getIngredientsByCategory', () => {
    it('should filter ingredients by category', async () => {
      const mockData: IngredientsData = {
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
        json: () => Promise.resolve(mockData)
      });

      const sweeteners = await ConfigLoader.getIngredientsByCategory('sweetener');

      expect(sweeteners).toHaveLength(1);
      expect(sweeteners[0].name).toBe('Brown Sugar');
    });
  });
});

describe('IngredientConfigService', () => {
  beforeEach(() => {
    // Clear the service state
    (IngredientConfigService as any).configIngredients.clear();
    (IngredientConfigService as any).isLoaded = false;
    ConfigLoader.clearCache();
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize service with ingredients from ConfigLoader', async () => {
      const mockData: IngredientsData = {
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
        json: () => Promise.resolve(mockData)
      });

      await IngredientConfigService.initialize();

      const ingredients = IngredientConfigService.getAllIngredients();
      expect(ingredients).toHaveLength(1);
      expect(ingredients[0].name).toBe('Baking Soda');
      expect(ingredients[0].id).toBe('baking-soda');
    });

    it('should not reinitialize if already loaded', async () => {
      const mockData: IngredientsData = {
        ingredients: [
          {
            id: 'test',
            name: 'Test',
            defaultUnit: 'cups',
            icon: '🧪',
            basePrice: 1.0,
            description: 'Test ingredient',
            category: 'test',
            nutrition: { caloriesPerUnit: 100, density: 1.0 },
            conversions: [{ unit: 'cups', gramsPerUnit: 100 }]
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      // First initialization
      await IngredientConfigService.initialize();
      // Second initialization
      await IngredientConfigService.initialize();

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getIngredient', () => {
    it('should return ingredient by ID after initialization', async () => {
      const mockData: IngredientsData = {
        ingredients: [
          {
            id: 'nutmeg',
            name: 'Nutmeg',
            defaultUnit: 'teaspoons',
            icon: '🌰',
            basePrice: 2.5,
            description: 'A warm spice',
            category: 'spice',
            nutrition: { caloriesPerUnit: 12, density: 2.2 },
            conversions: [{ unit: 'teaspoons', gramsPerUnit: 2.2 }]
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      await IngredientConfigService.initialize();
      const ingredient = IngredientConfigService.getIngredient('nutmeg');

      expect(ingredient).not.toBeNull();
      expect(ingredient!.name).toBe('Nutmeg');
      expect(ingredient!.basePrice).toBe(2.5);
    });

    it('should return null for non-existent ingredient', async () => {
      const mockData: IngredientsData = { ingredients: [] };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      await IngredientConfigService.initialize();
      const ingredient = IngredientConfigService.getIngredient('non-existent');

      expect(ingredient).toBeNull();
    });

    it('should return null when not initialized', () => {
      const ingredient = IngredientConfigService.getIngredient('test');
      expect(ingredient).toBeNull();
    });
  });

  describe('getSummary', () => {
    it('should return correct summary after initialization', async () => {
      const mockData: IngredientsData = {
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
          },
          {
            id: 'nutmeg',
            name: 'Nutmeg',
            defaultUnit: 'teaspoons',
            icon: '🌰',
            basePrice: 2.5,
            description: 'A warm spice',
            category: 'spice',
            nutrition: { caloriesPerUnit: 12, density: 2.2 },
            conversions: [{ unit: 'teaspoons', gramsPerUnit: 2.2 }]
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      await IngredientConfigService.initialize();
      const summary = IngredientConfigService.getSummary();

      expect(summary.isLoaded).toBe(true);
      expect(summary.count).toBe(2);
      expect(summary.ingredients).toHaveLength(2);
      expect(summary.ingredients.map(i => i.name)).toEqual(['Baking Soda', 'Nutmeg']);
    });
  });
});