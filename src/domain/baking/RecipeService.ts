import { injectable } from 'inversify';
import { observable, action } from 'mobx';
import { Recipe } from './Recipe';
import { RecipeCollection, RecipeCollectionState } from './RecipeCollection';
import { RecipeLibrary, RECIPE_REGISTRY } from './RecipeLibrary';
import { Pantry, IngredientAmount } from '@/domain/inventory';

export interface RecipeRepository {
  saveRecipeCollection(state: RecipeCollectionState): void;
  loadRecipeCollection(): RecipeCollectionState | null;
  getRecipeLibrary(): Map<string, Recipe>;
}

@injectable()
export class LocalStorageRecipeRepository implements RecipeRepository {
  private static readonly COLLECTION_STORAGE_KEY = 'bakewatt-recipe-collection';

  public saveRecipeCollection(state: RecipeCollectionState): void {
    try {
      localStorage.setItem(
        LocalStorageRecipeRepository.COLLECTION_STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.warn('Failed to save recipe collection to localStorage:', error);
    }
  }

  public loadRecipeCollection(): RecipeCollectionState | null {
    try {
      const saved = localStorage.getItem(LocalStorageRecipeRepository.COLLECTION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load recipe collection from localStorage:', error);
      return null;
    }
  }

  public getRecipeLibrary(): Map<string, Recipe> {
    return RECIPE_REGISTRY;
  }
}

@injectable()
export class RecipeService {
  @observable private recipeCollection: RecipeCollection;

  constructor(private repository: RecipeRepository = new LocalStorageRecipeRepository()) {
    const savedState = this.repository.loadRecipeCollection();
    
    if (savedState) {
      this.recipeCollection = RecipeCollection.fromState(savedState, this.repository.getRecipeLibrary());
    } else {
      // Initialize with starter recipe
      this.recipeCollection = new RecipeCollection([RecipeLibrary.getStarterRecipe()]);
      this.saveCollectionState();
    }
  }

  public getRecipeCollection(): RecipeCollection {
    return this.recipeCollection;
  }

  public getRecipe(id: string): Recipe | null {
    return this.recipeCollection.getRecipe(id);
  }

  public getAllRecipes(): Recipe[] {
    return this.recipeCollection.getAllRecipes();
  }

  public getAvailableRecipesFromLibrary(): Recipe[] {
    return RecipeLibrary.getAllRecipes();
  }

  @action
  public addRecipe(recipeId: string): void {
    const recipe = RecipeLibrary.getRecipeById(recipeId);
    if (!recipe) {
      throw new Error(`Recipe not found in library: ${recipeId}`);
    }

    if (this.recipeCollection.hasRecipe(recipeId)) {
      throw new Error(`Recipe already owned: ${recipe.name}`);
    }

    this.recipeCollection.addRecipe(recipe);
    this.saveCollectionState();
  }

  @action
  public removeRecipe(recipeId: string): boolean {
    const removed = this.recipeCollection.removeRecipe(recipeId);
    if (removed) {
      this.saveCollectionState();
    }
    return removed;
  }

  // Recipe scaling operations (multiplication math)
  public scaleRecipe(recipeId: string, targetServings: number): Recipe {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    return recipe.scaleToServings(targetServings);
  }

  public getScalingFactor(recipeId: string, targetServings: number): number {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    return recipe.getScalingFactor(targetServings);
  }

  // Recipe availability checking
  public getRecipesCanMake(pantry: Pantry): Recipe[] {
    return this.recipeCollection.getRecipesCanMake(pantry);
  }

  public getRecipesCannotMake(pantry: Pantry): Recipe[] {
    return this.recipeCollection.getRecipesCannotMake(pantry);
  }

  public canMakeRecipe(recipeId: string, pantry: Pantry): boolean {
    return this.recipeCollection.canMake(recipeId, pantry);
  }

  // Multi-recipe planning (addition math)
  public planMultipleRecipes(recipeIds: string[]): {
    recipes: Recipe[];
    combinedIngredients: Map<string, number>;
    totalServings: number;
    totalTime: number;
  } {
    return this.recipeCollection.planMultipleRecipes(recipeIds);
  }

  // Search and filtering
  public searchRecipes(query: string): Recipe[] {
    return this.recipeCollection.searchRecipes(query);
  }

  public getRecipesByDifficulty(difficulty: string): Recipe[] {
    return this.recipeCollection.getRecipesByDifficulty(difficulty);
  }

  public getSortedRecipes(sortBy: 'name' | 'difficulty' | 'time' | 'servings'): Recipe[] {
    return this.recipeCollection.getSortedRecipes(sortBy);
  }

  // Math problem generation helpers
  public createMultiplicationProblem(recipeId: string, targetServings: number): {
    recipe: Recipe;
    baseServings: number;
    targetServings: number;
    scalingFactor: number;
    scaledIngredients: IngredientAmount[];
    mathDescription: string;
  } {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    const scalingFactor = recipe.getScalingFactor(targetServings);
    const scaledIngredients = recipe.createScaledIngredientList(targetServings);

    return {
      recipe,
      baseServings: recipe.baseServings,
      targetServings,
      scalingFactor,
      scaledIngredients,
      mathDescription: `${recipe.name}: ${recipe.baseServings} servings × ${scalingFactor} = ${targetServings} servings`
    };
  }

  public createAdditionProblem(recipeIds: string[]): {
    recipes: Recipe[];
    ingredientAdditions: Array<{
      ingredientId: string;
      ingredientName: string;
      amounts: number[];
      total: number;
      mathDescription: string;
    }>;
    totalServings: number;
  } {
    const recipes = recipeIds
      .map(id => this.getRecipe(id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);

    if (recipes.length === 0) {
      throw new Error('No valid recipes provided for addition problem');
    }

    // Group ingredients across recipes
    const ingredientGroups = new Map<string, { name: string; amounts: number[] }>();

    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        const id = ingredient.ingredient.id;
        const name = ingredient.ingredient.name;
        
        if (!ingredientGroups.has(id)) {
          ingredientGroups.set(id, { name, amounts: [] });
        }
        
        ingredientGroups.get(id)!.amounts.push(ingredient.quantity);
      });
    });

