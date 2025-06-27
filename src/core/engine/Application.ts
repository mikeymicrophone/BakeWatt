import { observable, action } from 'mobx';
import { SceneManager } from './SceneManager';
import { CameraZoomManager } from './CameraZoomManager';
import { CubeGrid } from '@/presentation/components/CubeGrid';
import { GestureHandler } from '@/presentation/ui/GestureHandler';
import { MultiplicationService } from '@/core/math/MultiplicationService';
import { IngredientService } from '@/domain/inventory';
import { RecipeService } from '@/domain/baking';
import { RecipeScalingScene } from '@/presentation/scenes/RecipeScalingScene';
import { container } from '@/shared/container';
import { testIngredientSystem } from '@/domain/inventory/demo';
import { testRecipeSystem } from '@/domain/baking/demo';

export class Application {
  @observable private _isInitialized: boolean = false;
  
  private sceneManager: SceneManager;
  private zoomManager: CameraZoomManager;
  private gestureHandler: GestureHandler;
  private multiplicationService: MultiplicationService;
  private ingredientService: IngredientService;
  private recipeService: RecipeService;
  private recipeScalingScene: RecipeScalingScene;
  private cubeGrid: CubeGrid | null = null;
  private zoomSlider: HTMLInputElement | null = null;
  private zoomValue: HTMLSpanElement | null = null;
  private isUpdatingSlider: boolean = false;
  private zoomCallback: ((level: number) => void) | null = null;

  constructor() {
    this.sceneManager = container.get<SceneManager>(SceneManager);
    this.zoomManager = container.get<CameraZoomManager>(CameraZoomManager);
    this.gestureHandler = container.get<GestureHandler>(GestureHandler);
    this.multiplicationService = container.get<MultiplicationService>(MultiplicationService);
    this.ingredientService = container.get<IngredientService>(IngredientService);
    this.recipeService = container.get<RecipeService>(RecipeService);
    this.recipeScalingScene = container.get<RecipeScalingScene>(RecipeScalingScene);
  }

  @action
  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    const container = document.getElementById('three-container');
    if (!container) {
      throw new Error('Three.js container not found');
    }

    this.sceneManager.mount(container);
    this.gestureHandler.mount(container);
    this.setupUI();
    this.setupZoomSync();
    
    // Test ingredient system
    console.log('🧪 Testing Ingredient System Integration...');
    console.log('📦 Pantry initialized with:', this.ingredientService.getAllIngredientAmounts().length, 'ingredient types');
    testIngredientSystem();
    
    // Test recipe system
    console.log('\n🍪 Testing Recipe System Integration...');
    console.log('📚 Recipe collection initialized with:', this.recipeService.getAllRecipes().length, 'recipes');
    testRecipeSystem();
    
