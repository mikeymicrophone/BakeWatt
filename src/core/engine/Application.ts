import { observable, action } from 'mobx';
import { SceneManager } from './SceneManager';
import { CameraZoomManager } from './CameraZoomManager';
import { CubeGrid } from '@/presentation/components/CubeGrid';
import { GestureHandler } from '@/presentation/ui/GestureHandler';
import { MultiplicationService } from '@/core/math/MultiplicationService';
import { MathService } from '@/core/math/MathService';
import { IngredientService } from '@/domain/inventory';
import { RecipeService } from '@/domain/baking';
import { RecipeScalingScene } from '@/presentation/scenes/RecipeScalingScene';
import { SubtractionMathScene } from '@/presentation/scenes/SubtractionMathScene';
import { container } from '@/shared/container';
import { testIngredientSystem } from '@/domain/inventory/demo';
import { testRecipeSystem } from '@/domain/baking/demo';
import { GameState, GameStateFactory } from '@/domain/progression';
import { MultiStepRecipeLibrary } from '@/domain/baking';
import { StorageService } from '@/core/storage/StorageService';

export class Application {
  @observable private _isInitialized: boolean = false;
  @observable private _gameState: GameState;
  @observable private _currentTab: string = 'math';
  @observable private _currentRecipe: any | null = null;
  @observable private _currentStep: number = 0;
  @observable private _bakingCounter: Map<string, number> = new Map();
  @observable private _productionData = {
    initialItems: 2,
    piecesPerItem: 24,
    piecesPerPackage: 4
  };
  @observable private _supplierStats = {
    todaysOrders: 0,
    bulkSavings: 0.00
  };
  @observable private _recipeScalings: Map<string, {
    currentServings: number;
    originalServings: number;
    scalingFactor: number;
    previousServings: number;
    lastScaleMultiplier: number;
  }> = new Map();
  @observable private _currentRecipeScalingFactor: number = 1;
  @observable private _advancedMode: boolean = false;
  
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
    // Initialize game state first - try to load saved state
    this._gameState = this.initializeGameState();
    
