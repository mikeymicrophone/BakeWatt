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
import { MultiStepRecipeLibrary } from '@/domain/baking';

export class Application {
  @observable private _isInitialized: boolean = false;
  @observable private _gameState: GameState;
  @observable private _currentTab: string = 'math';
  
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
    this.setupTabNavigation();
    this.setupRecipeDetailsModal();
    this.populateRecipeCollection();
    
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
    
    // Make app instance globally accessible for recipe details
    (window as any).appInstance = this;
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


  private setupTabNavigation(): void {
    const mathTab = document.getElementById('math-tab') as HTMLButtonElement;
    const transferTab = document.getElementById('transfer-tab') as HTMLButtonElement;
    const recipesTab = document.getElementById('recipes-tab') as HTMLButtonElement;

    if (!mathTab || !transferTab || !recipesTab) {
      throw new Error('Tab navigation elements not found');
    }

    mathTab.addEventListener('click', () => this.switchToTab('math'));
    transferTab.addEventListener('click', () => this.switchToTab('transfer'));
    recipesTab.addEventListener('click', () => this.switchToTab('recipes'));
  }

  @action
  private switchToTab(tabName: string): void {
    console.log(`🎯 Switching to ${tabName} tab`);
    
    // Update current tab
    this._currentTab = tabName;
    
    // Update tab buttons
    const allTabs = document.querySelectorAll('.tab-button');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) activeTab.classList.add('active');
    
    // Show/hide panels
    const mathPanel = document.getElementById('math-panel');
    const transferPanel = document.getElementById('transfer-panel');
    const recipePanel = document.getElementById('recipe-collection-panel');
    
    if (mathPanel) mathPanel.style.display = tabName === 'math' ? 'block' : 'none';
    if (transferPanel) transferPanel.style.display = tabName === 'transfer' ? 'block' : 'none';
    if (recipePanel) recipePanel.style.display = tabName === 'recipes' ? 'block' : 'none';
    
