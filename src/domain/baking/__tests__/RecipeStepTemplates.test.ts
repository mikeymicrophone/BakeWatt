/**
 * Tests for RecipeStep templating system and RecipeStepTemplates factory
 */

import { RecipeStep, StepType, IngredientGroup, StepParameters } from '../RecipeStep';
import { RecipeStepTemplates, RecipeStepCombinations } from '../RecipeStepTemplates';
import { FlexibleIngredient } from '../FlexibleIngredient';
import { STARTER_INGREDIENTS } from '@/domain/inventory/Ingredient';

describe('RecipeStep Enhanced Functionality', () => {
  describe('Constructor with groups and parameters', () => {
    it('should create RecipeStep with ingredient groups', () => {
      const ingredients = [
        new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 2),
        new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 1)
      ];

      const group: IngredientGroup = {
        name: 'dry',
        ingredients,
        description: 'Dry ingredients'
      };

      const step = new RecipeStep(
        {
          id: 'test-step',
          name: 'Test Step',
          description: 'Test step with groups',
          order: 1,
          instructions: ['Mix {group:dry} together']
        },
        StepType.Preparation,
        [],
        {},
        [group]
      );

      expect(step.groups).toHaveLength(1);
      expect(step.groups[0].name).toBe('dry');
      expect(step.groups[0].ingredients).toHaveLength(2);
      expect(step.parameters).toEqual({});
    });

    it('should create RecipeStep with parameters', () => {
      const parameters: StepParameters = {
        temp: 375,
        time: 12,
        speed: 'medium'
      };

      const step = new RecipeStep(
        {
          id: 'test-step',
          name: 'Test Step',
          description: 'Test step with parameters',
          order: 1,
          instructions: ['Bake at {temp}°F for {time} minutes']
        },
        StepType.Baking,
        [],
        parameters
      );

      expect(step.parameters.temp).toBe(375);
      expect(step.parameters.time).toBe(12);
      expect(step.parameters.speed).toBe('medium');
      expect(step.groups).toHaveLength(0);
    });

    it('should maintain backward compatibility with existing constructor', () => {
      const step = new RecipeStep(
        {
          id: 'old-step',
          name: 'Old Step',
          description: 'Backward compatible step',
          order: 1,
          instructions: ['Mix ingredients']
        },
        StepType.Preparation,
        [new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 2)]
      );

      expect(step.ingredients).toHaveLength(1);
      expect(step.groups).toHaveLength(0);
      expect(step.parameters).toEqual({});
    });
  });

  describe('Enhanced instruction formatting', () => {
    it('should replace temperature and time parameters', () => {
      const step = new RecipeStep(
        {
          id: 'bake-step',
          name: 'Bake',
          description: 'Bake the item',
          order: 1,
          instructions: [
            'Preheat oven to {temp}°F',
            'Bake for {time} minutes'
          ]
        },
        StepType.Baking,
        [],
        { temp: 350, time: 25 }
      );

      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toBe('Preheat oven to 350°F');
      expect(formatted[1]).toBe('Bake for 25 minutes');
    });

    it('should replace ingredient group placeholders', () => {
      const wetIngredients = [
        new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 2),
        new FlexibleIngredient(STARTER_INGREDIENTS.EGGS, 3)
      ];

      const group: IngredientGroup = {
        name: 'wet',
        ingredients: wetIngredients
      };

      const step = new RecipeStep(
        {
          id: 'mix-step',
          name: 'Mix Wet',
          description: 'Mix wet ingredients',
          order: 1,
          instructions: ['Cream {group:wet} until fluffy']
        },
        StepType.Preparation,
        [],
        {},
        [group]
      );

      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toBe('Cream 2 sticks Butter, 3 pieces Eggs until fluffy');
    });

    it('should replace custom parameters', () => {
      const step = new RecipeStep(
        {
          id: 'mix-step',
          name: 'Mix',
          description: 'Mix at specific speed',
          order: 1,
          instructions: ['Mix on {speed} speed for {duration}']
        },
        StepType.Preparation,
        [],
        { speed: 'medium', duration: '3 minutes' }
      );

      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toBe('Mix on medium speed for 3 minutes');
    });

    it('should maintain existing individual ingredient replacement', () => {
      const step = new RecipeStep(
        {
          id: 'mix-step',
          name: 'Mix',
          description: 'Mix individual ingredients',
          order: 1,
          instructions: ['Add {flour} and {sugar}']
        },
        StepType.Preparation,
        [
          new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 2),
          new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 1)
        ]
      );

      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toBe('Add 2 cups Flour and 1 teaspoons Sugar');
    });
  });

  describe('Helper methods', () => {
    it('should get group by name', () => {
      const group: IngredientGroup = {
        name: 'test-group',
        ingredients: [new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 1)]
      };

      const step = new RecipeStep(
        {
          id: 'test',
          name: 'Test',
          description: 'Test',
          order: 1,
          instructions: ['Test']
        },
        StepType.Preparation,
        [],
        {},
        [group]
      );

      expect(step.getGroup('test-group')).toBe(group);
      expect(step.getGroup('nonexistent')).toBeNull();
    });

    it('should check if step has group', () => {
      const group: IngredientGroup = {
        name: 'test-group',
        ingredients: []
      };

      const step = new RecipeStep(
        {
          id: 'test',
          name: 'Test',
          description: 'Test',
          order: 1,
          instructions: ['Test']
        },
        StepType.Preparation,
        [],
        {},
        [group]
      );

      expect(step.hasGroup('test-group')).toBe(true);
      expect(step.hasGroup('nonexistent')).toBe(false);
    });

    it('should get all ingredients including from groups', () => {
      const individualIngredient = new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 1);
      const groupIngredients = [
        new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 1),
        new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 1)
      ];

      const group: IngredientGroup = {
        name: 'group1',
        ingredients: groupIngredients
      };

      const step = new RecipeStep(
        {
          id: 'test',
          name: 'Test',
          description: 'Test',
          order: 1,
          instructions: ['Test']
        },
        StepType.Preparation,
        [individualIngredient],
        {},
        [group]
      );

      const allIngredients = step.getAllIngredients();
      expect(allIngredients).toHaveLength(3);
    });

    it('should get parameter summary', () => {
      const step = new RecipeStep(
        {
          id: 'test',
          name: 'Test',
          description: 'Test',
          order: 1,
          instructions: ['Test']
        },
        StepType.Baking,
        [],
        { temp: 375, time: 12 }
      );

      expect(step.getParameterSummary()).toBe('375°F | 12min');
    });
  });

  describe('Scaling with groups and parameters', () => {
    it('should scale ingredients in groups', () => {
      const ingredients = [
        new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 2),
        new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 1)
      ];

      const group: IngredientGroup = {
        name: 'dry',
        ingredients
      };

      const step = new RecipeStep(
        {
          id: 'test',
          name: 'Test',
          description: 'Test',
          order: 1,
          instructions: ['Test']
        },
        StepType.Preparation,
        [],
        {},
        [group]
      );

      const scaled = step.scale(2);
      const scaledGroup = scaled.getGroup('dry')!;
      
      expect(scaledGroup.ingredients[0].getDefaultAmount()).toBe(4); // 2 * 2
      expect(scaledGroup.ingredients[1].getDefaultAmount()).toBe(2); // 1 * 2
    });

    it('should scale time parameters', () => {
      const step = new RecipeStep(
        {
          id: 'test',
          name: 'Test',
          description: 'Test',
          order: 1,
          instructions: ['Test']
        },
        StepType.Preparation,
        [],
        { time: 10, temp: 375 }
      );

      const scaled = step.scale(1.5);
      
      expect(scaled.parameters.time).toBe(15); // 10 * 1.5, rounded
      expect(scaled.parameters.temp).toBe(375); // Temperature not scaled
    });
  });
});

