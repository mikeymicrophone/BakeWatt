import { observable, action } from 'mobx';
import { SceneManager } from './SceneManager';
import { CameraZoomManager } from './CameraZoomManager';
import { CubeGrid } from '@/presentation/components/CubeGrid';
import { GestureHandler } from '@/presentation/ui/GestureHandler';
import { MultiplicationService } from '@/core/math/MultiplicationService';
import { IngredientService } from '@/domain/inventory';
import { RecipeService } from '@/domain/baking';
import { RecipeScalingScene } from '@/presentation/scenes/RecipeScalingScene';
import { SubtractionMathScene } from '@/presentation/scenes/SubtractionMathScene';
import { container } from '@/shared/container';
import { testIngredientSystem } from '@/domain/inventory/demo';
import { testRecipeSystem } from '@/domain/baking/demo';
import { GameState, GameStateFactory } from '@/domain/progression';

export class Application {
  @observable private _isInitialized: boolean = false;
  @observable private _gameState: GameState;
  
  private sceneManager: SceneManager;
  private zoomManager: CameraZoomManager;
  private gestureHandler: GestureHandler;
  private multiplicationService: MultiplicationService;
  private ingredientService: IngredientService;
  private recipeService: RecipeService;
  private recipeScalingScene: RecipeScalingScene;
  private subtractionMathScene: SubtractionMathScene;
  private cubeGrid: CubeGrid | null = null;
  private zoomSlider: HTMLInputElement | null = null;
  private zoomValue: HTMLSpanElement | null = null;
  private isUpdatingSlider: boolean = false;
  private zoomCallback: ((level: number) => void) | null = null;

  constructor() {
    // Initialize game state first
    this._gameState = GameStateFactory.createInitialGameState();
    
    this.sceneManager = container.get<SceneManager>(SceneManager);
    this.zoomManager = container.get<CameraZoomManager>(CameraZoomManager);
    this.gestureHandler = container.get<GestureHandler>(GestureHandler);
    this.multiplicationService = container.get<MultiplicationService>(MultiplicationService);
    this.ingredientService = container.get<IngredientService>(IngredientService);
    this.recipeService = container.get<RecipeService>(RecipeService);
    this.recipeScalingScene = container.get<RecipeScalingScene>(RecipeScalingScene);
    this.subtractionMathScene = container.get<SubtractionMathScene>(SubtractionMathScene);
  }

  @action
  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    const threeContainer = document.getElementById('three-container');
    if (!threeContainer) {
      throw new Error('Three.js container not found');
    }

    this.sceneManager.mount(threeContainer);
    this.gestureHandler.mount(threeContainer);
    this.setupUI();
    this.setupZoomSync();
    
    // Initialize game state
    console.log('🎮 BakeWatt Game State Initialized!');
    console.log('📦 Pantry:', {
      flour: this._gameState.pantry.getStock('flour') + ' cups',
      butter: this._gameState.pantry.getStock('butter') + ' sticks', 
      eggs: this._gameState.pantry.getStock('eggs') + ' pieces'
    });
    console.log('📚 Recipes:', this._gameState.recipes.recipeCount + ' available');
    console.log('🎯 Level:', this._gameState.currentLevel);
    console.log('📖 Tutorial completed:', this._gameState.tutorialCompleted);
    
    
    // Validate initial state
    const validation = GameStateFactory.validateInitialGameState(this._gameState);
    if (validation.isValid) {
      console.log('✅ Initial game state validation passed');
    } else {
      console.warn('⚠️ Game state validation issues:', validation.errors);
    }
    
    // Test systems (legacy demos)
    console.log('\n🧪 Testing Legacy Systems...');
    testIngredientSystem();
    testRecipeSystem();
    
    this._isInitialized = true;
  }

  public get gameState(): GameState {
    return this._gameState;
  }

  private setupUI(): void {
    // Basic math UI elements
    const visualizeBtn = document.getElementById('visualize-btn') as HTMLButtonElement;
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
    const factor1Input = document.getElementById('factor1') as HTMLInputElement;
    const factor2Input = document.getElementById('factor2') as HTMLInputElement;
    const resultDiv = document.getElementById('result') as HTMLDivElement;
    const transferModeBtn = document.getElementById('transfer-mode-btn') as HTMLButtonElement;
    const backFromTransferBtn = document.getElementById('back-from-transfer-btn') as HTMLButtonElement;
    
    // Common UI elements
    this.zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement;
    this.zoomValue = document.getElementById('zoom-value') as HTMLSpanElement;

    if (!visualizeBtn || !calculateBtn || !this.zoomSlider || !this.zoomValue) {
      throw new Error('Required UI elements not found');
    }

    // Basic math mode handlers
    visualizeBtn.addEventListener('click', () => {
      console.log('🎯 Show Cubes button clicked');
      try {
        this.handleVisualize(factor1Input, factor2Input, resultDiv);
        console.log('✅ Visualization completed successfully');
      } catch (error) {
        console.error('❌ Error in handleVisualize:', error);
        alert('Error creating visualization: ' + (error instanceof Error ? error.message : String(error)));
      }
    });

    calculateBtn.addEventListener('click', () => {
      console.log('🎯 Show Result button clicked');
      try {
        this.handleCalculate(resultDiv);
        console.log('✅ Result calculation completed successfully');
      } catch (error) {
        console.error('❌ Error in handleCalculate:', error);
        alert('Error calculating result: ' + (error instanceof Error ? error.message : String(error)));
      }
    });

    // Mode switching handlers
    if (transferModeBtn) {
      transferModeBtn.addEventListener('click', () => {
        console.log('🎯 Transfer Mode button clicked');
        try {
          this.switchToTransferMode();
          console.log('✅ Switched to transfer mode successfully');
        } catch (error) {
          console.error('❌ Error switching to transfer mode:', error);
          alert('Error switching to transfer mode: ' + (error instanceof Error ? error.message : String(error)));
        }
      });
    }

    if (backFromTransferBtn) {
      backFromTransferBtn.addEventListener('click', () => {
        this.switchToBasicMode();
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
  private switchToTransferMode(): void {
    const basicPanel = document.querySelector('.ui-panel') as HTMLElement;
    const transferPanel = document.querySelector('.transfer-panel') as HTMLElement;
    
    if (basicPanel) basicPanel.style.display = 'none';
    if (transferPanel) transferPanel.style.display = 'block';
    
    // Clear any existing cubes from previous calculations
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
      this.cubeGrid = null;
    }
    
    // Pass gameState to the scene
    this.subtractionMathScene.setGameState(this._gameState);
    this.subtractionMathScene.show();
  }

  @action
  private switchToBasicMode(): void {
    const basicPanel = document.querySelector('.ui-panel') as HTMLElement;
    const transferPanel = document.querySelector('.transfer-panel') as HTMLElement;
    
    if (basicPanel) basicPanel.style.display = 'block';
    if (transferPanel) transferPanel.style.display = 'none';
    
    // Clear any existing cubes from previous calculations
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
      this.cubeGrid = null;
    }
    
    this.subtractionMathScene.hide();
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