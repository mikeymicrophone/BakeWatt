/**
 * Factory functions for creating reusable recipe step templates
 * Provides common patterns like preheat, bake, mix, etc.
 */

import { RecipeStep, RecipeStepMetadata, StepType, IngredientGroup, StepParameters } from './RecipeStep';
import { FlexibleIngredient } from './FlexibleIngredient';

export class RecipeStepTemplates {
  /**
   * Create a preheat oven step
   */
  static createPreheatStep(temp: number, estimatedTime: number = 10): RecipeStep {
    const metadata: RecipeStepMetadata = {
      id: 'preheat',
      name: 'Preheat Oven',
      description: 'Prepare oven for baking',
      order: 1, // Will typically be overridden when added to recipe
      estimatedTime,
      temperature: temp,
      instructions: [
        'Preheat oven to {temp}°F',
        'Allow oven to fully heat before baking'
      ]
    };

    const parameters: StepParameters = { temp };

    return new RecipeStep(metadata, StepType.Preparation, [], parameters);
  }

  /**
   * Create a baking step
   */
  static createBakeStep(
    time: number, 
    temp: number, 
    additionalInstructions: string[] = []
  ): RecipeStep {
    const baseInstructions = [
      'Bake for {time} minutes at {temp}°F',
      'Check for doneness with toothpick or visual cues'
    ];

    const metadata: RecipeStepMetadata = {
      id: 'bake',
      name: 'Bake',
      description: 'Bake until done',
      order: 1,
      estimatedTime: time,
      temperature: temp,
      instructions: [...baseInstructions, ...additionalInstructions]
    };

    const parameters: StepParameters = { time, temp };

    return new RecipeStep(metadata, StepType.Baking, [], parameters);
  }

  /**
   * Create a step to mix a group of ingredients
   */
  static createMixGroupStep(
    groupName: string,
    ingredients: FlexibleIngredient[],
    customInstructions?: string[],
    mixingTime: number = 5
  ): RecipeStep {
    const defaultInstructions = [
      `In a bowl, combine {group:${groupName}}`,
      `Mix until well combined`
    ];

    const instructions = customInstructions || defaultInstructions;

    const metadata: RecipeStepMetadata = {
      id: `mix-${groupName}`,
      name: `Mix ${groupName.charAt(0).toUpperCase() + groupName.slice(1)} Ingredients`,
      description: `Combine ${groupName} ingredients`,
      order: 1,
      estimatedTime: mixingTime,
      instructions
    };

    const group: IngredientGroup = {
      name: groupName,
      ingredients,
      description: `${groupName} ingredients`
    };

    return new RecipeStep(metadata, StepType.Preparation, [], {}, [group]);
  }

  /**
   * Create a step to mix wet ingredients specifically
   */
  static createMixWetIngredientsStep(
    wetIngredients: FlexibleIngredient[],
    mixingTime: number = 8
  ): RecipeStep {
    return this.createMixGroupStep(
      'wet',
      wetIngredients,
      [
        'In a large bowl, cream {group:wet}',
        'Beat until light and fluffy (about 3-4 minutes)',
        'Ensure all wet ingredients are well incorporated'
      ],
      mixingTime
    );
  }

  /**
   * Create a step to mix dry ingredients specifically
   */
  static createMixDryIngredientsStep(
    dryIngredients: FlexibleIngredient[],
    mixingTime: number = 3
  ): RecipeStep {
    return this.createMixGroupStep(
      'dry',
      dryIngredients,
      [
        'In a separate bowl, whisk together {group:dry}',
        'Ensure even distribution of all dry ingredients',
        'Set aside for combining with wet ingredients'
      ],
      mixingTime
    );
  }

  /**
   * Create a combine wet and dry ingredients step
   */
  static createCombineWetDryStep(estimatedTime: number = 5): RecipeStep {
    const metadata: RecipeStepMetadata = {
      id: 'combine-wet-dry',
      name: 'Combine Wet & Dry',
      description: 'Bring wet and dry ingredients together',
      order: 1,
      estimatedTime,
      instructions: [
        'Gradually add the dry ingredient mixture to the wet ingredients',
        'Fold gently until just combined - do not overmix',
        'Stop mixing as soon as no dry flour is visible'
      ]
    };

    return new RecipeStep(metadata, StepType.Preparation);
  }

  /**
   * Create a cooling step
   */
  static createCoolingStep(
    time: number,
    location: string = 'wire rack',
    additionalInstructions: string[] = []
  ): RecipeStep {
    const baseInstructions = [
      `Cool for {time} minutes on ${location}`,
      'Allow to cool completely before proceeding'
    ];

    const metadata: RecipeStepMetadata = {
      id: 'cool',
      name: 'Cool',
      description: 'Allow to cool properly',
      order: 1,
      estimatedTime: time,
      instructions: [...baseInstructions, ...additionalInstructions]
    };

    const parameters: StepParameters = { time };

    return new RecipeStep(metadata, StepType.Cooling, [], parameters);
  }

