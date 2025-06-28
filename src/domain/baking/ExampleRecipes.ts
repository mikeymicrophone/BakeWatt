import { MultiStepRecipe, MultiStepRecipeMetadata } from './MultiStepRecipe';
import { RecipeStep, RecipeStepMetadata, StepType } from './RecipeStep';
import { FlexibleIngredient } from './FlexibleIngredient';
import { RecipeDifficulty } from './Recipe';
import { STARTER_INGREDIENTS } from '@/domain/inventory/Ingredient';

// Example 1: Advanced Chocolate Chip Cookies with flexible chocolate amounts
export function createChocolateChipCookiesRecipe(): MultiStepRecipe {
  const metadata: MultiStepRecipeMetadata = {
    id: 'chocolate-chip-cookies',
    name: 'Chocolate Chip Cookies',
    description: 'Classic cookies with customizable chocolate amounts',
    baseServings: 24,
    difficulty: RecipeDifficulty.Easy,
    bakingTime: 35,
    icon: '🍪',
    skillLevel: 'beginner',
    tags: ['classic', 'customizable', 'family-friendly']
  };

  // Step 1: Mix dry ingredients
  const step1 = new RecipeStep(
    {
      id: 'mix-dry',
      name: 'Mix Dry Ingredients',
      description: 'Combine flour and prepare base',
      order: 1,
      estimatedTime: 5,
      instructions: [
        'In a large bowl, combine {flour}',
        'Set aside for mixing with wet ingredients'
      ]
    },
    StepType.Preparation,
    [
      new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 3) // Fixed: 3 cups flour
    ]
  );

  // Step 2: Cream butter and sugar
  const step2 = new RecipeStep(
    {
      id: 'cream-butter',
      name: 'Cream Butter',
      description: 'Create the cookie base',
      order: 2,
      estimatedTime: 10,
      instructions: [
        'In another bowl, cream {butter} until fluffy',
        'Add {sugar} gradually while mixing',
        'Beat until light and fluffy (about 3-4 minutes)'
      ]
    },
    StepType.Preparation,
    [
      new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 2), // Fixed: 2 sticks butter
      new FlexibleIngredient(
        STARTER_INGREDIENTS.SUGAR, 
        { min: 20, max: 35, recommended: 28, step: 1 }, // Flexible: 20-35 teaspoons sugar
        'Less sugar for subtle sweetness, more for extra sweet cookies'
      )
    ]
  );

  // Step 3: Add eggs and combine
  const step3 = new RecipeStep(
    {
      id: 'add-eggs',
      name: 'Add Eggs & Combine',
      description: 'Bring wet and dry ingredients together',
      order: 3,
      estimatedTime: 8,
      instructions: [
        'Beat in {eggs} one at a time',
        'Add {vanilla} and mix well',
        'Gradually blend in the flour mixture from step 1',
        'Fold in {chocolate} - use more for extra chocolatey cookies!'
      ]
    },
    StepType.Preparation,
    [
      new FlexibleIngredient(STARTER_INGREDIENTS.EGGS, 2), // Fixed: 2 eggs
      new FlexibleIngredient(STARTER_INGREDIENTS.VANILLA, 2), // Fixed: 2 grams vanilla
      new FlexibleIngredient(
        STARTER_INGREDIENTS.CHOCOLATE,
        { min: 15, max: 40, recommended: 25, step: 5 }, // Flexible: 15-40 pieces chocolate
        'Fewer pieces for subtle chocolate, more for chocolate lovers!'
      )
    ]
  );

  // Step 4: Bake
  const step4 = new RecipeStep(
    {
      id: 'bake',
      name: 'Bake Cookies',
      description: 'Transform dough into delicious cookies',
      order: 4,
      estimatedTime: 12,
      temperature: 375,
      instructions: [
        'Preheat oven to 375°F',
        'Drop rounded tablespoons of dough onto ungreased cookie sheets',
        'Bake for 9-11 minutes or until golden brown',
        'Cool on baking sheet for 2 minutes, then remove to wire rack'
      ]
    },
    StepType.Baking,
    [] // No additional ingredients for baking step
  );

  return new MultiStepRecipe(metadata, [step1, step2, step3, step4]);
}

