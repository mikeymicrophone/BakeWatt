import { StoreItemEntity, SaleRecord, PriceModifiers } from './StoreItem';

export type Location = 'USA' | 'Europe' | 'Asia' | 'Canada' | 'Australia';

export interface PricingConfig {
  location: Location;
  timeZone: string;
  demandWindowHours: number; // How many hours back to look for demand calculation
  maxDemandMultiplier: number;
  minDemandMultiplier: number;
}

export class PricingEngine {
  private saleHistory: SaleRecord[] = [];
  
  constructor(private config: PricingConfig = {
    location: 'USA',
    timeZone: 'America/New_York',
    demandWindowHours: 24,
    maxDemandMultiplier: 3.0,
    minDemandMultiplier: 0.3
  }) {}

  public calculatePrice(item: StoreItemEntity): number {
    const modifiers = this.calculateModifiers(item);
    const finalPrice = item.basePrice * 
      modifiers.timeOfDay * 
      modifiers.demand * 
      modifiers.location * 
      modifiers.seasonal * 
      modifiers.freshness;

    return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
  }

  public calculateModifiers(item: StoreItemEntity): PriceModifiers {
    return {
      timeOfDay: this.getTimeOfDayModifier(),
      demand: this.getDemandModifier(item.id),
      location: this.getLocationModifier(item.category),
      seasonal: this.getSeasonalModifier(item.category),
      freshness: this.getFreshnessModifier(item)
    };
  }

  private getTimeOfDayModifier(): number {
    const now = new Date();
    const hour = now.getHours();
    
    // Peak hours: 7-9 AM (breakfast), 12-2 PM (lunch), 6-8 PM (dinner)
    // Off-peak: late night (10 PM - 6 AM)
    if ((hour >= 7 && hour <= 9) || (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 20)) {
      return 1.3; // Peak hours - higher demand
    } else if (hour >= 22 || hour <= 6) {
      return 0.7; // Late night/early morning - lower demand
    } else {
      return 1.0; // Normal hours
    }
  }

  private getDemandModifier(itemId: string): number {
    const cutoffTime = new Date(Date.now() - this.config.demandWindowHours * 60 * 60 * 1000);
    const recentSales = this.saleHistory.filter(sale => 
      sale.itemId === itemId && sale.timestamp >= cutoffTime
    );

    const totalSold = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);
    
    // High sales = higher demand = higher price
    // Low sales = lower demand = lower price
    // Base assumption: 10 units sold in 24h = normal demand (1.0x)
    const normalDemand = 10;
    const demandRatio = totalSold / normalDemand;
    
    if (demandRatio > 2) {
      return Math.min(this.config.maxDemandMultiplier, 1 + (demandRatio - 1) * 0.5);
    } else if (demandRatio < 0.5) {
      return Math.max(this.config.minDemandMultiplier, 0.5 + demandRatio * 0.5);
    } else {
      return 1.0;
    }
  }

  private getLocationModifier(category: string): number {
    const locationMultipliers: Record<Location, Record<string, number>> = {
      'USA': {
        'baked_goods': 1.0,
        'packages': 0.9,
        'ingredients': 1.1
      },
      'Europe': {
        'baked_goods': 1.2,
        'packages': 1.1,
        'ingredients': 0.9
      },
      'Asia': {
        'baked_goods': 0.8,
        'packages': 1.3,
        'ingredients': 0.8
      },
      'Canada': {
        'baked_goods': 1.1,
        'packages': 1.0,
        'ingredients': 1.0
      },
      'Australia': {
        'baked_goods': 1.3,
        'packages': 1.2,
        'ingredients': 1.1
      }
    };

    return locationMultipliers[this.config.location]?.[category] || 1.0;
  }

  private getSeasonalModifier(category: string): number {
    const month = new Date().getMonth(); // 0-11
    
    // Simple seasonal adjustments
    if (category === 'baked_goods') {
      // Higher demand for baked goods in winter months (Nov-Feb)
      if (month >= 10 || month <= 1) {
        return 1.2;
      }
      // Lower demand in summer (Jun-Aug)
      else if (month >= 5 && month <= 7) {
        return 0.9;
      }
    }
    
    return 1.0;
  }

  private getFreshnessModifier(item: StoreItemEntity): number {
    const hoursOld = item.getFreshnessHours();
    
    if (item.category === 'baked_goods') {
      // Baked goods lose value over time
      if (hoursOld < 2) return 1.0; // Fresh
      if (hoursOld < 6) return 0.95; // Still good
      if (hoursOld < 12) return 0.85; // Getting stale
      if (hoursOld < 24) return 0.7; // Day old
      return 0.5; // Old
    } else {
      // Packages and ingredients don't degrade as quickly
      if (hoursOld < 24) return 1.0;
      if (hoursOld < 72) return 0.95;
      return 0.9;
    }
  }

  public recordSale(itemId: string, quantity: number, price: number): void {
    const sale: SaleRecord = {
      itemId,
      quantity,
      price,
      timestamp: new Date(),
      location: this.config.location
    };
    
    this.saleHistory.push(sale);
    
    // Keep only recent history to prevent memory bloat
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    this.saleHistory = this.saleHistory.filter(sale => sale.timestamp >= cutoffTime);
  }

  public getSalesHistory(itemId?: string, hours: number = 24): SaleRecord[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.saleHistory.filter(sale => {
      const matchesTime = sale.timestamp >= cutoffTime;
      const matchesItem = !itemId || sale.itemId === itemId;
      return matchesTime && matchesItem;
    });
  }

  public getRevenueStats(hours: number = 24): { totalRevenue: number; totalSales: number; averagePrice: number } {
    const recentSales = this.getSalesHistory(undefined, hours);
    const totalRevenue = recentSales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);
    const totalSales = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const averagePrice = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSales,
      averagePrice: Math.round(averagePrice * 100) / 100
    };
  }

  public updateLocation(newLocation: Location): void {
    this.config.location = newLocation;
  }

  public toState() {
    return {
      config: this.config,
      saleHistory: this.saleHistory
    };
  }

  public static fromState(state: any): PricingEngine {
    const engine = new PricingEngine(state.config);
    engine.saleHistory = state.saleHistory.map((sale: any) => ({
      ...sale,
      timestamp: new Date(sale.timestamp)
    }));
    return engine;
  }
}