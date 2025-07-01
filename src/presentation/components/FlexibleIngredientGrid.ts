import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface FlexibleIngredientData {
  id: string;
  name: string;
  icon: string;
  unit: string;
  scaledMin: number;
  scaledMax: number;
  currentAmount: number;
  availableInPantry: number;
  isTransferred: boolean;
  canTransfer: boolean;
}

@customElement('flexible-ingredient-grid')
export class FlexibleIngredientGrid extends LitElement {
  @property({ type: Object, attribute: false })
  declare ingredient: FlexibleIngredientData;

  @property({ type: Number })
  declare gridWidth: number;

  @property({ type: Number })
  declare gridHeight: number;

  private _cachedDisplayDimensions: {maxWidth: number, maxHeight: number, minWidth: number, minHeight: number} | null = null;

  constructor() {
    super();
    this.ingredient = {
      id: '',
      name: '',
      icon: '',
      unit: '',
      scaledMin: 0,
      scaledMax: 0,
      currentAmount: 0,
      availableInPantry: 0,
      isTransferred: false,
      canTransfer: false
    };
    this.gridWidth = 5;
    this.gridHeight = 4;
  }

  /**
   * Calculate optimal grid dimensions that prefer square-like layouts
   * @param target The target number to represent
   * @param allowOvershoot Whether to allow overshooting for better squares
   * @returns {width, height} dimensions
   */
  private calculateOptimalDimensions(target: number, allowOvershoot: boolean = false): {width: number, height: number} {
    if (target <= 0) return {width: 1, height: 1};
    if (target > 100) return {width: 10, height: 10}; // Max 10x10 grid
    
    let bestWidth = 1;
    let bestHeight = target;
    let bestDifference = Math.abs(bestWidth - bestHeight);
    
    // Find all factor pairs and prefer the most square-like
    for (let w = 1; w <= 10; w++) {
      if (target % w === 0) {
        const h = target / w;
        if (h <= 10) {
          const difference = Math.abs(w - h);
          if (difference < bestDifference) {
            bestWidth = w;
            bestHeight = h;
            bestDifference = difference;
          }
        }
      }
    }
    
    // If no perfect factors and overshooting allowed, find next square
    if (allowOvershoot && bestDifference > 2) {
      const sqrt = Math.ceil(Math.sqrt(target));
      if (sqrt <= 10) {
        return {width: sqrt, height: sqrt};
      }
    }
    
    return {width: bestWidth, height: bestHeight};
  }

  /**
   * Calculate display dimensions for min/max visualization (cached)
   */
  private getDisplayDimensions(): {maxWidth: number, maxHeight: number, minWidth: number, minHeight: number} {
    if (!this._cachedDisplayDimensions) {
      const maxDims = this.calculateOptimalDimensions(this.ingredient.scaledMax, true);
      
      // For minimum, try to use one dimension close to max dimensions for visual continuity
      let minDims: {width: number, height: number};
      
      if (this.ingredient.scaledMin <= maxDims.width) {
        // Min can fit in one row/column of max
        minDims = {width: this.ingredient.scaledMin, height: 1};
      } else if (this.ingredient.scaledMin <= maxDims.height) {
        minDims = {width: 1, height: this.ingredient.scaledMin};
      } else {
        // Calculate optimal for min if it's too large for sliver approach
        minDims = this.calculateOptimalDimensions(this.ingredient.scaledMin, false);
      }
      
      this._cachedDisplayDimensions = {
        maxWidth: maxDims.width,
        maxHeight: maxDims.height,
        minWidth: minDims.width,
        minHeight: minDims.height
      };
    }
    
    return this._cachedDisplayDimensions;
  }

  /**
   * Render in light DOM so that global styles apply.
   */
  protected createRenderRoot() {
    return this; // renders into light DOM instead of shadow
  }

