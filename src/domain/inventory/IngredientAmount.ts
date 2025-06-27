import { Ingredient } from './Ingredient';

export class IngredientAmount {
  constructor(
    public readonly ingredient: Ingredient,
    public readonly quantity: number
  ) {
    if (quantity < 0) {
      throw new Error('Ingredient quantity cannot be negative');
    }
    if (!Number.isFinite(quantity)) {
      throw new Error('Ingredient quantity must be a finite number');
    }
  }

  public add(amount: number): IngredientAmount {
    return new IngredientAmount(this.ingredient, this.quantity + amount);
  }

  public subtract(amount: number): IngredientAmount {
    const newQuantity = this.quantity - amount;
    if (newQuantity < 0) {
      throw new Error(`Cannot subtract ${amount} ${this.ingredient.unit} - only ${this.quantity} available`);
    }
    return new IngredientAmount(this.ingredient, newQuantity);
  }

  public multiply(factor: number): IngredientAmount {
    if (factor < 0) {
      throw new Error('Multiplication factor cannot be negative');
    }
    return new IngredientAmount(this.ingredient, this.quantity * factor);
  }

  public equals(other: IngredientAmount): boolean {
    return this.ingredient.equals(other.ingredient) && 
           Math.abs(this.quantity - other.quantity) < 0.001; // Handle floating point precision
  }

  public toString(): string {
    return `${this.quantity} ${this.ingredient.unit} ${this.ingredient.name}`;
  }

  public toDisplayString(): string {
    const qty = this.quantity % 1 === 0 ? this.quantity.toString() : this.quantity.toFixed(1);
    return `${qty} ${this.ingredient.unit} ${this.ingredient.name}`;
  }
}

export class IngredientAmountBuilder {
  private ingredient?: Ingredient;
  private quantity: number = 0;

  public withIngredient(ingredient: Ingredient): this {
    this.ingredient = ingredient;
    return this;
  }

  public withQuantity(quantity: number): this {
    this.quantity = quantity;
    return this;
  }

  public build(): IngredientAmount {
    if (!this.ingredient) {
      throw new Error('Ingredient must be specified');
    }
    return new IngredientAmount(this.ingredient, this.quantity);
  }
}