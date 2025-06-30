import { UIManager } from '../UIManager';
import { Application } from '@/core/engine/Application';
import { GameState, GameStateFactory } from '@/domain/progression';

// Mock the Application class
vi.mock('@/core/engine/Application');

describe('UIManager', () => {
  let uiManager: UIManager;
  let mockApp: any;
  let gameState: GameState;

  beforeEach(() => {
    // Create a fresh DOM environment
    document.body.innerHTML = '';
    
    // Create mock game state
    gameState = GameStateFactory.createTestGameState();
    gameState.store.addRevenue(100); // Give some money for tests
    
    // Create mock application
    mockApp = {
      gameState,
      switchToTab: vi.fn(),
      startCooking: vi.fn(),
      scaleRecipe: vi.fn(),
      resetRecipeScaling: vi.fn(),
      proceedToNextStep: vi.fn(),
      cancelCooking: vi.fn(),
      finishProduction: vi.fn(),
      bulkBuyIngredient: vi.fn(),
      orderIngredient: vi.fn()
    };
    
    uiManager = new UIManager(mockApp);
  });

  describe('Recipe Shop Modal', () => {
    describe('createRecipeShopModal', () => {
      it('should create recipe shop modal in DOM', () => {
        uiManager.createRecipeShopModal();
        
        const modal = document.getElementById('recipe-shop-modal');
        expect(modal).toBeTruthy();
        expect(modal?.style.display).toBe('flex');
      });

      it('should create modal with all required elements', () => {
        uiManager.createRecipeShopModal();
        
        // Check for essential elements
        expect(document.getElementById('recipe-shop-close')).toBeTruthy();
        expect(document.getElementById('player-coins')).toBeTruthy();
        expect(document.getElementById('recipe-sort')).toBeTruthy();
        expect(document.getElementById('recipe-filter')).toBeTruthy();
        expect(document.getElementById('recipe-shop-grid')).toBeTruthy();
        
        // Check for category buttons
        const categoryBtns = document.querySelectorAll('.shop-category-btn');
        expect(categoryBtns.length).toBe(4); // all, starter, intermediate, advanced
      });

      it('should remove existing modal before creating new one', () => {
        // Create first modal
        uiManager.createRecipeShopModal();
        const firstModal = document.getElementById('recipe-shop-modal');
        
        // Create second modal
        uiManager.createRecipeShopModal();
        const secondModal = document.getElementById('recipe-shop-modal');
        
        // Should only have one modal
        const allModals = document.querySelectorAll('#recipe-shop-modal');
        expect(allModals.length).toBe(1);
        expect(firstModal).not.toBe(secondModal);
      });

      it('should display current player funds', () => {
        uiManager.createRecipeShopModal();
        
        const currencyAmount = document.getElementById('player-coins');
        expect(currencyAmount?.textContent).toBe('$105.00'); // $5 initial + $100 added
      });
    });

    describe('setupRecipeShopModal', () => {
      beforeEach(() => {
        uiManager.createRecipeShopModal();
      });

      it('should setup close button functionality', () => {
        const modal = document.getElementById('recipe-shop-modal');
        const closeBtn = document.getElementById('recipe-shop-close');
        
        expect(modal).toBeTruthy();
        expect(closeBtn).toBeTruthy();
        
        // Simulate click
        closeBtn?.click();
        
        // Modal should be removed from DOM
        expect(document.getElementById('recipe-shop-modal')).toBeFalsy();
      });

      it('should setup category button functionality', () => {
        const categoryBtns = document.querySelectorAll('.shop-category-btn');
        const starterBtn = Array.from(categoryBtns).find(btn => 
          btn.getAttribute('data-category') === 'starter'
        ) as HTMLElement;
        
        expect(starterBtn).toBeTruthy();
        
        // Simulate click
        starterBtn?.click();
        
        // Should update active state
        expect(starterBtn?.classList.contains('active')).toBe(true);
        
        // Other buttons should not be active
        const otherBtns = Array.from(categoryBtns).filter(btn => btn !== starterBtn);
        otherBtns.forEach(btn => {
          expect(btn.classList.contains('active')).toBe(false);
        });
      });

      it('should setup sort and filter controls', () => {
        const sortSelect = document.getElementById('recipe-sort') as HTMLSelectElement;
        const filterSelect = document.getElementById('recipe-filter') as HTMLSelectElement;
        
        expect(sortSelect).toBeTruthy();
        expect(filterSelect).toBeTruthy();
        
        // Check that options are present
        expect(sortSelect.options.length).toBeGreaterThan(1);
        expect(filterSelect.options.length).toBeGreaterThan(1);
      });
    });

    describe('Recipe Sorting and Filtering', () => {
      beforeEach(() => {
        uiManager.createRecipeShopModal();
      });

      describe('applyRecipeFilter', () => {
        it('should filter purchasable recipes', () => {
          const mockRecipes = [
            { id: '1', isPurchasable: true, isOwned: false, comingSoon: false },
            { id: '2', isPurchasable: false, isOwned: false, comingSoon: false },
            { id: '3', isPurchasable: true, isOwned: false, comingSoon: false }
          ];
          
          const filtered = (uiManager as any).applyRecipeFilter(mockRecipes, 'purchasable');
          expect(filtered.length).toBe(2);
          expect(filtered.every((r: any) => r.isPurchasable)).toBe(true);
        });

        it('should filter owned recipes', () => {
          const mockRecipes = [
            { id: '1', isPurchasable: false, isOwned: true, comingSoon: false },
            { id: '2', isPurchasable: true, isOwned: false, comingSoon: false },
            { id: '3', isPurchasable: false, isOwned: true, comingSoon: false }
          ];
          
          const filtered = (uiManager as any).applyRecipeFilter(mockRecipes, 'owned');
          expect(filtered.length).toBe(2);
          expect(filtered.every((r: any) => r.isOwned)).toBe(true);
        });

        it('should filter coming soon recipes', () => {
          const mockRecipes = [
            { id: '1', isPurchasable: false, isOwned: false, comingSoon: true },
            { id: '2', isPurchasable: true, isOwned: false, comingSoon: false },
            { id: '3', isPurchasable: false, isOwned: false, comingSoon: true }
          ];
          
          const filtered = (uiManager as any).applyRecipeFilter(mockRecipes, 'coming-soon');
          expect(filtered.length).toBe(2);
          expect(filtered.every((r: any) => r.comingSoon)).toBe(true);
        });

        it('should filter affordable recipes', () => {
          const mockRecipes = [
            { id: '1', price: 50, isOwned: false },
            { id: '2', price: 150, isOwned: false },
            { id: '3', price: 75, isOwned: true } // owned, should be excluded
          ];
          
          const filtered = (uiManager as any).applyRecipeFilter(mockRecipes, 'affordable');
          expect(filtered.length).toBe(1);
          expect(filtered[0].price).toBe(50);
        });
      });

      describe('sortRecipes', () => {
        it('should sort recipes by name', () => {
          const mockRecipes = [
            { recipe: { name: 'Zebra Cake' } },
            { recipe: { name: 'Apple Pie' } },
            { recipe: { name: 'Banana Bread' } }
          ];
          
          const sorted = (uiManager as any).sortRecipes(mockRecipes, 'name');
          expect(sorted[0].recipe.name).toBe('Apple Pie');
          expect(sorted[1].recipe.name).toBe('Banana Bread');
          expect(sorted[2].recipe.name).toBe('Zebra Cake');
        });

        it('should sort recipes by price (low to high)', () => {
          const mockRecipes = [
            { price: 100 },
            { price: 25 },
            { price: 75 }
          ];
          
          const sorted = (uiManager as any).sortRecipes(mockRecipes, 'price-low');
          expect(sorted[0].price).toBe(25);
          expect(sorted[1].price).toBe(75);
          expect(sorted[2].price).toBe(100);
        });

        it('should sort recipes by price (high to low)', () => {
          const mockRecipes = [
            { price: 100 },
            { price: 25 },
            { price: 75 }
          ];
          
          const sorted = (uiManager as any).sortRecipes(mockRecipes, 'price-high');
          expect(sorted[0].price).toBe(100);
          expect(sorted[1].price).toBe(75);
          expect(sorted[2].price).toBe(25);
        });

        it('should sort recipes by level requirement', () => {
          const mockRecipes = [
            { levelRequirement: 5 },
            { levelRequirement: 2 },
            { levelRequirement: 8 }
          ];
          
          const sorted = (uiManager as any).sortRecipes(mockRecipes, 'level');
          expect(sorted[0].levelRequirement).toBe(2);
          expect(sorted[1].levelRequirement).toBe(5);
          expect(sorted[2].levelRequirement).toBe(8);
        });

        it('should sort recipes by baking time', () => {
          const mockRecipes = [
            { recipe: { bakingTime: 60 } },
            { recipe: { bakingTime: 30 } },
            { recipe: { bakingTime: 90 } }
          ];
          
          const sorted = (uiManager as any).sortRecipes(mockRecipes, 'time');
          expect(sorted[0].recipe.bakingTime).toBe(30);
          expect(sorted[1].recipe.bakingTime).toBe(60);
          expect(sorted[2].recipe.bakingTime).toBe(90);
        });

        it('should randomly shuffle recipes', () => {
          const mockRecipes = [
            { id: '1' },
            { id: '2' },
            { id: '3' },
            { id: '4' },
            { id: '5' }
          ];
          
          // Run random sort multiple times to check it's actually random
          const results = [];
          for (let i = 0; i < 10; i++) {
            const sorted = (uiManager as any).sortRecipes([...mockRecipes], 'random');
            results.push(sorted.map((r: any) => r.id).join(''));
          }
          
          // Should have at least some different orderings
          const uniqueResults = new Set(results);
          expect(uniqueResults.size).toBeGreaterThan(1);
        });
      });
    });
  });

  describe('refreshRecipeShop', () => {
    it('should refresh with current category and controls', () => {
      uiManager.createRecipeShopModal();
      
      // Set a specific category as active
      const starterBtn = document.querySelector('[data-category="starter"]') as HTMLElement;
      starterBtn?.click();
      
      // Set specific sort/filter values
      const sortSelect = document.getElementById('recipe-sort') as HTMLSelectElement;
      const filterSelect = document.getElementById('recipe-filter') as HTMLSelectElement;
      
      if (sortSelect) sortSelect.value = 'price-low';
      if (filterSelect) filterSelect.value = 'purchasable';
      
      // Spy on populateRecipeShop to verify it's called with correct parameters
      const populateSpy = vi.spyOn(uiManager, 'populateRecipeShop');
      
      uiManager.refreshRecipeShop();
      
      expect(populateSpy).toHaveBeenCalledWith('starter', 'price-low', 'purchasable');
    });
  });
});