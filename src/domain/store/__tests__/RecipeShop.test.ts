import { RecipeShop } from '../RecipeShop';
import { GameState, GameStateFactory } from '@/domain/progression';
import { RecipeLibrary } from '@/domain/baking';

describe('RecipeShop', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = GameStateFactory.createTestGameState();
  });

  describe('getAvailableRecipes', () => {
    it('should return all shop recipes', () => {
      const recipes = RecipeShop.getAvailableRecipes(gameState);
      
      expect(recipes.length).toBeGreaterThan(0);
      expect(recipes.length).toBe(10); // Should have 10 total recipes
    });

    it('should mark implemented recipes as purchasable when conditions are met', () => {
      // Give player enough money and level
      gameState.store.addRevenue(1000);
      gameState.advanceLevel();
      gameState.advanceLevel();
      gameState.advanceLevel();
      
      const recipes = RecipeShop.getAvailableRecipes(gameState);
      const implementedRecipes = recipes.filter(r => r.implemented);
      
      expect(implementedRecipes.length).toBe(2); // Should have 2 implemented recipes
      
      const purchasableRecipes = implementedRecipes.filter(r => r.isPurchasable);
      expect(purchasableRecipes.length).toBeGreaterThan(0);
    });

    it('should mark coming soon recipes as not purchasable', () => {
      const recipes = RecipeShop.getAvailableRecipes(gameState);
      const comingSoonRecipes = recipes.filter(r => r.comingSoon);
      
      expect(comingSoonRecipes.length).toBe(8); // Should have 8 coming soon recipes
      
      comingSoonRecipes.forEach(recipe => {
        expect(recipe.isPurchasable).toBe(false);
      });
    });

    it('should mark owned recipes correctly', () => {
      // Add a recipe to the collection first
      const chocolateMuffins = RecipeLibrary.getRecipeById('chocolate-muffins');
      if (chocolateMuffins) {
        gameState.recipes.addRecipe(chocolateMuffins);
      }
      
      const recipes = RecipeShop.getAvailableRecipes(gameState);
      const ownedRecipe = recipes.find(r => r.id === 'chocolate-muffins');
      
      expect(ownedRecipe?.isOwned).toBe(true);
      expect(ownedRecipe?.isPurchasable).toBe(false);
    });
  });

  describe('filterRecipesByCategory', () => {
    it('should filter recipes by starter category', () => {
      const allRecipes = RecipeShop.getAvailableRecipes(gameState);
      const starterRecipes = RecipeShop.filterRecipesByCategory(allRecipes, 'starter');
      
      starterRecipes.forEach(recipe => {
        expect(recipe.category).toBe('starter');
      });
    });

    it('should filter recipes by intermediate category', () => {
      const allRecipes = RecipeShop.getAvailableRecipes(gameState);
      const intermediateRecipes = RecipeShop.filterRecipesByCategory(allRecipes, 'intermediate');
      
      intermediateRecipes.forEach(recipe => {
        expect(recipe.category).toBe('intermediate');
      });
    });

    it('should filter recipes by advanced category', () => {
      const allRecipes = RecipeShop.getAvailableRecipes(gameState);
      const advancedRecipes = RecipeShop.filterRecipesByCategory(allRecipes, 'advanced');
      
      advancedRecipes.forEach(recipe => {
        expect(recipe.category).toBe('advanced');
      });
    });

    it('should return all recipes for "all" category', () => {
      const allRecipes = RecipeShop.getAvailableRecipes(gameState);
      const filteredRecipes = RecipeShop.filterRecipesByCategory(allRecipes, 'all');
      
      expect(filteredRecipes).toEqual(allRecipes);
    });
  });

  describe('canPurchaseRecipe', () => {
    it('should allow purchase when all conditions are met', () => {
      // Give player enough money and level
      gameState.store.addRevenue(100);
      gameState.advanceLevel();
      gameState.advanceLevel();
      gameState.advanceLevel();
      
      const result = RecipeShop.canPurchaseRecipe('chocolate-muffins', gameState);
      
      expect(result.canPurchase).toBe(true);
      expect(result.price).toBe(25.00);
    });

    it('should prevent purchase when insufficient funds', () => {
      // Don't give player enough money
      gameState.advanceLevel();
      gameState.advanceLevel();
      gameState.advanceLevel();
      
      const result = RecipeShop.canPurchaseRecipe('chocolate-muffins', gameState);
      
      expect(result.canPurchase).toBe(false);
      expect(result.reason).toContain('Insufficient funds');
    });

    it('should prevent purchase when level too low', () => {
      // Give money but not enough level
      gameState.store.addRevenue(100);
      
      const result = RecipeShop.canPurchaseRecipe('chocolate-muffins', gameState);
      
      expect(result.canPurchase).toBe(false);
      expect(result.reason).toContain('Requires level');
    });

    it('should prevent purchase of coming soon recipes', () => {
      // Give player everything they need
      gameState.store.addRevenue(1000);
      for (let i = 0; i < 10; i++) gameState.advanceLevel();
      
      const result = RecipeShop.canPurchaseRecipe('chocolate-lava-cake', gameState);
      
      expect(result.canPurchase).toBe(false);
      expect(result.reason).toContain('Coming soon');
    });

    it('should prevent purchase of already owned recipes', () => {
      // Give player everything and add recipe to collection
      gameState.store.addRevenue(100);
      gameState.advanceLevel();
      gameState.advanceLevel();
      gameState.advanceLevel();
      
      const chocolateMuffins = RecipeLibrary.getRecipeById('chocolate-muffins');
      if (chocolateMuffins) {
        gameState.recipes.addRecipe(chocolateMuffins);
      }
      
      const result = RecipeShop.canPurchaseRecipe('chocolate-muffins', gameState);
      
      expect(result.canPurchase).toBe(false);
      expect(result.reason).toBe('Already owned');
    });
  });

  describe('purchaseRecipe', () => {
    it('should successfully purchase when conditions are met', () => {
      // Give player enough money and level
      gameState.store.addRevenue(100);
      gameState.advanceLevel();
      gameState.advanceLevel();
      gameState.advanceLevel();
      
      const initialBalance = gameState.store.getTotalRevenue();
      const result = RecipeShop.purchaseRecipe('chocolate-muffins', gameState);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully purchased');
      expect(result.newBalance).toBe(initialBalance - 25.00);
      
      // Check recipe was added to collection
      const ownedRecipeIds = gameState.recipes.getAllRecipes().map(r => r.id);
      expect(ownedRecipeIds).toContain('chocolate-muffins');
    });

    it('should fail purchase when conditions not met', () => {
      // Don't give enough money
      const result = RecipeShop.purchaseRecipe('chocolate-muffins', gameState);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('level'); // Should fail on level requirement, not funds
    });
  });

  describe('utility methods', () => {
    it('should get recipe price correctly', () => {
      const price = RecipeShop.getRecipePrice('chocolate-muffins');
      expect(price).toBe(25.00);
      
      const unknownPrice = RecipeShop.getRecipePrice('unknown-recipe');
      expect(unknownPrice).toBe(0);
    });

    it('should return shop categories', () => {
      const categories = RecipeShop.getShopCategories();
      expect(categories).toEqual(['all', 'starter', 'intermediate', 'advanced']);
    });

    it('should filter recipes by availability', () => {
      // Give player some money and level
      gameState.store.addRevenue(50);
      gameState.advanceLevel();
      gameState.advanceLevel();
      gameState.advanceLevel();
      
      const allRecipes = RecipeShop.getAvailableRecipes(gameState);
      
      const purchasableRecipes = RecipeShop.filterRecipesByAvailability(allRecipes, 'purchasable');
      purchasableRecipes.forEach(recipe => {
        expect(recipe.isPurchasable).toBe(true);
      });
      
      const lockedRecipes = RecipeShop.filterRecipesByAvailability(allRecipes, 'locked');
      lockedRecipes.forEach(recipe => {
        expect(recipe.isOwned).toBe(false);
        expect(recipe.isPurchasable).toBe(false);
      });
    });
  });
});