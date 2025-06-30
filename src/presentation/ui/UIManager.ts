import { Application } from '@/core/engine/Application';
import { RecipeShop } from '@/domain/store';

export class UIManager {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public setupUI(): void {
    this.setupTabNavigation();
    this.setupRecipeDetailsModal();
    this.setupCookingInterface();
    this.setupStoreInterface();
    this.setupSupplierInterface();
    this.setupRecipeControls();
  }

  public setupTabNavigation(): void {
    const tabs = ['math', 'transfer', 'recipes', 'supplier', 'store'];
    
    console.log('🔧 Setting up tab navigation for:', tabs);
    
    tabs.forEach(tabName => {
      const tabBtn = document.getElementById(`${tabName}-tab`);
      if (tabBtn) {
        console.log(`✅ Found tab button: ${tabName}-tab`);
        tabBtn.addEventListener('click', () => {
          console.log(`🖱️ Tab clicked: ${tabName}`);
          this.app.switchToTab(tabName);
        });
      } else {
        console.error(`❌ Tab button not found: ${tabName}-tab`);
      }
    });
  }

  public setupRecipeDetailsModal(): void {
    const modal = document.getElementById('recipe-details-modal');
    // Support old and new close button IDs
    const closeBtn = document.getElementById('recipe-details-close') || document.getElementById('btn-close-recipe-details');
    const cookBtn = document.getElementById('btn-cook-recipe');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });
    }

    if (cookBtn) {
      cookBtn.addEventListener('click', () => {
        const titleEl = document.getElementById('recipe-details-title');
        if (titleEl && titleEl.textContent) {
          this.app.startCooking(titleEl.textContent);
          if (modal) modal.style.display = 'none';
        }
      });
    }

    // --- Recipe scaling buttons ---
    const halveBtn = document.getElementById('btn-halve-recipe');
    const doubleBtn = document.getElementById('btn-double-recipe');
    const resetBtn = document.getElementById('btn-reset-recipe');

    if (halveBtn) {
      halveBtn.addEventListener('click', () => {
        this.app.scaleRecipe(0.5);
      });
    }

    if (doubleBtn) {
      doubleBtn.addEventListener('click', () => {
        this.app.scaleRecipe(2);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.app.resetRecipeScaling();
      });
    }

    // Close modal when clicking outside
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
  }

  public setupCookingInterface(): void {
    // Button to proceed to the next cooking step
    const proceedBtn = document.getElementById('btn-proceed') || document.getElementById('btn-proceed-step');
    const cancelBtn = document.getElementById('btn-cancel-cooking');
    const finishProductionBtn = document.getElementById('btn-finish-production');

    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        this.app.proceedToNextStep();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.app.cancelCooking();
      });
    }

    if (finishProductionBtn) {
      finishProductionBtn.addEventListener('click', () => {
        this.app.finishProduction();
      });
    }
  }

  public setupStoreInterface(): void {
    const closeBtn = document.getElementById('btn-close-store');
    const locationSelect = document.getElementById('location-select') as HTMLSelectElement;

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.app.switchToTab('recipes');
      });
    }

    if (locationSelect) {
      locationSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        // TODO: Implement updateStoreLocation method
        console.log('Store location changed:', target.value);
      });
    }
  }

  public setupSupplierInterface(): void {
    const closeBtn = document.getElementById('btn-close-supplier');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.app.switchToTab('recipes');
      });
    }
  }

  public setupRecipeControls(): void {
    const sortSelect = document.getElementById('recipe-sort') as HTMLSelectElement;
    const filterSelect = document.getElementById('recipe-filter') as HTMLSelectElement;
    const recipeShopBtn = document.getElementById('btn-recipe-shop');
    const advancedModeBtn = document.getElementById('btn-advanced-mode');
    const saveGameBtn = document.getElementById('btn-save-game');
    const loadGameBtn = document.getElementById('btn-load-game');

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const sortBy = (e.target as HTMLSelectElement).value;
        // TODO: Implement sortRecipes method
        console.log('Sort recipes by:', sortBy);
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        const filterBy = (e.target as HTMLSelectElement).value;
        // TODO: Implement filterRecipes method
        console.log('Filter recipes by:', filterBy);
      });
    }

    if (recipeShopBtn) {
      recipeShopBtn.addEventListener('click', () => {
        this.app.openRecipeShop();
      });
    }

    if (advancedModeBtn) {
      this.updateAdvancedModeButton(advancedModeBtn);
      advancedModeBtn.addEventListener('click', () => {
        this.app.toggleAdvancedMode();
        this.updateAdvancedModeButton(advancedModeBtn);
      });
    }

    if (saveGameBtn) {
      saveGameBtn.addEventListener('click', () => {
        // TODO: Implement saveGame method
        console.log('Save game');
      });
    }

    if (loadGameBtn) {
      loadGameBtn.addEventListener('click', () => {
        // TODO: Implement loadGame method
        console.log('Load game');
      });
    }
  }

  public populateRecipeCollection(recipes: any[], gameState: any): void {
    // Attempt to find recipe grid container (id updated in HTML)
    const recipesGrid = document.getElementById('recipe-grid') || document.getElementById('recipes-grid');
    if (!recipesGrid) return;

    let recipesHTML = '';
    
    recipes.forEach(recipe => {
      const currentServings = this.app.getCurrentServings ? this.app.getCurrentServings(recipe.id) : recipe.baseServings;
      const scaleFactor = currentServings / recipe.baseServings;
      const scaledIngredients = recipe.ingredients.map((ing: any) => ing.multiply(scaleFactor));
      const canMakeRecipe = gameState.pantry.canSupport(scaledIngredients);
      const buttonClass = canMakeRecipe ? 'btn-recipe primary' : 'btn-recipe disabled';
      
      recipesHTML += `
        <div class="recipe-card ${canMakeRecipe ? 'available' : 'unavailable'}">
          <div class="recipe-header">
            <span class="recipe-icon">${recipe.icon}</span>
            <h3 class="recipe-title">${recipe.name}</h3>
          </div>
          <p class="recipe-description">${recipe.description}</p>
          <div class="recipe-meta">
            <span class="recipe-servings current-servings">👥 ${currentServings} servings</span>
            <span class="recipe-time">⏱️ ${recipe.bakingTime}min</span>
            <span class="recipe-difficulty">📊 ${recipe.difficulty}</span>
          </div>
          <div class="recipe-actions">
            <button class="${buttonClass}" onclick="window.appInstance.startCooking('${recipe.id}')" ${canMakeRecipe ? '' : 'disabled'}>
              ${canMakeRecipe ? 'Cook Recipe' : 'Missing Ingredients'}
            </button>
            <button class="btn-recipe secondary" data-recipe-id="${recipe.id}" onclick="window.appInstance.showRecipeDetails('${recipe.id}')">
              Details
            </button>
          </div>
        </div>
      `;
    });

    recipesGrid.innerHTML = recipesHTML;
  }

  public populateRecipeDetailsModal(recipe: any, recipeScaling: any): void {
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
      const productionInfo = this.app.getRecipeProductionInfo(recipe);
      
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
              amountDisplay = `${this.app.formatAmount(scaledAmount)} ${ingredient.unit}`;
              requiredAmount = scaledAmount;
            } else if (flexIngredient.range) {
              amountClass += ' flexible';
              const range = flexIngredient.range;
              const scaledMin = range.min * recipeScaling.scalingFactor;
              const scaledMax = range.max * recipeScaling.scalingFactor;
              const scaledRecommended = (range.recommended || range.min) * recipeScaling.scalingFactor;
              amountDisplay = `${this.app.formatAmount(scaledMin)}-${this.app.formatAmount(scaledMax)} ${ingredient.unit} (recommended: ${this.app.formatAmount(scaledRecommended)})`;
              requiredAmount = scaledRecommended;
              if (flexIngredient.description) {
                notes = `<div class="ingredient-notes">${flexIngredient.description}</div>`;
              }
            }
            
            // Get pantry supply and calculate color
            const pantrySupply = this.app.gameState.pantry.getStock(ingredient.id);
            const supplyRatio = requiredAmount > 0 ? pantrySupply / requiredAmount : 0;
            let supplyClass = 'ingredient-supply insufficient';
            if (supplyRatio >= 1) {
              supplyClass = 'ingredient-supply sufficient';
            } else if (supplyRatio >= 0.5) {
              supplyClass = 'ingredient-supply low';
            }
            
            ingredientsHTML += `
              <div class="ingredient-item ${flexIngredient.isFixed ? 'fixed' : 'flexible'}">
                <div class="ingredient-info">
                  <div class="ingredient-header">
                    <span class="ingredient-icon">${ingredient.icon}</span>
                    <span class="ingredient-name">${ingredient.name}</span>
                    <span class="${amountClass}">${amountDisplay}</span>
                  </div>
                  <div class="${supplyClass}">
                    Have: ${this.app.formatAmount(pantrySupply)} ${ingredient.unit}
                  </div>
                  ${notes}
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

    // Populate steps
    if (stepsEl) {
      let stepsHTML = '';
      
      recipe.steps.forEach((step: any, index: number) => {
        stepsHTML += `
          <div class="recipe-step">
            <div class="step-header">
              <span class="step-number">${index + 1}</span>
              <span class="step-name">${step.name}</span>
              <span class="step-time">⏱️ ${step.time || 'No time specified'}</span>
            </div>
            <div class="step-instructions">
              ${step.instructions.map((instruction: string) => 
                `<div class="instruction">${instruction}</div>`
              ).join('')}
            </div>
          </div>
        `;
      });
      
      stepsEl.innerHTML = stepsHTML;
    }
  }

  public populateCookingStep(recipe: any, step: any, currentStep: number): void {
    const stepNumberEl = document.getElementById('cooking-step-number');
    const stepNameEl = document.getElementById('cooking-step-name');
    const stepInstructionsEl = document.getElementById('cooking-step-instructions');
    const ingredientsZoneEl = document.getElementById('ingredients-zone');

    if (stepNumberEl) stepNumberEl.textContent = `Step ${currentStep + 1}`;
    if (stepNameEl) stepNameEl.textContent = step.name;
    
    if (stepInstructionsEl) {
      stepInstructionsEl.innerHTML = step.instructions
        .map((instruction: string) => `<p>${instruction}</p>`)
        .join('');
    }

    if (ingredientsZoneEl && step.ingredients.length > 0) {
      let ingredientsHTML = '';
      
      step.ingredients.forEach((flexIngredient: any) => {
        const ingredient = flexIngredient.ingredient;
        
        if (flexIngredient.isFixed) {
          // Fixed ingredient - simple transfer
          const needed = flexIngredient.fixedAmount;
          const available = this.app.gameState.pantry.getStock(ingredient.id);
          const canTransfer = available >= needed;
          
          ingredientsHTML += `
            <div class="ingredient-transfer">
              <div class="ingredient-info">
                <span class="ingredient-icon">${ingredient.icon}</span>
                <span class="ingredient-name">${ingredient.name}</span>
                <span class="ingredient-amount">Need: ${this.app.formatAmount(needed)} ${ingredient.unit}</span>
                <span class="ingredient-available">Available: ${this.app.formatAmount(available)} ${ingredient.unit}</span>
              </div>
              <button class="btn-transfer ${canTransfer ? 'enabled' : 'disabled'}" 
                      data-ingredient-id="${ingredient.id}"
                      data-amount="${needed}"
                      ${canTransfer ? '' : 'disabled'}
                      onclick="window.appInstance.transferIngredient('${ingredient.id}', ${needed})">
                Transfer ${this.app.formatAmount(needed)} ${ingredient.unit}
              </button>
            </div>
          `;
        } else if (flexIngredient.range) {
          // Flexible ingredient - slider interface
          const range = flexIngredient.range;
          const available = this.app.gameState.pantry.getStock(ingredient.id);
          const maxTransferable = Math.min(range.max, available);
          const recommended = range.recommended || range.min;
          
          ingredientsHTML += `
            <div class="flexible-ingredient-transfer">
              <div class="ingredient-info">
                <span class="ingredient-icon">${ingredient.icon}</span>
                <span class="ingredient-name">${ingredient.name}</span>
                <span class="ingredient-range">Range: ${this.app.formatAmount(range.min)}-${this.app.formatAmount(range.max)} ${ingredient.unit}</span>
                <span class="ingredient-available">Available: ${this.app.formatAmount(available)} ${ingredient.unit}</span>
                ${flexIngredient.description ? `<div class="ingredient-description">${flexIngredient.description}</div>` : ''}
              </div>
              
              <div class="flexible-controls">
                <div class="amount-display">
                  <span>Amount: </span>
                  <span class="current-amount" id="amount-${ingredient.id}">${this.app.formatAmount(recommended)}</span>
                  <span> ${ingredient.unit}</span>
                </div>
                
                <input type="range" 
                       class="amount-slider"
                       id="slider-${ingredient.id}"
                       min="${range.min}" 
                       max="${maxTransferable}" 
                       step="0.1" 
                       value="${recommended}"
                       data-ingredient-id="${ingredient.id}">
                
                <button class="btn-transfer-flexible" 
                        data-ingredient-id="${ingredient.id}"
                        onclick="window.appInstance.transferFlexibleIngredient('${ingredient.id}')">
                  Transfer
                </button>
              </div>
              
              <!-- Flexible Ingredient Grid Visualization -->
              <div class="flexible-ingredient-grid" id="grid-${ingredient.id}">
                <!-- 10x10 grid will be populated by JavaScript -->
              </div>
            </div>
          `;
        }
      });
      
      ingredientsZoneEl.innerHTML = ingredientsHTML;
      
      // Setup flexible ingredient sliders
      step.ingredients.forEach((flexIngredient: any) => {
        if (flexIngredient.range) {
          this.setupFlexibleIngredientSlider(flexIngredient);
        }
      });
    }
  }

  public setupFlexibleIngredientSlider(flexIngredient: any): void {
    const ingredient = flexIngredient.ingredient;
    const slider = document.getElementById(`slider-${ingredient.id}`) as HTMLInputElement;
    const amountDisplay = document.getElementById(`amount-${ingredient.id}`);
    
    if (slider && amountDisplay) {
      slider.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        amountDisplay.textContent = this.app.formatAmount(value);
        this.updateFlexibleIngredientGrid(ingredient.id, value, flexIngredient.range);
      });
      
      // Initialize grid
      this.updateFlexibleIngredientGrid(ingredient.id, parseFloat(slider.value), flexIngredient.range);
    }
  }

  public updateFlexibleIngredientGrid(ingredientId: string, currentAmount: number, range: any): void {
    const gridEl = document.getElementById(`grid-${ingredientId}`);
    if (!gridEl) return;

    const { min, max } = range;
    const totalCells = 100; // 10x10 grid
    
    let gridHTML = '';
    for (let i = 0; i < totalCells; i++) {
      const cellValue = min + (i / totalCells) * (max - min);
      let cellClass = 'grid-cell';
      
      if (cellValue <= currentAmount) {
        if (cellValue <= min + (max - min) * 0.3) {
          cellClass += ' min-range'; // Light color for minimum range
        } else {
          cellClass += ' current-amount'; // Darker color for current amount
        }
      } else if (cellValue <= max) {
        cellClass += ' max-range'; // Different color for maximum range
      }
      
      gridHTML += `<div class="${cellClass}"></div>`;
    }
    
    gridHTML = `<div class="grid-container">${gridHTML}</div>`;
    gridHTML += `<div class="grid-legend">
      <span class="legend-item"><span class="legend-color min-range"></span> Minimum</span>
      <span class="legend-item"><span class="legend-color current-amount"></span> Current</span>
      <span class="legend-item"><span class="legend-color max-range"></span> Available</span>
    </div>`;
    
    gridEl.innerHTML = gridHTML;
  }

  public updateAdvancedModeButton(button: HTMLElement): void {
    const isAdvanced = this.app.isAdvancedMode;
    button.textContent = isAdvanced ? '📚 Switch to Simple Mode' : '🔬 Switch to Advanced Mode';
    button.className = isAdvanced ? 'btn-advanced-mode active' : 'btn-advanced-mode';
  }

  public updateRecipeScalingDisplay(recipe: any, scaling: any): void {
    const servingsDisplays = document.querySelectorAll(`[data-recipe-id="${recipe.id}"] .current-servings`);
    servingsDisplays.forEach(display => {
      if (display.textContent) {
        display.textContent = scaling.currentServings.toString();
      }
    });
  }

  public updateProceedButton(canProceed: boolean): void {
    const proceedBtn = document.getElementById('btn-proceed-step') as HTMLButtonElement;
    if (proceedBtn) {
      proceedBtn.disabled = !canProceed;
      proceedBtn.textContent = canProceed ? 'Proceed to Next Step' : 'Complete ingredient transfers first';
    }
  }

  public updateStoreDisplay(storeItems: any[], stats: any): void {
    // Update header stats
    const totalRevenueEl = document.getElementById('total-revenue');
    const itemsInStockEl = document.getElementById('items-in-stock');
    const storeValueEl = document.getElementById('store-value');
    const salesTodayEl = document.getElementById('sales-today');

    if (totalRevenueEl) totalRevenueEl.textContent = `$${stats.totalRevenue.toFixed(2)}`;
    if (itemsInStockEl) itemsInStockEl.textContent = stats.itemsInStock.toString();
    if (storeValueEl) storeValueEl.textContent = `$${stats.storeValue.toFixed(2)}`;
    if (salesTodayEl) salesTodayEl.textContent = stats.salesToday.toString();

    // Group items by category
    const categories = ['baked-goods', 'packages', 'ingredients'];
    
    categories.forEach(category => {
      const sectionEl = document.getElementById(`${category}-section`);
      const gridEl = document.getElementById(`${category}-grid`);
      const countEl = document.getElementById(`${category}-count`);
      
      if (!sectionEl || !gridEl || !countEl) return;
      
      const categoryItems = storeItems.filter(item => item.category === category);
      countEl.textContent = `${categoryItems.length} items`;
      
      if (categoryItems.length === 0) {
        gridEl.innerHTML = `
          <div class="empty-inventory">
            <div class="empty-inventory-icon">${this.getCategoryIcon(category)}</div>
            <div class="empty-inventory-text">No ${category.replace('-', ' ')} in stock</div>
            <div class="empty-inventory-hint">Complete recipes to add items to your store</div>
          </div>
        `;
      } else {
        let itemsHTML = '';
        categoryItems.forEach(item => {
          itemsHTML += this.createStoreItemHTML(item);
        });
        gridEl.innerHTML = itemsHTML;
      }
    });
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'baked-goods': '🧁',
      'packages': '📦', 
      'ingredients': '🌾'
    };
    return icons[category] || '📦';
  }

  private createStoreItemHTML(item: any): string {
    return `
      <div class="store-item-card">
        <div class="store-item-header">
          <div class="store-item-info">
            <span class="store-item-icon">${item.icon}</span>
            <div class="store-item-details">
              <h4 class="store-item-name">${item.name}</h4>
              <p class="store-item-quantity">${item.quantity} available</p>
              ${item.nutrition ? `<div class="store-item-nutrition">🔥 ${item.nutrition.totalCalories} cal</div>` : ''}
            </div>
          </div>
          <div class="store-item-pricing">
            <p class="store-item-price">$${item.currentPrice.toFixed(2)}</p>
            ${item.basePrice !== item.currentPrice ? `<p class="store-item-base-price">$${item.basePrice.toFixed(2)}</p>` : ''}
          </div>
        </div>
        
        ${item.modifiers ? this.createModifiersHTML(item.modifiers) : ''}
        ${item.nutrition ? this.createNutritionHTML(item.nutrition) : ''}
        
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
  }

  private createModifiersHTML(modifiers: any): string {
    return `
      <div class="store-item-modifiers">
        <div class="store-item-modifiers-title">Price Factors</div>
        <div class="modifiers-grid">
          ${Object.entries(modifiers).map(([key, value]: [string, any]) => `
            <div class="modifier-item">
              <span class="modifier-name">${key}</span>
              <span class="modifier-value ${value > 1 ? 'positive' : value < 1 ? 'negative' : ''}">
                ${value > 1 ? '+' : ''}${((value - 1) * 100).toFixed(0)}%
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private createNutritionHTML(nutrition: any): string {
    return `
      <div class="store-item-nutrition-details">
        <div class="nutrition-summary">
          <span class="calories">${nutrition.totalCalories} calories</span>
          <span class="macros">${nutrition.macros || 'Mixed ingredients'}</span>
        </div>
        ${nutrition.ingredients ? `
          <div class="ingredients-list">
            <div class="ingredients-title">Ingredients</div>
            <div class="ingredients-tags">
              ${nutrition.ingredients.map((ing: string) => `
                <span class="ingredient-tag">${ing}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  public updateSupplierDisplay(stats: any, ingredients: any[]): void {
    // Update stats
    const availableCoinsEl = document.getElementById('available-coins');
    const todaysOrdersEl = document.getElementById('todays-orders');
    const bulkSavingsEl = document.getElementById('bulk-savings');

    if (availableCoinsEl) {
      availableCoinsEl.textContent = `$${stats.totalRevenue.toFixed(2)}`;
    }

    if (todaysOrdersEl) {
      todaysOrdersEl.textContent = stats.todaysOrders.toString();
    }

    if (bulkSavingsEl) {
      bulkSavingsEl.textContent = `$${stats.bulkSavings.toFixed(2)}`;
    }

    // Populate supplier items
    this.populateSupplierItems(ingredients, stats.totalRevenue);
  }

  public populateSupplierItems(ingredients: any[], availableCoins: number): void {
    const supplierGrid = document.getElementById('supplier-items-grid');
    if (!supplierGrid) return;
    
    let itemsHTML = '';
    ingredients.forEach(ingredient => {
      const currentStock = this.app.gameState.pantry.getStock(ingredient.id);
      itemsHTML += this.createSupplierItemHTML(ingredient, currentStock, availableCoins);
    });

    supplierGrid.innerHTML = itemsHTML;
  }

  private createSupplierItemHTML(ingredient: any, currentStock: number, availableCoins: number): string {
    const quantities = [1, 10, 100];
    let buttonsHTML = '';
    
    quantities.forEach(qty => {
      const totalCost = this.app.calculateTotalCost(ingredient.basePrice, qty);
      const canAfford = availableCoins >= totalCost;
      const savings = this.app.calculateSavings(ingredient.basePrice, qty);
      const pricePerUnit = totalCost / qty;
      
      buttonsHTML += `
        <button class="btn-purchase ${canAfford ? '' : 'disabled'}" 
                ${canAfford ? '' : 'disabled'}
                onclick="appInstance.purchaseIngredient('${ingredient.id}', ${qty})">
          +${qty} $${pricePerUnit.toFixed(2)}/${ingredient.unit} $${totalCost.toFixed(2)}
          ${savings > 0 ? ` Save $${savings.toFixed(2)} (${qty === 10 ? '15' : '30'}% off)` : ''}
        </button>
      `;
    });
    
    return `
      <div class="supplier-item-card">
        <div class="supplier-item-header">
          <span class="supplier-item-icon">${ingredient.icon}</span>
          <div class="supplier-item-details">
            <h4 class="supplier-item-name">${ingredient.name}</h4>
            <p class="supplier-item-description">${ingredient.description}</p>
            <p class="supplier-item-stock">${currentStock} ${ingredient.unit}</p>
          </div>
        </div>
        <div class="supplier-item-pricing">
          <div class="base-price">Base: $${ingredient.basePrice.toFixed(2)}/${ingredient.unit}</div>
          <div class="bulk-options">
            ${buttonsHTML}
          </div>
        </div>
      </div>
    `;
  }

  public showSalesNotification(message: string): void {
    const notification = document.getElementById('sales-notification');
    if (notification) {
      notification.textContent = message;
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
  }

  public showPurchaseConfirmation(ingredientName: string, quantity: number, cost: number, savings: number): void {
    const confirmation = document.createElement('div');
    confirmation.className = 'purchase-confirmation';
    
    let message = `🎉 Purchased ${quantity} ${ingredientName} for $${cost.toFixed(2)}`;
    if (savings > 0) {
      message += ` (Saved $${savings.toFixed(2)}!)`;
    }
    
    confirmation.innerHTML = `
      <div class="confirmation-content">
        <div class="confirmation-icon">✅</div>
        <div class="confirmation-message">${message}</div>
      </div>
    `;
    
    document.body.appendChild(confirmation);
    
    // Show confirmation
    setTimeout(() => {
      confirmation.classList.add('show');
    }, 100);
    
    // Hide and remove after 3 seconds
    setTimeout(() => {
      confirmation.classList.add('hide');
      setTimeout(() => {
        document.body.removeChild(confirmation);
      }, 300);
    }, 3000);
  }

  // Recipe Shop Methods
  public createRecipeShopModal(): void {
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
              <span class="currency-icon">💰</span>
              <span class="currency-amount" id="player-coins">$${this.app.gameState.store.getTotalRevenue().toFixed(2)}</span>
              <span class="currency-label">Available Funds</span>
            </div>
          </div>
          
          <div class="recipe-shop-categories">
            <button class="shop-category-btn active" data-category="all">🛒 All</button>
            <button class="shop-category-btn" data-category="starter">🌟 Starter</button>
            <button class="shop-category-btn" data-category="intermediate">🏆 Intermediate</button>
            <button class="shop-category-btn" data-category="advanced">👑 Advanced</button>
          </div>
          
          <div class="recipe-shop-controls">
            <div class="shop-control-group">
              <label for="recipe-sort">Sort by:</label>
              <select id="recipe-sort" class="shop-select">
                <option value="name">📝 Name</option>
                <option value="price-low">💰 Price (Low to High)</option>
                <option value="price-high">💸 Price (High to Low)</option>
                <option value="level">🎯 Level Required</option>
                <option value="time">⏱️ Baking Time</option>
                <option value="difficulty">📊 Difficulty</option>
                <option value="random">🎲 Random</option>
              </select>
            </div>
            
            <div class="shop-control-group">
              <label for="recipe-filter">Show:</label>
              <select id="recipe-filter" class="shop-select">
                <option value="all">🛒 All Recipes</option>
                <option value="purchasable">✅ Can Purchase</option>
                <option value="owned">🏆 Owned</option>
                <option value="locked">🔒 Locked</option>
                <option value="coming-soon">🚧 Coming Soon</option>
                <option value="affordable">💰 Affordable</option>
              </select>
            </div>
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
    
    // Populate with all recipes
    this.populateRecipeShop('all', 'name', 'all');
  }

  public setupRecipeShopModal(): void {
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
        
        // Load category with current sort and filter
        if (category) {
          this.refreshRecipeShop();
        }
      });
    });
    
    // Sort and filter controls
    const sortSelect = document.getElementById('recipe-sort') as HTMLSelectElement;
    const filterSelect = document.getElementById('recipe-filter') as HTMLSelectElement;
    
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.refreshRecipeShop();
      });
    }
    
    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        this.refreshRecipeShop();
      });
    }
  }

  public refreshRecipeShop(): void {
    const activeCategory = document.querySelector('.shop-category-btn.active')?.getAttribute('data-category') || 'all';
    const sortSelect = document.getElementById('recipe-sort') as HTMLSelectElement;
    const filterSelect = document.getElementById('recipe-filter') as HTMLSelectElement;
    
    const sortBy = sortSelect?.value || 'name';
    const filterBy = filterSelect?.value || 'all';
    
    this.populateRecipeShop(activeCategory, sortBy, filterBy);
  }

  public populateRecipeShop(category: string, sortBy: string = 'name', filterBy: string = 'all'): void {
    const shopGrid = document.getElementById('recipe-shop-grid');
    if (!shopGrid) return;

    // Get real shop recipes from RecipeShop service
    let shopRecipes = RecipeShop.getAvailableRecipes(this.app.gameState);
    
    // Filter by category if specified
    if (category !== 'all') {
      shopRecipes = RecipeShop.filterRecipesByCategory(shopRecipes, category);
    }
    
    // Apply additional filters
    shopRecipes = this.applyRecipeFilter(shopRecipes, filterBy);
    
    // Apply sorting
    shopRecipes = this.sortRecipes(shopRecipes, sortBy);
    
    const playerRevenue = this.app.gameState.store.getTotalRevenue();
    
    let recipesHTML = '';
    shopRecipes.forEach((shopRecipe: any) => {
      const recipe = shopRecipe.recipe;
      const isOwned = shopRecipe.isOwned;
      const canAfford = playerRevenue >= shopRecipe.price;
      const meetsLevel = this.app.gameState.currentLevel >= shopRecipe.levelRequirement;
      const isPurchasable = shopRecipe.isPurchasable;
      
      let statusBadge = '';
      let buttonHTML = '';
      
      if (isOwned) {
        statusBadge = '<span class="owned-badge">✅ Owned</span>';
        buttonHTML = '<button class="btn-shop-recipe owned" disabled>Already Owned</button>';
      } else if (shopRecipe.comingSoon) {
        statusBadge = `<span class="coming-soon-badge">🚧 Coming Soon</span>`;
        buttonHTML = `<button class="btn-shop-recipe coming-soon" disabled>Coming Soon - $${shopRecipe.price.toFixed(2)}</button>`;
      } else if (!meetsLevel) {
        statusBadge = `<span class="level-required">🔒 Level ${shopRecipe.levelRequirement}</span>`;
        buttonHTML = `<button class="btn-shop-recipe locked" disabled>Requires Level ${shopRecipe.levelRequirement}</button>`;
      } else if (!canAfford) {
        statusBadge = `<span class="price-tag expensive">💰 $${shopRecipe.price.toFixed(2)}</span>`;
        buttonHTML = `<button class="btn-shop-recipe expensive" disabled>Insufficient Funds ($${shopRecipe.price.toFixed(2)})</button>`;
      } else {
        statusBadge = `<span class="price-tag affordable">💰 $${shopRecipe.price.toFixed(2)}</span>`;
        buttonHTML = `<button class="btn-shop-recipe purchase" onclick="appInstance.purchaseRecipe('${shopRecipe.id}')">
          Purchase for $${shopRecipe.price.toFixed(2)}
        </button>`;
      }
      
      const cardClass = isOwned ? 'owned' : 
                       shopRecipe.comingSoon ? 'coming-soon' :
                       isPurchasable ? 'purchasable' : 'locked';
      
      recipesHTML += `
        <div class="shop-recipe-card ${cardClass}">
          <div class="shop-recipe-header">
            <div class="shop-recipe-icon">${recipe.icon}</div>
            <div class="shop-recipe-info">
              <div class="shop-recipe-name">${recipe.name}</div>
              <div class="shop-recipe-difficulty ${shopRecipe.category}">${shopRecipe.category.charAt(0).toUpperCase() + shopRecipe.category.slice(1)}</div>
            </div>
            <div class="shop-recipe-price">
              ${statusBadge}
            </div>
          </div>
          
          <div class="shop-recipe-description">${shopRecipe.description}</div>
          
          <div class="shop-recipe-features">
            <span class="recipe-feature">⏱️ ${recipe.bakingTime}min</span>
            <span class="recipe-feature">🍽️ ${recipe.baseServings} servings</span>
            <span class="recipe-feature">📊 ${recipe.difficulty}</span>
          </div>
          
          <div class="shop-recipe-actions">
            ${buttonHTML}
          </div>
        </div>
      `;
    });

    if (shopRecipes.length === 0) {
      recipesHTML = `
        <div class="empty-shop-message">
          <div class="empty-shop-icon">🛒</div>
          <div class="empty-shop-text">No recipes available in this category</div>
          <div class="empty-shop-hint">Try a different category or level up to unlock more recipes!</div>
        </div>
      `;
    }

    shopGrid.innerHTML = recipesHTML;
    
    // Update currency display
    const currencyAmount = document.getElementById('player-coins');
    if (currencyAmount) {
      currencyAmount.textContent = `$${playerRevenue.toFixed(2)}`;
    }
  }

  private applyRecipeFilter(recipes: any[], filterBy: string): any[] {
    switch (filterBy) {
      case 'purchasable':
        return recipes.filter(recipe => recipe.isPurchasable);
      case 'owned':
        return recipes.filter(recipe => recipe.isOwned);
      case 'locked':
        return recipes.filter(recipe => !recipe.isOwned && !recipe.isPurchasable && !recipe.comingSoon);
      case 'coming-soon':
        return recipes.filter(recipe => recipe.comingSoon);
      case 'affordable': {
        const playerRevenue = this.app.gameState.store.getTotalRevenue();
        return recipes.filter(recipe => !recipe.isOwned && playerRevenue >= recipe.price);
      }
      case 'all':
      default:
        return recipes;
    }
  }

  private sortRecipes(recipes: any[], sortBy: string): any[] {
    const sorted = [...recipes];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.recipe.name.localeCompare(b.recipe.name));
      
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      
      case 'level':
        return sorted.sort((a, b) => a.levelRequirement - b.levelRequirement);
      
      case 'time':
        return sorted.sort((a, b) => a.recipe.bakingTime - b.recipe.bakingTime);
      
      case 'difficulty': {
        const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
        return sorted.sort((a, b) => {
          const aDiff = difficultyOrder[a.recipe.difficulty.toLowerCase() as keyof typeof difficultyOrder] || 2;
          const bDiff = difficultyOrder[b.recipe.difficulty.toLowerCase() as keyof typeof difficultyOrder] || 2;
          return aDiff - bDiff;
        });
      }
      
      case 'random':
        // Fisher-Yates shuffle algorithm
        for (let i = sorted.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
        }
        return sorted;
      
      default:
        return sorted;
    }
  }
}