import { observable, action } from 'mobx';
import { SceneManager } from './SceneManager';
import { CubeGrid } from '@/presentation/components/CubeGrid';
import { MultiplicationService } from '@/core/math/MultiplicationService';
import { container } from '@/shared/container';

export class Application {
  @observable private _isInitialized: boolean = false;
  
  private sceneManager: SceneManager;
  private multiplicationService: MultiplicationService;
  private cubeGrid: CubeGrid | null = null;

  constructor() {
    this.sceneManager = container.get<SceneManager>(SceneManager);
    this.multiplicationService = container.get<MultiplicationService>(MultiplicationService);
  }

  @action
  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    const container = document.getElementById('three-container');
    if (!container) {
      throw new Error('Three.js container not found');
    }

    this.sceneManager.mount(container);
    this.setupUI();
    
    this._isInitialized = true;
  }

  private setupUI(): void {
    const visualizeBtn = document.getElementById('visualize-btn') as HTMLButtonElement;
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
    const factor1Input = document.getElementById('factor1') as HTMLInputElement;
    const factor2Input = document.getElementById('factor2') as HTMLInputElement;
    const resultDiv = document.getElementById('result') as HTMLDivElement;

    if (!visualizeBtn || !calculateBtn || !factor1Input || !factor2Input || !resultDiv) {
      throw new Error('Required UI elements not found');
    }

    visualizeBtn.addEventListener('click', () => {
      this.handleVisualize(factor1Input, factor2Input, resultDiv);
    });

    calculateBtn.addEventListener('click', () => {
      this.handleCalculate(resultDiv);
    });

    // Handle Enter key in inputs
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.handleVisualize(factor1Input, factor2Input, resultDiv);
      }
    };
    
    factor1Input.addEventListener('keydown', handleEnter);
    factor2Input.addEventListener('keydown', handleEnter);
  }

  @action
  private handleVisualize(
    factor1Input: HTMLInputElement, 
    factor2Input: HTMLInputElement,
    resultDiv: HTMLDivElement
  ): void {
    const factor1 = this.multiplicationService.validateInput(factor1Input.value);
    const factor2 = this.multiplicationService.validateInput(factor2Input.value);

    if (factor1 === null || factor2 === null) {
      alert('Please enter valid numbers between 1 and 20');
      return;
    }

    // Hide result display
    resultDiv.style.display = 'none';
    this.multiplicationService.hideResult();

    // Create new problem
    const problem = this.multiplicationService.createProblem(factor1, factor2);
    
    // Clear existing cubes
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
    }

    // Create new cube grid
    this.cubeGrid = container.get<CubeGrid>(CubeGrid);
    const dimensions = this.multiplicationService.getVisualizationDimensions(problem);
    this.cubeGrid.createGrid(dimensions.rows, dimensions.columns);
  }

  @action
  private handleCalculate(resultDiv: HTMLDivElement): void {
    const problem = this.multiplicationService.currentProblem;
    
    if (!problem) {
      alert('Please create a visualization first by clicking "Show Cubes"');
      return;
    }

    this.multiplicationService.showResult();
    const resultText = this.multiplicationService.formatResult(problem);
    
    resultDiv.textContent = resultText;
    resultDiv.style.display = 'block';
  }

  public destroy(): void {
    if (this.cubeGrid) {
      this.cubeGrid.destroy();
    }
    this.sceneManager.unmount();
    this._isInitialized = false;
  }
}