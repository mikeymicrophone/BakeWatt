import { injectable } from 'inversify';
import { observable, action, computed } from 'mobx';

export interface MultiplicationProblem {
  factor1: number;
  factor2: number;
  product: number;
}

export interface RecipeScalingProblem {
  recipeId: string;
  recipeName: string;
  baseServings: number;
  targetServings: number;
  scalingFactor: number;
  ingredientScaling: Array<{
    ingredientName: string;
    baseAmount: number;
    scaledAmount: number;
    unit: string;
  }>;
  mathDescription: string;
}

@injectable()
export class MultiplicationService {
  @observable private _currentProblem: MultiplicationProblem | null = null;
  @observable private _currentRecipeProblem: RecipeScalingProblem | null = null;
  @observable private _showingResult: boolean = false;
  @observable private _mode: 'basic' | 'recipe' = 'basic';

  @computed
  get currentProblem(): MultiplicationProblem | null {
    return this._currentProblem;
  }

  @computed
  get currentRecipeProblem(): RecipeScalingProblem | null {
    return this._currentRecipeProblem;
  }

  @computed
  get showingResult(): boolean {
    return this._showingResult;
  }

  @computed
  get mode(): 'basic' | 'recipe' {
    return this._mode;
  }

  @computed
  get isRecipeMode(): boolean {
    return this._mode === 'recipe';
  }

  @action
  public createProblem(factor1: number, factor2: number): MultiplicationProblem {
    const problem: MultiplicationProblem = {
      factor1: Math.max(1, Math.min(20, Math.floor(factor1))),
      factor2: Math.max(1, Math.min(20, Math.floor(factor2))),
      product: 0
    };
    
    problem.product = problem.factor1 * problem.factor2;
    this._currentProblem = problem;
    this._showingResult = false;
    
    return problem;
  }

  @action
  public showResult(): void {
    this._showingResult = true;
  }

  @action
  public hideResult(): void {
    this._showingResult = false;
  }

  @action
  public setMode(mode: 'basic' | 'recipe'): void {
    this._mode = mode;
    this._showingResult = false;
    
    // Clear current problems when switching modes
    if (mode === 'basic') {
      this._currentRecipeProblem = null;
    } else {
      this._currentProblem = null;
    }
  }

  @action
  public createRecipeScalingProblem(
    recipeId: string,
    recipeName: string,
    baseServings: number,
    targetServings: number,
    ingredients: Array<{ name: string; amount: number; unit: string }>
  ): RecipeScalingProblem {
    const scalingFactor = targetServings / baseServings;
    
    const ingredientScaling = ingredients.map(ingredient => ({
      ingredientName: ingredient.name,
      baseAmount: ingredient.amount,
      scaledAmount: ingredient.amount * scalingFactor,
      unit: ingredient.unit
    }));

    const problem: RecipeScalingProblem = {
      recipeId,
      recipeName,
      baseServings,
      targetServings,
      scalingFactor,
      ingredientScaling,
      mathDescription: `${recipeName}: ${baseServings} servings × ${scalingFactor} = ${targetServings} servings`
    };

    this._currentRecipeProblem = problem;
    this._showingResult = false;
    this._mode = 'recipe';

    return problem;
  }

  @action
  public reset(): void {
    this._currentProblem = null;
    this._currentRecipeProblem = null;
    this._showingResult = false;
  }

  public formatResult(problem: MultiplicationProblem): string {
    return `${problem.factor1} × ${problem.factor2} = ${problem.product}`;
  }

  public validateInput(value: string): number | null {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 20) {
      return null;
    }
    return num;
  }

  public getVisualizationDimensions(problem: MultiplicationProblem): { rows: number; columns: number } {
    return {
      rows: problem.factor1,
      columns: problem.factor2
    };
  }

  public getRecipeVisualizationDimensions(recipeProblem: RecipeScalingProblem): { rows: number; columns: number } {
    return {
      rows: recipeProblem.baseServings,
      columns: Math.round(recipeProblem.scalingFactor)
    };
  }

  public formatRecipeResult(recipeProblem: RecipeScalingProblem): string {
    return recipeProblem.mathDescription;
  }

  // Helper method to get the current active problem for visualization
  public getCurrentVisualizationDimensions(): { rows: number; columns: number } | null {
    if (this._mode === 'recipe' && this._currentRecipeProblem) {
      return this.getRecipeVisualizationDimensions(this._currentRecipeProblem);
    } else if (this._mode === 'basic' && this._currentProblem) {
      return this.getVisualizationDimensions(this._currentProblem);
    }
    return null;
  }

  // Helper method to get current problem description
  public getCurrentProblemDescription(): string | null {
    if (this._mode === 'recipe' && this._currentRecipeProblem) {
      return this.formatRecipeResult(this._currentRecipeProblem);
    } else if (this._mode === 'basic' && this._currentProblem) {
      return this.formatResult(this._currentProblem);
    }
    return null;
  }
}