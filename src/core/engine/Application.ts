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
import { UnitConversionService } from '@/domain/nutrition/UnitConversion';

export class Application {
  @observable private _isInitialized: boolean = false;
  @observable private _gameState: GameState;
  @observable private _currentTab: string = 'math';
  @observable private _currentRecipe: any | null = null;
  @observable private _currentStep: number = 0;
  @observable private _bakingCounter: Map<string, number> = new Map();
  @observable private _usedIngredients: Map<string, number> = new Map(); // Track actual ingredient amounts used
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
              if (flexIngredient.description) {
                notes = `<div class="ingredient-notes">${flexIngredient.description}</div>`;
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
    // Default production values with updated terminology mapping
    const defaultProduction = {
      initialItems: 2,
      itemName: this.getRecipeOutputTerm(recipe)
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

  /**
   * Get recipe-specific output terminology
   * cookies: batches; cupcakes: trays; cake: cakes; pancakes: rounds
   */
  private getRecipeOutputTerm(recipe: any): string {
    if (!recipe || !recipe.name) return 'items';
    
    const recipeName = recipe.name.toLowerCase();
    
    if (recipeName.includes('cookies')) return 'batches';
    if (recipeName.includes('cupcakes')) return 'trays';
    if (recipeName.includes('cake')) return 'cakes';
    if (recipeName.includes('pancakes')) return 'rounds';
    
    // Fallback for other recipe types
    if (recipeName.includes('brownies')) return 'pans';
    if (recipeName.includes('muffins')) return 'dozens';
    if (recipeName.includes('bread')) return 'loaves';
    
    return 'items'; // Default fallback
  }

  /**
   * Calculate total calories from actual ingredients used
   * Returns total calories for the entire recipe
   */
  private calculateRecipeCalories(): number {
    let totalCalories = 0;
    
    this._usedIngredients.forEach((amount, ingredientId) => {
      // Get the ingredient from the ingredient service to find its unit
      const ingredient = this.ingredientService.getIngredient(ingredientId);
      if (!ingredient) {
        console.warn(`Ingredient not found: ${ingredientId}`);
        return;
      }
      
      // Calculate calories using UnitConversionService
      const ingredientCalories = UnitConversionService.calculateCalories(ingredientId, amount, ingredient.unit);
      totalCalories += ingredientCalories;
      
      console.log(`📊 ${ingredientId}: ${amount} ${ingredient.unit} = ${ingredientCalories.toFixed(1)} calories`);
    });
    
    console.log(`📊 Total recipe calories: ${totalCalories.toFixed(1)}`);
    return totalCalories;
  }

  /**
   * Generate nutrition display HTML for store items
   */
  private getItemNutritionDisplay(item: any): string {
    // Only show nutrition for packages (which come from recipes)
    if (item.category !== 'packages' || !item.recipeId) {
      return '';
    }

    // For packages, try to estimate nutrition based on the recipe
    // Since we don't have the exact ingredient amounts used when this package was made,
    // we'll calculate from the current saved ingredients or use default recipe amounts
    try {
      const recipe = this.recipeService.getRecipe(item.recipeId);
      if (!recipe) return '';

      // If this item was made recently and we have the used ingredients data
      if (this._usedIngredients.size > 0) {
        const totalCalories = this.calculateRecipeCalories();
        const { initialItems, piecesPerItem, piecesPerPackage } = this._productionData;
        const totalPackages = Math.floor(initialItems * piecesPerItem / piecesPerPackage);
        
        if (totalPackages > 0) {
          const caloriesPerPackage = totalCalories / totalPackages;
          return `<div class="store-item-nutrition">🔥 ${caloriesPerPackage.toFixed(0)} cal/package</div>`;
        }
      }

      // Fallback: estimate based on typical recipe values
      // This is a simplified approach - could be enhanced with recipe default nutrition
      const estimatedCaloriesPerPackage = Math.round(item.basePrice / 0.05); // Reverse calculation from $0.05/calorie
      return `<div class="store-item-nutrition">🔥 ~${estimatedCaloriesPerPackage} cal/package</div>`;
      
    } catch (error) {
      console.warn('Error calculating nutrition for item:', error);
      return '';
    }
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

  /**
   * Calculate grid dimensions for an amount, favoring squares for upper bounds
   * Upper bound: favor square-like dimensions (e.g., 20 -> 5x4 not 2x10)
   * Lower bound: use smaller factor if it fits within upper bound grid
   */
  private calculateGridDimensions(amount: number, isUpperBound: boolean = false): { rows: number; columns: number } {
    if (amount <= 0) return { rows: 1, columns: 1 };
    
    if (isUpperBound) {
      // For upper bound, favor square-like dimensions
      const sqrt = Math.sqrt(amount);
      const rows = Math.floor(sqrt);
      const columns = Math.ceil(amount / rows);
      return { rows, columns };
    } else {
      // For lower bound, use smaller factors that fit within a reasonable grid
      for (let rows = 1; rows <= Math.sqrt(amount); rows++) {
        if (amount % rows === 0) {
          return { rows, columns: amount / rows };
        }
      }
      // Fallback if no perfect factor found
      const rows = Math.floor(Math.sqrt(amount));
      const columns = Math.ceil(amount / rows);
      return { rows, columns };
    }
  }

  /**
   * Generate HTML for a visual grid showing ingredient amounts
   */
  private generateIngredientGrid(minAmount: number, maxAmount: number, currentAmount: number): string {
    const upperDims = this.calculateGridDimensions(maxAmount, true);
    const lowerDims = this.calculateGridDimensions(minAmount, false);
    
    // Use the upper bound dimensions for the grid size
    const gridRows = upperDims.rows;
    const gridCols = upperDims.columns;
    
    let gridHTML = '<div class="ingredient-grid" style="display: grid; grid-template-columns: repeat(' + gridCols + ', 1fr); gap: 2px; margin: 10px 0;">';
    
    for (let i = 0; i < gridRows * gridCols; i++) {
      let cellClass = 'grid-cell';
      
      if (i < minAmount) {
        cellClass += ' min-amount';
      } else if (i < maxAmount) {
        cellClass += ' max-amount';
      } else {
        cellClass += ' empty';
      }
      
      if (i < currentAmount) {
        cellClass += ' selected';
      }
      
      gridHTML += `<div class="${cellClass}"></div>`;
    }
    
    gridHTML += '</div>';
    return gridHTML;
  }

  /**
   * Generate HTML for flexible ingredient grid with custom dimensions
   */
  /**
   * ⭐ FLEXIBLE INGREDIENT GRID GENERATOR ⭐
   * 
   * This method generates a fixed 10x10 grid (100 cells) for flexible ingredients.
   * User selection is shown as a rectangle within this fixed grid backdrop.
   * 
   * GRID VISUALIZATION:
   * - Red cells (min-required): Minimum quantity needed
   * - Orange cells (max-allowed): Maximum quantity allowed  
   * - Purple cells (selected): Currently selected amount (width x height rectangle)
   * - Empty cells: Unused cells in the 10x10 grid
   */
  private generateFlexibleIngredientGrid(minAmount: number, maxAmount: number, currentAmount: number, width: number, height: number): string {
    const FIXED_GRID_SIZE = 10; // Fixed 10x10 grid
    const totalCells = FIXED_GRID_SIZE * FIXED_GRID_SIZE; // Always 100 cells
    const selectedAmount = Math.min(currentAmount, totalCells);
    
    // Fixed 10x10 grid with consistent cell sizes
    let gridHTML = `<div class="flexible-ingredient-grid fixed-grid" style="display: grid; grid-template-columns: repeat(${FIXED_GRID_SIZE}, 20px); grid-template-rows: repeat(${FIXED_GRID_SIZE}, 20px); gap: 2px; margin: 10px auto; width: fit-content;">`;
    
    for (let i = 0; i < totalCells; i++) {
      let cellClass = 'grid-cell';
      const row = Math.floor(i / FIXED_GRID_SIZE);
      const col = i % FIXED_GRID_SIZE;
      
      // Color coding: Red = minimum required, Orange = maximum allowed
      if (i < minAmount) {
        cellClass += ' min-required';    // Red gradient
      } else if (i < maxAmount) {
        cellClass += ' max-allowed';     // Orange gradient  
      } else {
        cellClass += ' empty';           // Transparent
      }
      
      // Purple overlay for currently selected rectangle (width x height)
      // Show selection as a rectangle starting from top-left
      if (row < height && col < width) {
        cellClass += ' selected';        // Purple gradient (overrides other colors)
      }
      
      gridHTML += `<div class="${cellClass}" data-cell-index="${i}" data-row="${row}" data-col="${col}"></div>`;
    }
    
    gridHTML += '</div>';
    return gridHTML;
  }

  /**
   * Update ingredient grid when sliders change
   */
  @action
  public updateIngredientGrid(ingredientId: string): void {
    const widthSlider = document.getElementById(`width-slider-${ingredientId}`) as HTMLInputElement;
    const heightSlider = document.getElementById(`height-slider-${ingredientId}`) as HTMLInputElement;
    const widthValue = document.getElementById(`width-value-${ingredientId}`);
    const heightValue = document.getElementById(`height-value-${ingredientId}`);
    const amountDisplay = document.getElementById(`flexible-amount-${ingredientId}`);
    const gridContainer = document.getElementById(`grid-container-${ingredientId}`);
    
    if (!widthSlider || !heightSlider || !gridContainer) return;
    
    const width = parseInt(widthSlider.value);
    const height = parseInt(heightSlider.value);
    const selectedAmount = width * height;
    
    // Update slider value displays
    if (widthValue) widthValue.textContent = width.toString();
    if (heightValue) heightValue.textContent = height.toString();
    
    // Update amount display
    if (amountDisplay) amountDisplay.textContent = this.formatAmount(selectedAmount);
    
    // Find the current step and ingredient to get min/max bounds
    const currentStep = this._currentRecipe?.getStep(this._currentStep);
    if (!currentStep) return;
    
    const flexIngredient = currentStep.ingredients.find((fi: any) => fi.ingredient.id === ingredientId);
    if (!flexIngredient || !flexIngredient.range) return;
    
    const range = flexIngredient.range;
    const scaledMin = Math.ceil(range.min * this._currentRecipeScalingFactor);
    const scaledMax = Math.ceil(range.max * this._currentRecipeScalingFactor);
    
    // Update grid display
    gridContainer.innerHTML = this.generateFlexibleIngredientGrid(scaledMin, scaledMax, selectedAmount, width, height);
  }

  /**
   * Transfer flexible ingredient with selected amount
   */
  @action
  public transferFlexibleIngredient(ingredientId: string): void {
    const widthSlider = document.getElementById(`width-slider-${ingredientId}`) as HTMLInputElement;
    const heightSlider = document.getElementById(`height-slider-${ingredientId}`) as HTMLInputElement;
    
    if (!widthSlider || !heightSlider) return;
    
    const width = parseInt(widthSlider.value);
    const height = parseInt(heightSlider.value);
    const selectedAmount = width * height;
    
    // Ensure selection doesn't exceed 10x10 grid (100 cells)
    if (selectedAmount > 100) {
      alert(`Selection too large! Maximum is 100 (10x10 grid). Current: ${selectedAmount} (${width}x${height})`);
      return;
    }
    
    const availableInPantry = this._gameState.pantry.getStock(ingredientId);
    
    if (availableInPantry < selectedAmount) {
      alert(`Not enough ${ingredientId} in pantry! Available: ${availableInPantry}, needed: ${selectedAmount}`);
      return;
    }

    // Check if amount is within valid range
    const currentStep = this._currentRecipe?.getStep(this._currentStep);
    if (!currentStep) return;
    
    const flexIngredient = currentStep.ingredients.find((fi: any) => fi.ingredient.id === ingredientId);
    if (!flexIngredient || !flexIngredient.range) return;
    
    const range = flexIngredient.range;
    const scaledMin = Math.ceil(range.min * this._currentRecipeScalingFactor);
    const scaledMax = Math.ceil(range.max * this._currentRecipeScalingFactor);
    
    if (selectedAmount < scaledMin) {
      alert(`Amount too low! Minimum required: ${scaledMin} ${flexIngredient.ingredient.unit}`);
      return;
    }
    
    if (selectedAmount > scaledMax) {
      alert(`Amount too high! Maximum allowed: ${scaledMax} ${flexIngredient.ingredient.unit}`);
      return;
    }

    // Remove from pantry
    this._gameState.pantry.removeIngredient(ingredientId, selectedAmount);
    
    // Add to baking counter
    const currentAmount = this._bakingCounter.get(ingredientId) || 0;
    this._bakingCounter.set(ingredientId, currentAmount + selectedAmount);

    console.log(`🔄 Transferred ${selectedAmount} ${ingredientId} to baking counter (${width}×${height} grid)`);

    // Update displays
    if (currentStep) {
      this.populateIngredientZones(currentStep);
      this.updateBakingCounter();
      this.updateProceedButton();
    }
  }

  private populateIngredientZones(step: any): void {
    const zonesEl = document.getElementById('ingredient-zones-list');
    if (!zonesEl) return;

    let zonesHTML = '';

    step.ingredients.forEach((flexIngredient: any, index: number) => {
      const ingredient = flexIngredient.ingredient;
      const availableInPantry = this._gameState.pantry.getStock(ingredient.id);
      const transferredAmount = this._bakingCounter.get(ingredient.id) || 0;
      
      if (flexIngredient.isFixed) {
        // Fixed ingredient - use traditional transfer system
        const baseAmount = flexIngredient.fixedAmount;
        const neededAmount = baseAmount * this._currentRecipeScalingFactor;
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
      } else if (flexIngredient.range) {
        // Flexible ingredient - use grid-based selection system
        const range = flexIngredient.range;
        const scaledMin = Math.ceil(range.min * this._currentRecipeScalingFactor);
        const scaledMax = Math.ceil(range.max * this._currentRecipeScalingFactor);
        const scaledRecommended = Math.ceil((range.recommended || range.min) * this._currentRecipeScalingFactor);
        
        // Start with recommended amount if nothing transferred yet
        const currentAmount = transferredAmount || scaledRecommended;
        const isTransferred = transferredAmount > 0;
        const canTransfer = availableInPantry >= scaledMin && !isTransferred;

        zonesHTML += `
          <div class="ingredient-zone flexible ${isTransferred ? 'transferred' : 'needed'}" data-ingredient-id="${ingredient.id}">
            <div class="ingredient-zone-header">
              <div class="ingredient-zone-name">
                <span>${ingredient.icon}</span>
                <span>${ingredient.name}</span>
              </div>
              <div class="ingredient-zone-amount flexible-amount">
                <span id="flexible-amount-${ingredient.id}">${this.formatAmount(currentAmount)}</span> ${ingredient.unit}
                <small>(${this.formatAmount(scaledMin)}-${this.formatAmount(scaledMax)} range)</small>
              </div>
            </div>
            
            ${!isTransferred ? `
            <div class="grid-control-section">
              <div class="grid-sliders">
                <div class="slider-group">
                  <label>Grid Width (1-10):</label>
                  <input type="range" class="grid-slider" id="width-slider-${ingredient.id}" 
                         min="1" max="10" value="5" 
                         onchange="window.appInstance.updateIngredientGrid('${ingredient.id}')">
                  <span id="width-value-${ingredient.id}">5</span>
                </div>
                <div class="slider-group">
                  <label>Grid Height (1-10):</label>
                  <input type="range" class="grid-slider" id="height-slider-${ingredient.id}" 
                         min="1" max="10" value="4" 
                         onchange="window.appInstance.updateIngredientGrid('${ingredient.id}')">
                  <span id="height-value-${ingredient.id}">4</span>
                </div>
              </div>
              
              <div class="ingredient-grid-container" id="grid-container-${ingredient.id}">
                ${this.generateFlexibleIngredientGrid(scaledMin, scaledMax, currentAmount, 5, 4)}
              </div>
              
              <div class="grid-legend">
                <div class="legend-item">
                  <div class="legend-color min-required"></div>
                  <span>Minimum Required (${this.formatAmount(scaledMin)})</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color max-allowed"></div>
                  <span>Maximum Allowed (${this.formatAmount(scaledMax)})</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color selected"></div>
                  <span>Current Selection</span>
                </div>
              </div>
            </div>
            ` : ''}
            
            <div class="ingredient-zone-status">
              ${isTransferred ? 
                '✅ Transferred to counter' : 
                `Available: ${availableInPantry} ${ingredient.unit}`
              }
            </div>
            <div class="ingredient-zone-transfer">
              <button class="btn-transfer" 
                ${canTransfer ? '' : 'disabled'} 
                onclick="window.appInstance.transferFlexibleIngredient('${ingredient.id}')">
                ${isTransferred ? 'Transferred' : 'Transfer Selected Amount'}
              </button>
            </div>
          </div>
        `;
      }
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
      const transferredAmount = this._bakingCounter.get(ingredient.id) || 0;
      
      if (flexIngredient.isFixed) {
        // Fixed ingredient - check exact amount
        const neededAmount = flexIngredient.fixedAmount * this._currentRecipeScalingFactor;
        if (transferredAmount < neededAmount - 0.01) {
          allTransferred = false;
          break;
        }
      } else if (flexIngredient.range) {
        // Flexible ingredient - check if transferred amount is within valid range
        const scaledMin = Math.ceil(flexIngredient.range.min * this._currentRecipeScalingFactor);
        const scaledMax = Math.ceil(flexIngredient.range.max * this._currentRecipeScalingFactor);
        
        // Must have transferred something and it must be within the valid range
        if (transferredAmount === 0 || transferredAmount < scaledMin || transferredAmount > scaledMax) {
          allTransferred = false;
          break;
        }
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
    
    // Capture actual ingredient amounts used before clearing baking counter
    this._usedIngredients.clear();
    this._bakingCounter.forEach((amount, ingredientId) => {
      this._usedIngredients.set(ingredientId, amount);
    });
    
    console.log('📊 Captured ingredient amounts:', Array.from(this._usedIngredients.entries()));
    
    // Show production interface instead of just alerting
    this.showProductionInterface();
  }

  @action
  public cancelCooking(): void {
    console.log('❌ Cooking cancelled');
    
    this._currentRecipe = null;
    this._currentStep = 0;
    this._bakingCounter.clear();
    this._usedIngredients.clear(); // Clear used ingredients tracking

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

    const outputTerm = this.getRecipeOutputTerm(this._currentRecipe);
    
    if (initialMath) initialMath.textContent = `Recipe produces ${initialItems} ${outputTerm}`;
    if (cuttingMath) cuttingMath.textContent = `${initialItems} ${outputTerm} × ${piecesPerItem} pieces each = ${totalPieces} pieces`;
    
    // Show precise division with quotient and remainder
    if (packagingMath) {
      if (remainingPieces > 0) {
        packagingMath.textContent = `${totalPieces} pieces ÷ ${piecesPerPackage} per package = ${totalPackages} packages + ${remainingPieces} loose pieces`;
      } else {
        packagingMath.textContent = `${totalPieces} pieces ÷ ${piecesPerPackage} per package = ${totalPackages} packages`;
      }
    }
    
    // Update comprehensive equation
    if (totalMathEq) {
      if (remainingPieces > 0) {
        totalMathEq.textContent = `${initialItems} ${outputTerm} × ${piecesPerItem} pieces/${outputTerm.slice(0, -1)} ÷ ${piecesPerPackage} pieces/package = ${totalPackages} packages + ${remainingPieces} loose`;
      } else {
        totalMathEq.textContent = `${initialItems} ${outputTerm} × ${piecesPerItem} pieces/${outputTerm.slice(0, -1)} ÷ ${piecesPerPackage} pieces/package = ${totalPackages} packages`;
      }
    }

    // Update totals with precise counts
    const initialTotal = document.getElementById('initial-total');
    const cuttingTotal = document.getElementById('cutting-total');
    const packagingTotal = document.getElementById('packaging-total');

    if (initialTotal) initialTotal.textContent = `Total: ${initialItems} ${outputTerm}`;
    if (cuttingTotal) cuttingTotal.textContent = `Total: ${totalPieces} pieces`;
    
    // Show packages and loose pieces
    if (packagingTotal) {
      if (remainingPieces > 0) {
        packagingTotal.textContent = `Total: ${totalPackages} packages + ${remainingPieces} loose pieces`;
      } else {
        packagingTotal.textContent = `Total: ${totalPackages} packages`;
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
      // Show all pieces without truncation
      for (let i = 0; i < totalPieces; i++) {
        piecesHTML += `<div class="visual-item piece">🔸</div>`;
      }
      piecesAfterCutting.innerHTML = piecesHTML;
    }

    // Step 3: Packaging visualization
    const piecesBeforePackaging = document.getElementById('pieces-before-packaging');
    const packagesAfterPackaging = document.getElementById('packages-after-packaging');

    if (piecesBeforePackaging) {
      let piecesHTML = '';
      // Show all pieces without truncation
      for (let i = 0; i < totalPieces; i++) {
        piecesHTML += `<div class="visual-item piece">🔸</div>`;
      }
      piecesBeforePackaging.innerHTML = piecesHTML;
    }

    if (packagesAfterPackaging) {
      let packagesHTML = '';
      
      // Show all packages without truncation
      for (let i = 0; i < totalPackages; i++) {
        packagesHTML += `<div class="visual-item package">📦</div>`;
      }
      
      // Show loose pieces if any (hide when remainder is 0)
      if (remainingPieces > 0) {
        packagesHTML += `<div class="visual-item-separator">│</div>`;
        for (let i = 0; i < remainingPieces; i++) {
          packagesHTML += `<div class="visual-item piece remaining">🔸</div>`;
        }
        packagesHTML += `<div class="visual-item-label">Loose Pieces</div>`;
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
    // Calculate price based on actual calories used in recipe
    const totalCalories = this.calculateRecipeCalories();
    const pricePerCalorie = 0.05; // 5 cents per calorie
    const calorieBasedPrice = totalCalories * pricePerCalorie;
    
    console.log(`💰 Calorie-based pricing: ${totalCalories.toFixed(1)} calories × $${pricePerCalorie} = $${calorieBasedPrice.toFixed(2)}`);
    
    // Return at least $0.50 minimum price
    return Math.max(calorieBasedPrice, 0.50);
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

  @action
  public buyIngredient(ingredientId: string, amount: number, price: number): void {
    let totalCost = amount * price;
    if (amount === 10) {
      totalCost *= 0.85;
    } else if (amount === 100) {
      totalCost *= 0.7;
    }

    if (this._gameState.money < totalCost) {
      this.showSalesNotification('Not enough money!', false);
      return;
    }

    this._gameState.money -= totalCost;
    this._gameState.pantry.addIngredient(ingredientId, amount);

    this._supplierStats.todaysOrders++;
    this.showSalesNotification(`Purchased ${amount} ${ingredientId} for ${totalCost.toFixed(2)}`);

    this.updateSupplierDisplay();
    this.populateRecipeCollection(); // Refresh recipe craftability
  }

  private updateSupplierDisplay(): void {
    const availableCoinsEl = document.getElementById('available-coins');
    const todaysOrdersEl = document.getElementById('todays-orders');
    const bulkSavingsEl = document.getElementById('bulk-savings');
    const supplierGridEl = document.getElementById('supplier-items-grid');

    if (availableCoinsEl) {
      availableCoinsEl.textContent = `${this._gameState.money.toFixed(2)}`;
    }
    if (todaysOrdersEl) {
      todaysOrdersEl.textContent = this._supplierStats.todaysOrders.toString();
    }
    if (bulkSavingsEl) {
      bulkSavingsEl.textContent = `${this._supplierStats.bulkSavings.toFixed(2)}`;
    }

    if (supplierGridEl) {
      supplierGridEl.innerHTML = '';
      const ingredients = this.ingredientService.getAllIngredients();

      ingredients.forEach(ingredient => {
        const price = ingredient.basePrice || 0.5;
        const canAfford = this._gameState.money >= price;

        const itemCard = document.createElement('div');
        itemCard.className = 'supplier-item-card';
        itemCard.innerHTML = `
          <div class="item-header">
            <div class="item-icon">${ingredient.icon}</div>
            <div class="item-name">${ingredient.name}</div>
            <div class="item-price">${price.toFixed(2)}</div>
          </div>
          <div class="item-description">${(ingredient as any).description || 'A basic ingredient.'}</div>
          <div class="item-actions">
            <button class="btn-buy" onclick="window.appInstance.buyIngredient('${ingredient.id}', 1, ${price})" ${!canAfford ? 'disabled' : ''}>Buy 1</button>
            <button class="btn-buy" onclick="window.appInstance.buyIngredient('${ingredient.id}', 10, ${price})" ${!canAfford ? 'disabled' : ''}>Buy 10 (15% off)</button>
            <button class="btn-buy" onclick="window.appInstance.buyIngredient('${ingredient.id}', 100, ${price})" ${!canAfford ? 'disabled' : ''}>Buy 100 (30% off)</button>
          </div>
        `;
        supplierGridEl.appendChild(itemCard);
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
                    ${this.getItemNutritionDisplay(item)}
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
      { id: 'sugar', name: 'Granulated Sugar', icon: '🍚', unit: 'teaspoons', basePrice: 0.02, description: 'Pure white sugar' },
      { id: 'vanilla', name: 'Vanilla Extract', icon: '🍦', unit: 'tsp', basePrice: 1.20, description: 'Pure vanilla extract' },
      { id: 'chocolate', name: 'Chocolate Chips', icon: '🍫', unit: 'pieces', basePrice: 0.10, description: 'Premium chocolate chips' }
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