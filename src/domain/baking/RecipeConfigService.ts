/**
 * Service for loading and converting JSON recipe configurations to MultiStepRecipe objects
 * Handles template resolution, parameter injection, and ingredient group creation
 */

import { MultiStepRecipe, MultiStepRecipeMetadata } from './MultiStepRecipe';
import { RecipeStep, RecipeStepMetadata, StepType, IngredientGroup, StepParameters } from './RecipeStep';
import { FlexibleIngredient } from './FlexibleIngredient';
import { RecipeDifficulty } from './Recipe';
import { 
  ConfigLoader, 
  type RecipeConfig, 
  type StepConfig, 
  type RecipeIngredientConfig,
  type IngredientGroupConfig,
  type StepTemplateConfig
} from '@/core/config/ConfigLoader';
import { IngredientConfigService } from '@/domain/inventory/IngredientConfigService';
import { STARTER_INGREDIENTS } from '@/domain/inventory/Ingredient';

export class RecipeConfigService {
  private static loadedRecipes: Map<string, MultiStepRecipe> = new Map();
  private static isInitialized = false;

  /**
   * Initialize the service by loading recipe configurations
   */
  public static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🏗️ Initializing RecipeConfigService...');
      
      // Load recipe configurations from JSON
      const recipeConfigs = await ConfigLoader.getAllRecipes();
      
      // Convert each config to a MultiStepRecipe
      for (const config of recipeConfigs) {
        try {
          const recipe = await this.createRecipeFromConfig(config);
          this.loadedRecipes.set(config.id, recipe);
        } catch (error) {
          console.error(`❌ Failed to create recipe ${config.id}:`, error);
          // Continue with other recipes
        }
      }
      
