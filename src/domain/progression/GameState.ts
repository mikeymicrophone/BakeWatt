import { observable, action, computed } from 'mobx';
import { Pantry, PantryState } from '@/domain/inventory';
import { RecipeCollection, type RecipeCollectionState } from '@/domain/baking';

export interface GameStateData {
  pantry: PantryState;
  recipes: RecipeCollectionState;
  currentLevel: number;
  tutorialCompleted: boolean;
  gameVersion: string;
  lastSaved: string;
}

export class GameState {
  @observable private _pantry: Pantry;
  @observable private _recipes: RecipeCollection;
  @observable private _currentLevel: number = 1;
  @observable private _tutorialCompleted: boolean = false;
  private readonly _gameVersion: string = '1.0.0';

  constructor(
    pantry: Pantry = new Pantry(),
    recipes: RecipeCollection = new RecipeCollection(),
    currentLevel: number = 1,
    tutorialCompleted: boolean = false
  ) {
    this._pantry = pantry;
    this._recipes = recipes;
    this._currentLevel = currentLevel;
    this._tutorialCompleted = tutorialCompleted;
  }

  @computed
  public get pantry(): Pantry {
    return this._pantry;
  }

  @computed
  public get recipes(): RecipeCollection {
    return this._recipes;
  }

  @computed
  public get currentLevel(): number {
    return this._currentLevel;
  }

  @computed
  public get tutorialCompleted(): boolean {
    return this._tutorialCompleted;
  }

  @computed
  public get gameVersion(): string {
    return this._gameVersion;
  }

  @action
  public completeTutorial(): void {
    this._tutorialCompleted = true;
  }

  @action
  public advanceLevel(): void {
    this._currentLevel += 1;
  }

  @action
  public setLevel(level: number): void {
    if (level < 1) {
      throw new Error('Level must be at least 1');
    }
    this._currentLevel = level;
  }

  @action
  public resetToDefaults(): void {
    this._pantry.clear();
    this._recipes = new RecipeCollection();
    this._currentLevel = 1;
    this._tutorialCompleted = false;
  }

  @computed
  public get isFirstTime(): boolean {
    return !this._tutorialCompleted && this._currentLevel === 1;
  }

  @computed
  public get canStartTutorial(): boolean {
    return this.isFirstTime && !this._pantry.isEmpty;
  }

  // Validation methods
  public validateState(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate pantry
    if (this._pantry.isEmpty && this._currentLevel > 1) {
      errors.push('Pantry cannot be empty for level > 1');
    }

    // Validate level
    if (this._currentLevel < 1) {
      errors.push('Level must be at least 1');
    }

    // Validate recipes
    if (this._recipes.isEmpty && this._tutorialCompleted) {
      errors.push('Player should have recipes after completing tutorial');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Persistence methods
  public toData(): GameStateData {
    return {
      pantry: this._pantry.toState(),
      recipes: this._recipes.toState(),
      currentLevel: this._currentLevel,
      tutorialCompleted: this._tutorialCompleted,
      gameVersion: this._gameVersion,
      lastSaved: new Date().toISOString()
    };
  }

  public static fromData(
    data: GameStateData,
    recipeRegistry: Map<string, any>
  ): GameState {
    const pantry = new Pantry(data.pantry);
    const recipes = RecipeCollection.fromState(data.recipes, recipeRegistry);
    
    const gameState = new GameState(
      pantry,
      recipes,
      data.currentLevel,
      data.tutorialCompleted
    );

    // Validate loaded state
    const validation = gameState.validateState();
    if (!validation.isValid) {
      console.warn('Loaded game state has validation errors:', validation.errors);
    }

    return gameState;
  }

  public clone(): GameState {
    return new GameState(
      this._pantry.clone(),
      this._recipes.clone(),
      this._currentLevel,
      this._tutorialCompleted
    );
  }

  // Game progress tracking
  @computed
  public get progressStats() {
    return {
      level: this._currentLevel,
      recipesUnlocked: this._recipes.recipeCount,
      ingredientTypesInPantry: this._pantry.ingredientIds.length,
      tutorialComplete: this._tutorialCompleted,
      canMakeRecipes: this._recipes.getRecipesCanMake(this._pantry).length
    };
  }

  // Helper methods for game flow
  public hasRequiredStarterIngredients(): boolean {
    return this._pantry.hasEnough('flour', 2) && 
           this._pantry.hasEnough('butter', 1) && 
           this._pantry.hasEnough('eggs', 1);
  }

  public canMakeStarterRecipe(): boolean {
    const starterRecipe = this._recipes.getRecipe('simple-cookies');
    return starterRecipe ? this._recipes.canMake('simple-cookies', this._pantry) : false;
  }
}