    // Create addition problems for each ingredient
    const ingredientAdditions = Array.from(ingredientGroups.entries()).map(([id, data]) => {
      const total = data.amounts.reduce((sum, amount) => sum + amount, 0);
      const mathDescription = `${data.amounts.join(' + ')} = ${total} ${data.name}`;
      
      return {
        ingredientId: id,
        ingredientName: data.name,
        amounts: data.amounts,
        total,
        mathDescription
      };
    });

    const totalServings = recipes.reduce((sum, recipe) => sum + recipe.baseServings, 0);

    return {
      recipes,
      ingredientAdditions,
      totalServings
    };
  }

  // Validation methods
  public validateRecipeRequirements(recipeId: string, pantry: Pantry): {
    canMake: boolean;
    missingIngredients: IngredientAmount[];
    availableIngredients: IngredientAmount[];
  } {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    const pantryStock = pantry.getAllStock();
    const canMake = recipe.canBeMadeWith(pantryStock);
    const missingIngredients = recipe.getMissingIngredients(pantryStock);
    
    // Get available amounts for each recipe ingredient
    const availableIngredients = recipe.ingredients.map(required => {
      const available = pantry.getStock(required.ingredient.id);
      return new IngredientAmount(
        required.ingredient, 
        Math.min(available, required.quantity)
      );
    });

    return {
      canMake,
      missingIngredients,
      availableIngredients
    };
  }

  private saveCollectionState(): void {
    this.repository.saveRecipeCollection(this.recipeCollection.toState());
  }

  @action
  public resetToDefaults(): void {
    this.recipeCollection = new RecipeCollection([RecipeLibrary.getStarterRecipe()]);
    this.saveCollectionState();
  }
}