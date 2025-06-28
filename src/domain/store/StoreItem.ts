export interface StoreItem {
  id: string;
  name: string;
  icon: string;
  basePrice: number;
  quantity: number;
  category: 'baked_goods' | 'packages' | 'ingredients';
  recipeId?: string;
  productionMethod?: 'manual' | 'automated';
  addedAt: Date;
}

export interface SaleRecord {
  itemId: string;
  quantity: number;
  price: number;
  timestamp: Date;
  location: string;
}

export interface PriceModifiers {
  timeOfDay: number; // 0.5 to 2.0 multiplier
  demand: number; // 0.3 to 3.0 multiplier based on recent sales
  location: number; // 0.8 to 1.5 multiplier based on location
  seasonal: number; // 0.9 to 1.2 multiplier for seasonal items
  freshness: number; // 0.7 to 1.0 multiplier based on how long item has been in store
}

export class StoreItemEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly icon: string,
    public readonly basePrice: number,
    public quantity: number,
    public readonly category: StoreItem['category'],
    public readonly recipeId?: string,
    public readonly productionMethod: StoreItem['productionMethod'] = 'manual',
    public readonly addedAt: Date = new Date()
  ) {}

  public updateQuantity(newQuantity: number): void {
    if (newQuantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    this.quantity = newQuantity;
  }

  public sell(quantity: number): void {
    if (quantity > this.quantity) {
      throw new Error(`Cannot sell ${quantity}, only ${this.quantity} available`);
    }
    this.quantity -= quantity;
  }

  public getFreshnessHours(): number {
    return (Date.now() - this.addedAt.getTime()) / (1000 * 60 * 60);
  }

  public toState(): StoreItem {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      basePrice: this.basePrice,
      quantity: this.quantity,
      category: this.category,
      recipeId: this.recipeId,
      productionMethod: this.productionMethod,
      addedAt: this.addedAt
    };
  }

  public static fromState(state: StoreItem): StoreItemEntity {
    return new StoreItemEntity(
      state.id,
      state.name,
      state.icon,
      state.basePrice,
      state.quantity,
      state.category,
      state.recipeId,
      state.productionMethod,
      state.addedAt
    );
  }
}