describe('RecipeStepTemplates Factory', () => {
  describe('createPreheatStep', () => {
    it('should create a preheat step with correct parameters', () => {
      const step = RecipeStepTemplates.createPreheatStep(375);
      
      expect(step.name).toBe('Preheat Oven');
      expect(step.type).toBe(StepType.Preparation);
      expect(step.parameters.temp).toBe(375);
      expect(step.temperature).toBe(375);
      
      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toBe('Preheat oven to 375°F');
    });

    it('should create preheat step with custom time', () => {
      const step = RecipeStepTemplates.createPreheatStep(350, 15);
      
      expect(step.estimatedTime).toBe(15);
      expect(step.parameters.temp).toBe(350);
    });
  });

  describe('createBakeStep', () => {
    it('should create a bake step with time and temperature', () => {
      const step = RecipeStepTemplates.createBakeStep(25, 350);
      
      expect(step.name).toBe('Bake');
      expect(step.type).toBe(StepType.Baking);
      expect(step.parameters.time).toBe(25);
      expect(step.parameters.temp).toBe(350);
      expect(step.estimatedTime).toBe(25);
      expect(step.temperature).toBe(350);
      
      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toBe('Bake for 25 minutes at 350°F');
    });

    it('should include additional instructions', () => {
      const additionalInstructions = ['Rotate pan halfway through'];
      const step = RecipeStepTemplates.createBakeStep(20, 375, additionalInstructions);
      
      const formatted = step.getFormattedInstructions();
      expect(formatted).toContain('Rotate pan halfway through');
    });
  });

  describe('createMixGroupStep', () => {
    it('should create a step for mixing ingredient groups', () => {
      const ingredients = [
        new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 2),
        new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 1)
      ];

      const step = RecipeStepTemplates.createMixGroupStep('dry', ingredients);
      
      expect(step.name).toBe('Mix Dry Ingredients');
      expect(step.type).toBe(StepType.Preparation);
      expect(step.groups).toHaveLength(1);
      expect(step.groups[0].name).toBe('dry');
      expect(step.groups[0].ingredients).toHaveLength(2);
      
      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toContain('2 cups Flour, 1 teaspoons Sugar');
    });

    it('should use custom instructions', () => {
      const ingredients = [new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 1)];
      const customInstructions = ['Cream {group:wet} until fluffy'];
      
      const step = RecipeStepTemplates.createMixGroupStep('wet', ingredients, customInstructions);
      
      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toBe('Cream 1 sticks Butter until fluffy');
    });
  });

  describe('createMixWetIngredientsStep', () => {
    it('should create specialized wet ingredients mixing step', () => {
      const wetIngredients = [
        new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 2),
        new FlexibleIngredient(STARTER_INGREDIENTS.EGGS, 2)
      ];

      const step = RecipeStepTemplates.createMixWetIngredientsStep(wetIngredients);
      
      expect(step.name).toBe('Mix Wet Ingredients');
      expect(step.groups[0].name).toBe('wet');
      expect(step.estimatedTime).toBe(8);
      
      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toContain('cream');
      expect(formatted[0]).toContain('2 sticks Butter, 2 pieces Eggs');
    });
  });

  describe('createMixDryIngredientsStep', () => {
    it('should create specialized dry ingredients mixing step', () => {
      const dryIngredients = [
        new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 3),
        new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 2)
      ];

      const step = RecipeStepTemplates.createMixDryIngredientsStep(dryIngredients);
      
      expect(step.name).toBe('Mix Dry Ingredients');
      expect(step.groups[0].name).toBe('dry');
      expect(step.estimatedTime).toBe(3);
      
      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toContain('whisk');
      expect(formatted[0]).toContain('3 cups Flour, 2 teaspoons Sugar');
    });
  });

  describe('createCoolingStep', () => {
    it('should create a cooling step with time parameter', () => {
      const step = RecipeStepTemplates.createCoolingStep(10);
      
      expect(step.name).toBe('Cool');
      expect(step.type).toBe(StepType.Cooling);
      expect(step.parameters.time).toBe(10);
      expect(step.estimatedTime).toBe(10);
      
      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toBe('Cool for 10 minutes on wire rack');
    });

    it('should allow custom location', () => {
      const step = RecipeStepTemplates.createCoolingStep(15, 'baking sheet');
      
      const formatted = step.getFormattedInstructions();
      expect(formatted[0]).toBe('Cool for 15 minutes on baking sheet');
    });
  });

  describe('createCustomStep', () => {
    it('should create custom step with all parameters', () => {
      const ingredients = [new FlexibleIngredient(STARTER_INGREDIENTS.CHOCOLATE, 1)];
      const group: IngredientGroup = {
        name: 'toppings',
        ingredients
      };
      
      const step = RecipeStepTemplates.createCustomStep(
        'custom-step',
        'Custom Step',
        'A custom step',
        StepType.Decoration,
        ['Custom instruction with {temp}'],
        { temp: 200 },
        [],
        [group],
        20
      );
      
      expect(step.id).toBe('custom-step');
      expect(step.name).toBe('Custom Step');
      expect(step.type).toBe(StepType.Decoration);
      expect(step.parameters.temp).toBe(200);
      expect(step.groups).toHaveLength(1);
      expect(step.estimatedTime).toBe(20);
    });
  });
});

describe('RecipeStepCombinations', () => {
  describe('createCookieBakingSteps', () => {
    it('should create complete cookie baking sequence', () => {
      const steps = RecipeStepCombinations.createCookieBakingSteps(375, 12, 5);
      
      expect(steps).toHaveLength(3);
      expect(steps[0].name).toBe('Preheat Oven');
      expect(steps[1].name).toBe('Bake');
      expect(steps[2].name).toBe('Cool');
      
      expect(steps[0].parameters.temp).toBe(375);
      expect(steps[1].parameters.time).toBe(12);
      expect(steps[2].parameters.time).toBe(5);
    });
  });

  describe('createCakeBakingSteps', () => {
    it('should create complete cake baking sequence', () => {
      const steps = RecipeStepCombinations.createCakeBakingSteps(350, 25, 10);
      
      expect(steps).toHaveLength(4);
      expect(steps[0].name).toBe('Preheat Oven');
      expect(steps[1].name).toBe('Prepare Pans');
      expect(steps[2].name).toBe('Bake');
      expect(steps[3].name).toBe('Cool');
      
      expect(steps[0].parameters.temp).toBe(350);
      expect(steps[2].parameters.time).toBe(25);
      expect(steps[3].parameters.time).toBe(10);
    });
  });
});