  /**
   * Initialize smart grid dimensions when ingredient data is set
   */
  protected willUpdate(changedProperties: Map<string, any>) {
    if (changedProperties.has('ingredient') && this.ingredient.scaledMax > 0) {
      // Clear cache when ingredient changes
      this._cachedDisplayDimensions = null;
      
      const optimalDims = this.calculateOptimalDimensions(this.ingredient.scaledMax, true);
      this.gridWidth = optimalDims.width;
      this.gridHeight = optimalDims.height;
      
      // Update current amount to match the optimal grid
      this.ingredient = {
        ...this.ingredient,
        currentAmount: Math.min(this.gridWidth * this.gridHeight, this.ingredient.scaledMax)
      };
    }
  }

  private updateGrid() {
    const widthSlider = this.querySelector(`#width-slider-${this.ingredient.id}`) as HTMLInputElement;
    const heightSlider = this.querySelector(`#height-slider-${this.ingredient.id}`) as HTMLInputElement;
    
    if (!widthSlider || !heightSlider) {
      console.warn('Sliders not found for ingredient:', this.ingredient.id);
      return;
    }
    
    const newWidth = parseInt(widthSlider.value);
    const newHeight = parseInt(heightSlider.value);
    
    console.log(`🎛️ Grid updated: ${this.gridWidth}x${this.gridHeight} → ${newWidth}x${newHeight}`);
    
    this.gridWidth = newWidth;
    this.gridHeight = newHeight;
    
    // Update amount
    const newAmount = this.gridWidth * this.gridHeight;
    const clampedAmount = Math.max(this.ingredient.scaledMin, Math.min(this.ingredient.scaledMax, newAmount));
    
    console.log(`📊 Amount: ${this.ingredient.currentAmount} → ${clampedAmount} (${this.gridWidth}x${this.gridHeight})`);
    
    // Update the ingredient data to trigger re-render
    this.ingredient = {
      ...this.ingredient,
      currentAmount: clampedAmount
    };
    
    // Notify parent about the amount change
    this.dispatchEvent(new CustomEvent('amount-changed', {
      detail: { ingredientId: this.ingredient.id, amount: clampedAmount },
      bubbles: true
    }));
    
    // Update slider value displays
    const widthDisplay = this.querySelector(`#width-value-${this.ingredient.id}`);
    const heightDisplay = this.querySelector(`#height-value-${this.ingredient.id}`);
    if (widthDisplay) widthDisplay.textContent = this.gridWidth.toString();
    if (heightDisplay) heightDisplay.textContent = this.gridHeight.toString();
    
    // Trigger re-render
    this.requestUpdate();
  }

  private formatAmount(amount: number): string {
    return Number.isInteger(amount) ? amount.toString() : amount.toFixed(1);
  }

  private generateGridSquares() {
    if (!this.ingredient) return [];
    
    console.log(`🎨 Generating grid squares for ${this.ingredient.id}: ${this.gridWidth}x${this.gridHeight}`);
    
    const FIXED_GRID_SIZE = 10; // Always 10x10 grid = 100 cells
    const displayDims = this.getDisplayDimensions();
    const squares = [];
    
    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / FIXED_GRID_SIZE);
      const col = i % FIXED_GRID_SIZE;
      
      let cellClasses = ['grid-cell'];
      
      // Check if cell is within minimum sliver area
      const isInMinArea = row < displayDims.minHeight && col < displayDims.minWidth;
      // Check if cell is within maximum outline area
      const isInMaxOutline = row < displayDims.maxHeight && col < displayDims.maxWidth;
      
      if (isInMinArea) {
        cellClasses.push('min-required');
      } else if (isInMaxOutline) {
        cellClasses.push('max-allowed'); 
      } else {
        cellClasses.push('empty');
      }
      
      // Selection overlay (user's current selection)
      if (row < this.gridHeight && col < this.gridWidth) {
        cellClasses.push('selected');
      }
      
