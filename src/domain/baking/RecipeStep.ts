import { FlexibleIngredient } from './FlexibleIngredient';

export interface RecipeStepMetadata {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedTime?: number; // in minutes
  temperature?: number; // for baking steps
  instructions: string[];
}

export interface IngredientGroup {
  name: string;
  ingredients: FlexibleIngredient[];
  description?: string; // e.g., "wet ingredients", "dry ingredients"
}

export interface StepParameters {
  temp?: number;
  time?: number;
  [key: string]: any; // Custom parameters like "mixingSpeed", "restTime"
}

export enum StepType {
  Preparation = 'preparation',   // Mixing, chopping, etc.
  Baking = 'baking',            // Oven work
  Cooling = 'cooling',          // Waiting/cooling
  Assembly = 'assembly',        // Putting together
  Decoration = 'decoration'     // Final touches
}

export class RecipeStep {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly order: number;
  public readonly type: StepType;
  public readonly ingredients: ReadonlyArray<FlexibleIngredient>;
  public readonly instructions: ReadonlyArray<string>;
  public readonly estimatedTime?: number;
  public readonly temperature?: number;
  public readonly groups: ReadonlyArray<IngredientGroup>;
  public readonly parameters: StepParameters;

  constructor(
    metadata: RecipeStepMetadata,
    type: StepType,
    ingredients: FlexibleIngredient[] = [],
    parameters: StepParameters = {},
    groups: IngredientGroup[] = []
  ) {
    // Validation
    if (!metadata.id || metadata.id.trim().length === 0) {
      throw new Error('Step id cannot be empty');
    }
    if (!metadata.name || metadata.name.trim().length === 0) {
      throw new Error('Step name cannot be empty');
    }
    if (metadata.order < 0) {
      throw new Error('Step order cannot be negative');
    }
    if (metadata.estimatedTime !== undefined && metadata.estimatedTime < 0) {
      throw new Error('Estimated time cannot be negative');
    }
    if (!metadata.instructions || metadata.instructions.length === 0) {
      throw new Error('Step must have at least one instruction');
    }

    this.id = metadata.id;
    this.name = metadata.name;
    this.description = metadata.description;
    this.order = metadata.order;
    this.type = type;
    this.ingredients = Object.freeze([...ingredients]);
    this.instructions = Object.freeze([...metadata.instructions]);
    this.estimatedTime = metadata.estimatedTime;
    this.temperature = metadata.temperature;
    this.groups = Object.freeze([...groups]);
    this.parameters = { ...parameters };
  }

  /**
   * Get all ingredient amounts using default values
   */
  public getDefaultIngredientAmounts(): Map<string, number> {
    const amounts = new Map<string, number>();
    this.ingredients.forEach(ingredient => {
      amounts.set(ingredient.ingredient.id, ingredient.getDefaultAmount());
    });
    return amounts;
  }

  /**
   * Get ingredient amounts with custom values
   */
  public getIngredientAmounts(customAmounts?: Map<string, number>): Map<string, number> {
    const amounts = new Map<string, number>();
    this.ingredients.forEach(ingredient => {
      const customAmount = customAmounts?.get(ingredient.ingredient.id);
      amounts.set(ingredient.ingredient.id, ingredient.getAmount(customAmount));
    });
    return amounts;
  }

  /**
   * Scale this step by a factor
   */
  public scale(factor: number): RecipeStep {
    const scaledIngredients = this.ingredients.map(ingredient => ingredient.scale(factor));
    
    // Scale ingredients in groups
    const scaledGroups = this.groups.map(group => ({
      ...group,
      ingredients: group.ingredients.map(ingredient => ingredient.scale(factor))
    }));
    
    // Scale numeric parameters that make sense to scale
    const scaledParameters = { ...this.parameters };
    if (scaledParameters.time) {
      scaledParameters.time = Math.round(scaledParameters.time * factor);
    }
    
    const scaledMetadata: RecipeStepMetadata = {
      id: this.id,
      name: this.name,
      description: this.description,
      order: this.order,
      estimatedTime: this.estimatedTime,
      temperature: this.temperature,
      instructions: [...this.instructions]
    };

    return new RecipeStep(scaledMetadata, this.type, scaledIngredients, scaledParameters, scaledGroups);
  }

  /**
   * Check if this step has any ingredients
   */
  public hasIngredients(): boolean {
    return this.ingredients.length > 0;
  }

