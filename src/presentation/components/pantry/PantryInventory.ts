import { LitElement, html } from 'lit';
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

  constructor() {
    super();
    this.ingredients = [];
  }

  protected createRenderRoot() {
    return this;
  }
}