      squares.push(html`
        <div 
          class="${cellClasses.join(' ')}" 
          data-cell-index="${i}"
          data-row="${row}"
          data-col="${col}">
        </div>
      `);
    }
    
    return squares;
  }

  private generateGrid(): string {
    // Fallback for innerHTML updates - deprecated
    if (!this.ingredient) return '';
    
    const totalSquares = this.gridWidth * this.gridHeight;
    const { scaledMin, scaledMax, currentAmount } = this.ingredient;
    
    let gridHTML = '<div class="ingredient-grid">';
    
    for (let i = 0; i < totalSquares; i++) {
      let squareClass = 'grid-square';
      
      if (i < scaledMin) {
        squareClass += ' min-required';
      } else if (i < scaledMax) {
        squareClass += ' max-allowed';
      }
      
      if (i < currentAmount) {
        squareClass += ' selected';
      }
      
      gridHTML += `<div class="${squareClass}"></div>`;
    }
    
    gridHTML += '</div>';
    return gridHTML;
  }

  private transfer() {
    if (this.ingredient?.canTransfer) {
      // Get the current amount from the grid dimensions
      const currentAmount = this.gridWidth * this.gridHeight;
      
      this.dispatchEvent(new CustomEvent('transfer-ingredient', {
        detail: { 
          ingredientId: this.ingredient.id, 
          amount: currentAmount 
        },
        bubbles: true
      }));
    }
  }

  render() {
    if (!this.ingredient) return html``;
    
    const { name, icon, unit, scaledMin, scaledMax, currentAmount, availableInPantry, isTransferred, canTransfer } = this.ingredient;
    
    return html`
      <div class="ingredient-zone flexible ${isTransferred ? 'transferred' : 'needed'}" data-ingredient-id="${this.ingredient.id}">
        <div class="ingredient-zone-header">
          <div class="ingredient-zone-name">
            <span>${icon}</span>
            <span>${name}</span>
          </div>
          <div class="ingredient-zone-amount flexible-amount">
            <span id="flexible-amount-${this.ingredient.id}">${this.formatAmount(currentAmount)}</span> ${unit}
            <small>(${this.formatAmount(scaledMin)}-${this.formatAmount(scaledMax)} range)</small>
          </div>
        </div>
        
        ${!isTransferred ? html`
        <div class="grid-control-section">
          <div class="grid-sliders">
            <div class="slider-group">
              <input type="range" class="grid-slider" id="width-slider-${this.ingredient.id}" 
                     min="1" max="10" value="${this.gridWidth}" 
                     @change=${this.updateGrid}>
              <span id="width-value-${this.ingredient.id}">${this.gridWidth}</span>
            </div>
            <div class="slider-group">
              <input type="range" class="grid-slider" id="height-slider-${this.ingredient.id}" 
                     min="1" max="10" value="${this.gridHeight}" 
                     @change=${this.updateGrid}>
              <span id="height-value-${this.ingredient.id}">${this.gridHeight}</span>
            </div>
          </div>
          
          <div class="ingredient-grid-container" id="grid-container-${this.ingredient.id}">
            <div class="flexible-ingredient-grid fixed-grid" style="display: grid; grid-template-columns: repeat(10, 1fr); grid-template-rows: repeat(10, 1fr); gap: 2px;">
              ${this.generateGridSquares()}
            </div>
          </div>
          
          <div class="grid-legend">
            <div class="legend-item">
              <div class="legend-color min-required"></div>
              <span>Minimum Required (${this.formatAmount(scaledMin)} - ${this.getDisplayDimensions().minWidth}×${this.getDisplayDimensions().minHeight})</span>
            </div>
            <div class="legend-item">
              <div class="legend-color max-allowed"></div>
              <span>Maximum Allowed (${this.formatAmount(scaledMax)} - ${this.getDisplayDimensions().maxWidth}×${this.getDisplayDimensions().maxHeight})</span>
            </div>
            <div class="legend-item">
              <div class="legend-color selected"></div>
              <span>Current Selection (${this.gridWidth}×${this.gridHeight})</span>
            </div>
          </div>
        </div>
        ` : ''}
        
        <div class="ingredient-zone-status">
          ${isTransferred ? 
            '✅ Transferred to counter' : 
            `Available: ${availableInPantry} ${unit}`
          }
        </div>
        <div class="ingredient-zone-transfer">
          <button class="btn-transfer" 
            ?disabled=${!canTransfer} 
            @click=${this.transfer}>
            ${isTransferred ? 'Transferred' : 'Transfer to Counter'}
          </button>
        </div>
      </div>
    `;
  }
}