/**
 * Example recipes demonstrating the new recipe step template system
 * Shows how to use ingredient groups, parameters, and reusable step templates
 */

import { MultiStepRecipe, MultiStepRecipeMetadata } from './MultiStepRecipe';
import { RecipeStepTemplates, RecipeStepCombinations } from './RecipeStepTemplates';
import { RecipeStep, StepType, IngredientGroup } from './RecipeStep';
import { FlexibleIngredient } from './FlexibleIngredient';
import { RecipeDifficulty } from './Recipe';
import { STARTER_INGREDIENTS } from '@/domain/inventory/Ingredient';
import { IngredientConfigService } from '@/domain/inventory/IngredientConfigService';

/**
 * Modern Chocolate Chip Cookies using templates and ingredient groups
 * Demonstrates ingredient groups, parameter templating, and JSON config ingredients
 */
export async function createModernChocolateChipCookies(): Promise<MultiStepRecipe> {
  const metadata: MultiStepRecipeMetadata = {
    id: 'modern-chocolate-chip-cookies',
    name: 'Modern Chocolate Chip Cookies',
    description: 'Classic cookies using modern templated steps with optional baking soda',
    baseServings: 24,
    difficulty: RecipeDifficulty.Easy,
    bakingTime: 35,
    icon: '🍪',
    skillLevel: 'beginner',
    tags: ['templated', 'modern', 'customizable']
  };

  // Get baking soda from JSON config (fallback gracefully if not available)
  const bakingSoda = IngredientConfigService.getIngredient('baking-soda');

  // Step 1: Mix dry ingredients using template with JSON config ingredient
  const dryIngredients = [
    new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 2.5),
    ...(bakingSoda ? [new FlexibleIngredient(bakingSoda, { min: 0.5, max: 1.5, recommended: 1 })] : [])
  ];

  const mixDryStep = RecipeStepTemplates.createMixDryIngredientsStep(dryIngredients, 5);

  // Step 2: Mix wet ingredients using template with flexible amounts
  const wetIngredients = [
    new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 2),
    new FlexibleIngredient(STARTER_INGREDIENTS.EGGS, 2),
    new FlexibleIngredient(
      STARTER_INGREDIENTS.SUGAR,
      { min: 20, max: 35, recommended: 28, step: 1 },
      'Adjust sweetness to taste'
    )
  ];

  const mixWetStep = RecipeStepTemplates.createMixWetIngredientsStep(wetIngredients, 8);

  // Step 3: Combine wet and dry using template
  const combineStep = RecipeStepTemplates.createCombineWetDryStep(5);

  // Step 4: Add chocolate chips using custom template
  const addChocolateStep = RecipeStepTemplates.createCustomStep(
    'add-chocolate',
    'Add Chocolate Chips',
    'Fold in chocolate for extra deliciousness',
    StepType.Preparation,
    [
      'Gently fold in {group:additions} until evenly distributed',
      'Don\'t overmix - just until chocolate is incorporated'
    ],
    {},
    [],
    [{
      name: 'additions',
      ingredients: [
        new FlexibleIngredient(
          STARTER_INGREDIENTS.CHOCOLATE,
          { min: 15, max: 40, recommended: 25, step: 5 },
          'More chocolate = more happiness!'
        )
      ],
      description: 'Chocolate additions'
    }],
    3
  );

  // Step 5: Complete baking sequence using template combination
  const bakingSteps = RecipeStepCombinations.createCookieBakingSteps(375, 12, 5);

  // Combine all steps with proper ordering
  const allSteps = [mixDryStep, mixWetStep, combineStep, addChocolateStep, ...bakingSteps];
  
  // Update step orders
  allSteps.forEach((step, index) => {
    const updatedMetadata = {
      ...step,
      order: index + 1
    };
    
    // Create new step with updated order (immutable pattern)
    Object.defineProperty(step, 'order', { value: index + 1, writable: false });
  });

  return new MultiStepRecipe(metadata, allSteps);
}

/**
 * Spiced Brown Sugar Cookies using JSON config ingredients
 * Demonstrates extensive use of JSON config ingredients in templates
 */
