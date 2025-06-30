/**
 * Configuration loader for JSON-based game data
 * Handles loading and parsing of ingredients, recipes, and other config files
 */

export interface IngredientConversion {
  unit: string;
  gramsPerUnit: number;
}

export interface IngredientNutrition {
  caloriesPerUnit: number;
  density: number;
}

export interface IngredientConfig {
  id: string;
  name: string;
  defaultUnit: string;
  icon: string;
  basePrice: number;
  description: string;
  category: string;
  nutrition: IngredientNutrition;
  conversions: IngredientConversion[];
}

export interface IngredientsData {
  ingredients: IngredientConfig[];
}

// Recipe Configuration Interfaces
export interface RecipeIngredientConfig {
  id: string;
  amount: number | {
    min: number;
    max: number;
    recommended?: number;
    step?: number;
  };
  description?: string;
}

export interface IngredientGroupConfig {
  name: string;
  ingredients: RecipeIngredientConfig[];
  description?: string;
}

export interface StepConfig {
  template: string;
  params?: Record<string, any>;
  customInstructions?: string[];
  ingredientGroups?: IngredientGroupConfig[];
  ingredients?: RecipeIngredientConfig[];
  estimatedTime?: number;
}

export interface RecipeMetadataConfig {
  name: string;
  description: string;
  baseServings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  bakingTime: number;
  icon: string;
  skillLevel?: string;
  tags?: string[];
}

export interface RecipeConfig {
  id: string;
  metadata: RecipeMetadataConfig;
  steps: StepConfig[];
}

export interface RecipesData {
  recipes: RecipeConfig[];
}

// Step Template Configuration Interfaces
export interface StepTemplateConfig {
  name: string;
  type: 'preparation' | 'baking' | 'cooling' | 'assembly' | 'decoration';
  instructions: string[];
  requiredParams?: string[];
  defaultParams?: Record<string, any>;
  description?: string;
}

export interface StepTemplatesData {
  stepTemplates: Record<string, StepTemplateConfig>;
}

export class ConfigLoader {
  private static ingredientsCache: IngredientsData | null = null;
  private static recipesCache: RecipesData | null = null;
  private static stepTemplatesCache: StepTemplatesData | null = null;

  /**
   * Load ingredients from JSON configuration file
   */
  public static async loadIngredients(): Promise<IngredientsData> {
    if (this.ingredientsCache) {
      return this.ingredientsCache;
    }

    try {
      console.log('📄 Loading ingredients from JSON config...');
      
      // Fetch from public directory (accessible at runtime)
      const response = await fetch('/data/ingredients.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load ingredients: ${response.status} ${response.statusText}`);
      }
      
      const data: IngredientsData = await response.json();
      
      // Validate the data structure
      this.validateIngredientsData(data);
      
      // Cache the result
      this.ingredientsCache = data;
      
      console.log(`✅ Loaded ${data.ingredients.length} ingredients from config`);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to load ingredients config:', error);
      
      // Return fallback data
      return this.getFallbackIngredients();
    }
  }

  /**
   * Get a specific ingredient by ID from config
   */
  public static async getIngredientById(id: string): Promise<IngredientConfig | null> {
    const data = await this.loadIngredients();
    return data.ingredients.find(ingredient => ingredient.id === id) || null;
  }

  /**
   * Get all ingredients from config
   */
  public static async getAllIngredients(): Promise<IngredientConfig[]> {
    const data = await this.loadIngredients();
    return data.ingredients;
  }

  /**
   * Get ingredients by category
   */
  public static async getIngredientsByCategory(category: string): Promise<IngredientConfig[]> {
    const data = await this.loadIngredients();
    return data.ingredients.filter(ingredient => ingredient.category === category);
  }

  /**
   * Clear the cache (useful for testing or hot reloading)
   */
  public static clearCache(): void {
    this.ingredientsCache = null;
    this.recipesCache = null;
    this.stepTemplatesCache = null;
  }