    // Clear any existing cubes when switching tabs
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
      this.cubeGrid = null;
    }
    
    // Handle scene-specific logic
    if (tabName === 'transfer') {
      this.subtractionMathScene.setGameState(this._gameState);
      this.subtractionMathScene.show();
    } else {
      this.subtractionMathScene.hide();
    }
  }

  private populateRecipeCollection(): void {
    const recipeGrid = document.getElementById('recipe-grid');
    if (!recipeGrid) return;
    
    const recipes = MultiStepRecipeLibrary.getAllRecipes();
    
    recipeGrid.innerHTML = '';
    
    recipes.forEach(recipe => {
      const recipeCard = document.createElement('div');
      recipeCard.className = 'recipe-card';
      
      const overview = recipe.getOverview();
      const stepsList = recipe.steps.map((step, index) => 
        `<li class="step-item"><span class="step-number">${index + 1}.</span>${step.name}</li>`
      ).join('');
      
      recipeCard.innerHTML = `
        <div class="recipe-header">
          <div class="recipe-icon">${recipe.icon}</div>
          <h3 class="recipe-title">${recipe.name}</h3>
        </div>
        
        <div class="recipe-meta">
          <span>⏱️ ${overview.totalTime} min</span>
          <span>👥 ${overview.servings} servings</span>
          <span>📊 ${overview.difficulty}</span>
        </div>
        
        <div class="recipe-description">
          ${recipe.description}
        </div>
        
        <div class="recipe-tags">
          ${overview.tags.map(tag => `<span class="recipe-tag">${tag}</span>`).join('')}
        </div>
        
        <div class="recipe-steps">
          <h4>Steps (${overview.totalSteps})</h4>
          <ul class="step-list">
            ${stepsList}
          </ul>
        </div>
        
        <div class="recipe-actions">
          <button class="btn-recipe primary" onclick="console.log('Start cooking ${recipe.name}')">
            Start Cooking
          </button>
          <button class="btn-recipe secondary" data-recipe-id="${recipe.id}" onclick="window.appInstance.showRecipeDetails('${recipe.id}')">
            View Details
          </button>
        </div>
      `;
      
      recipeGrid.appendChild(recipeCard);
    });
  }

  public get currentTab(): string {
    return this._currentTab;
  }

  private setupRecipeDetailsModal(): void {
    const modal = document.getElementById('recipe-details-modal');
    const closeBtn = document.getElementById('recipe-details-close');
    
    if (!modal || !closeBtn) {
      throw new Error('Recipe details modal elements not found');
    }

    // Close modal when clicking close button
    closeBtn.addEventListener('click', () => {
      this.hideRecipeDetails();
    });

    // Close modal when clicking outside the content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideRecipeDetails();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        this.hideRecipeDetails();
      }
    });
  }

  @action
  public showRecipeDetails(recipeId: string): void {
    const recipe = MultiStepRecipeLibrary.getRecipeById(recipeId);
    if (!recipe) {
      console.error(`Recipe not found: ${recipeId}`);
      return;
    }

    console.log(`🍽️ Showing details for recipe: ${recipe.name}`);

    // Update modal content
    this.populateRecipeDetailsModal(recipe);

    // Show modal
    const modal = document.getElementById('recipe-details-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  @action
  public hideRecipeDetails(): void {
    const modal = document.getElementById('recipe-details-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private populateRecipeDetailsModal(recipe: any): void {
    // Update header
    const iconEl = document.getElementById('recipe-details-icon');
    const titleEl = document.getElementById('recipe-details-title');
    const metaEl = document.getElementById('recipe-details-meta');
    const descriptionEl = document.getElementById('recipe-details-description');
    const ingredientsEl = document.getElementById('recipe-details-ingredients');
    const stepsEl = document.getElementById('recipe-details-steps');

    if (iconEl) iconEl.textContent = recipe.icon;
    if (titleEl) titleEl.textContent = recipe.name;
    if (descriptionEl) descriptionEl.textContent = recipe.description;

    // Update meta information
    if (metaEl) {
      const overview = recipe.getOverview();
      metaEl.innerHTML = `
        <span>⏱️ ${overview.totalTime} minutes</span>
        <span>👥 ${overview.servings} servings</span>
        <span>📊 ${overview.difficulty}</span>
        <span>📋 ${overview.totalSteps} steps</span>
        ${recipe.skillLevel ? `<span>🎯 ${recipe.skillLevel}</span>` : ''}
      `;
    }

    // Populate ingredients by step
    if (ingredientsEl) {
      let ingredientsHTML = '';
      
      recipe.steps.forEach((step: any, index: number) => {
        if (step.ingredients.length > 0) {
          ingredientsHTML += `
            <div class="ingredients-by-step">
              <div class="step-ingredients-header">
                Step ${index + 1}: ${step.name}
              </div>
              <div class="step-ingredients-list">
          `;
          
          step.ingredients.forEach((flexIngredient: any) => {
            const ingredient = flexIngredient.ingredient;
            let amountDisplay = '';
            let amountClass = 'ingredient-amount';
            let notes = '';
            
            if (flexIngredient.isFixed) {
              amountDisplay = `${flexIngredient.fixedAmount} ${ingredient.unit}`;
            } else if (flexIngredient.range) {
              amountClass += ' flexible';
              const range = flexIngredient.range;
              amountDisplay = `${range.min}-${range.max} ${ingredient.unit} (recommended: ${range.recommended})`;
              if (flexIngredient.notes) {
                notes = `<div class="ingredient-notes">${flexIngredient.notes}</div>`;
              }
            }
            
            ingredientsHTML += `
              <div class="ingredient-item">
                <div>
                  <div class="ingredient-name">
                    <span>${ingredient.icon}</span>
                    <span>${ingredient.name}</span>
                  </div>
                  ${notes}
                </div>
                <div class="${amountClass}">${amountDisplay}</div>
              </div>
            `;
          });
          
          ingredientsHTML += `
              </div>
            </div>
          `;
        }
      });
      
      ingredientsEl.innerHTML = ingredientsHTML;
    }

    // Populate detailed steps
    if (stepsEl) {
      let stepsHTML = '';
      
      recipe.steps.forEach((step: any, index: number) => {
        const instructionsList = step.instructions.map((instruction: string) => 
          `<li>${instruction}</li>`
        ).join('');
        
        stepsHTML += `
          <div class="detailed-step">
            <div class="detailed-step-header">
              <h4 class="detailed-step-title">${index + 1}. ${step.name}</h4>
              ${step.estimatedTime ? `<span class="detailed-step-time">⏱️ ${step.estimatedTime} min</span>` : ''}
            </div>
            ${step.description ? `<div class="detailed-step-description">${step.description}</div>` : ''}
            <ul class="detailed-step-instructions">
              ${instructionsList}
            </ul>
            ${step.temperature ? `<div class="detailed-step-description"><strong>Temperature:</strong> ${step.temperature}°F</div>` : ''}
          </div>
        `;
      });
      
      stepsEl.innerHTML = stepsHTML;
    }
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