import { html, css } from 'lit';
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

  static styles = css`
    :host {
      display: block;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 15px;
      margin-top: 15px;
    }

    h4 {
      margin: 0 0 15px 0;
      color: white;
      font-size: 14px;
    }

    .ingredient-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 15px;
    }

    .ingredient-info .name {
      font-weight: 600;
      font-size: 16px;
      color: white;
    }

    .ingredient-info .icon {
      font-size: 20px;
    }

    .transfer-amounts {
      margin-bottom: 15px;
    }

    .amount-display {
      margin-bottom: 10px;
      font-size: 14px;
    }

    .amount-display label {
      color: #ccc;
      margin-right: 8px;
    }

    .amount-display span {
      color: #4caf50;
      font-weight: 600;
    }

    .input-group {
      margin-bottom: 15px;
    }

    .input-group label {
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
      color: #ccc;
    }

    .input-group input {
      width: 80px;
      padding: 8px 12px;
      border: 2px solid #333;
      border-radius: 6px;
      background: #222;
      color: white;
      font-size: 16px;
      text-align: center;
    }

    .input-group input:focus {
      outline: none;
      border-color: #007acc;
    }

    .input-group .unit {
      margin-left: 8px;
      color: #ccc;
    }

    .subtraction-problem {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 15px;
      text-align: center;
    }

    .subtraction-equation {
      font-family: monospace;
      font-size: 14px;
      color: #ffeb3b;
    }

    .subtraction-equation.invalid {
      color: #ff6f61;
    }

    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    button {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      flex: 1;
    }

    .btn-visualize {
      background: #007acc;
      color: white;
    }

    .btn-visualize:hover {
      background: #005a9e;
      transform: translateY(-1px);
    }

    .btn-calculate {
      background: #28a745;
      color: white;
    }

    .btn-calculate:hover {
      background: #1e7e34;
      transform: translateY(-1px);
    }

    .btn-calculate:disabled {
      background: #666;
      cursor: not-allowed;
      transform: none;
    }

    .btn-secondary {
      background: #666;
      color: white;
      padding: 8px 16px;
      font-size: 12px;
    }

    .btn-secondary:hover {
      background: #555;
      transform: translateY(-1px);
    }

    .transfer-result {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 10px;
      margin-top: 10px;
      font-size: 14px;
      display: none;
    }

    .transfer-result.success {
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid #4caf50;
      color: #4caf50;
      display: block;
    }

    .transfer-result.error {
      background: rgba(255, 111, 97, 0.2);
      border: 1px solid #ff6f61;
      color: #ff6f61;
      display: block;
    }
  `;

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