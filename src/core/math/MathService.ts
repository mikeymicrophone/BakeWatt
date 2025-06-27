import { injectable } from 'inversify';
import { observable, action, computed } from 'mobx';
import { Ingredient } from '@/domain/inventory';

export interface MultiplicationProblem {
  factor1: number;
  factor2: number;
  product: number;
}

export interface SubtractionProblem {
  minuend: number;
  subtrahend: number;
  difference: number;
  ingredient?: Ingredient;
  problemText: string;
  isValid: boolean;
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

export interface IngredientTransferProblem {
  ingredient: Ingredient;
  pantryAmount: number;
  transferAmount: number;
  remainingAmount: number;
  problemText: string;
  isValid: boolean;
  errorMessage?: string;
}

export type MathMode = 'basic-multiplication' | 'recipe-scaling' | 'ingredient-transfer' | 'basic-subtraction';

@injectable()
export class MathService {
  @observable private _currentMultiplicationProblem: MultiplicationProblem | null = null;
  @observable private _currentSubtractionProblem: SubtractionProblem | null = null;
  @observable private _currentRecipeProblem: RecipeScalingProblem | null = null;
  @observable private _currentTransferProblem: IngredientTransferProblem | null = null;
  @observable private _showingResult: boolean = false;
  @observable private _mode: MathMode = 'basic-multiplication';

  @computed
  get currentMultiplicationProblem(): MultiplicationProblem | null {
    return this._currentMultiplicationProblem;
  }

  @computed
  get currentSubtractionProblem(): SubtractionProblem | null {
    return this._currentSubtractionProblem;
  }

  @computed
  get currentRecipeProblem(): RecipeScalingProblem | null {
    return this._currentRecipeProblem;
  }

  @computed
  get currentTransferProblem(): IngredientTransferProblem | null {
    return this._currentTransferProblem;
  }

  @computed
  get showingResult(): boolean {
    return this._showingResult;
  }

  @computed
  get mode(): MathMode {
    return this._mode;
  }

  @computed
  get isMultiplicationMode(): boolean {
    return this._mode === 'basic-multiplication' || this._mode === 'recipe-scaling';
  }

  @computed
  get isSubtractionMode(): boolean {
    return this._mode === 'basic-subtraction' || this._mode === 'ingredient-transfer';
  }

  @computed
  get currentProblem(): MultiplicationProblem | null {
    // Backwards compatibility
    return this._currentMultiplicationProblem;
  }

  // Multiplication Methods
  @action
  public createMultiplicationProblem(factor1: number, factor2: number): MultiplicationProblem {
    const problem: MultiplicationProblem = {
      factor1: Math.max(1, Math.min(20, Math.floor(factor1))),
      factor2: Math.max(1, Math.min(20, Math.floor(factor2))),
      product: 0
    };
    
    problem.product = problem.factor1 * problem.factor2;
    this._currentMultiplicationProblem = problem;
    this._showingResult = false;
    
    return problem;
  }

  // Backwards compatibility
  public createProblem(factor1: number, factor2: number): MultiplicationProblem {
    return this.createMultiplicationProblem(factor1, factor2);
  }

  // Subtraction Methods
  @action
  public createSubtractionProblem(minuend: number, subtrahend: number, ingredient?: Ingredient): SubtractionProblem {
    const isValid = minuend >= subtrahend && subtrahend >= 0;
    const difference = isValid ? minuend - subtrahend : minuend;
    
    let problemText: string;
    if (ingredient) {
      problemText = `${minuend} ${ingredient.unit} ${ingredient.name} - ${subtrahend} ${ingredient.unit} = ${difference} ${ingredient.unit}`;
    } else {
      problemText = `${minuend} - ${subtrahend} = ${difference}`;
    }

    const problem: SubtractionProblem = {
      minuend: Math.max(0, minuend),
      subtrahend: Math.max(0, subtrahend),
      difference,
      ingredient,
      problemText,
      isValid
    };
    
    this._currentSubtractionProblem = problem;
    this._showingResult = false;
    
    return problem;
  }

