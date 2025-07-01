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

  @property({ type: Number, attribute: false })
  declare gridWidth: number;

  @property({ type: Number, attribute: false })
  declare gridHeight: number;

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
   * Render in light DOM so that global styles apply.
   */
  protected createRenderRoot() {
    return this; // renders into light DOM instead of shadow
  }

  private updateGrid() {
    this.gridWidth = parseInt((this.querySelector(`#width-slider-${this.ingredient.id}`) as HTMLInputElement)?.value || '5');
    this.gridHeight = parseInt((this.querySelector(`#height-slider-${this.ingredient.id}`) as HTMLInputElement)?.value || '4');
    
    // Update amount
    const newAmount = this.gridWidth * this.gridHeight;
    const clampedAmount = Math.max(this.ingredient.scaledMin, Math.min(this.ingredient.scaledMax, newAmount));
    
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
    
    // Trigger re-render
    this.requestUpdate();
  }

  private formatAmount(amount: number): string {
    return Number.isInteger(amount) ? amount.toString() : amount.toFixed(1);
  }

  private generateGridSquares() {
    if (!this.ingredient) return [];
    
    const FIXED_GRID_SIZE = 10; // Always 10x10 grid = 100 cells
    const { scaledMin, scaledMax } = this.ingredient;
    const squares = [];
    
    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / FIXED_GRID_SIZE);
      const col = i % FIXED_GRID_SIZE;
      
      let cellClasses = ['grid-cell'];
      
      // Base coloring based on min/max requirements
      if (i < scaledMin) {
        cellClasses.push('min-required');
      } else if (i < scaledMax) {
        cellClasses.push('max-allowed'); 
      } else {
        cellClasses.push('empty');
      }
      
      // Selection overlay (purple rectangle from top-left)
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