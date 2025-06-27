import { Pantry } from '../Pantry';
import { Ingredient, STARTER_INGREDIENTS } from '../Ingredient';
import { IngredientAmount } from '../IngredientAmount';

describe('Pantry', () => {
  let pantry: Pantry;

  beforeEach(() => {
    pantry = new Pantry();
  });

  describe('addIngredient', () => {
    it('should add ingredient to empty pantry', () => {
      pantry.addIngredient('flour', 5);
      
      expect(pantry.getStock('flour')).toBe(5);
    });

    it('should add to existing ingredient stock', () => {
      pantry.addIngredient('flour', 5);
      pantry.addIngredient('flour', 3);
      
      expect(pantry.getStock('flour')).toBe(8);
    });

    it('should throw error for negative amount', () => {
      expect(() => pantry.addIngredient('flour', -1)).toThrow('Cannot add negative amount to pantry');
    });
  });

  describe('removeIngredient', () => {
    beforeEach(() => {
      pantry.addIngredient('flour', 10);
    });

    it('should remove ingredient from pantry', () => {
      pantry.removeIngredient('flour', 3);
      
      expect(pantry.getStock('flour')).toBe(7);
    });

    it('should remove all of ingredient when exact amount', () => {
      pantry.removeIngredient('flour', 10);
      
      expect(pantry.getStock('flour')).toBe(0);
      expect(pantry.ingredientIds).not.toContain('flour');
    });

    it('should throw error when insufficient stock', () => {
      expect(() => pantry.removeIngredient('flour', 15)).toThrow('Insufficient flour: have 10, need 15');
    });

    it('should throw error for negative amount', () => {
      expect(() => pantry.removeIngredient('flour', -1)).toThrow('Cannot remove negative amount from pantry');
    });
  });

  describe('hasEnough', () => {
    beforeEach(() => {
      pantry.addIngredient('flour', 10);
    });

    it('should return true when sufficient stock', () => {
      expect(pantry.hasEnough('flour', 5)).toBe(true);
      expect(pantry.hasEnough('flour', 10)).toBe(true);
    });

    it('should return false when insufficient stock', () => {
      expect(pantry.hasEnough('flour', 15)).toBe(false);
    });

    it('should return false for non-existent ingredient', () => {
      expect(pantry.hasEnough('butter', 1)).toBe(false);
    });
  });

  describe('canSupport', () => {
    beforeEach(() => {
      pantry.addIngredient('flour', 10);
      pantry.addIngredient('butter', 5);
    });

    it('should return true when all ingredients available', () => {
      const ingredients = [
        new IngredientAmount(STARTER_INGREDIENTS.FLOUR, 5),
        new IngredientAmount(STARTER_INGREDIENTS.BUTTER, 2)
      ];
      
      expect(pantry.canSupport(ingredients)).toBe(true);
    });

    it('should return false when any ingredient insufficient', () => {
      const ingredients = [
        new IngredientAmount(STARTER_INGREDIENTS.FLOUR, 5),
        new IngredientAmount(STARTER_INGREDIENTS.BUTTER, 10) // More than available
      ];
      
      expect(pantry.canSupport(ingredients)).toBe(false);
    });
  });

  describe('transferIngredients', () => {
    beforeEach(() => {
      pantry.addIngredient('flour', 10);
      pantry.addIngredient('butter', 5);
    });

    it('should transfer multiple ingredients successfully', () => {
      const ingredients = [
        new IngredientAmount(STARTER_INGREDIENTS.FLOUR, 6),
        new IngredientAmount(STARTER_INGREDIENTS.BUTTER, 2)
      ];
      
      pantry.transferIngredients(ingredients);
      
      expect(pantry.getStock('flour')).toBe(4);
      expect(pantry.getStock('butter')).toBe(3);
    });

    it('should validate all transfers before executing any', () => {
      const ingredients = [
        new IngredientAmount(STARTER_INGREDIENTS.FLOUR, 5),
        new IngredientAmount(STARTER_INGREDIENTS.BUTTER, 10) // Insufficient
      ];
      
      expect(() => pantry.transferIngredients(ingredients)).toThrow();
      
      // Flour should remain unchanged since validation failed
      expect(pantry.getStock('flour')).toBe(10);
      expect(pantry.getStock('butter')).toBe(5);
    });
  });

  describe('state management', () => {
    it('should save and restore state', () => {
      pantry.addIngredient('flour', 10);
      pantry.addIngredient('butter', 5);
      
      const state = pantry.toState();
      const newPantry = new Pantry(state);
      
      expect(newPantry.getStock('flour')).toBe(10);
      expect(newPantry.getStock('butter')).toBe(5);
    });

    it('should clone pantry correctly', () => {
      pantry.addIngredient('flour', 10);
      
      const cloned = pantry.clone();
      
      expect(cloned.getStock('flour')).toBe(10);
      
      // Verify independence
      cloned.addIngredient('flour', 5);
      expect(pantry.getStock('flour')).toBe(10); // Original unchanged
      expect(cloned.getStock('flour')).toBe(15); // Clone changed
    });
  });
});