import { injectable } from 'inversify';
import { observable, action, computed } from 'mobx';

export interface MultiplicationProblem {
  factor1: number;
  factor2: number;
  product: number;
}

@injectable()
export class MultiplicationService {
  @observable private _currentProblem: MultiplicationProblem | null = null;
  @observable private _showingResult: boolean = false;

  @computed
  get currentProblem(): MultiplicationProblem | null {
    return this._currentProblem;
  }

  @computed
  get showingResult(): boolean {
    return this._showingResult;
  }

  @action
  public createProblem(factor1: number, factor2: number): MultiplicationProblem {
    const problem: MultiplicationProblem = {
      factor1: Math.max(1, Math.min(20, Math.floor(factor1))),
      factor2: Math.max(1, Math.min(20, Math.floor(factor2))),
      product: 0
    };
    
    problem.product = problem.factor1 * problem.factor2;
    this._currentProblem = problem;
    this._showingResult = false;
    
    return problem;
  }

  @action
  public showResult(): void {
    this._showingResult = true;
  }

  @action
  public hideResult(): void {
    this._showingResult = false;
  }

  @action
  public reset(): void {
    this._currentProblem = null;
    this._showingResult = false;
  }

  public formatResult(problem: MultiplicationProblem): string {
    return `${problem.factor1} × ${problem.factor2} = ${problem.product}`;
  }

  public validateInput(value: string): number | null {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 20) {
      return null;
    }
    return num;
  }

  public getVisualizationDimensions(problem: MultiplicationProblem): { rows: number; columns: number } {
    return {
      rows: problem.factor1,
      columns: problem.factor2
    };
  }
}