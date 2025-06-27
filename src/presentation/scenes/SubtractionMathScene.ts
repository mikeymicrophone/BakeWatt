import { injectable, inject } from 'inversify';
import { observable, action, computed } from 'mobx';
import { IngredientService, BakingCounter, Ingredient, STARTER_INGREDIENTS } from '@/domain/inventory';
import { MathService, IngredientTransferProblem } from '@/core/math/MathService';
import { CubeGrid } from '@/presentation/components/CubeGrid';
import { SceneManager } from '@/core/engine/SceneManager';
import { CameraZoomManager } from '@/core/engine/CameraZoomManager';

@injectable()
export class SubtractionMathScene {
  @observable private _isVisible: boolean = false;
  @observable private _selectedIngredientId: string | null = null;
  @observable private _transferAmount: number = 1;

  private cubeGrid: CubeGrid | null = null;
  private bakingCounter: BakingCounter;
  private disposers: (() => void)[] = [];

  constructor(
    @inject(IngredientService) private ingredientService: IngredientService,
    @inject(MathService) private mathService: MathService,
    @inject(SceneManager) private sceneManager: SceneManager,
    @inject(CameraZoomManager) private zoomManager: CameraZoomManager
  ) {
    this.bakingCounter = new BakingCounter();
  }

  @computed
  get isVisible(): boolean {
    return this._isVisible;
  }

  @computed
  get selectedIngredientId(): string | null {
    return this._selectedIngredientId;
  }

  @computed
  get transferAmount(): number {
    return this._transferAmount;
  }

  @computed
  get selectedIngredient(): Ingredient | null {
    return this._selectedIngredientId 
      ? this.getIngredientById(this._selectedIngredientId)
      : null;
  }

  @computed
  get currentTransferProblem(): IngredientTransferProblem | null {
    if (!this.selectedIngredient) return null;
    
    const pantryAmount = this.ingredientService.getIngredientAmount(this.selectedIngredient.id)?.quantity || 0;
    return this.mathService.createIngredientTransferProblem(
      this.selectedIngredient,
      pantryAmount,
      this._transferAmount
    );
  }

  @action
  public show(): void {
    this._isVisible = true;
    this.mathService.setMode('ingredient-transfer');
    this.updatePantryDisplay();
    this.updateCounterDisplay();
    this.setupEventListeners();
  }

  @action
  public hide(): void {
    this._isVisible = false;
    this.mathService.setMode('basic-multiplication');
    this.cleanup();
  }

  @action
  public selectIngredient(ingredientId: string): void {
    this._selectedIngredientId = ingredientId;
    this.updateTransferControls();
    this.updateSubtractionDisplay();
  }

  @action
  public setTransferAmount(amount: number): void {
    this._transferAmount = Math.max(1, Math.min(20, amount));
    this.updateSubtractionDisplay();
  }

  @action
  public visualizeTransfer(): void {
    const problem = this.currentTransferProblem;
    if (!problem || !problem.isValid) return;

    // Clear existing cube grid
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
    }

    // Create cube grid showing subtraction
    this.cubeGrid = new CubeGrid(this.sceneManager, this.zoomManager);
    
    // For subtraction, show total amount 
    const totalCubes = Math.min(problem.pantryAmount, 20); // Limit for visualization
    
    // Create grid that fits the total amount
    const gridSize = Math.ceil(Math.sqrt(totalCubes));
    this.cubeGrid.createGrid(gridSize, gridSize);
    