      this.isInitialized = true;
      console.log(`✅ Initialized RecipeConfigService with ${this.loadedRecipes.size} recipes`);
      
    } catch (error) {
      console.error('❌ Failed to initialize RecipeConfigService:', error);
      throw error;
    }
  }

  /**
   * Get a recipe by ID
   */
  public static async getRecipe(id: string): Promise<MultiStepRecipe | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.loadedRecipes.get(id) || null;
  }

  /**
   * Get all loaded recipes
   */
  public static async getAllRecipes(): Promise<MultiStepRecipe[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return Array.from(this.loadedRecipes.values());
  }

  /**
   * Get recipes by difficulty
   */
  public static async getRecipesByDifficulty(difficulty: RecipeDifficulty): Promise<MultiStepRecipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.filter(recipe => recipe.difficulty === difficulty);
  }

  /**
   * Get recipes by tag
   */
  public static async getRecipesByTag(tag: string): Promise<MultiStepRecipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.filter(recipe => recipe.tags.includes(tag));
  }

  /**
   * Check if a recipe exists
   */
  public static async hasRecipe(id: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.loadedRecipes.has(id);
  }

  /**
   * Get available recipe IDs
   */
  public static async getRecipeIds(): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return Array.from(this.loadedRecipes.keys());
  }

  /**
   * Reload recipes from configuration
   */
  public static async reload(): Promise<void> {
    console.log('🔄 Reloading recipes from configuration...');
    
    this.loadedRecipes.clear();
    this.isInitialized = false;
    
    // Clear config loader caches
    ConfigLoader.clearCache();
    
    await this.initialize();
  }

  /**
   * Create a MultiStepRecipe from a recipe configuration
   */
  private static async createRecipeFromConfig(config: RecipeConfig): Promise<MultiStepRecipe> {
    // Convert metadata
    const metadata: MultiStepRecipeMetadata = {
      id: config.id,
      name: config.metadata.name,
      description: config.metadata.description,
      baseServings: config.metadata.baseServings,
      difficulty: this.convertDifficulty(config.metadata.difficulty),
      bakingTime: config.metadata.bakingTime,
      icon: config.metadata.icon,
      skillLevel: config.metadata.skillLevel,
      tags: config.metadata.tags || []
    };

    // Convert steps
    const steps: RecipeStep[] = [];
    for (let i = 0; i < config.steps.length; i++) {
      const stepConfig = config.steps[i];
      const step = await this.createStepFromConfig(stepConfig, i + 1);
      steps.push(step);
    }

    return new MultiStepRecipe(metadata, steps);
  }

  /**
   * Create a RecipeStep from a step configuration
   */
  private static async createStepFromConfig(stepConfig: StepConfig, order: number): Promise<RecipeStep> {
    // Load the step template
    const template = await ConfigLoader.getStepTemplate(stepConfig.template);
    if (!template) {
      throw new Error(`Template '${stepConfig.template}' not found`);
    }

    // Merge parameters
    const mergedParams = {
      ...template.defaultParams,
      ...stepConfig.params
    };

    // Validate required parameters
    if (template.requiredParams) {
      for (const requiredParam of template.requiredParams) {
        if (!(requiredParam in mergedParams)) {
          throw new Error(`Required parameter '${requiredParam}' missing for template '${stepConfig.template}'`);
        }
      }
    }

    // Process instructions (use custom or template)
    const instructions = stepConfig.customInstructions || template.instructions;

    // Create step metadata
    const stepMetadata: RecipeStepMetadata = {
      id: `${stepConfig.template}-${order}`,
      name: this.resolveTemplateName(template.name, mergedParams),
      description: template.description || `Step using ${stepConfig.template} template`,
      order,
      estimatedTime: stepConfig.estimatedTime || mergedParams.estimatedTime,
      temperature: mergedParams.temp,
      instructions
    };

    // Convert individual ingredients
    const individualIngredients: FlexibleIngredient[] = [];
    if (stepConfig.ingredients) {
      for (const ingredientConfig of stepConfig.ingredients) {
        const ingredient = await this.createFlexibleIngredient(ingredientConfig);
        if (ingredient) {
          individualIngredients.push(ingredient);
        }
      }
    }

    // Convert ingredient groups
    const groups: IngredientGroup[] = [];
    if (stepConfig.ingredientGroups) {
      for (const groupConfig of stepConfig.ingredientGroups) {
        const group = await this.createIngredientGroup(groupConfig);
        if (group) {
          groups.push(group);
        }
      }
    }

    // Convert step type
    const stepType = this.convertStepType(template.type);

    // Create parameters object
    const parameters: StepParameters = { ...mergedParams };

    return new RecipeStep(stepMetadata, stepType, individualIngredients, parameters, groups);
  }

  /**
   * Create a FlexibleIngredient from ingredient configuration
   */
  private static async createFlexibleIngredient(config: RecipeIngredientConfig): Promise<FlexibleIngredient | null> {
    // Try to get ingredient from config service first
    let ingredient = IngredientConfigService.getIngredient(config.id);
    
    // Fall back to starter ingredients
    if (!ingredient) {
      const starterKey = Object.keys(STARTER_INGREDIENTS).find(key => 
        STARTER_INGREDIENTS[key as keyof typeof STARTER_INGREDIENTS].id === config.id
      );
      if (starterKey) {
        ingredient = STARTER_INGREDIENTS[starterKey as keyof typeof STARTER_INGREDIENTS];
      }
    }

    if (!ingredient) {
      console.warn(`⚠️ Ingredient '${config.id}' not found, skipping`);
      return null;
    }

    return new FlexibleIngredient(ingredient, config.amount, config.description);
  }

  /**
   * Create an IngredientGroup from group configuration
   */
  private static async createIngredientGroup(config: IngredientGroupConfig): Promise<IngredientGroup | null> {
    const ingredients: FlexibleIngredient[] = [];
    
    for (const ingredientConfig of config.ingredients) {
      const ingredient = await this.createFlexibleIngredient(ingredientConfig);
      if (ingredient) {
        ingredients.push(ingredient);
      }
    }

    if (ingredients.length === 0) {
      console.warn(`⚠️ No valid ingredients found for group '${config.name}', skipping group`);
      return null;
    }

    return {
      name: config.name,
      ingredients,
      description: config.description
    };
  }

  /**
   * Convert difficulty string to RecipeDifficulty enum
   */
  private static convertDifficulty(difficulty: string): RecipeDifficulty {
    switch (difficulty.toLowerCase()) {
      case 'easy': return RecipeDifficulty.Easy;
      case 'medium': return RecipeDifficulty.Medium;
      case 'hard': return RecipeDifficulty.Hard;
      default: return RecipeDifficulty.Easy;
    }
  }

  /**
   * Convert step type string to StepType enum
   */
  private static convertStepType(type: string): StepType {
    switch (type.toLowerCase()) {
      case 'preparation': return StepType.Preparation;
      case 'baking': return StepType.Baking;
      case 'cooling': return StepType.Cooling;
      case 'assembly': return StepType.Assembly;
      case 'decoration': return StepType.Decoration;
      default: return StepType.Preparation;
    }
  }

  /**
   * Resolve template name with parameters
   */
  private static resolveTemplateName(templateName: string, params: Record<string, any>): string {
    let resolved = templateName;
    
    // Replace parameter placeholders in template name
    Object.entries(params).forEach(([key, value]) => {
      const placeholder = new RegExp(`{${key}}`, 'g');
      resolved = resolved.replace(placeholder, value?.toString() || '');
    });
    
    return resolved;
  }

  /**
   * Get service summary for debugging
   */
  public static getSummary(): {
    isInitialized: boolean;
    recipeCount: number;
    recipeIds: string[];
  } {
    return {
      isInitialized: this.isInitialized,
      recipeCount: this.loadedRecipes.size,
      recipeIds: Array.from(this.loadedRecipes.keys())
    };
  }

  /**
   * Create a recipe directly from config data (useful for testing)
   */
  public static async createRecipeFromConfigData(config: RecipeConfig): Promise<MultiStepRecipe> {
    return this.createRecipeFromConfig(config);
  }
}