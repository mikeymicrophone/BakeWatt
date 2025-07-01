import { html } from 'lit';
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

  constructor() {
    super();
    this.selectedIngredientId = null;
    this.isVisible = false;
  }

  protected createRenderRoot() {
    return this; // light DOM
  }

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
      this.ingredientService.removeFromPantry(ingredientId, amount);
      const ingredient = Object.values(STARTER_INGREDIENTS).find(ing => ing.id === ingredientId);
      if (ingredient) {
        this.bakingCounter.stageIngredient(ingredient, amount);
      }
      
      this.dispatchEvent(new CustomEvent('transfer-success', {
        detail: { ingredientId, amount },
        bubbles: true
      }));
      
      this.selectedIngredientId = null;
      
    } catch (error) {
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