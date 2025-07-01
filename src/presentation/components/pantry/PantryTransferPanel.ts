import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { observable, computed } from 'mobx';
import { MobxLitElement } from '@adobe/lit-mobx';
import { IngredientService, BakingCounter, STARTER_INGREDIENTS } from '@/domain/inventory';
import { MathService } from '@/core/math/MathService';
import { GameState } from '@/domain/progression';
import { container } from '@/shared/container';

@customElement('pantry-transfer-panel')
export class PantryTransferPanel extends MobxLitElement {
  @observable private ingredientService = container.get(IngredientService);
  @observable private mathService = container.get(MathService);
  @observable private gameState: GameState | null = null;
  
  @state() private selectedIngredientId: string | null = null;
  @state() private isVisible = false;
  
  private bakingCounter = new BakingCounter();

  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 20px;
      left: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      padding: 20px;
      color: white;
      font-family: inherit;
      pointer-events: auto;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
    }

    :host([hidden]) {
      display: none;
    }

    .transfer-info {
      margin-bottom: 15px;
    }

    .transfer-info p {
      margin: 0 0 15px 0;
      font-size: 14px;
      color: #ccc;
    }

    h3 {
      margin: 0 0 15px 0;
      color: white;
      font-size: 18px;
    }

    h4 {
      margin: 0 0 10px 0;
      color: white;
      font-size: 14px;
    }
  `;

  @computed
  get pantryIngredients() {
    return Object.values(STARTER_INGREDIENTS).map(ingredient => {
      const amount = this.gameState 
        ? this.gameState.pantry.getStock(ingredient.id)
        : this.ingredientService.getIngredientAmount(ingredient.id)?.quantity || 0;
      
      return {
        ...ingredient,
        currentAmount: amount,
        isSelected: this.selectedIngredientId === ingredient.id
      };
    });
  }

  @computed
  get counterIngredients() {
    return this.bakingCounter.stagedIngredients;
  }

  connectedCallback() {
    super.connectedCallback();
    this.mathService.setMode('ingredient-transfer');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.mathService.setMode('basic-multiplication');
  }

  public show() {
    this.isVisible = true;
    this.removeAttribute('hidden');
  }

  public hide() {
    this.isVisible = false;
    this.setAttribute('hidden', '');
    this.selectedIngredientId = null;
  }

  public setGameState(gameState: GameState) {
    this.gameState = gameState;
  }

  private handleIngredientSelected(e: CustomEvent) {
    const { ingredientId } = e.detail;
    this.selectedIngredientId = ingredientId;
  }

  private handleTransferConfirmed(e: CustomEvent) {
    const { ingredientId, amount } = e.detail;
    
    try {
      // Remove from pantry
      this.ingredientService.removeFromPantry(ingredientId, amount);
      
      // Add to baking counter
      const ingredient = Object.values(STARTER_INGREDIENTS).find(ing => ing.id === ingredientId);
      if (ingredient) {
        this.bakingCounter.stageIngredient(ingredient, amount);
      }
      
      // Show success notification
      this.dispatchEvent(new CustomEvent('transfer-success', {
        detail: { ingredientId, amount },
        bubbles: true
      }));
      
      // Clear selection
      this.selectedIngredientId = null;
      
    } catch (error) {
      // Show error notification
      this.dispatchEvent(new CustomEvent('transfer-error', {
        detail: { message: error instanceof Error ? error.message : String(error) },
        bubbles: true
      }));
    }
  }

  private handleTransferCancelled() {
    this.selectedIngredientId = null;
  }

  private handleVisualize(e: CustomEvent) {
    const { pantryAmount, transferAmount } = e.detail;
    
    // Dispatch event to three-scene-container to create subtraction visualization
    this.dispatchEvent(new CustomEvent('create-subtraction-visualization', {
      detail: { 
        totalAmount: pantryAmount, 
        removeAmount: transferAmount 
      },
      bubbles: true
    }));
  }

  render() {
    if (!this.isVisible) {
      return html``;
    }

    return html`
      <h3>📦 Pantry Transfer</h3>
      <div class="transfer-info">
        <p>Move ingredients from pantry to baking counter using subtraction!</p>
      </div>
      
      <pantry-inventory
        .ingredients=${this.pantryIngredients}
        @ingredient-selected=${this.handleIngredientSelected}>
      </pantry-inventory>
      
      <baking-counter-display
        .ingredients=${this.counterIngredients}>
      </baking-counter-display>
      
      ${this.selectedIngredientId ? html`
        <transfer-controls
          .ingredientId=${this.selectedIngredientId}
          .gameState=${this.gameState}
          .ingredientService=${this.ingredientService}
          .mathService=${this.mathService}
          @transfer-confirmed=${this.handleTransferConfirmed}
          @transfer-cancelled=${this.handleTransferCancelled}
          @visualize-transfer=${this.handleVisualize}>
        </transfer-controls>
      ` : ''}
    `;
  }
}