  /**
   * Validate the structure of ingredients data
   */
  private static validateIngredientsData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid ingredients data: not an object');
    }

    if (!Array.isArray(data.ingredients)) {
      throw new Error('Invalid ingredients data: ingredients is not an array');
    }

    data.ingredients.forEach((ingredient: any, index: number) => {
      if (!ingredient.id || typeof ingredient.id !== 'string') {
        throw new Error(`Invalid ingredient at index ${index}: missing or invalid id`);
      }
      
      if (!ingredient.name || typeof ingredient.name !== 'string') {
        throw new Error(`Invalid ingredient at index ${index}: missing or invalid name`);
      }
      
      if (!ingredient.defaultUnit || typeof ingredient.defaultUnit !== 'string') {
        throw new Error(`Invalid ingredient at index ${index}: missing or invalid defaultUnit`);
      }
      
      if (typeof ingredient.basePrice !== 'number' || ingredient.basePrice < 0) {
        throw new Error(`Invalid ingredient at index ${index}: invalid basePrice`);
      }
      
      if (!Array.isArray(ingredient.conversions)) {
        throw new Error(`Invalid ingredient at index ${index}: conversions is not an array`);
      }
    });
  }

  /**
   * Fallback data in case the JSON file can't be loaded
   */
  private static getFallbackIngredients(): IngredientsData {
    console.warn('🔄 Using fallback ingredients data');
    
    return {
      ingredients: [
        {
          id: "baking-soda",
          name: "Baking Soda",
          defaultUnit: "teaspoons",
          icon: "🧂",
          basePrice: 0.1,
          description: "A leavening agent that helps baked goods rise",
          category: "leavening",
          nutrition: {
            caloriesPerUnit: 0,
            density: 4.8
          },
          conversions: [
            {
              unit: "teaspoons",
              gramsPerUnit: 4.8
            }
          ]
        },
        {
          id: "nutmeg",
          name: "Nutmeg", 
          defaultUnit: "teaspoons",
          icon: "🌰",
          basePrice: 2.5,
          description: "A warm, aromatic spice",
          category: "spice",
          nutrition: {
            caloriesPerUnit: 12,
            density: 2.2
          },
          conversions: [
            {
              unit: "teaspoons",
              gramsPerUnit: 2.2
            }
          ]
        },
        {
          id: "brown-sugar",
          name: "Brown Sugar",
          defaultUnit: "cups", 
          icon: "🟫",
          basePrice: 0.8,
          description: "Soft sugar with molasses",
          category: "sweetener",
          nutrition: {
            caloriesPerUnit: 829,
            density: 220
          },
          conversions: [
            {
              unit: "cups",
              gramsPerUnit: 220
            }
          ]
        }
      ]
    };
  }

  /**
   * Reload ingredients from source (useful for development)
   */
  public static async reloadIngredients(): Promise<IngredientsData> {
    this.clearCache();
    return this.loadIngredients();
  }

  // ==================== RECIPE CONFIGURATION METHODS ====================

  /**
   * Load recipes from JSON configuration file
   */
  public static async loadRecipes(): Promise<RecipesData> {
    if (this.recipesCache) {
      return this.recipesCache;
    }

    try {
      console.log('📄 Loading recipes from JSON config...');
      
      const response = await fetch('/data/recipes.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load recipes: ${response.status} ${response.statusText}`);
      }
      
      const data: RecipesData = await response.json();
      
      // Validate the data structure
      this.validateRecipesData(data);
      
      // Cache the result
      this.recipesCache = data;
      
      console.log(`✅ Loaded ${data.recipes.length} recipes from config`);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to load recipes config:', error);
      
      // Return fallback data
      return this.getFallbackRecipes();
    }
  }

  /**
   * Get a specific recipe by ID from config
   */
  public static async getRecipeById(id: string): Promise<RecipeConfig | null> {
    const data = await this.loadRecipes();
    return data.recipes.find(recipe => recipe.id === id) || null;
  }

  /**
   * Get all recipes from config
   */
  public static async getAllRecipes(): Promise<RecipeConfig[]> {
    const data = await this.loadRecipes();
    return data.recipes;
  }

  /**
   * Get recipes by difficulty
   */
  public static async getRecipesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<RecipeConfig[]> {
    const data = await this.loadRecipes();
    return data.recipes.filter(recipe => recipe.metadata.difficulty === difficulty);
  }

  /**
   * Get recipes by tag
   */
  public static async getRecipesByTag(tag: string): Promise<RecipeConfig[]> {
    const data = await this.loadRecipes();
    return data.recipes.filter(recipe => recipe.metadata.tags?.includes(tag));
  }

  /**
   * Load step templates from JSON configuration file
   */
  public static async loadStepTemplates(): Promise<StepTemplatesData> {
    if (this.stepTemplatesCache) {
      return this.stepTemplatesCache;
    }

    try {
      console.log('📄 Loading step templates from JSON config...');
      
      const response = await fetch('/data/recipe-templates.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load step templates: ${response.status} ${response.statusText}`);
      }
      
      const data: StepTemplatesData = await response.json();
      
      // Validate the data structure
      this.validateStepTemplatesData(data);
      
      // Cache the result
      this.stepTemplatesCache = data;
      
      console.log(`✅ Loaded ${Object.keys(data.stepTemplates).length} step templates from config`);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to load step templates config:', error);
      
      // Return fallback data
      return this.getFallbackStepTemplates();
    }
  }

  /**
   * Get a specific step template by ID
   */
  public static async getStepTemplate(templateId: string): Promise<StepTemplateConfig | null> {
    const data = await this.loadStepTemplates();
    return data.stepTemplates[templateId] || null;
  }

  /**
   * Get all step templates from config
   */
  public static async getAllStepTemplates(): Promise<Record<string, StepTemplateConfig>> {
    const data = await this.loadStepTemplates();
    return data.stepTemplates;
  }

  /**
   * Reload recipes from source (useful for development)
   */
  public static async reloadRecipes(): Promise<RecipesData> {
    this.recipesCache = null;
    return this.loadRecipes();
  }

  /**
   * Reload step templates from source (useful for development)
   */
  public static async reloadStepTemplates(): Promise<StepTemplatesData> {
    this.stepTemplatesCache = null;
    return this.loadStepTemplates();
  }

  /**
   * Validate the structure of recipes data
   */
  private static validateRecipesData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid recipes data: not an object');
    }

    if (!Array.isArray(data.recipes)) {
      throw new Error('Invalid recipes data: recipes is not an array');
    }

    data.recipes.forEach((recipe: any, index: number) => {
      if (!recipe.id || typeof recipe.id !== 'string') {
        throw new Error(`Invalid recipe at index ${index}: missing or invalid id`);
      }
      
      if (!recipe.metadata || typeof recipe.metadata !== 'object') {
        throw new Error(`Invalid recipe at index ${index}: missing or invalid metadata`);
      }

      if (!recipe.metadata.name || typeof recipe.metadata.name !== 'string') {
        throw new Error(`Invalid recipe at index ${index}: missing or invalid name`);
      }

      if (!Array.isArray(recipe.steps)) {
        throw new Error(`Invalid recipe at index ${index}: steps is not an array`);
      }

      recipe.steps.forEach((step: any, stepIndex: number) => {
        if (!step.template || typeof step.template !== 'string') {
          throw new Error(`Invalid step at recipe ${index}, step ${stepIndex}: missing or invalid template`);
        }
      });
    });
  }

  /**
   * Validate the structure of step templates data
   */
  private static validateStepTemplatesData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid step templates data: not an object');
    }

    if (!data.stepTemplates || typeof data.stepTemplates !== 'object') {
      throw new Error('Invalid step templates data: stepTemplates is not an object');
    }

    Object.entries(data.stepTemplates).forEach(([templateId, template]: [string, any]) => {
      if (!template.name || typeof template.name !== 'string') {
        throw new Error(`Invalid template ${templateId}: missing or invalid name`);
      }

      if (!template.type || typeof template.type !== 'string') {
        throw new Error(`Invalid template ${templateId}: missing or invalid type`);
      }

      if (!Array.isArray(template.instructions)) {
        throw new Error(`Invalid template ${templateId}: instructions is not an array`);
      }
    });
  }

  /**
   * Fallback recipes data in case the JSON file can't be loaded
   */
  private static getFallbackRecipes(): RecipesData {
    console.warn('🔄 Using fallback recipes data');
    
    return {
      recipes: [
        {
          id: 'basic-cookies',
          metadata: {
            name: 'Basic Cookies',
            description: 'Simple fallback cookie recipe',
            baseServings: 12,
            difficulty: 'easy',
            bakingTime: 20,
            icon: '🍪',
            skillLevel: 'beginner',
            tags: ['fallback', 'simple']
          },
          steps: [
            {
              template: 'mix-ingredients',
              params: { estimatedTime: 10 },
              ingredients: [
                { id: 'flour', amount: 2 },
                { id: 'sugar', amount: 10 }
              ]
            },
            {
              template: 'bake',
              params: { time: 15, temp: 350 }
            }
          ]
        }
      ]
    };
  }

  /**
   * Fallback step templates data in case the JSON file can't be loaded
   */
  private static getFallbackStepTemplates(): StepTemplatesData {
    console.warn('🔄 Using fallback step templates data');
    
    return {
      stepTemplates: {
        'preheat': {
          name: 'Preheat Oven',
          type: 'preparation',
          instructions: ['Preheat oven to {temp}°F'],
          requiredParams: ['temp'],
          defaultParams: { estimatedTime: 10 }
        },
        'bake': {
          name: 'Bake',
          type: 'baking',
          instructions: ['Bake for {time} minutes at {temp}°F'],
          requiredParams: ['time', 'temp']
        },
        'mix-ingredients': {
          name: 'Mix Ingredients',
          type: 'preparation',
          instructions: ['Combine all ingredients', 'Mix until well combined'],
          defaultParams: { estimatedTime: 5 }
        }
      }
    };
  }
}