// Example 2: Birthday Cake with flexible decoration options
export function createBirthdayCakeRecipe(): MultiStepRecipe {
  const metadata: MultiStepRecipeMetadata = {
    id: 'birthday-cake',
    name: 'Birthday Cake',
    description: 'Festive cake with customizable decoration amounts',
    baseServings: 12,
    difficulty: RecipeDifficulty.Medium,
    bakingTime: 65,
    icon: '🎂',
    skillLevel: 'intermediate',
    tags: ['celebration', 'customizable', 'special-occasion']
  };

  // Step 1: Prepare cake batter
  const step1 = new RecipeStep(
    {
      id: 'cake-batter',
      name: 'Make Cake Batter',
      description: 'Create the cake base',
      order: 1,
      estimatedTime: 15,
      instructions: [
        'Preheat oven to 350°F',
        'In a large bowl, combine {flour}, {sugar}, and mix well',
        'In another bowl, beat {eggs} until fluffy',
        'Cream in {butter} until smooth',
        'Combine wet and dry ingredients gradually'
      ]
    },
    StepType.Preparation,
    [
      new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 4), // Fixed: 4 cups flour
      new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 40), // Fixed: 40 teaspoons sugar
      new FlexibleIngredient(STARTER_INGREDIENTS.EGGS, 3), // Fixed: 3 eggs
      new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 2) // Fixed: 2 sticks butter
    ]
  );

  // Step 2: Bake cake
  const step2 = new RecipeStep(
    {
      id: 'bake-cake',
      name: 'Bake Cake',
      description: 'Bake the cake layers',
      order: 2,
      estimatedTime: 30,
      temperature: 350,
      instructions: [
        'Grease and flour two 9-inch round cake pans',
        'Divide batter evenly between pans',
        'Bake for 25-30 minutes until toothpick comes out clean',
        'Cool in pans for 10 minutes, then turn out onto wire racks'
      ]
    },
    StepType.Baking,
    [] // No ingredients needed for this step
  );

  // Step 3: Make frosting and decorate
  const step3 = new RecipeStep(
    {
      id: 'decorate',
      name: 'Frosting & Decoration',
      description: 'Add frosting and decorative elements',
      order: 3,
      estimatedTime: 20,
      instructions: [
        'Cream {butter} until light and fluffy',
        'Gradually add {sugar} and {vanilla}',
        'Beat until smooth and spreadable',
        'Place one layer on serving plate, spread frosting on top',
        'Add second layer and frost top and sides',
        'Decorate with {chocolate} pieces as desired - more for extra decoration!'
      ]
    },
    StepType.Decoration,
    [
      new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 1), // Fixed: 1 stick butter for frosting
      new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 25), // Fixed: 25 teaspoons powdered sugar
      new FlexibleIngredient(STARTER_INGREDIENTS.VANILLA, 3), // Fixed: 3 grams vanilla
      new FlexibleIngredient(
        STARTER_INGREDIENTS.CHOCOLATE,
        { min: 5, max: 30, recommended: 15, step: 2 }, // Flexible: 5-30 pieces for decoration
        'Use fewer pieces for simple decoration, more for elaborate designs'
      )
    ]
  );

  return new MultiStepRecipe(metadata, [step1, step2, step3]);
}

// Example 3: Simple Pancakes with flexible sweetness
export function createPancakesRecipe(): MultiStepRecipe {
  const metadata: MultiStepRecipeMetadata = {
    id: 'fluffy-pancakes',
    name: 'Fluffy Pancakes',
    description: 'Perfect breakfast pancakes with adjustable sweetness',
    baseServings: 8,
    difficulty: RecipeDifficulty.Easy,
    bakingTime: 20,
    icon: '🥞',
    skillLevel: 'beginner',
    tags: ['breakfast', 'quick', 'customizable']
  };

  // Step 1: Mix batter
  const step1 = new RecipeStep(
    {
      id: 'mix-batter',
      name: 'Mix Pancake Batter',
      description: 'Combine all ingredients for fluffy pancakes',
      order: 1,
      estimatedTime: 8,
      instructions: [
        'In a large bowl, whisk together {flour}',
        'In another bowl, beat {eggs} and mix in {butter}',
        'Add {sugar} to taste - less for subtle sweetness, more for sweet pancakes',
        'Add {vanilla} for extra flavor',
        'Combine wet and dry ingredients until just mixed (don\'t overmix!)'
      ]
    },
    StepType.Preparation,
    [
      new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 2), // Fixed: 2 cups flour
      new FlexibleIngredient(STARTER_INGREDIENTS.EGGS, 2), // Fixed: 2 eggs
      new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 1), // Fixed: 1 stick melted butter
      new FlexibleIngredient(
        STARTER_INGREDIENTS.SUGAR,
        { min: 5, max: 15, recommended: 8, step: 1 }, // Flexible: 5-15 teaspoons sugar
        'Adjust sweetness to your preference'
      ),
      new FlexibleIngredient(STARTER_INGREDIENTS.VANILLA, 1) // Fixed: 1 gram vanilla
    ]
  );

  // Step 2: Cook pancakes
  const step2 = new RecipeStep(
    {
      id: 'cook-pancakes',
      name: 'Cook Pancakes',
      description: 'Cook perfect golden pancakes',
      order: 2,
      estimatedTime: 12,
      instructions: [
        'Heat a lightly greased griddle or non-stick pan over medium heat',
        'Pour 1/4 cup batter for each pancake',
        'Cook until bubbles form on surface and edges look set (2-3 minutes)',
        'Flip and cook until golden brown on other side (1-2 minutes)',
        'Serve immediately while hot!'
      ]
    },
    StepType.Preparation,
    [] // No additional ingredients for cooking
  );

  return new MultiStepRecipe(metadata, [step1, step2]);
}

