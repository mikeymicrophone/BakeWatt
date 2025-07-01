import { GameState } from '@/domain/progression';

export interface GameSaveData {
  pantryInventory: Record<string, number>;
  bakerCoins: number;
  unlockedRecipes: string[];
  currentLevel: number;
  tutorialCompleted: boolean;
  playerStats: {
    totalRevenue: number;
    itemsSold: number;
    recipesCompleted: number;
    mathProblemsCompleted: number;
  };
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  lastSaved: string;
}

export class StorageService {
  private static readonly STORAGE_KEY = 'bakewatt_game_save';
  private static readonly STORAGE_VERSION = '1.0.0';

  /**
   * Save game state to localStorage
   */
  public static saveGameState(gameState: GameState): boolean {
    try {
      const saveData: GameSaveData = {
        pantryInventory: this.serializePantry(gameState),
        bakerCoins: gameState.store.getTotalRevenue(), // Using revenue as coins for now
        unlockedRecipes: this.getUnlockedRecipes(gameState),
        currentLevel: gameState.currentLevel,
        tutorialCompleted: gameState.tutorialCompleted,
        playerStats: {
          totalRevenue: gameState.store.getTotalRevenue(),
          itemsSold: gameState.store.getAllItems().reduce((sum, item) => sum + item.quantity, 0),
          recipesCompleted: gameState.recipes.recipeCount,
          mathProblemsCompleted: 0 // TODO: Track this in game state
        },
        settings: {
          soundEnabled: true, // TODO: Add to game state
          musicEnabled: true,
          difficulty: 'medium'
        },
        lastSaved: new Date().toISOString()
      };

      const saveString = JSON.stringify({
        version: this.STORAGE_VERSION,
        data: saveData
      });

      localStorage.setItem(this.STORAGE_KEY, saveString);
      
      console.log('💾 Game saved successfully!', {
        coins: saveData.bakerCoins,
        level: saveData.currentLevel,
        recipes: saveData.unlockedRecipes.length
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game state from localStorage
   */
  public static loadGameState(): GameSaveData | null {
    try {
      const saveString = localStorage.getItem(this.STORAGE_KEY);
      if (!saveString) {
        console.log('📂 No saved game found - starting fresh');
        return null;
      }

      const saveFile = JSON.parse(saveString);
      
      // Version check for future migrations
      if (saveFile.version !== this.STORAGE_VERSION) {
        console.warn('⚠️ Save file version mismatch, may need migration');
      }

      const saveData = saveFile.data as GameSaveData;
      
      console.log('📂 Game loaded successfully!', {
        coins: saveData.bakerCoins,
        level: saveData.currentLevel,
        lastSaved: new Date(saveData.lastSaved).toLocaleString()
      });

      return saveData;
    } catch (error) {
      console.error('❌ Failed to load game:', error);
      return null;
    }
  }

  /**
   * Apply loaded save data to game state
   */
  public static applySaveData(gameState: GameState, saveData: GameSaveData): void {
    try {
      // Restore pantry inventory
      this.deserializePantry(gameState, saveData.pantryInventory);
      
      // Restore level and tutorial state
      gameState.setLevel(saveData.currentLevel);
      if (saveData.tutorialCompleted) {
        gameState.completeTutorial();
      }

      // TODO: Restore unlocked recipes when recipe unlocking system is implemented
      // TODO: Add baker coins to game state and restore them

      console.log('🔄 Save data applied to game state');
    } catch (error) {
      console.error('❌ Failed to apply save data:', error);
    }
  }

  /**
   * Clear saved game data
   */
  public static clearSaveData(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Save data cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear save data:', error);
      return false;
    }
  }

  /**
   * Check if save data exists
   */
  public static hasSaveData(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Get save data info without loading full state
   */
  public static getSaveInfo(): { lastSaved: Date; level: number; coins: number } | null {
    try {
      const saveString = localStorage.getItem(this.STORAGE_KEY);
      if (!saveString) return null;

      const saveFile = JSON.parse(saveString);
      const saveData = saveFile.data as GameSaveData;

      return {
        lastSaved: new Date(saveData.lastSaved),
        level: saveData.currentLevel,
        coins: saveData.bakerCoins
      };
    } catch (error) {
      return null;
    }
  }

  // Helper methods
  private static serializePantry(gameState: GameState): Record<string, number> {
    const pantryData: Record<string, number> = {};
    
    // Get all ingredient IDs and their stock levels
    const ingredients = ['flour', 'butter', 'eggs', 'sugar', 'vanilla', 'chocolate'];
    ingredients.forEach(id => {
      pantryData[id] = gameState.pantry.getStock(id);
    });

    return pantryData;
  }

  private static deserializePantry(gameState: GameState, pantryData: Record<string, number>): void {
    Object.entries(pantryData).forEach(([ingredientId, amount]) => {
      // Set the stock directly (this assumes GameState has a method to set stock)
      // For now, we'll need to add items to reach the desired amount
      const currentStock = gameState.pantry.getStock(ingredientId);
      const difference = amount - currentStock;
      
      if (difference > 0) {
        gameState.pantry.addIngredient(ingredientId, difference);
      } else if (difference < 0) {
        gameState.pantry.removeIngredient(ingredientId, Math.abs(difference));
      }
    });
  }

  private static getUnlockedRecipes(gameState: GameState): string[] {
    // For now, return all available recipes since we don't have unlocking system yet
    // TODO: Implement recipe unlocking system
    return ['chocolate-chip-cookies', 'birthday-cake', 'fluffy-pancakes', 'vanilla-cupcakes'];
  }

  /**
   * Auto-save functionality - call this periodically
   */
  public static autoSave(gameState: GameState): void {
    if (this.saveGameState(gameState)) {
      // Show a subtle notification
      this.showSaveNotification();
    }
  }

  private static showSaveNotification(): void {
    // Create a subtle save indicator
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    notification.textContent = '💾 Game Saved';
    
    document.body.appendChild(notification);
    
    // Fade out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }
}