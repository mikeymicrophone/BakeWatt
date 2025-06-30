/**
 * Service for managing ingredients loaded from JSON configuration
 * Bridges between config data and the domain Ingredient model
 */

import { Ingredient } from './Ingredient';
import { ConfigLoader, type IngredientConfig } from '@/core/config/ConfigLoader';

export class IngredientConfigService {
  private static configIngredients: Map<string, Ingredient> = new Map();
  private static isLoaded = false;

  /**
   * Initialize the service by loading ingredients from config
   */
  public static async initialize(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    try {
      console.log('🏗️ Initializing IngredientConfigService...');
      
      const ingredientConfigs = await ConfigLoader.getAllIngredients();
      
      // Convert config objects to Ingredient domain objects
      for (const config of ingredientConfigs) {
        const ingredient = this.createIngredientFromConfig(config);
        this.configIngredients.set(config.id, ingredient);
      }
      
      this.isLoaded = true;
      console.log(`✅ Initialized with ${this.configIngredients.size} ingredients from config`);
      
    } catch (error) {
      console.error('❌ Failed to initialize IngredientConfigService:', error);
      throw error;
    }
  }

  /**
   * Get an ingredient by ID (from config)
   */
  public static getIngredient(id: string): Ingredient | null {
    if (!this.isLoaded) {
      console.warn('⚠️ IngredientConfigService not initialized. Call initialize() first.');
      return null;
    }
    
    return this.configIngredients.get(id) || null;
  }

  /**
   * Get all ingredients loaded from config
   */
  public static getAllIngredients(): Ingredient[] {
    if (!this.isLoaded) {
      console.warn('⚠️ IngredientConfigService not initialized. Call initialize() first.');
      return [];
    }
    
    return Array.from(this.configIngredients.values());
  }

  /**
   * Check if an ingredient exists in the config
   */
  public static hasIngredient(id: string): boolean {
    return this.configIngredients.has(id);
  }

  /**
   * Get ingredient IDs loaded from config
   */
  public static getIngredientIds(): string[] {
    return Array.from(this.configIngredients.keys());
  }

  /**
   * Reload ingredients from config (useful for development)
   */
  public static async reload(): Promise<void> {
    console.log('🔄 Reloading ingredients from config...');
    
    this.configIngredients.clear();
    this.isLoaded = false;
    
    // Clear the config loader cache too
    ConfigLoader.clearCache();
    
    await this.initialize();
  }

  /**
   * Convert a config object to an Ingredient domain object
   */
  private static createIngredientFromConfig(config: IngredientConfig): Ingredient {
    return new Ingredient(
      config.id,
      config.name,
      config.defaultUnit,
      config.icon,
      config.basePrice
    );
  }

  /**
   * Get the original config data for an ingredient (useful for detailed info)
   */
  public static async getIngredientConfig(id: string): Promise<IngredientConfig | null> {
    return ConfigLoader.getIngredientById(id);
  }

  /**
   * Get ingredients by category from config
   */
  public static async getIngredientsByCategory(category: string): Promise<Ingredient[]> {
    const configIngredients = await ConfigLoader.getIngredientsByCategory(category);
    return configIngredients.map(config => this.createIngredientFromConfig(config));
  }

  /**
   * Merge config ingredients with existing starter ingredients
   * This allows both systems to coexist during transition
   */
  public static getMergedIngredients(starterIngredients: Record<string, Ingredient>): Map<string, Ingredient> {
    const merged = new Map<string, Ingredient>();
    
    // Add starter ingredients first
    Object.entries(starterIngredients).forEach(([key, ingredient]) => {
      merged.set(ingredient.id, ingredient);
    });
    
    // Add config ingredients (may override starter ingredients with same ID)
    this.configIngredients.forEach((ingredient, id) => {
      merged.set(id, ingredient);
    });
    
    return merged;
  }

  /**
   * Get summary of loaded ingredients
   */
  public static getSummary(): {
    isLoaded: boolean;
    count: number;
    ingredients: Array<{ id: string; name: string; category?: string }>;
  } {
    const ingredients: Array<{ id: string; name: string; category?: string }> = [];
    
    for (const [id, ingredient] of this.configIngredients) {
      ingredients.push({
        id,
        name: ingredient.name,
        // Note: category isn't stored in domain Ingredient, would need config lookup
      });
    }
    
    return {
      isLoaded: this.isLoaded,
      count: this.configIngredients.size,
      ingredients
    };
  }
}