// Example 4: Vanilla Cupcakes with flexible frosting
export function createVanillaCupcakesRecipe(): MultiStepRecipe {
  const metadata: MultiStepRecipeMetadata = {
    id: 'vanilla-cupcakes',
    name: 'Vanilla Cupcakes',
    description: 'Fluffy vanilla cupcakes with customizable frosting sweetness',
    baseServings: 12,
    difficulty: RecipeDifficulty.Easy,
    bakingTime: 30,
    icon: '🧁',
    skillLevel: 'beginner',
    tags: ['cupcakes', 'vanilla', 'party', 'customizable']
  };

  // Step 1: Make cupcake batter
  const step1 = new RecipeStep(
    {
      id: 'cupcake-batter',
      name: 'Make Cupcake Batter',
      description: 'Create light and fluffy cupcake base',
      order: 1,
      estimatedTime: 10,
      instructions: [
        'Preheat oven to 350°F and line muffin tin with cupcake liners',
        'In a bowl, cream {butter} until light and fluffy',
        'Gradually add {sugar} and beat until well combined',
        'Beat in {eggs} one at a time',
        'Mix in {vanilla} for flavor',
        'Gradually fold in {flour} until just combined (don\'t overmix)'
      ]
    },
    StepType.Preparation,
    [
      new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 1), // Fixed: 1 stick butter
      new FlexibleIngredient(STARTER_INGREDIENTS.SUGAR, 20), // Fixed: 20 teaspoons sugar
      new FlexibleIngredient(STARTER_INGREDIENTS.EGGS, 2), // Fixed: 2 eggs
      new FlexibleIngredient(STARTER_INGREDIENTS.VANILLA, 3), // Fixed: 3 grams vanilla
      new FlexibleIngredient(STARTER_INGREDIENTS.FLOUR, 2) // Fixed: 2 cups flour
    ]
  );

  // Step 2: Bake cupcakes
  const step2 = new RecipeStep(
    {
      id: 'bake-cupcakes',
      name: 'Bake Cupcakes',
      description: 'Bake until golden and fluffy',
      order: 2,
      estimatedTime: 18,
      temperature: 350,
      instructions: [
        'Fill cupcake liners 2/3 full with batter',
        'Bake for 15-18 minutes until toothpick inserted in center comes out clean',
        'Cool in pan for 5 minutes, then transfer to wire rack',
        'Cool completely before frosting'
      ]
    },
    StepType.Baking,
    [] // No additional ingredients needed
  );

  // Step 3: Make frosting and decorate
  const step3 = new RecipeStep(
    {
      id: 'frost-cupcakes',
      name: 'Frost & Decorate',
      description: 'Add delicious buttercream frosting',
      order: 3,
      estimatedTime: 15,
      instructions: [
        'Beat {butter} until light and fluffy (about 3 minutes)',
        'Gradually add {sugar} - use less for subtle sweetness, more for very sweet frosting',
        'Beat in {vanilla} until smooth',
        'Frost cooled cupcakes using a piping bag or spatula',
        'Top with {chocolate} pieces for decoration - use more for festive look!'
      ]
    },
    StepType.Decoration,
    [
      new FlexibleIngredient(STARTER_INGREDIENTS.BUTTER, 1), // Fixed: 1 stick butter for frosting
      new FlexibleIngredient(
        STARTER_INGREDIENTS.SUGAR,
        { min: 15, max: 30, recommended: 22, step: 2 }, // Flexible: 15-30 teaspoons powdered sugar
        'Adjust sweetness - less for mild frosting, more for very sweet'
      ),
      new FlexibleIngredient(STARTER_INGREDIENTS.VANILLA, 2), // Fixed: 2 grams vanilla
      new FlexibleIngredient(
        STARTER_INGREDIENTS.CHOCOLATE,
        { min: 0, max: 20, recommended: 8, step: 2 }, // Flexible: 0-20 pieces for decoration
        'Optional decoration - none for plain, more for festive cupcakes'
      )
    ]
  );

  return new MultiStepRecipe(metadata, [step1, step2, step3]);
}

// Recipe registry for the new multi-step recipes
export const MULTI_STEP_RECIPE_REGISTRY = new Map<string, MultiStepRecipe>([
  ['chocolate-chip-cookies', createChocolateChipCookiesRecipe()],
  ['birthday-cake', createBirthdayCakeRecipe()],
  ['fluffy-pancakes', createPancakesRecipe()],
  ['vanilla-cupcakes', createVanillaCupcakesRecipe()]
]);

export class MultiStepRecipeLibrary {
  public static getAllRecipes(): MultiStepRecipe[] {
    return Array.from(MULTI_STEP_RECIPE_REGISTRY.values());
  }

  public static getRecipeById(id: string): MultiStepRecipe | null {
    return MULTI_STEP_RECIPE_REGISTRY.get(id) || null;
  }

  public static getRecipesByDifficulty(difficulty: RecipeDifficulty): MultiStepRecipe[] {
    return this.getAllRecipes().filter(recipe => recipe.difficulty === difficulty);
  }

  public static getRecipesByTag(tag: string): MultiStepRecipe[] {
    return this.getAllRecipes().filter(recipe => recipe.tags.includes(tag));
  }

  public static getBeginnerRecipes(): MultiStepRecipe[] {
    return this.getAllRecipes().filter(recipe => recipe.skillLevel === 'beginner');
  }
}