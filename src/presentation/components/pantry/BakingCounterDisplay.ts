import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { IngredientAmount } from '@/domain/inventory';

@customElement('baking-counter-display')
export class BakingCounterDisplay extends LitElement {
  @property({ type: Array, attribute: false })
  declare ingredients: IngredientAmount[];

  static styles = css`
    :host {
      display: block;
      margin-bottom: 15px;
    }

    h4 {
      margin: 0 0 10px 0;
      color: white;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .inventory-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
      min-height: 60px;
    }

    .ingredient-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      border: 2px solid rgba(76, 175, 80, 0.3);
    }

    .ingredient-card .icon {
      font-size: 24px;
      margin-bottom: 5px;
    }

    .ingredient-card .name {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 3px;
      color: white;
    }

    .ingredient-card .amount {
      font-size: 11px;
      color: #4caf50;
      font-weight: 600;
    }

    .empty-counter {
      text-align: center;
      padding: 20px;
      color: #666;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      grid-column: 1 / -1;
    }

    .empty-counter small {
      display: block;
      margin-top: 5px;
      font-size: 11px;
    }
  `;

  constructor() {
    super();
    this.ingredients = [];
  }

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
}