  /**
   * Create a decoration step with flexible decorating ingredients
   */
  static createDecorationStep(
    decorationIngredients: FlexibleIngredient[],
    customInstructions?: string[],
    estimatedTime: number = 15
  ): RecipeStep {
    const defaultInstructions = [
      'Prepare decorating ingredients: {group:decoration}',
      'Apply decorations as desired for presentation',
      'Be creative with decoration placement!'
    ];

    const instructions = customInstructions || defaultInstructions;

    const metadata: RecipeStepMetadata = {
      id: 'decorate',
      name: 'Decorate',
      description: 'Add decorative touches',
      order: 1,
      estimatedTime,
      instructions
    };

    const group: IngredientGroup = {
      name: 'decoration',
      ingredients: decorationIngredients,
      description: 'Decorating ingredients'
    };

    return new RecipeStep(metadata, StepType.Decoration, [], {}, [group]);
  }

  /**
   * Create a custom step with parameters
   */
  static createCustomStep(
    id: string,
    name: string,
    description: string,
    type: StepType,
    instructions: string[],
    parameters: StepParameters = {},
    ingredients: FlexibleIngredient[] = [],
    groups: IngredientGroup[] = [],
    estimatedTime?: number
  ): RecipeStep {
    const metadata: RecipeStepMetadata = {
      id,
      name,
      description,
      order: 1,
      estimatedTime,
      instructions
    };

    return new RecipeStep(metadata, type, ingredients, parameters, groups);
  }

  /**
   * Create a rest/rise step for dough
   */
  static createRestStep(
    time: number,
    location: string = 'warm place',
    coveringInstructions: string = 'Cover with damp cloth'
  ): RecipeStep {
    const metadata: RecipeStepMetadata = {
      id: 'rest',
      name: 'Rest Dough',
      description: 'Allow dough to rest and rise',
      order: 1,
      estimatedTime: time,
      instructions: [
        coveringInstructions,
        `Place in ${location}`,
        `Let rest for {time} minutes`,
        'Dough should visibly rise and feel lighter'
      ]
    };

    const parameters: StepParameters = { time };

    return new RecipeStep(metadata, StepType.Preparation, [], parameters);
  }

  /**
   * Create a prep step for preparing pans/dishes
   */
  static createPrepPansStep(
    panType: string = 'baking pan',
    prepMethod: string = 'grease and flour',
    estimatedTime: number = 3
  ): RecipeStep {
    const metadata: RecipeStepMetadata = {
      id: 'prep-pans',
      name: 'Prepare Pans',
      description: `Prepare ${panType} for baking`,
      order: 1,
      estimatedTime,
      instructions: [
        `${prepMethod.charAt(0).toUpperCase() + prepMethod.slice(1)} your ${panType}`,
        'Ensure even coverage for easy release',
        'Set prepared pans aside until needed'
      ]
    };

    return new RecipeStep(metadata, StepType.Preparation);
  }
}

/**
 * Common recipe step combinations for convenience
 */
export class RecipeStepCombinations {
  /**
   * Create standard cookie baking steps: preheat + bake + cool
   */
  static createCookieBakingSteps(
    bakingTemp: number = 375,
    bakingTime: number = 12,
    coolingTime: number = 5
  ): RecipeStep[] {
    return [
      RecipeStepTemplates.createPreheatStep(bakingTemp),
      RecipeStepTemplates.createBakeStep(bakingTime, bakingTemp, [
        'Drop rounded tablespoons of dough onto ungreased cookie sheets',
        'Space cookies 2 inches apart for even baking'
      ]),
      RecipeStepTemplates.createCoolingStep(coolingTime, 'baking sheet', [
        'Transfer to wire rack to cool completely'
      ])
    ];
  }

  /**
   * Create standard cake baking steps: preheat + prep pans + bake + cool
   */
  static createCakeBakingSteps(
    bakingTemp: number = 350,
    bakingTime: number = 25,
    coolingTime: number = 10
  ): RecipeStep[] {
    return [
      RecipeStepTemplates.createPreheatStep(bakingTemp),
      RecipeStepTemplates.createPrepPansStep('cake pans', 'grease and flour'),
      RecipeStepTemplates.createBakeStep(bakingTime, bakingTemp, [
        'Divide batter evenly between prepared pans',
        'Tap pans gently to release air bubbles'
      ]),
      RecipeStepTemplates.createCoolingStep(coolingTime, 'pans', [
        'Turn out onto wire racks to cool completely'
      ])
    ];
  }
}