    // TODO: Implement visual distinction for cubes being removed
    console.log(`🎯 Visualizing subtraction: ${problem.pantryAmount} - ${problem.transferAmount} = ${problem.remainingAmount}`);
  }

  @action
  public confirmTransfer(): void {
    const problem = this.currentTransferProblem;
    if (!problem || !problem.isValid || !this.selectedIngredient) {
      this.showTransferError(problem?.errorMessage || 'Invalid transfer');
      return;
    }

    try {
      // Remove from pantry
      this.ingredientService.removeFromPantry(this.selectedIngredient.id, this._transferAmount);
      
      // Add to baking counter
      this.bakingCounter.stageIngredient(this.selectedIngredient, this._transferAmount);
      
      // Show success
      this.showTransferSuccess(problem);
      
      // Update displays
      this.updatePantryDisplay();
      this.updateCounterDisplay();
      this.updateSubtractionDisplay();
      
      // Show result
      this.mathService.showResult();
      
    } catch (error) {
      this.showTransferError(error instanceof Error ? error.message : String(error));
    }
  }

  @action
  public cancelTransfer(): void {
    this._selectedIngredientId = null;
    this.hideTransferControls();
    
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
      this.cubeGrid = null;
    }
  }

  private getIngredientById(id: string): Ingredient | null {
    return Object.values(STARTER_INGREDIENTS).find(ingredient => ingredient.id === id) || null;
  }

  private updatePantryDisplay(): void {
    const pantryItemsEl = document.getElementById('pantry-items');
    if (!pantryItemsEl) return;

    // Clear existing items
    pantryItemsEl.innerHTML = '';

    // Add ingredient cards
    Object.values(STARTER_INGREDIENTS).forEach(ingredient => {
      const amount = this.ingredientService.getIngredientAmount(ingredient.id);
      if (!amount) return;

      const cardEl = document.createElement('div');
      cardEl.className = 'ingredient-card';
      cardEl.dataset.ingredientId = ingredient.id;
      
      if (this._selectedIngredientId === ingredient.id) {
        cardEl.classList.add('selected');
      }

      cardEl.innerHTML = `
        <div class="icon">${ingredient.icon}</div>
        <div class="name">${ingredient.name}</div>
        <div class="amount ${amount.quantity > 0 ? 'sufficient' : 'insufficient'}">
          ${amount.quantity} ${ingredient.unit}
        </div>
      `;

      cardEl.addEventListener('click', () => {
        this.selectIngredient(ingredient.id);
      });

      pantryItemsEl.appendChild(cardEl);
    });
  }

  private updateCounterDisplay(): void {
    const counterItemsEl = document.getElementById('counter-items');
    if (!counterItemsEl) return;

    const stagedIngredients = this.bakingCounter.stagedIngredients;
    
    if (stagedIngredients.length === 0) {
      counterItemsEl.innerHTML = `
        <div class="empty-counter">
          <span>Counter is empty</span>
          <small>Transfer ingredients to start baking!</small>
        </div>
      `;
      return;
    }

    // Clear and show staged ingredients
    counterItemsEl.innerHTML = '';
    stagedIngredients.forEach(amount => {
      const cardEl = document.createElement('div');
      cardEl.className = 'ingredient-card';
      
      cardEl.innerHTML = `
        <div class="icon">${amount.ingredient.icon}</div>
        <div class="name">${amount.ingredient.name}</div>
        <div class="amount sufficient">
          ${amount.quantity} ${amount.ingredient.unit}
        </div>
      `;

      counterItemsEl.appendChild(cardEl);
    });
  }

  private updateTransferControls(): void {
    if (!this.selectedIngredient) {
      this.hideTransferControls();
      return;
    }

    const transferControlsEl = document.querySelector('.transfer-controls') as HTMLElement;
    if (!transferControlsEl) return;

    // Show transfer controls
    transferControlsEl.style.display = 'block';

    // Update ingredient info
    const nameEl = document.getElementById('transfer-ingredient-name');
    const iconEl = document.getElementById('transfer-ingredient-icon');
    const unitEl = document.getElementById('transfer-unit');
    
    if (nameEl) nameEl.textContent = this.selectedIngredient.name;
    if (iconEl) iconEl.textContent = this.selectedIngredient.icon;
    if (unitEl) unitEl.textContent = this.selectedIngredient.unit;

    // Update pantry amount
    const pantryAmountEl = document.getElementById('pantry-amount');
    const availableAmount = this.ingredientService.getIngredientAmount(this.selectedIngredient.id)?.quantity || 0;
    if (pantryAmountEl) {
      pantryAmountEl.textContent = `${availableAmount} ${this.selectedIngredient.unit}`;
    }

    // Update transfer amount input
    const transferAmountInput = document.getElementById('transfer-amount') as HTMLInputElement;
    if (transferAmountInput) {
      transferAmountInput.value = this._transferAmount.toString();
      transferAmountInput.max = Math.min(availableAmount, 20).toString();
    }
  }

  private updateSubtractionDisplay(): void {
    const problem = this.currentTransferProblem;
    const equationEl = document.getElementById('subtraction-equation');
    
    if (!equationEl || !problem) return;

    equationEl.textContent = problem.problemText;
    
    // Color code based on validity
    if (problem.isValid) {
      equationEl.style.color = '#ffeb3b';
    } else {
      equationEl.style.color = '#ff6f61';
    }
  }

  private hideTransferControls(): void {
    const transferControlsEl = document.querySelector('.transfer-controls') as HTMLElement;
    if (transferControlsEl) {
      transferControlsEl.style.display = 'none';
    }
  }

  private showTransferSuccess(problem: IngredientTransferProblem): void {
    const resultEl = document.getElementById('transfer-result');
    if (!resultEl) return;

    resultEl.className = 'transfer-result-display success';
    resultEl.style.display = 'block';
    resultEl.textContent = `✅ Successfully transferred ${problem.transferAmount} ${problem.ingredient.unit} ${problem.ingredient.name}`;
    
    // Hide after 3 seconds
    setTimeout(() => {
      if (resultEl) resultEl.style.display = 'none';
    }, 3000);
  }

  private showTransferError(message: string): void {
    const resultEl = document.getElementById('transfer-result');
    if (!resultEl) return;

    resultEl.className = 'transfer-result-display error';
    resultEl.style.display = 'block';
    resultEl.textContent = `❌ ${message}`;
    
    // Hide after 5 seconds
    setTimeout(() => {
      if (resultEl) resultEl.style.display = 'none';
    }, 5000);
  }

  private setupEventListeners(): void {
    // Transfer amount input
    const transferAmountInput = document.getElementById('transfer-amount') as HTMLInputElement;
    if (transferAmountInput) {
      const handler = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const amount = parseInt(target.value) || 1;
        this.setTransferAmount(amount);
      };
      transferAmountInput.addEventListener('input', handler);
      this.disposers.push(() => transferAmountInput.removeEventListener('input', handler));
    }

    // Visualize transfer button
    const visualizeBtn = document.getElementById('visualize-transfer-btn');
    if (visualizeBtn) {
      const handler = () => this.visualizeTransfer();
      visualizeBtn.addEventListener('click', handler);
      this.disposers.push(() => visualizeBtn.removeEventListener('click', handler));
    }

    // Confirm transfer button
    const confirmBtn = document.getElementById('confirm-transfer-btn');
    if (confirmBtn) {
      const handler = () => this.confirmTransfer();
      confirmBtn.addEventListener('click', handler);
      this.disposers.push(() => confirmBtn.removeEventListener('click', handler));
    }

    // Cancel transfer button
    const cancelBtn = document.getElementById('cancel-transfer-btn');
    if (cancelBtn) {
      const handler = () => this.cancelTransfer();
      cancelBtn.addEventListener('click', handler);
      this.disposers.push(() => cancelBtn.removeEventListener('click', handler));
    }
  }

  private cleanup(): void {
    // Remove event listeners
    this.disposers.forEach(dispose => dispose());
    this.disposers = [];

    // Clear cube grid
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
      this.cubeGrid = null;
    }

    // Hide transfer controls
    this.hideTransferControls();
  }
}