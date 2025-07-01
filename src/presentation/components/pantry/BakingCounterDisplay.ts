import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { IngredientAmount } from '@/domain/inventory';

@customElement('baking-counter-display')
export class BakingCounterDisplay extends LitElement {
  @property({ type: Array, attribute: false })
  declare ingredients: IngredientAmount[];

  render() {
    return html`
      <h4>🔥 Baking Counter</h4>
      <div class="inventory-grid">
        ${this.ingredients.length === 0 ? html`
          <div class="empty-counter">
            <span>Counter is empty</span>
            <small>Transfer ingredients to start baking!</small>
          </div>
        ` : this.ingredients.map(amount => html`
          <div class="ingredient-card">
            <div class="icon">${amount.ingredient.icon}</div>
            <div class="name">${amount.ingredient.name}</div>
            <div class="amount">
              ${amount.quantity} ${amount.ingredient.unit}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  constructor() {
    super();
    this.ingredients = [];
  }

  protected createRenderRoot() {
    return this;
  }
}