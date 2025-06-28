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
  @observable private _currentRecipe: any | null = null;
  @observable private _currentStep: number = 0;
  @observable private _bakingCounter: Map<string, number> = new Map();
  @observable private _productionData = {
    initialItems: 2,
    piecesPerItem: 24,
    piecesPerPackage: 4
  };
  
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
    this.setupPantryStockModal();
    this.setupCookingInterface();
    this.setupProductionInterface();
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
    const cookingPanel = document.getElementById('cooking-step-panel');
    
    if (mathPanel) mathPanel.style.display = tabName === 'math' ? 'block' : 'none';
    if (transferPanel) transferPanel.style.display = tabName === 'transfer' ? 'block' : 'none';
    if (recipePanel) recipePanel.style.display = tabName === 'recipes' ? 'block' : 'none';
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
          <button class="btn-recipe primary" onclick="window.appInstance.startCooking('${recipe.id}')">
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

    // Setup pantry button after modal content is populated
    this.setupPantryButton();
  }

  private setupGlobalModalHandlers(): void {
    // Use event delegation for dynamic content
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Handle pantry button clicks
      if (target.id === 'btn-show-pantry') {
        e.preventDefault();
        console.log('Pantry button clicked via delegation');
        this.showPantryStock();
      }
      
      // Handle recipe details close button
      if (target.id === 'recipe-details-close') {
        e.preventDefault();
        console.log('Recipe details close button clicked via delegation');
        this.hideRecipeDetails();
      }
      
      // Handle pantry stock close button
      if (target.id === 'pantry-stock-close') {
        e.preventDefault();
        console.log('Pantry stock close button clicked via delegation');
        this.hidePantryStock();
      }
    });
  }

  private setupPantryStockModal(): void {
    const modal = document.getElementById('pantry-stock-modal');
    const closeBtn = document.getElementById('pantry-stock-close');
    
    if (!modal || !closeBtn) {
      console.error('Pantry stock modal elements not found');
      return;
    }

    // Close modal when clicking close button
    closeBtn.addEventListener('click', () => {
      this.hidePantryStock();
    });

    // Close modal when clicking outside the content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hidePantryStock();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        this.hidePantryStock();
      }
    });
  }

  private setupPantryButton(): void {
    const showPantryBtn = document.getElementById('btn-show-pantry');
    
    console.log('Setting up pantry button:', !!showPantryBtn);
    
    if (showPantryBtn) {
      // Remove any existing listeners - create bound function first
      const boundHandler = () => {
        console.log('Pantry button clicked');
        this.showPantryStock();
      };
      
      // Store the handler so we can remove it later if needed
      (showPantryBtn as any)._pantryHandler = boundHandler;
      
      // Add new listener
      showPantryBtn.addEventListener('click', boundHandler);
    } else {
      console.log('Pantry button not found in DOM');
    }
  }

  @action
  public showPantryStock(): void {
    console.log('📦 Showing pantry stock');

    // Update pantry stock display
    this.populatePantryStockModal();

    // Show modal
    const modal = document.getElementById('pantry-stock-modal');
    if (modal) {
      console.log('Pantry modal found, showing');
      modal.style.setProperty('display', 'flex', 'important');
      console.log('Pantry modal display style set to:', modal.style.display);
    } else {
      console.log('Pantry modal not found');
    }
  }

  @action
  public hidePantryStock(): void {
    console.log('Hiding pantry stock');
    const modal = document.getElementById('pantry-stock-modal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
    }
  }

  private populatePantryStockModal(): void {
    const gridEl = document.getElementById('pantry-stock-grid');
    if (!gridEl) return;

    let stockHTML = '';
    
    // Get all pantry stock
    const pantryStock = this._gameState.pantry.getAllStock();
    
    // Convert to array and sort by ingredient name
    const stockItems = Object.entries(pantryStock).sort((a, b) => {
      const nameA = a[1].ingredient?.name || a[0];
      const nameB = b[1].ingredient?.name || b[0];
      return nameA.localeCompare(nameB);
    });

    stockItems.forEach(([ingredientId, stockData]) => {
      const ingredient = stockData.ingredient;
      const amount = stockData.amount;
      
      if (ingredient) {
        // Determine amount status for color coding
        let amountClass = 'pantry-stock-amount';
        if (amount === 0) {
          amountClass += ' empty';
        } else if (amount <= 5) {
          amountClass += ' low';
        }

        stockHTML += `
          <div class="pantry-stock-item">
            <div class="pantry-stock-item-header">
              <div class="pantry-stock-icon">${ingredient.icon}</div>
              <div class="pantry-stock-name">${ingredient.name}</div>
            </div>
            <div class="${amountClass}">
              ${amount} ${ingredient.unit}
            </div>
          </div>
        `;
      }
    });

    if (stockHTML === '') {
      gridEl.innerHTML = '<div class="pantry-stock-item"><div class="pantry-stock-name">No ingredients in pantry</div></div>';
    } else {
      gridEl.innerHTML = stockHTML;
    }
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
      const neededAmount = flexIngredient.isFixed ? 
        flexIngredient.fixedAmount : 
        flexIngredient.range?.recommended || flexIngredient.range?.min || 0;
      
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
            <div class="ingredient-zone-amount">${neededAmount} ${ingredient.unit}</div>
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
      const neededAmount = flexIngredient.isFixed ? 
        flexIngredient.fixedAmount : 
        flexIngredient.range?.recommended || flexIngredient.range?.min || 0;
      
      const transferredAmount = this._bakingCounter.get(ingredient.id) || 0;
      if (transferredAmount < neededAmount) {
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

    // Update slider values
    const cuttingValue = document.getElementById('cutting-value');
    const packagingValue = document.getElementById('packaging-value');
    
    if (cuttingValue) cuttingValue.textContent = piecesPerItem.toString();
    if (packagingValue) packagingValue.textContent = piecesPerPackage.toString();

    // Update math displays
    const initialMath = document.getElementById('initial-math');
    const cuttingMath = document.getElementById('cutting-math');
    const packagingMath = document.getElementById('packaging-math');
    const totalMathEq = document.getElementById('total-math-equation');

    if (initialMath) initialMath.textContent = `Recipe produces ${initialItems} items`;
    if (cuttingMath) cuttingMath.textContent = `${initialItems} items × ${piecesPerItem} pieces each = ${totalPieces} pieces`;
    if (packagingMath) packagingMath.textContent = `${totalPieces} pieces ÷ ${piecesPerPackage} per package = ${totalPackages} packages`;
    if (totalMathEq) totalMathEq.textContent = `${initialItems} items × ${piecesPerItem} pieces/item ÷ ${piecesPerPackage} pieces/package = ${totalPackages} packages`;

    // Update totals
    const initialTotal = document.getElementById('initial-total');
    const cuttingTotal = document.getElementById('cutting-total');
    const packagingTotal = document.getElementById('packaging-total');

    if (initialTotal) initialTotal.textContent = `Total: ${initialItems} items`;
    if (cuttingTotal) cuttingTotal.textContent = `Total: ${totalPieces} pieces`;
    if (packagingTotal) packagingTotal.textContent = `Total: ${totalPackages} packages`;

    // Update visual representations
    this.updateProductionVisuals();
  }

  private updateProductionVisuals(): void {
    const { initialItems, piecesPerItem, piecesPerPackage } = this._productionData;
    const totalPieces = initialItems * piecesPerItem;
    const totalPackages = Math.floor(totalPieces / piecesPerPackage);
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
      for (let i = 0; i < maxDisplayPackages; i++) {
        packagesHTML += `<div class="visual-item package">📦</div>`;
      }
      if (totalPackages > maxDisplayPackages) {
        packagesHTML += `<div class="visual-item package">+${totalPackages - maxDisplayPackages}</div>`;
      }
      packagesAfterPackaging.innerHTML = packagesHTML;
    }
  }

  @action
  private finishProduction(): void {
    console.log('✅ Production finished');
    
    // Here you could add the produced items to inventory
    // For now, just show a success message
    const { initialItems, piecesPerItem, piecesPerPackage } = this._productionData;
    const totalPackages = Math.floor(initialItems * piecesPerItem / piecesPerPackage);
    
    alert(`Great job! You produced ${totalPackages} packages of ${this._currentRecipe?.name}! 🎉`);
    
    this.hideProductionInterface();
    this.cancelCooking();
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