    this.sceneManager = container.get<SceneManager>(SceneManager);
    this.zoomManager = container.get<CameraZoomManager>(CameraZoomManager);
    this.gestureHandler = container.get<GestureHandler>(GestureHandler);
    this.multiplicationService = container.get<MultiplicationService>(MultiplicationService);
    this.ingredientService = container.get<IngredientService>(IngredientService);
    this.recipeService = container.get<RecipeService>(RecipeService);
    this.recipeScalingScene = container.get<RecipeScalingScene>(RecipeScalingScene);
    this.subtractionMathScene = container.get<SubtractionMathScene>(SubtractionMathScene);
  }

  private initializeGameState(): GameState {
    // Try to load saved game state
    const savedData = StorageService.loadGameState();
    
    if (savedData) {
      // Create initial state and apply saved data
      const gameState = GameStateFactory.createInitialGameState();
      StorageService.applySaveData(gameState, savedData);
      
      console.log('🔄 Loaded saved game state');
      return gameState;
    } else {
      // No saved data, create fresh state
      console.log('🆕 Starting new game');
      return GameStateFactory.createInitialGameState();
    }
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
    this.setupCookingInterface();
    this.setupProductionInterface();
    this.setupStoreInterface();
    this.setupSupplierInterface();
    this.setupRecipeControls();
    this.populateRecipeCollection();
    
    // Make app instance globally accessible early
    (window as any).appInstance = this;
    
    // Set up global modal handlers
    this.setupGlobalModalHandlers();
    
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
    
    // Set up auto-save functionality
    this.setupAutoSave();
    
    this._isInitialized = true;
  }

  private setupAutoSave(): void {
    // Auto-save every 30 seconds
    setInterval(() => {
      if (this._isInitialized) {
        StorageService.autoSave(this._gameState);
      }
    }, 30000);

    // Save on page unload/refresh
    window.addEventListener('beforeunload', () => {
      StorageService.saveGameState(this._gameState);
    });

    // Save on tab visibility change (user switches tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this._isInitialized) {
        StorageService.saveGameState(this._gameState);
      }
    });
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
    const supplierTab = document.getElementById('supplier-tab') as HTMLButtonElement;
    const storeTab = document.getElementById('store-tab') as HTMLButtonElement;

    if (!mathTab || !transferTab || !recipesTab || !supplierTab || !storeTab) {
      throw new Error('Tab navigation elements not found');
    }

    mathTab.addEventListener('click', () => this.switchToTab('math'));
    transferTab.addEventListener('click', () => this.switchToTab('transfer'));
    recipesTab.addEventListener('click', () => this.switchToTab('recipes'));
    supplierTab.addEventListener('click', () => this.switchToTab('supplier'));
    storeTab.addEventListener('click', () => this.switchToTab('store'));
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
    const cookingPanel = document.getElementById('cooking-step-panel');
    const supplierPanel = document.getElementById('supplier-panel');
    const storePanel = document.getElementById('store-panel');
    
    if (mathPanel) mathPanel.style.display = tabName === 'math' ? 'block' : 'none';
    if (transferPanel) transferPanel.style.display = tabName === 'transfer' ? 'block' : 'none';
    if (recipePanel) recipePanel.style.display = tabName === 'recipes' ? 'block' : 'none';
    if (supplierPanel) supplierPanel.style.display = tabName === 'supplier' ? 'block' : 'none';
    if (storePanel) storePanel.style.display = tabName === 'store' ? 'block' : 'none';
    if (cookingPanel && tabName !== 'cooking') cookingPanel.style.display = 'none';
    
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
    
    if (tabName === 'store') {
      this.updateStoreDisplay();
    }
    
    if (tabName === 'supplier') {
      this.updateSupplierDisplay();
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
      
      // Get recipe-specific scaling
      const recipeScaling = this.getRecipeScaling(recipe.id);
      
      // Check if recipe can be made at current scaling
      const canMakeRecipe = this.canMakeRecipeAtCurrentScale(recipe);
      const buttonClass = canMakeRecipe ? 'btn-recipe primary' : 'btn-recipe unavailable';
      const buttonText = canMakeRecipe ? 'Start Cooking' : 'Need More Ingredients';
      
      recipeCard.innerHTML = `
        <div class="recipe-header">
          <div class="recipe-icon">${recipe.icon}</div>
          <h3 class="recipe-title">${recipe.name}</h3>
        </div>
        
        <div class="recipe-meta">
          <span>⏱️ ${overview.totalTime} min</span>
          <span>👥 ${recipeScaling.scalingFactor === 1 ? `${overview.servings} servings` : `${recipeScaling.currentServings} servings (${recipeScaling.scalingFactor}x)`}</span>
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
          <button class="${buttonClass}" onclick="window.appInstance.startCooking('${recipe.id}')" ${canMakeRecipe ? '' : 'disabled'}>
            ${buttonText}
          </button>
          <button class="btn-recipe secondary" data-recipe-id="${recipe.id}" onclick="window.appInstance.showRecipeDetails('${recipe.id}')">
            View Details
          </button>
        </div>
      `;
      
      recipeGrid.appendChild(recipeCard);
    });
  }

  private canMakeRecipeAtCurrentScale(recipe: any): boolean {
    try {
      // Get recipe-specific scaling
      const recipeScaling = this.getRecipeScaling(recipe.id);
      
      // Get current pantry stock
      const pantryStock = this._gameState.pantry.getAllStock();
      
      // Get all ingredients needed for this recipe at current scale
      const scaledNutrition = recipe.calculateScaledNutrition(recipeScaling.currentServings);
      
      // Check each step for required ingredients
      for (const step of recipe.steps) {
        for (const flexIngredient of step.ingredients) {
          const ingredient = flexIngredient.ingredient;
          const baseAmount = flexIngredient.getAmount();
          
          // Scale the required amount based on recipe-specific scaling factor
          const scaledAmount = baseAmount * recipeScaling.scalingFactor;
          
          // Get available stock for this ingredient
          const availableAmount = this._gameState.pantry.getStock(ingredient.id);
          
          // Check if we have enough
          if (availableAmount < scaledAmount) {
            console.log(`❌ Not enough ${ingredient.name}: need ${scaledAmount} ${ingredient.defaultUnit}, have ${availableAmount}`);
            return false;
          }
        }
      }
      
      console.log(`✅ Can make ${recipe.name} at ${recipeScaling.scalingFactor}x scale`);
      return true;
    } catch (error) {
      console.error('Error checking recipe availability:', error);
      return false; // Default to unavailable if there's an error
    }
  }

  public get currentTab(): string {
    return this._currentTab;
  }

  public get advancedMode(): boolean {
    return this._advancedMode;
  }

  private getRecipeScaling(recipeId: string): {
    currentServings: number;
    originalServings: number;
    scalingFactor: number;
    previousServings: number;
    lastScaleMultiplier: number;
  } {
    if (!this._recipeScalings.has(recipeId)) {
      // Initialize scaling for this recipe with default values
      const recipe = MultiStepRecipeLibrary.getRecipeById(recipeId);
      const baseServings = recipe ? recipe.getOverview().servings : 2;
      
      this._recipeScalings.set(recipeId, {
        currentServings: baseServings,
        originalServings: baseServings,
        scalingFactor: 1,
        previousServings: baseServings,
        lastScaleMultiplier: 1
      });
    }
    
    return this._recipeScalings.get(recipeId)!;
  }

  @action
  public setAdvancedMode(enabled: boolean): void {
    this._advancedMode = enabled;
    console.log(`🔢 Advanced mode ${enabled ? 'enabled' : 'disabled'} - ${enabled ? 'showing' : 'hiding'} decimal places`);
    
    // Refresh displays to show/hide decimals
    this.refreshCurrentDisplays();
  }

  @action
  public toggleAdvancedMode(): void {
    this.setAdvancedMode(!this._advancedMode);
  }

  private updateAdvancedModeButton(button: HTMLElement): void {
    if (this._advancedMode) {
      button.textContent = '🔢 Basic Mode';
      button.classList.add('active');
      button.title = 'Switch to basic mode (hide decimal places)';
    } else {
      button.textContent = '🔢 Advanced Mode';
      button.classList.remove('active');
      button.title = 'Switch to advanced mode (show decimal places)';
    }
  }

  /**
   * Format numbers based on advanced mode setting
   * Advanced mode: shows decimals (e.g., 1.5, 2.75)
   * Basic mode: rounds to whole numbers (e.g., 2, 3)
   */
  private formatAmount(amount: number): string {
    if (this._advancedMode) {
      // Show up to 1 decimal place, remove trailing zeros
      return (Math.round(amount * 10) / 10).toString();
    } else {
      // Round to nearest whole number for basic mode
      return Math.round(amount).toString();
    }
  }

  private refreshCurrentDisplays(): void {
    // Refresh recipe details modal if open
    const modal = document.getElementById('recipe-details-modal');
    if (modal && modal.style.display === 'flex') {
      const recipe = this.getCurrentRecipeFromModal();
      if (recipe) {
        this.populateRecipeDetailsModal(recipe);
      }
    }

    // Refresh cooking interface if active
    if (this._currentRecipe && this._currentStep > 0) {
      this.showCookingStep();
    }

    // Refresh production interface if active
    const productionPanel = document.getElementById('production-panel');
    if (productionPanel && productionPanel.style.display !== 'none') {
      this.updateProductionStep();
    }
  }

  private setupRecipeDetailsModal(): void {
    const modal = document.getElementById('recipe-details-modal');
    const closeBtn = document.getElementById('recipe-details-close');
    
    console.log('Setting up recipe details modal:', { modal: !!modal, closeBtn: !!closeBtn });
    
    if (!modal || !closeBtn) {
      console.error('Recipe details modal elements not found:', { modal: !!modal, closeBtn: !!closeBtn });
      return;
    }

    // Close modal when clicking close button
    closeBtn.addEventListener('click', () => {
      console.log('Recipe details close button clicked');
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

    // Recipe scaling controls
    const doubleBtn = document.getElementById('btn-double-recipe');
    const halveBtn = document.getElementById('btn-halve-recipe');
    const resetBtn = document.getElementById('btn-reset-recipe');

    if (doubleBtn) {
      doubleBtn.addEventListener('click', () => {
        this.scaleRecipe(2);
      });
    }

    if (halveBtn) {
      halveBtn.addEventListener('click', () => {
        this.scaleRecipe(0.5);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetRecipeScaling();
      });
    }
  }

  @action
  public showRecipeDetails(recipeId: string): void {
    const recipe = MultiStepRecipeLibrary.getRecipeById(recipeId);
    if (!recipe) {
      console.error(`Recipe not found: ${recipeId}`);
      return;
    }

    console.log(`🍽️ Showing details for recipe: ${recipe.name}`);

    // Update modal content (preserve existing scaling)
    this.populateRecipeDetailsModal(recipe);

    // Show modal
    const modal = document.getElementById('recipe-details-modal');
    if (modal) {
      console.log('Recipe modal element found, showing');
      modal.style.setProperty('display', 'flex', 'important');
      console.log('Modal display style set to:', modal.style.display);
    } else {
      console.log('Recipe modal element not found');
    }
  }

  @action
  public hideRecipeDetails(): void {
    console.log('hideRecipeDetails called');
    const modal = document.getElementById('recipe-details-modal');
    if (modal) {
      console.log('Hiding recipe details modal');
      modal.style.setProperty('display', 'none', 'important');
      console.log('Modal display style set to:', modal.style.display);
    } else {
      console.log('Modal element not found');
    }
  }

  @action
  public scaleRecipe(scalingMultiplier: number): void {
    const recipe = this.getCurrentRecipeFromModal();
    if (!recipe) {
      console.error('No recipe found to scale');
      return;
    }
    
    const recipeScaling = this.getRecipeScaling(recipe.id);
    
    // Store previous state for equation display
    recipeScaling.previousServings = recipeScaling.currentServings;
    recipeScaling.lastScaleMultiplier = scalingMultiplier;
    
    // Update scaling factor by multiplying current factor
    recipeScaling.scalingFactor *= scalingMultiplier;
    recipeScaling.currentServings = Math.round(recipeScaling.originalServings * recipeScaling.scalingFactor);
    
    console.log(`🔢 Recipe ${recipe.name} scaled by ${scalingMultiplier}x. Current servings: ${recipeScaling.currentServings}, Factor: ${recipeScaling.scalingFactor}`);
    
    this.updateRecipeScalingDisplay();
    this.updateIngredientAmounts();
    this.populateRecipeCollection(); // Update recipe collection to show new scale
  }

  @action
  public resetRecipeScaling(): void {
    const recipe = this.getCurrentRecipeFromModal();
    if (!recipe) {
      console.error('No recipe found to reset scaling');
      return;
    }
    
    const recipeScaling = this.getRecipeScaling(recipe.id);
    
    recipeScaling.scalingFactor = 1;
    recipeScaling.currentServings = recipeScaling.originalServings;
    recipeScaling.previousServings = recipeScaling.originalServings;
    recipeScaling.lastScaleMultiplier = 1;
    
    console.log(`🔄 Recipe ${recipe.name} scaling reset. Current servings: ${recipeScaling.currentServings}`);
    
    this.updateRecipeScalingDisplay();
    this.updateIngredientAmounts();
    this.populateRecipeCollection(); // Update recipe collection to show reset scale
  }

  private updateRecipeScalingDisplay(): void {
    const recipe = this.getCurrentRecipeFromModal();
    if (!recipe) {
      console.log('⚠️ No recipe found for scaling display update');
      return;
    }
    
    const recipeScaling = this.getRecipeScaling(recipe.id);
    
    console.log('🔄 updateRecipeScalingDisplay called for', recipe.name, ':', {
      currentServings: recipeScaling.currentServings,
      scalingFactor: recipeScaling.scalingFactor,
      previousServings: recipeScaling.previousServings,
      lastScaleMultiplier: recipeScaling.lastScaleMultiplier
    });
    
    const currentServingsEl = document.getElementById('current-servings');
    const scalingMathEl = document.getElementById('scaling-math-display');
    const scalingEquationEl = document.getElementById('scaling-equation');
    const scalingExplanationEl = document.getElementById('scaling-explanation');
    
    if (currentServingsEl) {
      currentServingsEl.textContent = recipeScaling.currentServings.toString();
      console.log('✅ Updated current servings display to:', recipeScaling.currentServings);
    } else {
      console.log('⚠️ current-servings element not found');
    }
    
    if (scalingMathEl && scalingEquationEl) {
      if (recipeScaling.scalingFactor !== 1) {
        scalingMathEl.style.display = 'block';
        const equation = `${recipeScaling.originalServings} servings × ${recipeScaling.scalingFactor} = ${recipeScaling.currentServings} servings`;
        scalingEquationEl.textContent = equation;
        
        // Update the explanation text too
        if (scalingExplanationEl) {
          scalingExplanationEl.textContent = `All ingredient amounts will be multiplied by ${recipeScaling.scalingFactor}`;
        }
        
        console.log('✅ Updated scaling equation:', equation);
      } else {
        scalingMathEl.style.display = 'none';
        console.log('✅ Hiding scaling equation (factor = 1)');
      }
    } else {
      console.log('⚠️ scaling math elements not found:', {
        scalingMathEl: !!scalingMathEl,
        scalingEquationEl: !!scalingEquationEl,
        scalingExplanationEl: !!scalingExplanationEl
      });
    }
  }

  private updateIngredientAmounts(): void {
    const recipe = this.getCurrentRecipeFromModal();
    if (recipe) {
      this.populateRecipeDetailsModal(recipe);
    }
  }

  private getCurrentRecipeFromModal(): any {
    const titleEl = document.getElementById('recipe-details-title');
    if (!titleEl) return null;
    
    const recipeName = titleEl.textContent;
    return MultiStepRecipeLibrary.getAllRecipes().find(recipe => recipe.name === recipeName);
  }

  private populateRecipeDetailsModal(recipe: any): void {
    // Get recipe-specific scaling
    const recipeScaling = this.getRecipeScaling(recipe.id);
    const overview = recipe.getOverview();
    
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
      const productionInfo = this.getRecipeProductionInfo(recipe);
      
      // Calculate nutrition for current scaling
      const nutrition = recipe.calculateScaledNutrition(recipeScaling.currentServings);
      
      metaEl.innerHTML = `
        <span>⏱️ ${overview.totalTime} minutes</span>
        <span>👥 ${recipeScaling.currentServings} servings</span>
        <span>📊 ${overview.difficulty}</span>
        <span>📋 ${overview.totalSteps} steps</span>
        <span>🔥 ${nutrition.caloriesPerServing} cal/serving</span>
        <span>⚖️ Total: ${nutrition.totalCalories} calories</span>
        <span>🏭 Produces ${productionInfo.initialItems} ${productionInfo.itemName}</span>
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
            
            // Get required amount and apply scaling
            let requiredAmount = 0;
            if (flexIngredient.isFixed) {
              const scaledAmount = flexIngredient.fixedAmount * recipeScaling.scalingFactor;
              amountDisplay = `${this.formatAmount(scaledAmount)} ${ingredient.unit}`;
              requiredAmount = scaledAmount;
            } else if (flexIngredient.range) {
              amountClass += ' flexible';
              const range = flexIngredient.range;
              const scaledMin = range.min * recipeScaling.scalingFactor;
              const scaledMax = range.max * recipeScaling.scalingFactor;
              const scaledRecommended = (range.recommended || range.min) * recipeScaling.scalingFactor;
              amountDisplay = `${this.formatAmount(scaledMin)}-${this.formatAmount(scaledMax)} ${ingredient.unit} (recommended: ${this.formatAmount(scaledRecommended)})`;
              requiredAmount = scaledRecommended;
              if (flexIngredient.notes) {
                notes = `<div class="ingredient-notes">${flexIngredient.notes}</div>`;
              }
            }
            
            // Get pantry supply and calculate color
            const pantrySupply = this._gameState.pantry.getStock(ingredient.id);
            const supplyRatio = requiredAmount > 0 ? pantrySupply / requiredAmount : 0;
            let supplyClass = 'ingredient-supply insufficient';
            let supplyText = `${this.formatAmount(pantrySupply)} ${ingredient.unit}`;
            
            // Add calorie information
            const calories = flexIngredient.calculateCalories(requiredAmount);
            const calorieText = calories > 0 ? ` (${Math.round(calories)} cal)` : '';
            
            if (supplyRatio >= 2) {
              supplyClass = 'ingredient-supply abundant';
            } else if (supplyRatio >= 1) {
              supplyClass = 'ingredient-supply sufficient';
            } else {
              supplyClass = 'ingredient-supply insufficient';
            }
            
            ingredientsHTML += `
              <div class="ingredient-item">
                <div class="ingredient-content">
                  <div class="ingredient-name">
                    <span>${ingredient.icon}</span>
                    <span>${ingredient.name}</span>
                  </div>
                  ${notes}
                </div>
                <div class="ingredient-amounts">
                  <div class="${amountClass}">${amountDisplay}${calorieText}</div>
                  <div class="${supplyClass}">${supplyText} in pantry</div>
                </div>
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

    // Update recipe scaling display
    this.updateRecipeScalingDisplay();
    
  }

  private getRecipeProductionInfo(recipe: any): { initialItems: number; itemName: string } {
    // Default production values (this matches what we use in production interface)
    const defaultProduction = {
      initialItems: 2,
      itemName: recipe.name.toLowerCase().includes('cookies') ? 'trays' :
                recipe.name.toLowerCase().includes('brownies') ? 'pans' :
                recipe.name.toLowerCase().includes('muffins') ? 'dozens' :
                recipe.name.toLowerCase().includes('bread') ? 'loaves' :
                recipe.name.toLowerCase().includes('cake') ? 'cakes' : 'items'
    };

    // You could extend this to read from recipe metadata if available
    if (recipe.production) {
      return {
        initialItems: recipe.production.initialItems || defaultProduction.initialItems,
        itemName: recipe.production.itemName || defaultProduction.itemName
      };
    }

    return defaultProduction;
  }

  private setupGlobalModalHandlers(): void {
    // Use event delegation for dynamic content
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Recipe details close button is handled in setupRecipeDetailsModal, not here
    });
  }






  private setupCookingInterface(): void {
    const cancelBtn = document.getElementById('btn-cancel-cooking');
    const proceedBtn = document.getElementById('btn-proceed');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.cancelCooking();
      });
    }

    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        this.proceedToNextStep();
      });
    }
  }

  @action
  public startCooking(recipeId: string): void {
    const recipe = MultiStepRecipeLibrary.getRecipeById(recipeId);
    if (!recipe) {
      console.error(`Recipe not found: ${recipeId}`);
      return;
    }

    console.log(`🍳 Starting cooking: ${recipe.name}`);
    
    this._currentRecipe = recipe;
    
    // Store the current scaling factor from the recipe-specific scaling
    const recipeScaling = this.getRecipeScaling(recipe.id);
    this._currentRecipeScalingFactor = recipeScaling.scalingFactor;
    console.log(`🔢 Cooking with scaling factor: ${this._currentRecipeScalingFactor}x`);
    
    this._currentStep = 1;
    this._bakingCounter.clear();

    // Show cooking interface
    this.showCookingStep();
  }

  @action
  private showCookingStep(): void {
    if (!this._currentRecipe) return;

    const currentStep = this._currentRecipe.getStep(this._currentStep);
    if (!currentStep) return;

    // Hide other panels
    this.switchToTab('cooking');

    // Update cooking step display
    this.populateCookingStep(currentStep);

    // Show cooking panel
    const cookingPanel = document.getElementById('cooking-step-panel');
    if (cookingPanel) {
      cookingPanel.style.display = 'block';
    }
  }

  private populateCookingStep(step: any): void {
    // Update header
    const iconEl = document.getElementById('cooking-step-icon');
    const stepNameEl = document.getElementById('cooking-step-name');
    const recipeNameEl = document.getElementById('cooking-recipe-name');
    const stepTimeEl = document.getElementById('cooking-step-time');
    const stepNumberEl = document.getElementById('cooking-step-number');

    if (iconEl) iconEl.textContent = this._currentRecipe?.icon || '🍳';
    if (stepNameEl) stepNameEl.textContent = `Step ${this._currentStep}: ${step.name}`;
    if (recipeNameEl) recipeNameEl.textContent = this._currentRecipe?.name || '';
    if (stepTimeEl) stepTimeEl.textContent = step.estimatedTime ? `⏱️ ${step.estimatedTime} min` : '';
    if (stepNumberEl) stepNumberEl.textContent = `Step ${this._currentStep} of ${this._currentRecipe?.steps.length}`;

    // Update instructions
    const instructionsEl = document.getElementById('cooking-instructions');
    if (instructionsEl) {
      const instructionsHTML = step.instructions.map((instruction: string) =>
        `<li>${instruction}</li>`
      ).join('');
      instructionsEl.innerHTML = instructionsHTML;
    }

    // Update ingredient zones
    this.populateIngredientZones(step);

    // Update baking counter
    this.updateBakingCounter();

    // Update proceed button state
    this.updateProceedButton();
  }

  private populateIngredientZones(step: any): void {
    const zonesEl = document.getElementById('ingredient-zones-list');
    if (!zonesEl) return;

    let zonesHTML = '';

    step.ingredients.forEach((flexIngredient: any) => {
      const ingredient = flexIngredient.ingredient;
      const baseAmount = flexIngredient.isFixed ? 
        flexIngredient.fixedAmount : 
        flexIngredient.range?.recommended || flexIngredient.range?.min || 0;
      
      // Apply scaling factor from recipe details modal
      const neededAmount = baseAmount * this._currentRecipeScalingFactor;
      
      const availableInPantry = this._gameState.pantry.getStock(ingredient.id);
      const transferredAmount = this._bakingCounter.get(ingredient.id) || 0;
      const isTransferred = transferredAmount >= neededAmount;
      const canTransfer = availableInPantry >= neededAmount && !isTransferred;

      zonesHTML += `
        <div class="ingredient-zone ${isTransferred ? 'transferred' : 'needed'}">
          <div class="ingredient-zone-header">
            <div class="ingredient-zone-name">
              <span>${ingredient.icon}</span>
              <span>${ingredient.name}</span>
            </div>
            <div class="ingredient-zone-amount">${this.formatAmount(neededAmount)} ${ingredient.unit}</div>
          </div>
          <div class="ingredient-zone-status">
            ${isTransferred ? 
              '✅ Transferred to counter' : 
              `Available: ${availableInPantry} ${ingredient.unit}`
            }
          </div>
          <div class="ingredient-zone-transfer">
            <button class="btn-transfer" 
              ${canTransfer ? '' : 'disabled'} 
              onclick="window.appInstance.transferIngredient('${ingredient.id}', ${neededAmount})">
              ${isTransferred ? 'Transferred' : 'Transfer to Counter'}
            </button>
          </div>
        </div>
      `;
    });

    zonesEl.innerHTML = zonesHTML;
  }

  @action
  public transferIngredient(ingredientId: string, amount: number): void {
    const availableInPantry = this._gameState.pantry.getStock(ingredientId);
    
    if (availableInPantry < amount) {
      alert(`Not enough ${ingredientId} in pantry! Available: ${availableInPantry}`);
      return;
    }

    // Remove from pantry
    this._gameState.pantry.removeIngredient(ingredientId, amount);
    
    // Add to baking counter
    const currentAmount = this._bakingCounter.get(ingredientId) || 0;
    this._bakingCounter.set(ingredientId, currentAmount + amount);

    console.log(`🔄 Transferred ${amount} ${ingredientId} to baking counter`);

    // Update displays
    const currentStep = this._currentRecipe?.getStep(this._currentStep);
    if (currentStep) {
      this.populateIngredientZones(currentStep);
      this.updateBakingCounter();
      this.updateProceedButton();
    }
  }

  private updateBakingCounter(): void {
    const counterEl = document.getElementById('baking-counter');
    const gridEl = document.getElementById('baking-counter-grid');
    
    if (!counterEl || !gridEl) return;

    if (this._bakingCounter.size === 0) {
      gridEl.innerHTML = '<div class="baking-counter-empty">Transfer all ingredients here to proceed</div>';
      counterEl.classList.remove('has-ingredients');
    } else {
      let counterHTML = '';
      
      this._bakingCounter.forEach((amount, ingredientId) => {
        // Find ingredient in current step
        const currentStep = this._currentRecipe?.getStep(this._currentStep);
        const flexIngredient = currentStep?.ingredients.find((fi: any) => fi.ingredient.id === ingredientId);
        
        if (flexIngredient) {
          const ingredient = flexIngredient.ingredient;
          counterHTML += `
            <div class="ingredient-card">
              <div class="icon">${ingredient.icon}</div>
              <div class="name">${ingredient.name}</div>
              <div class="amount">${amount} ${ingredient.unit}</div>
            </div>
          `;
        }
      });
      
      gridEl.innerHTML = counterHTML;
      counterEl.classList.add('has-ingredients');
    }
  }

  private updateProceedButton(): void {
    const proceedBtn = document.getElementById('btn-proceed');
    const statusEl = document.getElementById('proceed-status');
    
    if (!proceedBtn || !statusEl) return;

    const currentStep = this._currentRecipe?.getStep(this._currentStep);
    if (!currentStep) return;

    // Check if all required ingredients are transferred
    let allTransferred = true;
    
    for (const flexIngredient of currentStep.ingredients) {
      const ingredient = flexIngredient.ingredient;
      const baseAmount = flexIngredient.isFixed ? 
        flexIngredient.fixedAmount : 
        flexIngredient.range?.recommended || flexIngredient.range?.min || 0;
      
      // Apply scaling factor (same as in populateIngredientZones)
      const neededAmount = baseAmount * this._currentRecipeScalingFactor;
      
      const transferredAmount = this._bakingCounter.get(ingredient.id) || 0;
      
      // Use decimal-safe comparison with small tolerance for floating point errors
      if (transferredAmount < neededAmount - 0.01) {
        allTransferred = false;
        break;
      }
    }

    if (allTransferred) {
      proceedBtn.disabled = false;
      statusEl.textContent = '✅ All ingredients ready! Click to proceed';
      statusEl.className = 'proceed-status ready';
    } else {
      proceedBtn.disabled = true;
      statusEl.textContent = 'Transfer all ingredients to proceed to next step';
      statusEl.className = 'proceed-status waiting';
    }
  }

  @action
  public proceedToNextStep(): void {
    if (!this._currentRecipe) return;

    this._currentStep++;
    
    if (this._currentStep > this._currentRecipe.steps.length) {
      // Recipe completed!
      this.completeCooking();
    } else {
      // Clear baking counter for next step
      this._bakingCounter.clear();
      
      // Show next step
      this.showCookingStep();
    }
  }

  @action
  private completeCooking(): void {
    console.log(`🎉 Recipe completed: ${this._currentRecipe?.name}`);
    
    // Show production interface instead of just alerting
    this.showProductionInterface();
  }

  @action
  public cancelCooking(): void {
    console.log('❌ Cooking cancelled');
    
    this._currentRecipe = null;
    this._currentStep = 0;
    this._bakingCounter.clear();

    // Hide cooking panel
    const cookingPanel = document.getElementById('cooking-step-panel');
    if (cookingPanel) {
      cookingPanel.style.display = 'none';
    }

    // Return to recipes tab
    this.switchToTab('recipes');
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

  private setupProductionInterface(): void {
    const finishBtn = document.getElementById('btn-finish-production');
    const backBtn = document.getElementById('btn-back-to-cooking');
    const cuttingSlider = document.getElementById('cutting-slider') as HTMLInputElement;
    const packagingSlider = document.getElementById('packaging-slider') as HTMLInputElement;

    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        this.finishProduction();
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.hideProductionInterface();
      });
    }

    if (cuttingSlider) {
      cuttingSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        this.updateCuttingAmount(value);
      });
    }

    if (packagingSlider) {
      packagingSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        this.updatePackagingAmount(value);
      });
    }
  }

  @action
  private showProductionInterface(): void {
    console.log('🏭 Showing production interface');
    
    // Hide cooking panel
    const cookingPanel = document.getElementById('cooking-step-panel');
    if (cookingPanel) {
      cookingPanel.style.display = 'none';
    }

    // Update production content
    this.populateProductionInterface();

    // Show production panel
    const productionPanel = document.getElementById('production-panel');
    if (productionPanel) {
      productionPanel.style.display = 'block';
    }
  }

  @action
  private hideProductionInterface(): void {
    const productionPanel = document.getElementById('production-panel');
    if (productionPanel) {
      productionPanel.style.display = 'none';
    }
    this.switchToTab('recipes');
  }

  private populateProductionInterface(): void {
    if (!this._currentRecipe) return;

    // Update header with current recipe
    const iconEl = document.getElementById('production-icon');
    const subtitleEl = document.getElementById('production-subtitle');

    if (iconEl) iconEl.textContent = this._currentRecipe.icon;
    if (subtitleEl) {
      subtitleEl.textContent = `Your ${this._currentRecipe.name} is ready! Now let's package it.`;
    }

    // Update all production steps
    this.updateProductionStep();
  }

  @action
  private updateCuttingAmount(value: number): void {
    this._productionData.piecesPerItem = value;
    this.updateProductionStep();
  }

  @action
  private updatePackagingAmount(value: number): void {
    this._productionData.piecesPerPackage = value;
    this.updateProductionStep();
  }

  private updateProductionStep(): void {
    const { initialItems, piecesPerItem, piecesPerPackage } = this._productionData;
    const totalPieces = initialItems * piecesPerItem;
    const totalPackages = Math.floor(totalPieces / piecesPerPackage);
    const remainingPieces = totalPieces % piecesPerPackage;

    // Update slider values
    const cuttingValue = document.getElementById('cutting-value');
    const packagingValue = document.getElementById('packaging-value');
    
    if (cuttingValue) cuttingValue.textContent = piecesPerItem.toString();
    if (packagingValue) packagingValue.textContent = piecesPerPackage.toString();

    // Update math displays with exact division showing quotient and remainder
    const initialMath = document.getElementById('initial-math');
    const cuttingMath = document.getElementById('cutting-math');
    const packagingMath = document.getElementById('packaging-math');
    const totalMathEq = document.getElementById('total-math-equation');

    if (initialMath) initialMath.textContent = `Recipe produces ${initialItems} items`;
    if (cuttingMath) cuttingMath.textContent = `${initialItems} items × ${piecesPerItem} pieces each = ${totalPieces} pieces`;
    
    // Show precise division with quotient and remainder
    if (packagingMath) {
      if (remainingPieces > 0) {
        packagingMath.textContent = `${totalPieces} pieces ÷ ${piecesPerPackage} per package = ${totalPackages} packages + ${remainingPieces} remaining pieces`;
      } else {
        packagingMath.textContent = `${totalPieces} pieces ÷ ${piecesPerPackage} per package = ${totalPackages} packages + 0 remaining pieces`;
      }
    }
    
    // Update comprehensive equation
    if (totalMathEq) {
      if (remainingPieces > 0) {
        totalMathEq.textContent = `${initialItems} items × ${piecesPerItem} pieces/item ÷ ${piecesPerPackage} pieces/package = ${totalPackages} packages + ${remainingPieces} remaining`;
      } else {
        totalMathEq.textContent = `${initialItems} items × ${piecesPerItem} pieces/item ÷ ${piecesPerPackage} pieces/package = ${totalPackages} packages + 0 remaining`;
      }
    }

    // Update totals with precise counts
    const initialTotal = document.getElementById('initial-total');
    const cuttingTotal = document.getElementById('cutting-total');
    const packagingTotal = document.getElementById('packaging-total');

    if (initialTotal) initialTotal.textContent = `Total: ${initialItems} items`;
    if (cuttingTotal) cuttingTotal.textContent = `Total: ${totalPieces} pieces`;
    
    // Show packages and remaining pieces
    if (packagingTotal) {
      if (remainingPieces > 0) {
        packagingTotal.textContent = `Total: ${totalPackages} packages + ${remainingPieces} pieces remaining`;
      } else {
        packagingTotal.textContent = `Total: ${totalPackages} packages + 0 pieces remaining`;
      }
    }

    // Update visual representations
    this.updateProductionVisuals();
  }

  private updateProductionVisuals(): void {
    const { initialItems, piecesPerItem, piecesPerPackage } = this._productionData;
    const totalPieces = initialItems * piecesPerItem;
    const totalPackages = Math.floor(totalPieces / piecesPerPackage);
    const remainingPieces = totalPieces % piecesPerPackage;
    const recipeIcon = this._currentRecipe?.icon || '🍪';

    // Step 1: Initial items
    const initialItemsEl = document.getElementById('initial-items');
    if (initialItemsEl) {
      let itemsHTML = '';
      for (let i = 0; i < initialItems; i++) {
        itemsHTML += `<div class="visual-item pan">${recipeIcon}</div>`;
      }
      initialItemsEl.innerHTML = itemsHTML;
    }

    // Step 2: Cutting visualization
    const itemsBeforeCutting = document.getElementById('items-before-cutting');
    const piecesAfterCutting = document.getElementById('pieces-after-cutting');
    
    if (itemsBeforeCutting) {
      let itemsHTML = '';
      for (let i = 0; i < initialItems; i++) {
        itemsHTML += `<div class="visual-item pan">${recipeIcon}</div>`;
      }
      itemsBeforeCutting.innerHTML = itemsHTML;
    }

    if (piecesAfterCutting) {
      let piecesHTML = '';
      const maxDisplayPieces = Math.min(totalPieces, 24); // Limit display for performance
      for (let i = 0; i < maxDisplayPieces; i++) {
        piecesHTML += `<div class="visual-item piece">🔸</div>`;
      }
      if (totalPieces > maxDisplayPieces) {
        piecesHTML += `<div class="visual-item piece">+${totalPieces - maxDisplayPieces}</div>`;
      }
      piecesAfterCutting.innerHTML = piecesHTML;
    }

    // Step 3: Packaging visualization
    const piecesBeforePackaging = document.getElementById('pieces-before-packaging');
    const packagesAfterPackaging = document.getElementById('packages-after-packaging');

    if (piecesBeforePackaging) {
      let piecesHTML = '';
      const maxDisplayPieces = Math.min(totalPieces, 24);
      for (let i = 0; i < maxDisplayPieces; i++) {
        piecesHTML += `<div class="visual-item piece">🔸</div>`;
      }
      if (totalPieces > maxDisplayPieces) {
        piecesHTML += `<div class="visual-item piece">+${totalPieces - maxDisplayPieces}</div>`;
      }
      piecesBeforePackaging.innerHTML = piecesHTML;
    }

    if (packagesAfterPackaging) {
      let packagesHTML = '';
      const maxDisplayPackages = Math.min(totalPackages, 12);
      
      // Show packages
      for (let i = 0; i < maxDisplayPackages; i++) {
        packagesHTML += `<div class="visual-item package">📦</div>`;
      }
      if (totalPackages > maxDisplayPackages) {
        packagesHTML += `<div class="visual-item package">+${totalPackages - maxDisplayPackages}</div>`;
      }
      
      // Show remaining pieces if any
      if (remainingPieces > 0) {
        packagesHTML += `<div class="visual-item-separator">│</div>`;
        for (let i = 0; i < remainingPieces; i++) {
          packagesHTML += `<div class="visual-item piece remaining">🔸</div>`;
        }
        packagesHTML += `<div class="visual-item-label">Remaining</div>`;
      }
      
      packagesAfterPackaging.innerHTML = packagesHTML;
    }
  }

  @action
  private finishProduction(): void {
    console.log('✅ Production finished');
    
    const { initialItems, piecesPerItem, piecesPerPackage } = this._productionData;
    const totalPackages = Math.floor(initialItems * piecesPerItem / piecesPerPackage);
    
    if (this._currentRecipe && totalPackages > 0) {
      // Add packages to store
      const packageName = `${this._currentRecipe.name} Package`;
      const basePrice = this.calculateBasePrice(this._currentRecipe.name);
      
      this._gameState.store.addItem(
        `${this._currentRecipe.id}_package`,
        packageName,
        '📦',
        basePrice,
        totalPackages,
        'packages',
        this._currentRecipe.id
      );
      
      this.showSalesNotification(`Added ${totalPackages} packages to store!`);
    }
    
    // Save game state after production
    StorageService.saveGameState(this._gameState);
    
    this.hideProductionInterface();
    this.cancelCooking();
  }

  private calculateBasePrice(recipeName: string): number {
    // Simple pricing based on recipe complexity
    const basePrices: Record<string, number> = {
      'cookies': 2.50,
      'brownies': 3.00,
      'muffins': 2.75,
      'bread': 4.00,
      'cake': 5.00
    };
    
    const recipeKey = recipeName.toLowerCase();
    for (const [key, price] of Object.entries(basePrices)) {
      if (recipeKey.includes(key)) {
        return price;
      }
    }
    
    return 3.00; // Default price
  }

  private setupStoreInterface(): void {
    const closeBtn = document.getElementById('btn-close-store');
    const locationSelect = document.getElementById('location-select') as HTMLSelectElement;

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.switchToTab('recipes');
      });
    }

    if (locationSelect) {
      locationSelect.addEventListener('change', (e) => {
        const newLocation = (e.target as HTMLSelectElement).value as any;
        this._gameState.store.updateLocation(newLocation);
        this.updateStoreDisplay();
      });
    }
  }

  private setupSupplierInterface(): void {
    const closeBtn = document.getElementById('btn-close-supplier');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.switchToTab('recipes');
      });
    }
  }

  private setupRecipeControls(): void {
    const sortSelect = document.getElementById('recipe-sort') as HTMLSelectElement;
    const filterSelect = document.getElementById('recipe-filter') as HTMLSelectElement;
    const recipeShopBtn = document.getElementById('btn-recipe-shop');
    const advancedModeBtn = document.getElementById('btn-advanced-mode');
    const saveGameBtn = document.getElementById('btn-save-game');
    const loadGameBtn = document.getElementById('btn-load-game');

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const sortBy = (e.target as HTMLSelectElement).value;
        this.sortRecipes(sortBy);
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        const filterBy = (e.target as HTMLSelectElement).value;
        this.filterRecipes(filterBy);
      });
    }

    if (recipeShopBtn) {
      recipeShopBtn.addEventListener('click', () => {
        this.openRecipeShop();
      });
    }

    if (advancedModeBtn) {
      this.updateAdvancedModeButton(advancedModeBtn);
      advancedModeBtn.addEventListener('click', () => {
        this.toggleAdvancedMode();
        this.updateAdvancedModeButton(advancedModeBtn);
      });
    }

    if (saveGameBtn) {
      saveGameBtn.addEventListener('click', () => {
        this.manualSaveGame();
      });
    }

    if (loadGameBtn) {
      loadGameBtn.addEventListener('click', () => {
        this.showLoadGameDialog();
      });
    }
  }

  @action
  private sortRecipes(sortBy: string): void {
    let recipes = MultiStepRecipeLibrary.getAllRecipes();
    
    switch (sortBy) {
      case 'name':
        recipes.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'difficulty':
        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        recipes.sort((a, b) => 
          (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0)
        );
        break;
      case 'time':
        recipes.sort((a, b) => a.bakingTime - b.bakingTime);
        break;
      case 'servings':
        recipes.sort((a, b) => a.baseServings - b.baseServings);
        break;
      case 'recent':
        // For demo purposes, reverse the default order
        recipes.reverse();
        break;
    }

    this.displaySortedRecipes(recipes);
  }

  @action
  private filterRecipes(filterBy: string): void {
    let recipes = MultiStepRecipeLibrary.getAllRecipes();
    
    switch (filterBy) {
      case 'owned':
        // Show recipes user has unlocked (for now, show all)
        break;
      case 'purchasable':
        // Show recipes available for purchase (for now, show none as all are owned)
        recipes = [];
        break;
      case 'easy':
        recipes = recipes.filter(recipe => recipe.difficulty === 'Easy');
        break;
      case 'medium':
        recipes = recipes.filter(recipe => recipe.difficulty === 'Medium');
        break;
      case 'hard':
        recipes = recipes.filter(recipe => recipe.difficulty === 'Hard');
        break;
      case 'all':
      default:
        // Show all recipes
        break;
    }

    this.displaySortedRecipes(recipes);
  }

  @action
  private openRecipeShop(): void {
    console.log('🛒 Opening recipe shop...');
    
    // Create dynamic recipe shop modal
    this.createRecipeShopModal();
  }

  private createRecipeShopModal(): void {
    // Remove any existing shop modal
    const existingModal = document.getElementById('recipe-shop-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML
    const shopModalHTML = `
      <div class="recipe-shop-modal" id="recipe-shop-modal" style="display: flex;">
        <div class="recipe-shop-content">
          <button class="recipe-shop-close" id="recipe-shop-close">×</button>
          
          <div class="recipe-shop-header">
            <div class="recipe-shop-icon">🛒</div>
            <h1 class="recipe-shop-title">Recipe Shop</h1>
            <p class="recipe-shop-subtitle">Discover new recipes to expand your baking skills!</p>
          </div>
          
          <div class="recipe-shop-currency">
            <div class="currency-display">
              <span class="currency-icon">🪙</span>
              <span class="currency-amount" id="player-coins">250</span>
              <span class="currency-label">Baker Coins</span>
            </div>
          </div>
          
          <div class="recipe-shop-categories">
            <button class="shop-category-btn active" data-category="featured">⭐ Featured</button>
            <button class="shop-category-btn" data-category="desserts">🧁 Desserts</button>
            <button class="shop-category-btn" data-category="breads">🍞 Breads</button>
            <button class="shop-category-btn" data-category="seasonal">🎃 Seasonal</button>
          </div>
          
          <div class="recipe-shop-grid" id="recipe-shop-grid">
            <!-- Will be populated with purchasable recipes -->
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', shopModalHTML);

    // Set up event listeners
    this.setupRecipeShopModal();
    
    // Populate with demo recipes
    this.populateRecipeShop('featured');
  }

  private setupRecipeShopModal(): void {
    const modal = document.getElementById('recipe-shop-modal');
    const closeBtn = document.getElementById('recipe-shop-close');
    const categoryBtns = document.querySelectorAll('.shop-category-btn');

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (modal) modal.remove();
      });
    }

    // Click outside to close
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }

    // Category buttons
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const category = target.dataset.category;
        
        // Update active state
        categoryBtns.forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        
        // Load category
        if (category) {
          this.populateRecipeShop(category);
        }
      });
    });
  }

  private populateRecipeShop(category: string): void {
    const shopGrid = document.getElementById('recipe-shop-grid');
    if (!shopGrid) return;

    // Demo purchasable recipes based on category
    const shopRecipes = this.getShopRecipesByCategory(category);
    
    let recipesHTML = '';
    shopRecipes.forEach(recipe => {
      const isOwned = true; // For demo, assume user owns current recipes
      const canAfford = recipe.price <= 250; // Demo coin amount
      
      recipesHTML += `
        <div class="shop-recipe-card ${isOwned ? 'owned' : ''}">
          <div class="shop-recipe-header">
            <div class="shop-recipe-icon">${recipe.icon}</div>
            <div class="shop-recipe-info">
              <div class="shop-recipe-name">${recipe.name}</div>
              <div class="shop-recipe-difficulty ${recipe.difficulty.toLowerCase()}">${recipe.difficulty}</div>
            </div>
            <div class="shop-recipe-price">
              ${isOwned ? '<span class="owned-badge">✅ Owned</span>' : 
                `<span class="price-tag ${canAfford ? 'affordable' : 'expensive'}">
                  🪙 ${recipe.price}
                </span>`}
            </div>
          </div>
          
          <div class="shop-recipe-description">${recipe.description}</div>
          
          <div class="shop-recipe-features">
            <span class="recipe-feature">⏱️ ${recipe.time}min</span>
            <span class="recipe-feature">🍽️ ${recipe.servings} servings</span>
            <span class="recipe-feature">📊 ${recipe.difficulty}</span>
          </div>
          
          <div class="shop-recipe-actions">
            ${isOwned ? 
              '<button class="btn-shop-recipe owned" disabled>Already Owned</button>' :
              `<button class="btn-shop-recipe ${canAfford ? 'purchase' : 'expensive'}" 
                       onclick="appInstance.purchaseRecipe('${recipe.id}', ${recipe.price})"
                       ${!canAfford ? 'disabled' : ''}>
                ${canAfford ? `Purchase for 🪙 ${recipe.price}` : 'Insufficient Coins'}
              </button>`
            }
          </div>
        </div>
      `;
    });

    shopGrid.innerHTML = recipesHTML;
  }

  private getShopRecipesByCategory(category: string): any[] {
    // Demo shop recipes - in a real implementation, these would come from a recipe database
    const allShopRecipes = {
      featured: [
        {
          id: 'chocolate-lava-cake',
          name: 'Chocolate Lava Cake',
          icon: '🌋',
          difficulty: 'Hard',
          price: 150,
          description: 'Decadent molten chocolate dessert with a gooey center',
          time: 45,
          servings: 4
        },
        {
          id: 'strawberry-shortcake',
          name: 'Strawberry Shortcake',
          icon: '🍰',
          difficulty: 'Medium',
          price: 100,
          description: 'Classic summer dessert with fresh strawberries and cream',
          time: 35,
          servings: 8
        }
      ],
      desserts: [
        {
          id: 'tiramisu',
          name: 'Tiramisu',
          icon: '🍮',
          difficulty: 'Hard',
          price: 200,
          description: 'Italian coffee-flavored dessert with mascarpone',
          time: 60,
          servings: 6
        },
        {
          id: 'apple-pie',
          name: 'Apple Pie',
          icon: '🥧',
          difficulty: 'Medium',
          price: 120,
          description: 'Classic American dessert with spiced apples',
          time: 90,
          servings: 8
        }
      ],
      breads: [
        {
          id: 'sourdough-bread',
          name: 'Sourdough Bread',
          icon: '🍞',
          difficulty: 'Hard',
          price: 180,
          description: 'Artisanal bread with tangy sourdough starter',
          time: 240,
          servings: 12
        },
        {
          id: 'dinner-rolls',
          name: 'Dinner Rolls',
          icon: '🥖',
          difficulty: 'Easy',
          price: 80,
          description: 'Soft and fluffy dinner rolls perfect for any meal',
          time: 90,
          servings: 16
        }
      ],
      seasonal: [
        {
          id: 'pumpkin-spice-cake',
          name: 'Pumpkin Spice Cake',
          icon: '🎃',
          difficulty: 'Medium',
          price: 140,
          description: 'Fall-inspired cake with warm pumpkin spices',
          time: 50,
          servings: 10
        },
        {
          id: 'gingerbread-cookies',
          name: 'Gingerbread Cookies',
          icon: '🍪',
          difficulty: 'Easy',
          price: 90,
          description: 'Festive spiced cookies perfect for holidays',
          time: 40,
          servings: 24
        }
      ]
    };

    return allShopRecipes[category] || allShopRecipes.featured;
  }

  @action
  public purchaseRecipe(recipeId: string, price: number): void {
    console.log(`💰 Purchasing recipe: ${recipeId} for ${price} coins`);
    
    // For demo purposes, just show success message
    // In a real implementation, this would:
    // 1. Check if user has enough coins
    // 2. Deduct coins from player account
    // 3. Add recipe to player's collection
    // 4. Update UI
    
    alert(`🎉 Recipe purchased successfully!\n\nYou spent ${price} Baker Coins and unlocked a new recipe!\n\n(This is a demo - recipe purchasing system would integrate with the game's economy in the full implementation)`);
    
    // Save game state after purchase
    StorageService.saveGameState(this._gameState);
    
    // Close the shop modal
    const modal = document.getElementById('recipe-shop-modal');
    if (modal) modal.remove();
  }

  private displaySortedRecipes(recipes: any[]): void {
    const recipeGrid = document.getElementById('recipe-grid');
    if (!recipeGrid) return;

    if (recipes.length === 0) {
      recipeGrid.innerHTML = `
        <div class="empty-recipes">
          <div class="empty-recipes-icon">📚</div>
          <div class="empty-recipes-text">No recipes match your current filter</div>
          <div class="empty-recipes-hint">Try selecting a different filter option</div>
        </div>
      `;
      return;
    }

    let recipesHTML = '';
    recipes.forEach(recipe => {
      recipesHTML += `
        <div class="recipe-card" data-recipe-id="${recipe.id}">
          <div class="recipe-card-header">
            <div class="recipe-icon">${recipe.icon}</div>
            <div class="recipe-info">
              <div class="recipe-name">${recipe.name}</div>
              <div class="recipe-meta">
                <span class="recipe-difficulty ${recipe.difficulty.toLowerCase()}">${recipe.difficulty}</span>
                <span class="recipe-time">⏱️ ${recipe.bakingTime}min</span>
                <span class="recipe-servings">🍽️ ${recipe.baseServings}</span>
              </div>
            </div>
          </div>
          <div class="recipe-description">${recipe.description}</div>
          <div class="recipe-tags">
            ${recipe.tags.map((tag: string) => `<span class="recipe-tag">${tag}</span>`).join('')}
          </div>
          <div class="recipe-actions">
            <button class="btn-recipe-details" onclick="appInstance.showRecipeDetails('${recipe.id}')">
              View Details
            </button>
            <button class="btn-start-cooking" onclick="appInstance.startCooking('${recipe.id}')">
              Start Cooking
            </button>
          </div>
        </div>
      `;
    });

    recipeGrid.innerHTML = recipesHTML;
  }

  @action
  private updateStoreDisplay(): void {
    this.updateStoreStats();
    this.updateStoreInventory();
  }

  private updateStoreStats(): void {
    const store = this._gameState.store;
    
    // Update main stats
    const totalRevenueEl = document.getElementById('total-revenue');
    const itemsInStockEl = document.getElementById('items-in-stock');
    const storeValueEl = document.getElementById('store-value');
    const dailySalesEl = document.getElementById('daily-sales');

    if (totalRevenueEl) totalRevenueEl.textContent = `$${store.getTotalRevenue().toFixed(2)}`;
    if (itemsInStockEl) itemsInStockEl.textContent = store.getAllItems().reduce((sum, item) => sum + item.quantity, 0).toString();
    if (storeValueEl) storeValueEl.textContent = `$${store.getInventoryValue().toFixed(2)}`;
    
    const salesStats = store.getSalesStats(24);
    if (dailySalesEl) dailySalesEl.textContent = salesStats.totalSales.toString();
  }

  private updateStoreInventory(): void {
    const store = this._gameState.store;
    
    // Update each category
    this.updateStoreCategory('baked_goods', '🧁', 'baked-goods');
    this.updateStoreCategory('packages', '📦', 'packages');
    this.updateStoreCategory('ingredients', '🌾', 'ingredients');
  }

  private updateStoreCategory(category: any, icon: string, elementPrefix: string): void {
    const store = this._gameState.store;
    const items = store.getItemsByCategory(category);
    
    const countEl = document.getElementById(`${elementPrefix}-count`);
    const gridEl = document.getElementById(`${elementPrefix}-grid`);
    
    if (countEl) countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
    
    if (gridEl) {
      if (items.length === 0) {
        gridEl.innerHTML = `
          <div class="empty-inventory">
            <div class="empty-inventory-icon">${icon}</div>
            <div class="empty-inventory-text">No ${category.replace('_', ' ')} in stock</div>
            <div class="empty-inventory-hint">Complete recipes to add items to your store</div>
          </div>
        `;
      } else {
        let itemsHTML = '';
        
        items.forEach(item => {
          const currentPrice = store.getCurrentPrice(item.id) || 0;
          const modifiers = store.getPriceModifiers(item.id);
          const freshnessHours = item.getFreshnessHours();
          
          let freshnessClass = '';
          if (freshnessHours > 24) freshnessClass = 'old';
          else if (freshnessHours > 12) freshnessClass = 'stale';
          
          let modifiersHTML = '';
          if (modifiers) {
            modifiersHTML = `
              <div class="store-item-modifiers">
                <div class="store-item-modifiers-title">Price Modifiers</div>
                <div class="modifiers-grid">
                  <div class="modifier-item">
                    <span class="modifier-name">Time</span>
                    <span class="modifier-value ${modifiers.timeOfDay > 1 ? 'positive' : modifiers.timeOfDay < 1 ? 'negative' : ''}">${(modifiers.timeOfDay * 100).toFixed(0)}%</span>
                  </div>
                  <div class="modifier-item">
                    <span class="modifier-name">Demand</span>
                    <span class="modifier-value ${modifiers.demand > 1 ? 'positive' : modifiers.demand < 1 ? 'negative' : ''}">${(modifiers.demand * 100).toFixed(0)}%</span>
                  </div>
                  <div class="modifier-item">
                    <span class="modifier-name">Location</span>
                    <span class="modifier-value ${modifiers.location > 1 ? 'positive' : modifiers.location < 1 ? 'negative' : ''}">${(modifiers.location * 100).toFixed(0)}%</span>
                  </div>
                  <div class="modifier-item">
                    <span class="modifier-name">Fresh</span>
                    <span class="modifier-value ${modifiers.freshness < 1 ? 'negative' : ''}">${(modifiers.freshness * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            `;
          }
          
          itemsHTML += `
            <div class="store-item-card">
              <div class="freshness-indicator ${freshnessClass}"></div>
              <div class="store-item-header">
                <div class="store-item-info">
                  <div class="store-item-icon">${item.icon}</div>
                  <div class="store-item-details">
                    <h4 class="store-item-name">${item.name}</h4>
                    <div class="store-item-quantity">${item.quantity} in stock</div>
                  </div>
                </div>
                <div class="store-item-pricing">
                  <div class="store-item-price">$${currentPrice.toFixed(2)}</div>
                  ${currentPrice !== item.basePrice ? `<div class="store-item-base-price">$${item.basePrice.toFixed(2)}</div>` : ''}
                </div>
              </div>
              ${modifiersHTML}
              <div class="store-item-actions">
                <div class="sell-controls">
                  <input type="number" class="sell-quantity-input" value="1" min="1" max="${item.quantity}" id="sell-qty-${item.id}">
                  <button class="btn-sell" onclick="window.appInstance.sellItem('${item.id}')" ${item.quantity === 0 ? 'disabled' : ''}>
                    Sell
                  </button>
                </div>
              </div>
            </div>
          `;
        });
        
        gridEl.innerHTML = itemsHTML;
      }
    }
  }

  @action
  public sellItem(itemId: string): void {
    const quantityInput = document.getElementById(`sell-qty-${itemId}`) as HTMLInputElement;
    if (!quantityInput) return;
    
    const quantity = parseInt(quantityInput.value);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    
    const result = this._gameState.store.sellItem(itemId, quantity);
    
    if (result.success) {
      this.showSalesNotification(`Sold ${quantity} items for $${result.revenue.toFixed(2)}!`);
      this.updateStoreDisplay();
    } else {
      alert(result.error || 'Sale failed');
    }
  }

  private showSalesNotification(message: string): void {
    const notification = document.getElementById('sales-notification');
    if (notification) {
      notification.textContent = message;
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
  }

  private updateSupplierDisplay(): void {
    // Update stats
    const availableCoinsEl = document.getElementById('available-coins');
    const todaysOrdersEl = document.getElementById('todays-orders');
    const bulkSavingsEl = document.getElementById('bulk-savings');

    if (availableCoinsEl) {
      const totalRevenue = this._gameState.store.getTotalRevenue();
      availableCoinsEl.textContent = MathService.formatCurrency(totalRevenue);
    }

    if (todaysOrdersEl) {
      todaysOrdersEl.textContent = this._supplierStats.todaysOrders.toString();
    }

    if (bulkSavingsEl) {
      bulkSavingsEl.textContent = MathService.formatCurrency(this._supplierStats.bulkSavings);
    }

    // Populate supplier items
    this.populateSupplierItems();
  }

  private populateSupplierItems(): void {
    const supplierGrid = document.getElementById('supplier-items-grid');
    if (!supplierGrid) return;

    const ingredients = this.getSupplierIngredients();
    
    let itemsHTML = '';
    ingredients.forEach(ingredient => {
      const currentStock = this._gameState.pantry.getStock(ingredient.id);
      const availableCoins = this._gameState.store.getTotalRevenue();
      
      itemsHTML += this.createSupplierItemHTML(ingredient, currentStock, availableCoins);
    });

    supplierGrid.innerHTML = itemsHTML;
  }

  private getSupplierIngredients() {
    return [
      { id: 'flour', name: 'All-Purpose Flour', icon: '🌾', unit: 'cups', basePrice: 0.50, description: 'High-quality baking flour' },
      { id: 'butter', name: 'Butter', icon: '🧈', unit: 'sticks', basePrice: 0.75, description: 'Fresh dairy butter' },
      { id: 'eggs', name: 'Fresh Eggs', icon: '🥚', unit: 'eggs', basePrice: 0.25, description: 'Farm-fresh eggs' },
      { id: 'sugar', name: 'Granulated Sugar', icon: '🍚', unit: 'cups', basePrice: 0.40, description: 'Pure white sugar' },
      { id: 'vanilla', name: 'Vanilla Extract', icon: '🍦', unit: 'tsp', basePrice: 1.20, description: 'Pure vanilla extract' },
      { id: 'chocolate', name: 'Chocolate Chips', icon: '🍫', unit: 'cups', basePrice: 2.00, description: 'Premium chocolate chips' }
    ];
  }

  private createSupplierItemHTML(ingredient: any, currentStock: number, availableCoins: number): string {
    const quantities = [1, 10, 100] as const;
    
    return `
      <div class="supplier-item-card">
        <div class="supplier-item-header">
          <div class="supplier-item-icon">${ingredient.icon}</div>
          <div class="supplier-item-info">
            <div class="supplier-item-name">${ingredient.name}</div>
            <div class="supplier-item-description">${ingredient.description}</div>
          </div>
          <div class="supplier-item-stock">
            <div class="current-stock">${currentStock}</div>
            <div class="stock-unit">${ingredient.unit}</div>
          </div>
        </div>
        
        <div class="supplier-pricing">
          ${quantities.map(qty => {
            const unitPrice = MathService.calculateBulkPrice(ingredient.basePrice, qty);
            const totalCost = MathService.calculateTotalCost(ingredient.basePrice, qty);
            const savings = MathService.calculateSavings(ingredient.basePrice, qty);
            const discount = MathService.getDiscountPercentage(qty);
            
            return `
              <div class="price-option ${qty === 10 ? 'bulk' : qty === 100 ? 'wholesale' : ''}">
                <div class="price-quantity">${qty} ${qty === 1 ? ingredient.unit : ingredient.unit}</div>
                <div class="price-per-unit">${MathService.formatCurrency(unitPrice)}/${ingredient.unit}</div>
                <div class="price-total">${MathService.formatCurrency(totalCost)}</div>
                ${savings > 0 ? `<div class="price-savings">Save ${MathService.formatCurrency(savings)} (${discount}% off)</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="supplier-purchase-buttons">
          ${quantities.map(qty => {
            const totalCost = MathService.calculateTotalCost(ingredient.basePrice, qty);
            const canAfford = availableCoins >= totalCost;
            const buttonClass = qty === 1 ? 'single' : qty === 10 ? 'bulk' : 'wholesale';
            
            return `
              <button 
                class="btn-purchase ${buttonClass}" 
                ${!canAfford ? 'disabled' : ''}
                onclick="appInstance.purchaseIngredient('${ingredient.id}', ${qty})"
              >
                <div class="purchase-amount">+${qty}</div>
                <div class="purchase-price">${MathService.formatCurrency(totalCost)}</div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  @action
  public purchaseIngredient(ingredientId: string, quantity: 1 | 10 | 100): void {
    const ingredients = this.getSupplierIngredients();
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    
    if (!ingredient) {
      console.error('Ingredient not found:', ingredientId);
      return;
    }

    const totalCost = MathService.calculateTotalCost(ingredient.basePrice, quantity);
    const availableCoins = this._gameState.store.getTotalRevenue();
    
    if (availableCoins < totalCost) {
      alert(`❌ Not enough coins! You need ${MathService.formatCurrency(totalCost)} but only have ${MathService.formatCurrency(availableCoins)}.`);
      return;
    }

    // Add to pantry
    this._gameState.pantry.addIngredient(ingredientId, quantity);
    
    // Update stats
    this._supplierStats.todaysOrders += 1;
    
    const savings = MathService.calculateSavings(ingredient.basePrice, quantity);
    if (savings > 0) {
      this._supplierStats.bulkSavings += savings;
    }

    // For demo purposes, we're not actually deducting coins yet since the economy isn't fully integrated
    // In a full implementation, you'd deduct from a player coin balance here
    
    // Show confirmation
    this.showPurchaseConfirmation(ingredient.name, quantity, totalCost, savings);
    
    // Update displays
    this.updateSupplierDisplay();
    
    // Save game state
    StorageService.saveGameState(this._gameState);
    
    console.log(`🛒 Purchased ${quantity} ${ingredient.unit} of ${ingredient.name} for ${MathService.formatCurrency(totalCost)}`);
  }

  private showPurchaseConfirmation(ingredientName: string, quantity: number, cost: number, savings: number): void {
    const confirmation = document.createElement('div');
    confirmation.className = 'purchase-confirmation';
    
    let message = `🎉 Purchased ${quantity} ${ingredientName} for ${MathService.formatCurrency(cost)}`;
    if (savings > 0) {
      message += ` (Saved ${MathService.formatCurrency(savings)}!)`;
    }
    
    confirmation.innerHTML = `
      <span class="purchase-confirmation-icon">✅</span>
      <span>${message}</span>
    `;
    
    document.body.appendChild(confirmation);
    
    // Show animation
    setTimeout(() => confirmation.classList.add('show'), 100);
    
    // Hide and remove
    setTimeout(() => {
      confirmation.classList.remove('show');
      setTimeout(() => document.body.removeChild(confirmation), 300);
    }, 3000);
  }

  @action
  private manualSaveGame(): void {
    console.log('💾 Manual save requested');
    const success = StorageService.saveGameState(this._gameState);
    
    if (success) {
      // Show detailed success message
      const saveInfo = StorageService.getSaveInfo();
      const message = saveInfo 
        ? `Game saved successfully!\n\nLevel: ${saveInfo.level}\nCoins: ${saveInfo.coins}\nTime: ${saveInfo.lastSaved.toLocaleString()}`
        : 'Game saved successfully!';
      
      alert(message);
    } else {
      alert('❌ Failed to save game. Please try again.');
    }
  }

  @action
  private showLoadGameDialog(): void {
    console.log('📂 Load game requested');
    
    if (!StorageService.hasSaveData()) {
      alert('No saved game found. Start playing to create a save file!');
      return;
    }
    
    const saveInfo = StorageService.getSaveInfo();
    if (!saveInfo) {
      alert('❌ Error reading save file. The save data may be corrupted.');
      return;
    }
    
    const confirmMessage = `Load saved game?\n\nLevel: ${saveInfo.level}\nCoins: ${saveInfo.coins}\nLast saved: ${saveInfo.lastSaved.toLocaleString()}\n\n⚠️ This will replace your current progress!`;
    
    if (confirm(confirmMessage)) {
      // Reload the page to trigger fresh game state load
      console.log('🔄 Reloading game to load saved state');
      window.location.reload();
    }
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