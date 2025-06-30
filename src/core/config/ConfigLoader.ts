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

export class ConfigLoader {
  private static ingredientsCache: IngredientsData | null = null;

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
}