    this._isInitialized = true;
  }

  private setupUI(): void {
    // Basic math UI elements
    const visualizeBtn = document.getElementById('visualize-btn') as HTMLButtonElement;
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
    const factor1Input = document.getElementById('factor1') as HTMLInputElement;
    const factor2Input = document.getElementById('factor2') as HTMLInputElement;
    const resultDiv = document.getElementById('result') as HTMLDivElement;
    const recipeModeBtn = document.getElementById('recipe-mode-btn') as HTMLButtonElement;
    
    // Recipe scaling UI elements
    const visualizeScalingBtn = document.getElementById('visualize-scaling-btn') as HTMLButtonElement;
    const showScaledRecipeBtn = document.getElementById('show-scaled-recipe-btn') as HTMLButtonElement;
    const backToBasicBtn = document.getElementById('back-to-basic-btn') as HTMLButtonElement;
    
    // Common UI elements
    this.zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement;
    this.zoomValue = document.getElementById('zoom-value') as HTMLSpanElement;

    if (!visualizeBtn || !calculateBtn || !this.zoomSlider || !this.zoomValue) {
      throw new Error('Required UI elements not found');
    }

    // Basic math mode handlers
    visualizeBtn.addEventListener('click', () => {
      this.handleVisualize(factor1Input, factor2Input, resultDiv);
    });

    calculateBtn.addEventListener('click', () => {
      this.handleCalculate(resultDiv);
    });

    // Mode switching handlers
    if (recipeModeBtn) {
      recipeModeBtn.addEventListener('click', () => {
        this.switchToRecipeMode();
      });
    }

    if (backToBasicBtn) {
      backToBasicBtn.addEventListener('click', () => {
        this.switchToBasicMode();
      });
    }

    // Recipe scaling handlers
    if (visualizeScalingBtn) {
      visualizeScalingBtn.addEventListener('click', () => {
        this.recipeScalingScene.visualizeScaling();
      });
    }

    if (showScaledRecipeBtn) {
      showScaledRecipeBtn.addEventListener('click', () => {
        this.recipeScalingScene.showScaledRecipe();
      });
    }

    // Handle zoom slider
    this.zoomSlider.addEventListener('input', (e) => {
      if (this.isUpdatingSlider) return;
      
      const target = e.target as HTMLInputElement;
      const zoomLevel = parseFloat(target.value);
      this.zoomManager.setZoomLevel(zoomLevel, true);
    });

    // Handle Enter key in inputs
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.handleVisualize(factor1Input, factor2Input, resultDiv);
      }
    };
    
    if (factor1Input) factor1Input.addEventListener('keydown', handleEnter);
    if (factor2Input) factor2Input.addEventListener('keydown', handleEnter);
  }

  @action
  private switchToRecipeMode(): void {
    const basicPanel = document.querySelector('.ui-panel') as HTMLElement;
    const recipePanel = document.querySelector('.recipe-panel') as HTMLElement;
    
    if (basicPanel) basicPanel.style.display = 'none';
    if (recipePanel) recipePanel.style.display = 'block';
    
    this.recipeScalingScene.show();
  }

  @action
  private switchToBasicMode(): void {
    const basicPanel = document.querySelector('.ui-panel') as HTMLElement;
    const recipePanel = document.querySelector('.recipe-panel') as HTMLElement;
    
    if (basicPanel) basicPanel.style.display = 'block';
    if (recipePanel) recipePanel.style.display = 'none';
    
    this.recipeScalingScene.hide();
  }

  private setupZoomSync(): void {
    // Create callback for zoom changes
    this.zoomCallback = (zoomLevel: number) => {
      // Update slider without triggering its input event
      if (this.zoomSlider) {
        this.isUpdatingSlider = true;
        this.zoomSlider.value = zoomLevel.toString();
        // Use setTimeout to reset the flag after the event loop
        setTimeout(() => {
          this.isUpdatingSlider = false;
        }, 0);
      }
      
      // Update zoom display
      if (this.zoomValue) {
        this.zoomValue.textContent = `${zoomLevel.toFixed(1)}x`;
      }
      
      // Update cube numbers visibility
      if (this.cubeGrid) {
        this.cubeGrid.updateNumberVisibility();
      }
    };
    
    // Register the callback
    this.zoomManager.onZoomChange(this.zoomCallback);
    
    // Initial sync
    this.zoomCallback(this.zoomManager.zoomLevel);
  }

  @action
  private handleVisualize(
    factor1Input: HTMLInputElement, 
    factor2Input: HTMLInputElement,
    resultDiv: HTMLDivElement
  ): void {
    const factor1 = this.multiplicationService.validateInput(factor1Input.value);
    const factor2 = this.multiplicationService.validateInput(factor2Input.value);

    if (factor1 === null || factor2 === null) {
      alert('Please enter valid numbers between 1 and 20');
      return;
    }

    // Hide result display
    resultDiv.style.display = 'none';
    this.multiplicationService.hideResult();

    // Create new problem
    const problem = this.multiplicationService.createProblem(factor1, factor2);
    
    // Clear existing cubes
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
    }

    // Create new cube grid
    this.cubeGrid = container.get<CubeGrid>(CubeGrid);
    const dimensions = this.multiplicationService.getVisualizationDimensions(problem);
    this.cubeGrid.createGrid(dimensions.rows, dimensions.columns);
  }

  @action
  private handleCalculate(resultDiv: HTMLDivElement): void {
    const problem = this.multiplicationService.currentProblem;
    
    if (!problem) {
      alert('Please create a visualization first by clicking "Show Cubes"');
      return;
    }

    this.multiplicationService.showResult();
    const resultText = this.multiplicationService.formatResult(problem);
    
    resultDiv.textContent = resultText;
    resultDiv.style.display = 'block';
  }

  public destroy(): void {
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
    }
    
    if (this.zoomCallback) {
      this.zoomManager.removeZoomChangeCallback(this.zoomCallback);
    }
    
    this.gestureHandler.unmount();
    this.zoomManager.destroy();
    this.sceneManager.unmount();
    this._isInitialized = false;
  }
}