import { observable, action, computed } from 'mobx';
import { Recipe } from './Recipe';
import { Pantry } from '@/domain/inventory';

export interface RecipeCollectionState {
  recipeIds: string[];
}

export class RecipeCollection {
  @observable private recipes = new Map<string, Recipe>();

  constructor(initialRecipes: Recipe[] = []) {
    initialRecipes.forEach(recipe => {
      this.recipes.set(recipe.id, recipe);
    });
  }

  @action
  public addRecipe(recipe: Recipe): void {
    if (this.recipes.has(recipe.id)) {
      throw new Error(`Recipe with id '${recipe.id}' already exists in collection`);
    }
    this.recipes.set(recipe.id, recipe);
  }

  @action
  public removeRecipe(recipeId: string): boolean {
    return this.recipes.delete(recipeId);
  }

  public getRecipe(id: string): Recipe | null {
    return this.recipes.get(id) || null;
  }

  public hasRecipe(id: string): boolean {
    return this.recipes.has(id);
  }

  @computed
  public get recipeCount(): number {
    return this.recipes.size;
  }

  @computed
  public get isEmpty(): boolean {
    return this.recipes.size === 0;
  }

  public getAllRecipes(): Recipe[] {
    return Array.from(this.recipes.values());
  }

  public getRecipeIds(): string[] {
    return Array.from(this.recipes.keys());
  }

  // Find recipes that can be made with given pantry
  public getRecipesCanMake(pantry: Pantry): Recipe[] {
    const availableStock = pantry.getAllStock();
    return this.getAllRecipes().filter(recipe => 
      recipe.canBeMadeWith(availableStock)
    );
  }

  // Find recipes that cannot be made (missing ingredients)
  public getRecipesCannotMake(pantry: Pantry): Recipe[] {
    const availableStock = pantry.getAllStock();
    return this.getAllRecipes().filter(recipe => 
      !recipe.canBeMadeWith(availableStock)
    );
  }

  // Check if specific recipe can be made
  public canMake(recipeId: string, pantry: Pantry): boolean {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) return false;
    
    return pantry.canSupport([...recipe.ingredients]);
  }

  // Get recipes by difficulty
  public getRecipesByDifficulty(difficulty: string): Recipe[] {
    return this.getAllRecipes().filter(recipe => recipe.difficulty === difficulty);
  }

  // Search recipes by name or description
  public searchRecipes(query: string): Recipe[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllRecipes().filter(recipe => 
      recipe.name.toLowerCase().includes(lowerQuery) ||
      recipe.description.toLowerCase().includes(lowerQuery)
    );
  }

  // Get recipes that use a specific ingredient
  public getRecipesWithIngredient(ingredientId: string): Recipe[] {
    return this.getAllRecipes().filter(recipe => 
      recipe.hasIngredient(ingredientId)
    );
  }

  // Sort recipes by various criteria
  public getSortedRecipes(sortBy: 'name' | 'difficulty' | 'time' | 'servings'): Recipe[] {
    const recipes = this.getAllRecipes();
    
    switch (sortBy) {
      case 'name':
        return recipes.sort((a, b) => a.name.localeCompare(b.name));
      case 'difficulty':
        const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
        return recipes.sort((a, b) => 
          difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        );
      case 'time':
        return recipes.sort((a, b) => a.bakingTime - b.bakingTime);
      case 'servings':
        return recipes.sort((a, b) => a.baseServings - b.baseServings);
      default:
        return recipes;
    }
  }

  // Create a new collection with scaled versions of recipes
  public createScaledCollection(targetServings: number): RecipeCollection {
    const scaledRecipes = this.getAllRecipes().map(recipe => 
      recipe.scaleToServings(targetServings)
    );
    return new RecipeCollection(scaledRecipes);
  }

  // State management for persistence
  public toState(): RecipeCollectionState {
    return {
      recipeIds: Array.from(this.recipes.keys())
    };
  }

  public static fromState(
    state: RecipeCollectionState, 
    recipeRegistry: Map<string, Recipe>
  ): RecipeCollection {
    const recipes = state.recipeIds
      .map(id => recipeRegistry.get(id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);
    
    return new RecipeCollection(recipes);
  }

  public clone(): RecipeCollection {
    return new RecipeCollection(this.getAllRecipes());
  }

  // Utility method for combining ingredient needs across multiple recipes
  public getCombinedIngredientNeeds(recipeIds: string[]): Map<string, number> {
    const combinedNeeds = new Map<string, number>();
    
    recipeIds.forEach(recipeId => {
      const recipe = this.getRecipe(recipeId);
      if (recipe) {
        recipe.ingredients.forEach(ingredient => {
          const currentAmount = combinedNeeds.get(ingredient.ingredient.id) || 0;
          combinedNeeds.set(
            ingredient.ingredient.id, 
            currentAmount + ingredient.quantity
          );
        });
      }
    });
    
    return combinedNeeds;
  }

  // Method for planning multiple recipes (addition math)
  public planMultipleRecipes(recipeIds: string[]): {
    recipes: Recipe[];
    combinedIngredients: Map<string, number>;
    totalServings: number;
    totalTime: number;
  } {
    const recipes = recipeIds
      .map(id => this.getRecipe(id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);
    
    const combinedIngredients = this.getCombinedIngredientNeeds(recipeIds);
    const totalServings = recipes.reduce((sum, recipe) => sum + recipe.baseServings, 0);
    const totalTime = Math.max(...recipes.map(recipe => recipe.bakingTime));
    
    return {
      recipes,
      combinedIngredients,
      totalServings,
      totalTime
    };
  }
}