import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Ingredient } from '@/domain/inventory';

export interface PantryIngredientData extends Ingredient {
  currentAmount: number;
  isSelected: boolean;
}

@customElement('pantry-inventory')
export class PantryInventory extends LitElement {
  @property({ type: Array, attribute: false })
  declare ingredients: PantryIngredientData[];

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
    }

    .ingredient-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .ingredient-card:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: #007acc;
    }

    .ingredient-card.selected {
      border-color: #ff6f61;
      background: rgba(255, 111, 97, 0.1);
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
      color: #ccc;
    }

    .ingredient-card .amount.insufficient {
      color: #ff6f61;
    }

    .ingredient-card .amount.sufficient {
      color: #4caf50;
    }
  `;

  constructor() {
    super();
    this.ingredients = [];
  }

  private handleIngredientClick(ingredient: PantryIngredientData) {
    this.dispatchEvent(new CustomEvent('ingredient-selected', {
      detail: { ingredientId: ingredient.id },
      bubbles: true
    }));
  }

  render() {
    return html`
      <h4>📚 Pantry Inventory</h4>
      <div class="inventory-grid">
        ${this.ingredients.map(ingredient => html`
          <div 
            class="ingredient-card ${ingredient.isSelected ? 'selected' : ''}"
            @click=${() => this.handleIngredientClick(ingredient)}>
            <div class="icon">${ingredient.icon}</div>
            <div class="name">${ingredient.name}</div>
            <div class="amount ${ingredient.currentAmount > 0 ? 'sufficient' : 'insufficient'}">
              ${ingredient.currentAmount} ${ingredient.unit}
            </div>
          </div>
        `)}
      </div>
    `;
  }
}