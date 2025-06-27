import { Ingredient, STARTER_INGREDIENTS } from '../Ingredient';

describe('Ingredient', () => {
  describe('constructor', () => {
    it('should create ingredient with valid properties', () => {
      const ingredient = new Ingredient('flour', 'Flour', 'cups', '🌾');
      
      expect(ingredient.id).toBe('flour');
      expect(ingredient.name).toBe('Flour');
      expect(ingredient.unit).toBe('cups');
      expect(ingredient.icon).toBe('🌾');
    });

    it('should create ingredient without icon (defaults to empty string)', () => {
      const ingredient = new Ingredient('flour', 'Flour', 'cups');
      
      expect(ingredient.icon).toBe('');
    });

    it('should throw error for empty id', () => {
      expect(() => new Ingredient('', 'Flour', 'cups')).toThrow('Ingredient id cannot be empty');
      expect(() => new Ingredient('   ', 'Flour', 'cups')).toThrow('Ingredient id cannot be empty');
    });

    it('should throw error for empty name', () => {
      expect(() => new Ingredient('flour', '', 'cups')).toThrow('Ingredient name cannot be empty');
      expect(() => new Ingredient('flour', '   ', 'cups')).toThrow('Ingredient name cannot be empty');
    });

    it('should throw error for empty unit', () => {
      expect(() => new Ingredient('flour', 'Flour', '')).toThrow('Ingredient unit cannot be empty');
      expect(() => new Ingredient('flour', 'Flour', '   ')).toThrow('Ingredient unit cannot be empty');
    });
  });

  describe('equals', () => {
    it('should return true for ingredients with same id', () => {
      const ingredient1 = new Ingredient('flour', 'Flour', 'cups');
      const ingredient2 = new Ingredient('flour', 'Different Name', 'different unit');
      
      expect(ingredient1.equals(ingredient2)).toBe(true);
    });

    it('should return false for ingredients with different id', () => {
      const ingredient1 = new Ingredient('flour', 'Flour', 'cups');
      const ingredient2 = new Ingredient('butter', 'Flour', 'cups');
      
      expect(ingredient1.equals(ingredient2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return formatted string', () => {
      const ingredient = new Ingredient('flour', 'Flour', 'cups');
      
      expect(ingredient.toString()).toBe('Flour (cups)');
    });
  });

  describe('STARTER_INGREDIENTS', () => {
    it('should contain flour, butter, and eggs', () => {
      expect(STARTER_INGREDIENTS.FLOUR.id).toBe('flour');
      expect(STARTER_INGREDIENTS.FLOUR.name).toBe('Flour');
      expect(STARTER_INGREDIENTS.FLOUR.unit).toBe('cups');

      expect(STARTER_INGREDIENTS.BUTTER.id).toBe('butter');
      expect(STARTER_INGREDIENTS.BUTTER.name).toBe('Butter');
      expect(STARTER_INGREDIENTS.BUTTER.unit).toBe('sticks');

      expect(STARTER_INGREDIENTS.EGGS.id).toBe('eggs');
      expect(STARTER_INGREDIENTS.EGGS.name).toBe('Eggs');
      expect(STARTER_INGREDIENTS.EGGS.unit).toBe('pieces');
    });
  });
});