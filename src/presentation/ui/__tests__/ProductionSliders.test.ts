/**
 * Test for production sliders functionality
 * Verifies that cutting and packaging sliders are properly wired up
 */
import { UIManager } from '../UIManager';
import { Application } from '@/core/engine/Application';
import { GameStateFactory } from '@/domain/progression';

// Mock the Application class
vi.mock('@/core/engine/Application');

describe('Production Sliders', () => {
  let uiManager: UIManager;
  let mockApp: any;

  beforeEach(() => {
    // Create a fresh DOM environment
    document.body.innerHTML = '';
    
    // Create mock application with slider update methods
    mockApp = {
      gameState: GameStateFactory.createTestGameState(),
      updateCuttingAmount: vi.fn(),
      updatePackagingAmount: vi.fn()
    };
    
    uiManager = new UIManager(mockApp);
  });

  describe('setupProductionSliders', () => {
    beforeEach(() => {
      // Create the HTML elements that the sliders expect
      document.body.innerHTML = `
        <div class="slider-control">
          <label class="slider-label">Pieces per item:</label>
          <input type="range" class="production-slider" id="cutting-slider" 
                 min="1" max="50" value="24" step="1">
          <span class="slider-value" id="cutting-value">24</span>
        </div>
        
        <div class="slider-control">
          <label class="slider-label">Pieces per package:</label>
          <input type="range" class="production-slider" id="packaging-slider" 
                 min="1" max="12" value="4" step="1">
          <span class="slider-value" id="packaging-value">4</span>
        </div>
      `;
    });

    it('should find and setup cutting slider correctly', () => {
      uiManager.setupProductionSliders();
      
      const cuttingSlider = document.getElementById('cutting-slider') as HTMLInputElement;
      const cuttingValue = document.getElementById('cutting-value');
      
      expect(cuttingSlider).toBeTruthy();
      expect(cuttingValue).toBeTruthy();
      expect(cuttingSlider.value).toBe('24');
      expect(cuttingValue?.textContent).toBe('24');
    });

    it('should find and setup packaging slider correctly', () => {
      uiManager.setupProductionSliders();
      
      const packagingSlider = document.getElementById('packaging-slider') as HTMLInputElement;
      const packagingValue = document.getElementById('packaging-value');
      
      expect(packagingSlider).toBeTruthy();
      expect(packagingValue).toBeTruthy();
      expect(packagingSlider.value).toBe('4');
      expect(packagingValue?.textContent).toBe('4');
    });

    it('should update cutting amount when slider changes', () => {
      uiManager.setupProductionSliders();
      
      const cuttingSlider = document.getElementById('cutting-slider') as HTMLInputElement;
      const cuttingValue = document.getElementById('cutting-value');
      
      // Simulate slider change
      cuttingSlider.value = '30';
      cuttingSlider.dispatchEvent(new Event('input'));
      
      // Should update display value
      expect(cuttingValue?.textContent).toBe('30');
      
      // Should call application method
      expect(mockApp.updateCuttingAmount).toHaveBeenCalledWith(30);
    });

    it('should update packaging amount when slider changes', () => {
      uiManager.setupProductionSliders();
      
      const packagingSlider = document.getElementById('packaging-slider') as HTMLInputElement;
      const packagingValue = document.getElementById('packaging-value');
      
      // Simulate slider change
      packagingSlider.value = '8';
      packagingSlider.dispatchEvent(new Event('input'));
      
      // Should update display value
      expect(packagingValue?.textContent).toBe('8');
      
      // Should call application method
      expect(mockApp.updatePackagingAmount).toHaveBeenCalledWith(8);
    });

    it('should handle missing slider elements gracefully', () => {
      // Remove slider elements
      document.body.innerHTML = '';
      
      // Should not throw error
      expect(() => {
        uiManager.setupProductionSliders();
      }).not.toThrow();
      
      // Should not call update methods
      expect(mockApp.updateCuttingAmount).not.toHaveBeenCalled();
      expect(mockApp.updatePackagingAmount).not.toHaveBeenCalled();
    });

    it('should handle slider values at boundaries correctly', () => {
      uiManager.setupProductionSliders();
      
      const cuttingSlider = document.getElementById('cutting-slider') as HTMLInputElement;
      const packagingSlider = document.getElementById('packaging-slider') as HTMLInputElement;
      
      // Test minimum values
      cuttingSlider.value = '1';
      cuttingSlider.dispatchEvent(new Event('input'));
      expect(mockApp.updateCuttingAmount).toHaveBeenCalledWith(1);
      
      packagingSlider.value = '1';
      packagingSlider.dispatchEvent(new Event('input'));
      expect(mockApp.updatePackagingAmount).toHaveBeenCalledWith(1);
      
      // Test maximum values
      cuttingSlider.value = '50';
      cuttingSlider.dispatchEvent(new Event('input'));
      expect(mockApp.updateCuttingAmount).toHaveBeenCalledWith(50);
      
      packagingSlider.value = '12';
      packagingSlider.dispatchEvent(new Event('input'));
      expect(mockApp.updatePackagingAmount).toHaveBeenCalledWith(12);
    });

    it('should parse slider values as integers', () => {
      uiManager.setupProductionSliders();
      
      const cuttingSlider = document.getElementById('cutting-slider') as HTMLInputElement;
      
      // Even if somehow a decimal value gets in, should parse as integer
      cuttingSlider.value = '25.7';
      cuttingSlider.dispatchEvent(new Event('input'));
      
      expect(mockApp.updateCuttingAmount).toHaveBeenCalledWith(25);
    });
  });
});