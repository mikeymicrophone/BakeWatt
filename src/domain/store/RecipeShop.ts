import { RecipeLibrary } from '@/domain/baking';
import { GameState } from '@/domain/progression';

export interface ShopRecipe {
  id: string;
  recipe: any; // Recipe from RecipeLibrary or placeholder
  price: number;
  category: 'starter' | 'intermediate' | 'advanced';
  levelRequirement: number;
  description: string;
  isOwned: boolean;
  isPurchasable: boolean;
  implemented: boolean;
  comingSoon?: boolean;
}

export interface RecipeShopState {
  availableRecipes: ShopRecipe[];
  categories: string[];
  lastRefresh: string;
}

export class RecipeShop {
  private static readonly SHOP_RECIPES = [
    // Implemented recipes (can be purchased)
    {
      id: 'chocolate-muffins',
      basePrice: 25.00,
      category: 'starter' as const,
      levelRequirement: 2,
      description: 'Fluffy muffins great for addition math practice',
      implemented: true
    },
    {
      id: 'birthday-cake',
      basePrice: 45.00,
      category: 'intermediate' as const,
      levelRequirement: 3,
      description: 'Special cake for celebrations and advanced math',
      implemented: true
    },
    
    // Coming soon recipes (for display only)
    {
      id: 'chocolate-lava-cake',
      basePrice: 150.00,
      category: 'advanced' as const,
      levelRequirement: 5,
      description: 'Decadent molten chocolate dessert with a gooey center',
      implemented: false
    },
    {
      id: 'strawberry-shortcake',
      basePrice: 100.00,
      category: 'intermediate' as const,
      levelRequirement: 4,
      description: 'Classic summer dessert with fresh strawberries and cream',
      implemented: false
    },
    {
      id: 'tiramisu',
      basePrice: 200.00,
      category: 'advanced' as const,
      levelRequirement: 6,
      description: 'Italian coffee-flavored dessert with mascarpone',
      implemented: false
    },
    {
      id: 'apple-pie',
      basePrice: 120.00,
      category: 'intermediate' as const,
      levelRequirement: 4,
      description: 'Classic American dessert with spiced apples',
      implemented: false
    },
    {
      id: 'sourdough-bread',
      basePrice: 180.00,
      category: 'advanced' as const,
      levelRequirement: 7,
      description: 'Artisanal bread with tangy sourdough starter',
      implemented: false
    },
    {
      id: 'dinner-rolls',
      basePrice: 80.00,
      category: 'starter' as const,
      levelRequirement: 3,
      description: 'Soft and fluffy dinner rolls perfect for any meal',
      implemented: false
    },
    {
      id: 'pumpkin-spice-cake',
      basePrice: 140.00,
      category: 'intermediate' as const,
      levelRequirement: 5,
      description: 'Fall-inspired cake with warm pumpkin spices',
      implemented: false
    },
    {
      id: 'gingerbread-cookies',
      basePrice: 90.00,
      category: 'starter' as const,
      levelRequirement: 3,
      description: 'Festive spiced cookies perfect for holidays',
      implemented: false
    }
  ];

  public static getAvailableRecipes(gameState: GameState): ShopRecipe[] {
    const ownedRecipeIds = gameState.recipes.getAllRecipes().map(recipe => recipe.id);
    const playerLevel = gameState.currentLevel;
    const revenue = gameState.store.getTotalRevenue();

    return this.SHOP_RECIPES.map(shopItem => {
      let recipe;
      let isOwned = false;
      let isPurchasable = false;

      if (shopItem.implemented) {
        // Try to get real recipe from library
        recipe = RecipeLibrary.getRecipeById(shopItem.id);
        isOwned = ownedRecipeIds.includes(shopItem.id);
        const meetsLevel = playerLevel >= shopItem.levelRequirement;
        const canAfford = revenue >= shopItem.basePrice;
        isPurchasable = !isOwned && meetsLevel && canAfford && recipe !== null;
      } else {
        // Create placeholder recipe for unimplemented ones
        recipe = this.createPlaceholderRecipe(shopItem);
        isPurchasable = false; // Can't purchase unimplemented recipes
      }

      return {
        id: shopItem.id,
        recipe,
        price: shopItem.basePrice,
        category: shopItem.category,
        levelRequirement: shopItem.levelRequirement,
        description: shopItem.description,
        isOwned,
        isPurchasable,
        implemented: shopItem.implemented,
        comingSoon: !shopItem.implemented
      };
    }).filter(item => item.recipe !== null);
  }