export async function createSpicedBrownSugarCookies(): Promise<MultiStepRecipe> {
  const metadata: MultiStepRecipeMetadata = {
    id: 'spiced-brown-sugar-cookies',
    name: 'Spiced Brown Sugar Cookies',
    description: 'Warm, spiced cookies featuring brown sugar and nutmeg from JSON config',
    baseServings: 18,
    difficulty: RecipeDifficulty.Easy,
    bakingTime: 28,
    icon: '🍪',
    skillLevel: 'beginner',
    tags: ['spiced', 'json-config', 'templated']
  };

  // Get ingredients from JSON config
  const brownSugar = IngredientConfigService.getIngredient('brown-sugar');
  const nutmeg = IngredientConfigService.getIngredient('nutmeg');
  const bakingSoda = IngredientConfigService.getIngredient('baking-soda');

  if (!brownSugar || !nutmeg) {
    throw new Error('Required JSON config ingredients not available. Initialize IngredientConfigService first.');
  }

  // Step 1: Mix dry ingredients with spices
  const dryIngredients = [
    new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 2.25),
    new FlexibleIngredient(nutmeg, { min: 0.25, max: 1, recommended: 0.5 }, 'Adjust spice level'),
    ...(bakingSoda ? [new FlexibleIngredient(bakingSoda, 0.5)] : [])
  ];

  const mixDryStep = RecipeStepTemplates.createMixDryIngredientsStep(dryIngredients, 4);

  // Step 2: Cream butter with brown sugar
  const creamingIngredients = [
    new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 1.5),
    new FlexibleIngredient(
      brownSugar,
      { min: 0.75, max: 1.5, recommended: 1, step: 0.25 },
      'More brown sugar = deeper molasses flavor'
    )
  ];

  const creamStep = RecipeStepTemplates.createCustomStep(
    'cream-brown-sugar',
    'Cream Butter & Brown Sugar',
    'Create the perfect base with brown sugar richness',
    StepType.Preparation,
    [
      'Cream {group:creaming} until light and fluffy',
      'The mixture should be pale and increased in volume',
      'This takes about 4-5 minutes with electric mixer'
    ],
    { time: 5 },
    [],
    [{
      name: 'creaming',
      ingredients: creamingIngredients,
      description: 'Butter and brown sugar base'
    }],
    6
  );

  // Step 3: Add eggs and vanilla
  const eggStep = RecipeStepTemplates.createCustomStep(
    'add-eggs',
    'Add Eggs & Vanilla',
    'Incorporate eggs for structure',
    StepType.Preparation,
    [
      'Beat in {eggs} one at a time',
      'Add {vanilla} and mix until well combined',
      'Scrape down bowl sides as needed'
    ],
    {},
    [
      new FlexibleIngredient(STARTER_INGREDIENTS.EGGS, 1),
      new FlexibleIngredient(STARTER_INGREDIENTS.VANILLA, 1.5)
    ],
    [],
    3
  );

  // Step 4: Combine wet and dry
  const combineStep = RecipeStepTemplates.createCombineWetDryStep(4);

  // Step 5: Baking with adjusted temperature for brown sugar
  const preheatStep = RecipeStepTemplates.createPreheatStep(350, 10); // Lower temp for brown sugar
  const bakeStep = RecipeStepTemplates.createBakeStep(
    14, 
    350, 
    [
      'Drop rounded tablespoons onto ungreased baking sheets',
      'Leave 2 inches between cookies',
      'Bake until edges are set but centers still soft'
    ]
  );
  const coolStep = RecipeStepTemplates.createCoolingStep(3, 'baking sheet', [
    'Don\'t overbake - cookies continue cooking on hot pan',
    'Transfer to wire rack after cooling briefly'
  ]);

  const allSteps = [mixDryStep, creamStep, eggStep, combineStep, preheatStep, bakeStep, coolStep];
  
  // Update step orders
  allSteps.forEach((step, index) => {
    Object.defineProperty(step, 'order', { value: index + 1, writable: false });
  });

  return new MultiStepRecipe(metadata, allSteps);
}

