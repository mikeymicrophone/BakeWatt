import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { computed } from 'mobx';
import { MobxLitElement } from '@adobe/lit-mobx';
import { IngredientService, STARTER_INGREDIENTS } from '@/domain/inventory';
import { MathService, IngredientTransferProblem } from '@/core/math/MathService';
import { GameState } from '@/domain/progression';

@customElement('transfer-controls')
export class TransferControls extends MobxLitElement {
  @property() ingredientId!: string;
  @property({ type: Object, attribute: false }) gameState!: GameState | null;
  @property({ type: Object, attribute: false }) ingredientService!: IngredientService;
  @property({ type: Object, attribute: false }) mathService!: MathService;
  
  @state() private transferAmount = 1;

  protected createRenderRoot() {
    return this;
  }

  @computed
  get selectedIngredient() {
    return Object.values(STARTER_INGREDIENTS).find(ing => ing.id === this.ingredientId) || null;
  }

  @computed
  get availableAmount() {
    if (!this.selectedIngredient) return 0;
    
    return this.gameState 
      ? this.gameState.pantry.getStock(this.selectedIngredient.id)
      : this.ingredientService.getIngredientAmount(this.selectedIngredient.id)?.quantity || 0;
  }

  @computed
  get transferProblem(): IngredientTransferProblem | null {
    if (!this.selectedIngredient) return null;
    
    return this.mathService.createIngredientTransferProblem(
      this.selectedIngredient,
      this.availableAmount,
      this.transferAmount
    );
  }

  @computed
  get canTransfer() {
    return this.transferProblem?.isValid || false;
  }

  private handleAmountChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const amount = parseInt(target.value) || 1;
    this.transferAmount = Math.max(1, Math.min(this.availableAmount, amount));
  }

  private handleVisualize() {
    if (!this.transferProblem || !this.transferProblem.isValid) return;
    
    this.dispatchEvent(new CustomEvent('visualize-transfer', {
      detail: { 
        pantryAmount: this.availableAmount,
        transferAmount: this.transferAmount
      },
      bubbles: true
    }));
  }

  private handleConfirm() {
    if (!this.canTransfer) return;
    
    this.dispatchEvent(new CustomEvent('transfer-confirmed', {
      detail: { 
        ingredientId: this.ingredientId,
        amount: this.transferAmount
      },
      bubbles: true
    }));
  }

  private handleCancel() {
    this.dispatchEvent(new CustomEvent('transfer-cancelled', {
      bubbles: true
    }));
  }

  render() {
    if (!this.selectedIngredient) {
      return html`<div>No ingredient selected</div>`;
    }

    return html`
      <h4>Transfer Ingredient</h4>
      
      <div class="ingredient-info">
        <span class="icon">${this.selectedIngredient.icon}</span>
        <span class="name">${this.selectedIngredient.name}</span>
      </div>
      
      <div class="transfer-amounts">
        <div class="amount-display">
          <label>Available in pantry:</label>
          <span>${this.availableAmount} ${this.selectedIngredient.unit}</span>
        </div>
        
        <div class="input-group">
          <label for="transfer-amount">Amount to transfer:</label>
          <input 
            type="number" 
            id="transfer-amount"
            min="1" 
            max="${this.availableAmount}"
            .value=${this.transferAmount.toString()}
            @input=${this.handleAmountChange}>
          <span class="unit">${this.selectedIngredient.unit}</span>
        </div>
      </div>
      
      ${this.transferProblem ? html`
        <div class="subtraction-problem">
          <div class="subtraction-equation ${this.transferProblem.isValid ? '' : 'invalid'}">
            ${this.transferProblem.problemText}
          </div>
        </div>
      ` : ''}
      
      <div class="button-group">
        <button 
          class="btn-visualize"
          ?disabled=${!this.canTransfer}
          @click=${this.handleVisualize}>
          Show Subtraction
        </button>
        <button 
          class="btn-calculate"
          ?disabled=${!this.canTransfer}
          @click=${this.handleConfirm}>
          Confirm Transfer
        </button>
        <button 
          class="btn-secondary"
          @click=${this.handleCancel}>
          Cancel
        </button>
      </div>
    `;
  }
}