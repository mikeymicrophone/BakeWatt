/**
 * Tests for JSON recipe configuration system
 * Tests ConfigLoader recipe methods and RecipeConfigService
 */

import { vi } from 'vitest';
import { ConfigLoader } from '@/core/config/ConfigLoader';
import { RecipeConfigService } from '@/domain/baking/RecipeConfigService';
import { IngredientConfigService } from '@/domain/inventory/IngredientConfigService';
import { Ingredient } from '@/domain/inventory/Ingredient';

// Mock fetch for testing
global.fetch = vi.fn();

// Mock IngredientConfigService
vi.mock('@/domain/inventory/IngredientConfigService', () => ({
  IngredientConfigService: {
    getIngredient: vi.fn()
  }
}));

describe('ConfigLoader Recipe Methods', () => {
  beforeEach(() => {
    ConfigLoader.clearCache();
    vi.clearAllMocks();
  });

  describe('loadRecipes', () => {
    it('should load recipes from JSON successfully', async () => {
      const mockRecipeData = {
        recipes: [
          {
            id: 'test-recipe',
            metadata: {
              name: 'Test Recipe',
              description: 'A test recipe',
              baseServings: 4,
              difficulty: 'easy',
              bakingTime: 30,
              icon: '🧪',
              tags: ['test']
            },
            steps: [
              {
                template: 'mix-ingredients',
                params: { time: 5 }
              }
            ]
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecipeData)
      });

      const result = await ConfigLoader.loadRecipes();

      expect(fetch).toHaveBeenCalledWith('/data/recipes.json');
      expect(result).toEqual(mockRecipeData);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].metadata.name).toBe('Test Recipe');
    });

    it('should return fallback data when fetch fails', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await ConfigLoader.loadRecipes();

      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].id).toBe('basic-cookies');
    });

    it('should cache results on subsequent calls', async () => {
      const mockData = {
        recipes: [
          {
            id: 'cached-recipe',
            metadata: {
              name: 'Cached Recipe',
              description: 'Test caching',
              baseServings: 1,
              difficulty: 'easy',
              bakingTime: 10,
              icon: '📦'
            },
            steps: [{ template: 'test' }]
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      // First call
      const result1 = await ConfigLoader.loadRecipes();
      // Second call
      const result2 = await ConfigLoader.loadRecipes();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2); // Same object reference (cached)
    });
  });

  describe('loadStepTemplates', () => {
    it('should load step templates from JSON successfully', async () => {
      const mockTemplateData = {
        stepTemplates: {
          'test-template': {
            name: 'Test Template',
            type: 'preparation',
            instructions: ['Do something'],
            requiredParams: ['param1']
          }
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplateData)
      });

      const result = await ConfigLoader.loadStepTemplates();

      expect(fetch).toHaveBeenCalledWith('/data/recipe-templates.json');
      expect(result).toEqual(mockTemplateData);
      expect(Object.keys(result.stepTemplates)).toHaveLength(1);
      expect(result.stepTemplates['test-template'].name).toBe('Test Template');
    });

    it('should return fallback templates when fetch fails', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await ConfigLoader.loadStepTemplates();

      expect(Object.keys(result.stepTemplates)).toContain('preheat');
      expect(Object.keys(result.stepTemplates)).toContain('bake');
    });
  });

  describe('recipe query methods', () => {
    it('should get recipe by ID', async () => {
      const mockData = {
        recipes: [
          {
            id: 'recipe-1',
            metadata: { name: 'Recipe 1', description: 'Test', baseServings: 1, difficulty: 'easy', bakingTime: 10, icon: '1️⃣' },
            steps: []
          },
          {
            id: 'recipe-2',
            metadata: { name: 'Recipe 2', description: 'Test', baseServings: 2, difficulty: 'medium', bakingTime: 20, icon: '2️⃣' },
            steps: []
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const recipe = await ConfigLoader.getRecipeById('recipe-2');

      expect(recipe).not.toBeNull();
      expect(recipe!.metadata.name).toBe('Recipe 2');
    });

    it('should return null for non-existent recipe', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const recipe = await ConfigLoader.getRecipeById('non-existent');

      expect(recipe).toBeNull();
    });

    it('should get recipes by difficulty', async () => {
      const mockData = {
        recipes: [
          {
            id: 'easy-recipe',
            metadata: { name: 'Easy', description: 'Test', baseServings: 1, difficulty: 'easy', bakingTime: 10, icon: '😊' },
            steps: []
          },
          {
            id: 'hard-recipe',
            metadata: { name: 'Hard', description: 'Test', baseServings: 1, difficulty: 'hard', bakingTime: 60, icon: '😰' },
            steps: []
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const easyRecipes = await ConfigLoader.getRecipesByDifficulty('easy');

      expect(easyRecipes).toHaveLength(1);
      expect(easyRecipes[0].metadata.name).toBe('Easy');
    });

    it('should get recipes by tag', async () => {
      const mockData = {
        recipes: [
          {
            id: 'tagged-recipe',
            metadata: { 
              name: 'Tagged', 
              description: 'Test', 
              baseServings: 1, 
              difficulty: 'easy', 
              bakingTime: 10, 
              icon: '🏷️',
              tags: ['special', 'test']
            },
            steps: []
          },
          {
            id: 'untagged-recipe',
            metadata: { name: 'Untagged', description: 'Test', baseServings: 1, difficulty: 'easy', bakingTime: 10, icon: '📄' },
            steps: []
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const specialRecipes = await ConfigLoader.getRecipesByTag('special');

      expect(specialRecipes).toHaveLength(1);
      expect(specialRecipes[0].metadata.name).toBe('Tagged');
    });
  });

  describe('validation', () => {
    it('should validate recipe data structure', async () => {
      const invalidData = {
        recipes: [
          {
            // Missing id
            metadata: { name: 'Invalid' },
            steps: []
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidData)
      });

      // Should fall back to valid data due to validation error
      const result = await ConfigLoader.loadRecipes();
      expect(result.recipes[0].id).toBe('basic-cookies'); // Fallback recipe
    });

    it('should validate step template data structure', async () => {
      const invalidTemplateData = {
        stepTemplates: {
          'invalid-template': {
            // Missing name and type
            instructions: ['Do something']
          }
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidTemplateData)
      });

      // Should fall back to valid templates due to validation error
      const result = await ConfigLoader.loadStepTemplates();
      expect(result.stepTemplates).toHaveProperty('preheat'); // Fallback template
    });
  });
});

describe('RecipeConfigService', () => {
  beforeEach(() => {
    // Clear service state
    (RecipeConfigService as any).loadedRecipes.clear();
    (RecipeConfigService as any).isInitialized = false;
    ConfigLoader.clearCache();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with recipe and template data', async () => {
      // Mock ingredients
      const mockIngredient = new Ingredient('flour', 'Flour', 'cups', '🌾', 0.5);
      (IngredientConfigService.getIngredient as any).mockReturnValue(mockIngredient);

      // Mock recipe data
      const mockRecipeData = {
        recipes: [
          {
            id: 'test-recipe',
            metadata: {
              name: 'Test Recipe',
              description: 'A test recipe',
              baseServings: 4,
              difficulty: 'easy',
              bakingTime: 30,
              icon: '🧪',
              tags: ['test']
            },
            steps: [
              {
                template: 'mix-ingredients',
                params: { estimatedTime: 5 },
                ingredients: [
                  { id: 'flour', amount: 2 }
                ]
              }
            ]
          }
        ]
      };

      // Mock template data
      const mockTemplateData = {
        stepTemplates: {
          'mix-ingredients': {
            name: 'Mix Ingredients',
            type: 'preparation',
            instructions: ['Mix all ingredients'],
            defaultParams: { estimatedTime: 5 }
          }
        }
      };

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRecipeData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplateData)
        });

      await RecipeConfigService.initialize();

      const recipes = await RecipeConfigService.getAllRecipes();
      expect(recipes).toHaveLength(1);
      expect(recipes[0].name).toBe('Test Recipe');
      expect(recipes[0].steps).toHaveLength(1);
    });

    it('should not reinitialize if already initialized', async () => {
      const mockRecipeData = { recipes: [] };
      const mockTemplateData = { stepTemplates: {} };

      (fetch as any)
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockRecipeData)
        });

      // First initialization
      await RecipeConfigService.initialize();
      // Second initialization
      await RecipeConfigService.initialize();

      // Should only call fetch once for recipes (templates load deferred until needed)
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('recipe retrieval', () => {
    it('should get recipe by ID', async () => {
      const mockIngredient = new Ingredient('flour', 'Flour', 'cups', '🌾', 0.5);
      (IngredientConfigService.getIngredient as any).mockReturnValue(mockIngredient);

      const mockRecipeData = {
        recipes: [
          {
            id: 'specific-recipe',
            metadata: {
              name: 'Specific Recipe',
              description: 'A specific test recipe',
              baseServings: 2,
              difficulty: 'medium',
              bakingTime: 45,
              icon: '🎯'
            },
            steps: [
              {
                template: 'test-step',
                ingredients: [{ id: 'flour', amount: 1 }]
              }
            ]
          }
        ]
      };

      const mockTemplateData = {
        stepTemplates: {
          'test-step': {
            name: 'Test Step',
            type: 'preparation',
            instructions: ['Test instruction']
          }
        }
      };

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRecipeData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplateData)
        });

      const recipe = await RecipeConfigService.getRecipe('specific-recipe');

      expect(recipe).not.toBeNull();
      expect(recipe!.name).toBe('Specific Recipe');
      expect(recipe!.difficulty).toBe('medium');
    });

    it('should return null for non-existent recipe', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ recipes: [] })
      });

      const recipe = await RecipeConfigService.getRecipe('non-existent');

      expect(recipe).toBeNull();
    });
  });

  describe('template resolution', () => {
    it('should resolve step templates with parameters', async () => {
      const mockIngredient = new Ingredient('flour', 'Flour', 'cups', '🌾', 0.5);
      (IngredientConfigService.getIngredient as any).mockReturnValue(mockIngredient);

      const mockRecipeData = {
        recipes: [
          {
            id: 'template-test',
            metadata: {
              name: 'Template Test',
              description: 'Tests template resolution',
              baseServings: 1,
              difficulty: 'easy',
              bakingTime: 20,
              icon: '⚙️'
            },
            steps: [
              {
                template: 'bake',
                params: { time: 25, temp: 375 }
              }
            ]
          }
        ]
      };

      const mockTemplateData = {
        stepTemplates: {
          'bake': {
            name: 'Bake',
            type: 'baking',
            instructions: ['Bake for {time} minutes at {temp}°F'],
            requiredParams: ['time', 'temp']
          }
        }
      };

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRecipeData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplateData)
        });

      const recipe = await RecipeConfigService.getRecipe('template-test');

      expect(recipe).not.toBeNull();
      expect(recipe!.steps).toHaveLength(1);
      
      const step = recipe!.steps[0];
      expect(step.parameters.time).toBe(25);
      expect(step.parameters.temp).toBe(375);
      
      const formattedInstructions = step.getFormattedInstructions();
      expect(formattedInstructions[0]).toBe('Bake for 25 minutes at 375°F');
    });

    it('should handle ingredient groups in templates', async () => {
      const mockFlour = new Ingredient('flour', 'Flour', 'cups', '🌾', 0.5);
      const mockSugar = new Ingredient('sugar', 'Sugar', 'teaspoons', '🍯', 0.2);
      
      (IngredientConfigService.getIngredient as any).mockImplementation((id: string) => {
        switch (id) {
          case 'flour': return mockFlour;
          case 'sugar': return mockSugar;
          default: return null;
        }
      });

      const mockRecipeData = {
        recipes: [
          {
            id: 'group-test',
            metadata: {
              name: 'Group Test',
              description: 'Tests ingredient groups',
              baseServings: 1,
              difficulty: 'easy',
              bakingTime: 15,
              icon: '👥'
            },
            steps: [
              {
                template: 'mix-group',
                params: { groupName: 'dry' },
                ingredientGroups: [
                  {
                    name: 'dry',
                    ingredients: [
                      { id: 'flour', amount: 2 },
                      { id: 'sugar', amount: 10 }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      const mockTemplateData = {
        stepTemplates: {
          'mix-group': {
            name: 'Mix {groupName} Ingredients',
            type: 'preparation',
            instructions: ['Combine {group:{groupName}}'],
            requiredParams: ['groupName']
          }
        }
      };

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRecipeData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplateData)
        });

      const recipe = await RecipeConfigService.getRecipe('group-test');

      expect(recipe).not.toBeNull();
      expect(recipe!.steps).toHaveLength(1);
      
      const step = recipe!.steps[0];
      expect(step.name).toBe('Mix dry Ingredients');
      expect(step.groups).toHaveLength(1);
      expect(step.groups[0].name).toBe('dry');
      expect(step.groups[0].ingredients).toHaveLength(2);
      
      const formattedInstructions = step.getFormattedInstructions();
      expect(formattedInstructions[0]).toBe('Combine 2 cups Flour, 10 teaspoons Sugar');
    });
  });

  describe('error handling', () => {
    it('should handle missing templates gracefully', async () => {
      const mockRecipeData = {
        recipes: [
          {
            id: 'missing-template',
            metadata: {
              name: 'Missing Template',
              description: 'Recipe with missing template',
              baseServings: 1,
              difficulty: 'easy',
              bakingTime: 10,
              icon: '❓'
            },
            steps: [
              {
                template: 'non-existent-template'
              }
            ]
          }
        ]
      };

      const mockTemplateData = {
        stepTemplates: {}
      };

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRecipeData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplateData)
        });

      await RecipeConfigService.initialize();

      // Recipe should not be loaded due to missing template
      const recipes = await RecipeConfigService.getAllRecipes();
      expect(recipes).toHaveLength(0);
    });

    it('should handle missing ingredients gracefully', async () => {
      (IngredientConfigService.getIngredient as any).mockReturnValue(null);

      const mockRecipeData = {
        recipes: [
          {
            id: 'missing-ingredients',
            metadata: {
              name: 'Missing Ingredients',
              description: 'Recipe with missing ingredients',
              baseServings: 1,
              difficulty: 'easy',
              bakingTime: 10,
              icon: '🚫'
            },
            steps: [
              {
                template: 'test-step',
                ingredients: [
                  { id: 'non-existent-ingredient', amount: 1 }
                ]
              }
            ]
          }
        ]
      };

      const mockTemplateData = {
        stepTemplates: {
          'test-step': {
            name: 'Test Step',
            type: 'preparation',
            instructions: ['Test']
          }
        }
      };

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRecipeData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplateData)
        });

      const recipe = await RecipeConfigService.getRecipe('missing-ingredients');

      expect(recipe).not.toBeNull();
      expect(recipe!.steps).toHaveLength(1);
      expect(recipe!.steps[0].ingredients).toHaveLength(0); // Missing ingredient was skipped
    });
  });
});