/**
 * Simple Vanilla Cupcakes demonstrating template combinations
 * Shows how to use RecipeStepCombinations for standardized baking patterns
 */
export function createTemplatedVanillaCupcakes(): MultiStepRecipe {
  const metadata: MultiStepRecipeMetadata = {
    id: 'templated-vanilla-cupcakes',
    name: 'Templated Vanilla Cupcakes',
    description: 'Classic cupcakes using standardized template combinations',
    baseServings: 12,
    difficulty: RecipeDifficulty.Easy,
    bakingTime: 30,
    icon: '🧁',
    skillLevel: 'beginner',
    tags: ['cupcakes', 'templated', 'standard']
  };

  // Step 1: Mix dry ingredients
  const dryIngredients = [
    new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 1.5),
    new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 15)
  ];

  const mixDryStep = RecipeStepTemplates.createMixDryIngredientsStep(dryIngredients);

  // Step 2: Mix wet ingredients  
  const wetIngredients = [
    new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 0.5),
    new FlexibleIngredient(STARTER_INGREDIENTS.EGGS, 1),
    new FlexibleIngredient(STARTER_INGREDIENTS.VANILLA, 2)
  ];

  const mixWetStep = RecipeStepTemplates.createMixWetIngredientsStep(wetIngredients);

  // Step 3: Combine wet and dry
  const combineStep = RecipeStepTemplates.createCombineWetDryStep();

  // Step 4: Use template combination for cupcake baking
  const bakingSteps = RecipeStepCombinations.createCakeBakingSteps(350, 18, 5);
  
  // Customize the pan prep step for cupcakes
  const prepCupcakePans = RecipeStepTemplates.createPrepPansStep(
    'muffin tin',
    'line with cupcake papers'
  );

  const allSteps = [mixDryStep, mixWetStep, combineStep, prepCupcakePans, ...bakingSteps.slice(1)];
  
  // Update step orders
  allSteps.forEach((step, index) => {
    Object.defineProperty(step, 'order', { value: index + 1, writable: false });
  });

  return new MultiStepRecipe(metadata, allSteps);
}

/**
 * Advanced Recipe showing complex parameter usage
 * Demonstrates custom parameters and multiple ingredient groups
 */