  private static createPlaceholderRecipe(shopItem: any) {
    // Map recipe IDs to appropriate icons and details
    const recipeData = {
      'chocolate-lava-cake': { icon: '🌋', name: 'Chocolate Lava Cake', bakingTime: 45, baseServings: 4, difficulty: 'hard' },
      'strawberry-shortcake': { icon: '🍰', name: 'Strawberry Shortcake', bakingTime: 35, baseServings: 8, difficulty: 'medium' },
      'tiramisu': { icon: '🍮', name: 'Tiramisu', bakingTime: 60, baseServings: 6, difficulty: 'hard' },
      'apple-pie': { icon: '🥧', name: 'Apple Pie', bakingTime: 90, baseServings: 8, difficulty: 'medium' },
      'sourdough-bread': { icon: '🍞', name: 'Sourdough Bread', bakingTime: 240, baseServings: 12, difficulty: 'hard' },
      'dinner-rolls': { icon: '🥖', name: 'Dinner Rolls', bakingTime: 90, baseServings: 16, difficulty: 'easy' },
      'pumpkin-spice-cake': { icon: '🎃', name: 'Pumpkin Spice Cake', bakingTime: 50, baseServings: 10, difficulty: 'medium' },
      'gingerbread-cookies': { icon: '🍪', name: 'Gingerbread Cookies', bakingTime: 40, baseServings: 24, difficulty: 'easy' }
    };

    const data = recipeData[shopItem.id as keyof typeof recipeData];
    if (!data) return null;

    // Return a simple object that matches the Recipe interface properties we use
    return {
      id: shopItem.id,
      name: data.name,
      description: shopItem.description,
      icon: data.icon,
      bakingTime: data.bakingTime,
      baseServings: data.baseServings,
      difficulty: data.difficulty
    };
  }

  public static getRecipePrice(recipeId: string): number {
    const shopItem = this.SHOP_RECIPES.find(item => item.id === recipeId);
    return shopItem?.basePrice ?? 0;
  }

  public static canPurchaseRecipe(recipeId: string, gameState: GameState): { 
    canPurchase: boolean; 
    reason?: string;
    price: number;
  } {
    const shopItem = this.SHOP_RECIPES.find(item => item.id === recipeId);
    if (!shopItem) {
      return { canPurchase: false, reason: 'Recipe not found in shop', price: 0 };
    }

    if (!shopItem.implemented) {
      return { canPurchase: false, reason: 'Coming soon! This recipe is not yet available for purchase.', price: shopItem.basePrice };
    }

    const recipe = RecipeLibrary.getRecipeById(recipeId);
    if (!recipe) {
      return { canPurchase: false, reason: 'Recipe not available', price: shopItem.basePrice };
    }

    const ownedRecipeIds = gameState.recipes.getAllRecipes().map(r => r.id);
    if (ownedRecipeIds.includes(recipeId)) {
      return { canPurchase: false, reason: 'Already owned', price: shopItem.basePrice };
    }

    const playerLevel = gameState.currentLevel;
    if (playerLevel < shopItem.levelRequirement) {
      return { 
        canPurchase: false, 
        reason: `Requires level ${shopItem.levelRequirement} (you are level ${playerLevel})`,
        price: shopItem.basePrice
      };
    }

    const revenue = gameState.store.getTotalRevenue();
    if (revenue < shopItem.basePrice) {
      return { 
        canPurchase: false, 
        reason: `Insufficient funds (need $${shopItem.basePrice.toFixed(2)}, have $${revenue.toFixed(2)})`,
        price: shopItem.basePrice
      };
    }

    return { canPurchase: true, price: shopItem.basePrice };
  }

  public static purchaseRecipe(recipeId: string, gameState: GameState): {
    success: boolean;
    message: string;
    newBalance?: number;
  } {
    const purchaseCheck = this.canPurchaseRecipe(recipeId, gameState);
    
    if (!purchaseCheck.canPurchase) {
      return {
        success: false,
        message: purchaseCheck.reason || 'Cannot purchase recipe'
      };
    }

    // Deduct money from store revenue
    const purchaseSuccess = gameState.store.deductMoney(purchaseCheck.price);
    if (!purchaseSuccess) {
      return {
        success: false,
        message: 'Transaction failed - insufficient funds'
      };
    }

    // Add recipe to collection
    const recipe = RecipeLibrary.getRecipeById(recipeId);
    if (!recipe) {
      // Refund the money if recipe doesn't exist (note: the Store class would need a credit method for this)
      console.error('Recipe not found after purchase - this should not happen');
      return {
        success: false,
        message: 'Recipe not found'
      };
    }

    gameState.recipes.addRecipe(recipe);

    return {
      success: true,
      message: `Successfully purchased ${recipe.name} for $${purchaseCheck.price.toFixed(2)}!`,
      newBalance: gameState.store.getTotalRevenue()
    };
  }

  public static getShopCategories(): string[] {
    return ['all', 'starter', 'intermediate', 'advanced'];
  }

  public static filterRecipesByCategory(recipes: ShopRecipe[], category: string): ShopRecipe[] {
    if (category === 'all') return recipes;
    return recipes.filter(recipe => recipe.category === category);
  }

  public static filterRecipesByAvailability(recipes: ShopRecipe[], filter: string): ShopRecipe[] {
    switch (filter) {
      case 'owned':
        return recipes.filter(recipe => recipe.isOwned);
      case 'purchasable':
        return recipes.filter(recipe => recipe.isPurchasable);
      case 'locked':
        return recipes.filter(recipe => !recipe.isOwned && !recipe.isPurchasable);
      default:
        return recipes;
    }
  }
}