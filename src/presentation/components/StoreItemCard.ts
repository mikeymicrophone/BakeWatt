import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('store-item-card')
export class StoreItemCard extends LitElement {
  @property({ type: Object, attribute: false })
  declare item: any;
  
  @property({ type: Number, attribute: false })
  declare currentPrice: number;
  
  @property({ type: Object, attribute: false })
  declare modifiers: Record<string, number>;

  constructor() {
    super();
    this.item = null;
    this.currentPrice = 0;
    this.modifiers = {};
  }

  /**
   * Render in light DOM so that global styles apply.
   */
  protected createRenderRoot() {
    return this; // renders into light DOM instead of shadow
  }

  // No shadow DOM styles needed - using global CSS

  private sell() {
    if (this.item?.id) {
      window.appInstance?.sellSingleItem(this.item.id);
    }
  }
  private showPricing() {
    if (this.item?.id) {
      window.appInstance?.showPricingInfo(this.item.id);
    }
  }

  render() {
    if (!this.item) return html``;
    return html`
      <div class="store-item-header">
        <div class="store-item-info">
          <span class="store-item-icon">${this.item?.icon || '📦'}</span>
          <div class="store-item-details">
            <h4 class="store-item-name">${this.item?.name || 'Unknown Item'}</h4>
            <p class="store-item-quantity">${this.item?.quantity || 0} available</p>
          </div>
        </div>
        <div class="store-item-pricing">
          <p class="store-item-price">$${this.currentPrice.toFixed(2)}</p>
          ${this.currentPrice !== this.item?.basePrice ? html`<p class="store-item-base-price">$${this.item?.basePrice?.toFixed(2) || '0.00'}</p>` : ''}
        </div>
      </div>

      ${this.modifiers && Object.keys(this.modifiers).length > 0 ? html`
        <div class="pricing-modifiers">
          ${Object.entries(this.modifiers).map(([k, v]) => {
            const modifier = v as number;
            const pct = ((modifier - 1) * 100).toFixed(0);
            const cls = modifier > 1 ? 'positive' : modifier < 1 ? 'negative' : '';
            const sign = modifier > 1 ? '+' : '';
            return html`<span>${k}</span><span class="${cls}">${sign}${pct}%</span>`;
          })}
        </div>
      ` : ''}

      <div class="store-item-actions" style="margin-top:6px; display:flex; gap:4px;">
        <button @click=${this.showPricing}>Pricing Info</button>
        <button ?disabled=${this.item?.quantity === 0} @click=${this.sell}>Sell</button>
      </div>
    `;
  }
}
