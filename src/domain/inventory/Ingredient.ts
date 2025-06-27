export class Ingredient {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly unit: string,
    public readonly icon: string = ''
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Ingredient id cannot be empty');
    }
    if (!name || name.trim().length === 0) {
      throw new Error('Ingredient name cannot be empty');
    }
    if (!unit || unit.trim().length === 0) {
      throw new Error('Ingredient unit cannot be empty');
    }
  }

  public equals(other: Ingredient): boolean {
    return this.id === other.id;
  }

  public toString(): string {
    return `${this.name} (${this.unit})`;
  }
}

export const STARTER_INGREDIENTS = {
  FLOUR: new Ingredient('flour', 'Flour', 'cups', '🌾'),
  BUTTER: new Ingredient('butter', 'Butter', 'sticks', '🧈'),
  EGGS: new Ingredient('eggs', 'Eggs', 'pieces', '🥚')
} as const;