  /**
   * Get a specific ingredient by ID
   */
  public getIngredient(ingredientId: string): FlexibleIngredient | null {
    return this.ingredients.find(ing => ing.ingredient.id === ingredientId) || null;
  }

  /**
   * Check if step uses a specific ingredient
   */
  public usesIngredient(ingredientId: string): boolean {
    return this.ingredients.some(ing => ing.ingredient.id === ingredientId);
  }

  /**
   * Get display string for this step
   */
  public toDisplayString(): string {
    const timeStr = this.estimatedTime ? ` (${this.estimatedTime}min)` : '';
    const tempStr = this.temperature ? ` @ ${this.temperature}°F` : '';
    return `${this.order}. ${this.name}${timeStr}${tempStr}`;
  }

  /**
   * Get formatted instructions with ingredient amounts and template parameters
   */
  public getFormattedInstructions(customAmounts?: Map<string, number>): string[] {
    const amounts = this.getIngredientAmounts(customAmounts);
    
    return this.instructions.map(instruction => {
      let formatted = instruction;
      
      // Replace parameter placeholders
      if (this.parameters.temp !== undefined) {
        formatted = formatted.replace(/{temp}/g, this.parameters.temp.toString());
      }
      if (this.parameters.time !== undefined) {
        formatted = formatted.replace(/{time}/g, this.parameters.time.toString());
      }
      
      // Replace custom parameter placeholders
      Object.entries(this.parameters).forEach(([key, value]) => {
        if (key !== 'temp' && key !== 'time' && value !== undefined) {
          const placeholder = new RegExp(`{${key}}`, 'g');
          formatted = formatted.replace(placeholder, value.toString());
        }
      });
      
      // Replace ingredient group placeholders
      this.groups.forEach(group => {
        const placeholder = new RegExp(`{group:${group.name}}`, 'g');
        const ingredientList = group.ingredients.map(ingredient => {
          const amount = amounts.get(ingredient.ingredient.id) || ingredient.getDefaultAmount();
          return `${amount} ${ingredient.ingredient.unit} ${ingredient.ingredient.name}`;
        }).join(', ');
        formatted = formatted.replace(placeholder, ingredientList);
      });
      
      // Replace individual ingredient placeholders (existing functionality)
      this.ingredients.forEach(ingredient => {
        const amount = amounts.get(ingredient.ingredient.id);
        const placeholder = `{${ingredient.ingredient.id}}`;
        const replacement = `${amount} ${ingredient.ingredient.unit} ${ingredient.ingredient.name}`;
        formatted = formatted.replace(new RegExp(placeholder, 'g'), replacement);
      });
      
      return formatted;
    });
  }

  /**
   * Get a specific ingredient group by name
   */
  public getGroup(groupName: string): IngredientGroup | null {
    return this.groups.find(group => group.name === groupName) || null;
  }

  /**
   * Check if step has a specific group
   */
  public hasGroup(groupName: string): boolean {
    return this.groups.some(group => group.name === groupName);
  }

  /**
   * Get all ingredients from groups and individual ingredients combined
   */
  public getAllIngredients(): FlexibleIngredient[] {
    const groupIngredients = this.groups.flatMap(group => group.ingredients);
    return [...this.ingredients, ...groupIngredients];
  }

  /**
   * Get ingredient amounts for all ingredients including those in groups
   */
  public getAllIngredientAmounts(customAmounts?: Map<string, number>): Map<string, number> {
    const amounts = new Map<string, number>();
    
    // Add individual ingredients
    this.ingredients.forEach(ingredient => {
      const customAmount = customAmounts?.get(ingredient.ingredient.id);
      amounts.set(ingredient.ingredient.id, ingredient.getAmount(customAmount));
    });
    
    // Add group ingredients
    this.groups.forEach(group => {
      group.ingredients.forEach(ingredient => {
        const customAmount = customAmounts?.get(ingredient.ingredient.id);
        const currentAmount = amounts.get(ingredient.ingredient.id) || 0;
        amounts.set(ingredient.ingredient.id, currentAmount + ingredient.getAmount(customAmount));
      });
    });
    
    return amounts;
  }

  /**
   * Get summary of step parameters for display
   */
  public getParameterSummary(): string {
    const parts: string[] = [];
    
    if (this.parameters.temp) {
      parts.push(`${this.parameters.temp}°F`);
    }
    if (this.parameters.time) {
      parts.push(`${this.parameters.time}min`);
    }
    
    return parts.join(' | ');
  }
}