export function createAdvancedLayerCake(): MultiStepRecipe {
  const metadata: MultiStepRecipeMetadata = {
    id: 'advanced-layer-cake',
    name: 'Advanced Layer Cake',
    description: 'Complex cake demonstrating advanced templating features',
    baseServings: 16,
    difficulty: RecipeDifficulty.Hard,
    bakingTime: 75,
    icon: '🎂',
    skillLevel: 'advanced',
    tags: ['advanced', 'layered', 'complex-templating']
  };

  // Multiple ingredient groups in one step
  const mixingStep = RecipeStepTemplates.createCustomStep(
    'complex-mixing',
    'Multi-Stage Mixing',
    'Complex mixing with multiple ingredient groups',
    StepType.Preparation,
    [
      'First, whisk together {group:dry} in large bowl',
      'In separate bowl, cream {group:fats} until {consistency}',
      'Beat in {group:liquids} one at a time',
      'Gradually fold dry mixture into wet at {speed} speed',
      'Mix just until combined - about {time} minutes total'
    ],
    { 
      consistency: 'light and fluffy',
      speed: 'low',
      time: 3
    },
    [],
    [
      {
        name: 'dry',
        ingredients: [
          new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 3),
          new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 30)
        ],
        description: 'Dry base ingredients'
      },
      {
        name: 'fats',
        ingredients: [
          new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 2)
        ],
        description: 'Fat ingredients for creaming'
      },
      {
        name: 'liquids',
        ingredients: [
          new FlexibleIngredient(STARTER_INGREDIENTS.EGGS, 3),
          new FlexibleIngredient(STARTER_INGREDIENTS.VANILLA, 2)
        ],
        description: 'Liquid ingredients'
      }
    ],
    15
  );

  // Advanced baking with temperature changes
  const advancedBakeStep = RecipeStepTemplates.createCustomStep(
    'advanced-bake',
    'Advanced Layer Baking',
    'Multi-temperature baking for perfect layers',
    StepType.Baking,
    [
      'Start baking at {startTemp}°F for first {phase1Time} minutes',
      'Reduce temperature to {finishTemp}°F',
      'Continue baking for {phase2Time} more minutes',
      'Total baking time: {totalTime} minutes'
    ],
    {
      startTemp: 375,
      finishTemp: 350,
      phase1Time: 10,
      phase2Time: 20,
      totalTime: 30
    },
    [],
    [],
    30
  );

  // Decoration step with multiple decoration groups
  const decorationStep = RecipeStepTemplates.createCustomStep(
    'layer-decoration',
    'Layer Assembly & Decoration',
    'Assemble and decorate the layer cake',
    StepType.Decoration,
    [
      'Level cake layers if needed',
      'Place first layer on serving plate',
      'Spread {group:filling} evenly on first layer',
      'Add second layer and press gently',
      'Apply {group:frosting} to top and sides',
      'Finish with {group:garnish} as desired'
    ],
    {},
    [],
    [
      {
        name: 'filling',
        ingredients: [
          new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 0.5),
          new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 10)
        ],
        description: 'Layer filling'
      },
      {
        name: 'frosting',
        ingredients: [
          new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 1),
          new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 20),
          new FlexibleIngredient(STARTER_INGREDIENTS.VANILLA, 1)
        ],
        description: 'Outer frosting'
      },
      {
        name: 'garnish',
        ingredients: [
          new FlexibleIngredient(
            STARTER_INGREDIENTS.CHOCOLATE,
            { min: 5, max: 25, recommended: 12, step: 3 },
            'Optional chocolate decoration'
          )
        ],
        description: 'Decorative garnish'
      }
    ],
    25
  );

  const preheatStep = RecipeStepTemplates.createPreheatStep(375);
  const prepStep = RecipeStepTemplates.createPrepPansStep('two 9-inch round pans', 'grease and flour');
  const coolStep = RecipeStepTemplates.createCoolingStep(15, 'pans', [
    'Cool completely before removing from pans',
    'Turn out onto wire racks for assembly'
  ]);

  const allSteps = [preheatStep, prepStep, mixingStep, advancedBakeStep, coolStep, decorationStep];
  
  // Update step orders
  allSteps.forEach((step, index) => {
    Object.defineProperty(step, 'order', { value: index + 1, writable: false });
  });

  return new MultiStepRecipe(metadata, allSteps);
}

/**
 * Recipe library for template-based recipes
 */
export class TemplateRecipeLibrary {
  private static recipes: Map<string, () => Promise<MultiStepRecipe> | MultiStepRecipe> = new Map([
    ['modern-chocolate-chip-cookies', createModernChocolateChipCookies],
    ['spiced-brown-sugar-cookies', createSpicedBrownSugarCookies],
    ['templated-vanilla-cupcakes', () => createTemplatedVanillaCupcakes()],
    ['advanced-layer-cake', () => createAdvancedLayerCake()]
  ]);

  /**
   * Get all template-based recipes
   */
  public static async getAllRecipes(): Promise<MultiStepRecipe[]> {
    const recipes: MultiStepRecipe[] = [];
    
    for (const [id, factory] of this.recipes) {
      try {
        const recipe = await factory();
        recipes.push(recipe);
      } catch (error) {
        console.warn(`Failed to create recipe ${id}:`, error);
      }
    }
    
    return recipes;
  }

  /**
   * Get a specific template recipe by ID
   */
  public static async getRecipeById(id: string): Promise<MultiStepRecipe | null> {
    const factory = this.recipes.get(id);
    if (!factory) {
      return null;
    }

    try {
      return await factory();
    } catch (error) {
      console.error(`Failed to create recipe ${id}:`, error);
      return null;
    }
  }

  /**
   * Check if a recipe ID exists in the template library
   */
  public static hasRecipe(id: string): boolean {
    return this.recipes.has(id);
  }

  /**
   * Get all available recipe IDs
   */
  public static getRecipeIds(): string[] {
    return Array.from(this.recipes.keys());
  }
}