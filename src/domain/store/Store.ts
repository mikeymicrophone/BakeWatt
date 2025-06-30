import { observable, action } from 'mobx';
import { StoreItemEntity, StoreItem } from './StoreItem';
import { PricingEngine, Location } from './PricingEngine';

export interface StoreState {
  inventory: StoreItem[];
  revenue: number;
  pricingEngine: any;
}

export class Store {
  @observable private inventory: Map<string, StoreItemEntity> = new Map();
  @observable private revenue: number = 5.00; // Start with $5
  private pricingEngine: PricingEngine;

  constructor(initialState?: StoreState) {
    if (initialState) {
      this.revenue = initialState.revenue;
      this.pricingEngine = PricingEngine.fromState(initialState.pricingEngine);
      
      initialState.inventory.forEach(item => {
        this.inventory.set(item.id, StoreItemEntity.fromState(item));
      });
    } else {
      this.pricingEngine = new PricingEngine();
    }
  }

  @action
  public addItem(
    id: string,
    name: string,
    icon: string,
    basePrice: number,
    quantity: number,
    category: StoreItem['category'],
    recipeId?: string
  ): void {
    const existingItem = this.inventory.get(id);
    
    if (existingItem) {
      // Add to existing quantity
      existingItem.updateQuantity(existingItem.quantity + quantity);
    } else {
      // Create new item
      const newItem = new StoreItemEntity(id, name, icon, basePrice, quantity, category, recipeId);
      this.inventory.set(id, newItem);
    }
  }

  @action
  public sellItem(itemId: string, quantity: number): { success: boolean; revenue: number; error?: string } {
    const item = this.inventory.get(itemId);
    
    if (!item) {
      return { success: false, revenue: 0, error: 'Item not found' };
    }

    if (item.quantity < quantity) {
      return { success: false, revenue: 0, error: `Only ${item.quantity} available` };
    }

    const price = this.pricingEngine.calculatePrice(item);
    const totalRevenue = price * quantity;

    try {
      item.sell(quantity);
      this.revenue += totalRevenue;
      
      // Record the sale for demand tracking
      this.pricingEngine.recordSale(itemId, quantity, price);

      // Remove item if quantity reaches zero
      if (item.quantity === 0) {
        this.inventory.delete(itemId);
      }

      return { success: true, revenue: totalRevenue };
    } catch (error) {
      return { success: false, revenue: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  public getItem(itemId: string): StoreItemEntity | undefined {
    return this.inventory.get(itemId);
  }

  public getAllItems(): StoreItemEntity[] {
    return Array.from(this.inventory.values());
  }

  public getItemsByCategory(category: StoreItem['category']): StoreItemEntity[] {
    return this.getAllItems().filter(item => item.category === category);
  }

  public getCurrentPrice(itemId: string): number | null {
    const item = this.inventory.get(itemId);
    return item ? this.pricingEngine.calculatePrice(item) : null;
  }

  public getPriceModifiers(itemId: string) {
    const item = this.inventory.get(itemId);
    return item ? this.pricingEngine.calculateModifiers(item) : null;
  }

  public getInventoryValue(): number {
    let totalValue = 0;
    
    this.inventory.forEach(item => {
      const currentPrice = this.pricingEngine.calculatePrice(item);
      totalValue += currentPrice * item.quantity;
    });

    return Math.round(totalValue * 100) / 100;
  }

  public getTotalRevenue(): number {
    return this.revenue;
  }

  public getSalesStats(hours: number = 24) {
    return this.pricingEngine.getRevenueStats(hours);
  }

  public updateLocation(location: Location): void {
    this.pricingEngine.updateLocation(location);
  }

  @action
  public clearInventory(): void {
    this.inventory.clear();
  }

  @action
  public resetRevenue(): void {
    this.revenue = 0;
  }

  @action
  public deductMoney(amount: number): boolean {
    if (this.revenue >= amount) {
      this.revenue -= amount;
      return true;
    }
    return false;
  }

  @action
  public addRevenue(amount: number): void {
    this.revenue += amount;
  }

  public toState(): StoreState {
    return {
      inventory: Array.from(this.inventory.values()).map(item => item.toState()),
      revenue: this.revenue,
      pricingEngine: this.pricingEngine.toState()
    };
  }

  public clone(): Store {
    return new Store(this.toState());
  }

  // Helper method to get all items with their current prices
  public getItemsWithPrices(): Array<{
    item: StoreItemEntity;
    currentPrice: number;
    modifiers: any;
  }> {
    return this.getAllItems().map(item => ({
      item,
      currentPrice: this.pricingEngine.calculatePrice(item),
      modifiers: this.pricingEngine.calculateModifiers(item)
    }));
  }

  // Method to simulate time passing (for testing price changes)
  public simulateTimePassing(hours: number): void {
    // This would be used for testing - advance all item creation times
    this.inventory.forEach(item => {
      (item as any).addedAt = new Date(item.addedAt.getTime() - hours * 60 * 60 * 1000);
    });
  }
}