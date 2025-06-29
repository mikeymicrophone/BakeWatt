import { observable, action } from 'mobx';
import { StorageService } from '@/core/storage/StorageService';

export interface ProductionData {
  initialItems: number;
  piecesPerItem: number;
  piecesPerPackage: number;
}

export class ProductionService {
  @observable private _productionData: ProductionData = {
    initialItems: 2,
    piecesPerItem: 24,
    piecesPerPackage: 4
  };

  @observable private _currentRecipe: any | null = null;
  @observable private _currentRecipeScalingFactor: number = 1;

  // Callbacks to Application methods we need
  private getRecipeProductionInfo: (recipe: any) => { initialItems: number; itemName: string };
  private getRecipeOutputTerm: (recipe: any) => string;
  private calculateBasePrice: (recipe: any, productionData: ProductionData) => number;
  private gameStateStore: any;
  private showSalesNotification: (message: string) => void;
  private switchToTab: (tab: string) => void;
  private cancelCooking: () => void;

  constructor(callbacks: {
    getRecipeProductionInfo: (recipe: any) => { initialItems: number; itemName: string };
    getRecipeOutputTerm: (recipe: any) => string;
    calculateBasePrice: (recipe: any, productionData: ProductionData) => number;
    gameStateStore: any;
    showSalesNotification: (message: string) => void;
    switchToTab: (tab: string) => void;
    cancelCooking: () => void;
  }) {
    this.getRecipeProductionInfo = callbacks.getRecipeProductionInfo;
    this.getRecipeOutputTerm = callbacks.getRecipeOutputTerm;
    this.calculateBasePrice = callbacks.calculateBasePrice;
    this.gameStateStore = callbacks.gameStateStore;
    this.showSalesNotification = callbacks.showSalesNotification;
    this.switchToTab = callbacks.switchToTab;
    this.cancelCooking = callbacks.cancelCooking;
  }

  @action
  public startProduction(recipe: any, scalingFactor: number): void {
    console.log('🏭 Starting production interface');
    
    if (!recipe) {
      console.error('Cannot start production without a recipe.');
      return;
    }

    this._currentRecipe = recipe;
    this._currentRecipeScalingFactor = scalingFactor;

    // Get base production info
    const baseProductionInfo = this.getRecipeProductionInfo(recipe);
    
    // Calculate scaled items, ensuring it's an integer
    const scaledInitialItems = Math.round(baseProductionInfo.initialItems * scalingFactor);
    
    // Update production data
    this._productionData.initialItems = scaledInitialItems;
    
    console.log(`📈 Production scaled: ${baseProductionInfo.initialItems} (base) * ${scalingFactor}x (scale) = ${scaledInitialItems} items`);
    
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
  public hideProductionInterface(): void {
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
  public updateCuttingAmount(value: number): void {
    this._productionData.piecesPerItem = value;
    this.updateProductionStep();
  }

  @action
  public updatePackagingAmount(value: number): void {
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
      const singularTerm = outputTerm.slice(0, -1); // Remove 's' from plural
      if (remainingPieces > 0) {
        totalMathEq.textContent = `${initialItems} ${outputTerm} × ${piecesPerItem} pieces/${singularTerm} ÷ ${piecesPerPackage} pieces/package = ${totalPackages} packages + ${remainingPieces} loose`;
      } else {
        totalMathEq.textContent = `${initialItems} ${outputTerm} × ${piecesPerItem} pieces/${singularTerm} ÷ ${piecesPerPackage} pieces/package = ${totalPackages} packages`;
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
  public finishProduction(): void {
    console.log('✅ Production finished');
    
    const { initialItems, piecesPerItem, piecesPerPackage } = this._productionData;
    const totalPackages = Math.floor(initialItems * piecesPerItem / piecesPerPackage);
    
    if (this._currentRecipe && totalPackages > 0) {
      // Add packages to store
      const packageName = `${this._currentRecipe.name} Package`;
      const basePrice = this.calculateBasePrice(this._currentRecipe, this._productionData);
      
      this.gameStateStore.addItem(
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
    StorageService.saveGameState(this.gameStateStore.gameState);
    
    this.hideProductionInterface();
    this.cancelCooking();
  }

  // Getter for production data (readonly)
  public get productionData(): Readonly<ProductionData> {
    return this._productionData;
  }
}