  // Ingredient Transfer Methods
  @action
  public createIngredientTransferProblem(
    ingredient: Ingredient,
    pantryAmount: number,
    transferAmount: number
  ): IngredientTransferProblem {
    const isValid = pantryAmount >= transferAmount && transferAmount > 0;
    const remainingAmount = isValid ? pantryAmount - transferAmount : pantryAmount;
    
    let problemText = `${pantryAmount} ${ingredient.unit} ${ingredient.name} - ${transferAmount} ${ingredient.unit} = ${remainingAmount} ${ingredient.unit} remaining`;
    let errorMessage: string | undefined;

    if (!isValid) {
      if (transferAmount <= 0) {
        errorMessage = "Transfer amount must be greater than 0";
      } else if (pantryAmount < transferAmount) {
        errorMessage = `Not enough ${ingredient.name}! You have ${pantryAmount} ${ingredient.unit} but need ${transferAmount} ${ingredient.unit}.`;
      }
    }

    const problem: IngredientTransferProblem = {
      ingredient,
      pantryAmount,
      transferAmount,
      remainingAmount,
      problemText,
      isValid,
      errorMessage
    };
    
    this._currentTransferProblem = problem;
    this._showingResult = false;
    
    return problem;
  }

  // Recipe Scaling (from existing MultiplicationService)
  @action
  public createRecipeScalingProblem(
    recipeId: string,
    recipeName: string,
    baseServings: number,
    targetServings: number,
    ingredients: Array<{name: string; amount: number; unit: string}>
  ): RecipeScalingProblem {
    const scalingFactor = targetServings / baseServings;
    
    const ingredientScaling = ingredients.map(ing => ({
      ingredientName: ing.name,
      baseAmount: ing.amount,
      scaledAmount: ing.amount * scalingFactor,
      unit: ing.unit
    }));

    const problem: RecipeScalingProblem = {
      recipeId,
      recipeName,
      baseServings,
      targetServings,
      scalingFactor,
      ingredientScaling,
      mathDescription: `${baseServings} servings × ${scalingFactor} = ${targetServings} servings`
    };

    this._currentRecipeProblem = problem;
    this._showingResult = false;
    
    return problem;
  }

  // General Methods
  @action
  public showResult(): void {
    this._showingResult = true;
  }

  @action
  public hideResult(): void {
    this._showingResult = false;
  }

  @action
  public setMode(mode: MathMode): void {
    this._mode = mode;
    this._showingResult = false;
    
    // Clear problems when switching modes
    this._currentMultiplicationProblem = null;
    this._currentSubtractionProblem = null;
    this._currentRecipeProblem = null;
    this._currentTransferProblem = null;
  }

  // Validation Methods
  public validateInput(value: string): number | null {
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 20) {
      return null;
    }
    return num;
  }

  public validateTransferAmount(transferAmount: number, availableAmount: number): boolean {
    return transferAmount > 0 && transferAmount <= availableAmount;
  }

  // Visualization Methods
  public getVisualizationDimensions(problem: MultiplicationProblem): { rows: number; columns: number } {
    return {
      rows: problem.factor1,
      columns: problem.factor2
    };
  }

  public getRecipeVisualizationDimensions(problem: RecipeScalingProblem): { rows: number; columns: number } {
    return {
      rows: problem.baseServings,
      columns: Math.round(problem.scalingFactor)
    };
  }

  public getSubtractionVisualizationDimensions(problem: SubtractionProblem): { total: number; remove: number; remaining: number } {
    return {
      total: problem.minuend,
      remove: problem.subtrahend,
      remaining: problem.difference
    };
  }

  // Result Formatting
  public formatMultiplicationResult(problem: MultiplicationProblem): string {
    return `${problem.factor1} × ${problem.factor2} = ${problem.product}`;
  }

  public formatSubtractionResult(problem: SubtractionProblem): string {
    return problem.problemText;
  }

  public formatRecipeResult(problem: RecipeScalingProblem): string {
    return `Scaled ${problem.recipeName} from ${problem.baseServings} to ${problem.targetServings} servings`;
  }

  public formatTransferResult(problem: IngredientTransferProblem): string {
    if (!problem.isValid) {
      return problem.errorMessage || 'Invalid transfer';
    }
    return `Transferred ${problem.transferAmount} ${problem.ingredient.unit} ${problem.ingredient.name}`;
  }

  // Backwards compatibility methods
  public generateProblem(factor1: number, factor2: number): MultiplicationProblem {
    return this.createMultiplicationProblem(factor1, factor2);
  }

  public formatResult(problem: MultiplicationProblem): string {
    return this.formatMultiplicationResult(problem);
  }
}