import { injectable, inject } from 'inversify';
import { observable, action, computed } from 'mobx';
import { RecipeService } from '@/domain/baking';
import { RecipeScalingProblem } from '@/core/math/MultiplicationService';
import { MathService } from '@/core/math/MathService';
import { CubeGrid } from '@/presentation/components/CubeGrid';
import { SceneManager } from '@/core/engine/SceneManager';
import { CameraZoomManager } from '@/core/engine/CameraZoomManager';

@injectable()
export class RecipeScalingScene {
  @observable private _isVisible: boolean = false;
  @observable private _currentRecipeId: string = 'simple-cookies';
  @observable private _targetServings: number = 6;

  private cubeGrid: CubeGrid | null = null;
  private disposers: (() => void)[] = [];

  constructor(
    @inject(RecipeService) private recipeService: RecipeService,
    @inject(MathService) private mathService: MathService,
    @inject(SceneManager) private sceneManager: SceneManager,
    @inject(CameraZoomManager) private zoomManager: CameraZoomManager
  ) {}

  @computed
  get isVisible(): boolean {
    return this._isVisible;
  }

  @computed
  get currentRecipeId(): string {
    return this._currentRecipeId;
  }

  @computed
  get targetServings(): number {
    return this._targetServings;
  }

  @action
  public show(): void {
    console.log('🎯 RecipeScalingScene: show() called');
    this._isVisible = true;
    this.mathService.setMode('recipe-scaling');
    this.updateRecipeDisplay();
    this.setupReactions();
    console.log('✅ RecipeScalingScene: show() completed');
  }

  @action
  public hide(): void {
    this._isVisible = false;
    this.mathService.setMode('basic-multiplication');
    this.cleanup();
  }

  @action
  public setTargetServings(servings: number): void {
    this._targetServings = Math.max(1, Math.min(20, servings));
    this.updateRecipeDisplay();
  }

  private updateRecipeDisplay(): void {
    console.log('🍪 RecipeScalingScene: updateRecipeDisplay called');
    console.log('🔍 Looking for recipe ID:', this._currentRecipeId);
    console.log('📚 Available recipes:', this.recipeService.getAllRecipes().map(r => ({ id: r.id, name: r.name })));
    
    const recipe = this.recipeService.getRecipe(this._currentRecipeId);
    if (!recipe) {
      console.error('❌ Recipe not found:', this._currentRecipeId);
      return;
    }
    
    console.log('✅ Recipe found:', recipe.name);

    // Update recipe info in UI
    this.updateRecipeInfoUI(recipe);

    // Create recipe scaling problem
    const ingredients = recipe.ingredients.map(ing => ({
      name: ing.ingredient.name,
      amount: ing.quantity,
      unit: ing.ingredient.unit
    }));

    const problem = this.mathService.createRecipeScalingProblem(
      recipe.id,
      recipe.name,
      recipe.baseServings,
      this._targetServings,
      ingredients
    );

    // Update scaling math display
    this.updateScalingMathUI(problem);

    // Update ingredient problems display
    this.updateIngredientProblemsUI(problem);
  }

  private updateRecipeInfoUI(recipe: any): void {
    const recipeNameEl = document.getElementById('recipe-name');
    const recipeIconEl = document.getElementById('recipe-icon');
    const baseServingsEl = document.getElementById('base-servings');

    if (recipeNameEl) recipeNameEl.textContent = recipe.name;
    if (recipeIconEl) recipeIconEl.textContent = recipe.icon;
    if (baseServingsEl) baseServingsEl.textContent = recipe.baseServings.toString();
  }

  private updateScalingMathUI(problem: RecipeScalingProblem): void {
    const scalingEquationEl = document.getElementById('scaling-equation');
    if (scalingEquationEl) {
      scalingEquationEl.textContent = `${problem.baseServings} servings × ${problem.scalingFactor} = ${problem.targetServings} servings`;
    }
  }

  private updateIngredientProblemsUI(problem: RecipeScalingProblem): void {
    const ingredientProblemsEl = document.getElementById('ingredient-problems');
    if (!ingredientProblemsEl) return;

    ingredientProblemsEl.innerHTML = '';

    problem.ingredientScaling.forEach(ingredient => {
      const problemEl = document.createElement('div');
      problemEl.className = 'ingredient-problem';
      
      problemEl.innerHTML = `
        <div>${ingredient.ingredientName}:</div>
        <div class="math-equation">${ingredient.baseAmount} ${ingredient.unit} × ${problem.scalingFactor} = ${ingredient.scaledAmount} ${ingredient.unit}</div>
      `;
      
      ingredientProblemsEl.appendChild(problemEl);
    });
  }

  public visualizeScaling(): void {
    const problem = this.mathService.currentRecipeProblem;
    if (!problem) return;

    // Get visualization dimensions
    const dimensions = this.mathService.getRecipeVisualizationDimensions(problem);

    // Clear existing cube grid
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
    }

    // Create new cube grid
    this.cubeGrid = new CubeGrid(this.sceneManager, this.zoomManager);
    this.cubeGrid.createGrid(dimensions.rows, dimensions.columns);
  }

  public showScaledRecipe(): void {
    const problem = this.mathService.currentRecipeProblem;
    if (!problem) return;

    this.mathService.showResult();
    
    const scaledResultEl = document.getElementById('scaled-recipe-result');
    if (!scaledResultEl) return;

    let resultHTML = `<h5>${problem.recipeName} (${problem.targetServings} servings)</h5>`;
    
    problem.ingredientScaling.forEach(ingredient => {
      resultHTML += `<div class="scaled-ingredient">• ${ingredient.scaledAmount} ${ingredient.unit} ${ingredient.ingredientName}</div>`;
    });

    scaledResultEl.innerHTML = resultHTML;
    scaledResultEl.style.display = 'block';
  }

  private setupReactions(): void {
    // Auto-update when target servings change
    const targetServingsInput = document.getElementById('target-servings') as HTMLInputElement;
    if (targetServingsInput) {
      const updateHandler = () => {
        const value = parseInt(targetServingsInput.value, 10);
        if (!isNaN(value)) {
          this.setTargetServings(value);
        }
      };
      
      targetServingsInput.addEventListener('input', updateHandler);
      
      // Store cleanup function
      this.disposers.push(() => {
        targetServingsInput.removeEventListener('input', updateHandler);
      });
    }
  }

  private cleanup(): void {
    this.disposers.forEach(dispose => dispose());
    this.disposers = [];
    
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
      this.cubeGrid = null;
    }

    // Hide scaled result
    const scaledResultEl = document.getElementById('scaled-recipe-result');
    if (scaledResultEl) {
      scaledResultEl.style.display = 'none';
    }
  }

  public destroy(): void {
    this.cleanup();
  }
}