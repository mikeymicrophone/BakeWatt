import * as THREE from 'three';
import { injectable, inject } from 'inversify';
import { observable, action, computed } from 'mobx';
import { SceneManager } from './SceneManager';

export interface ZoomConfig {
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
  numberThreshold: number; // Zoom level at which numbers appear
}

@injectable()
export class CameraZoomManager {
  @observable private _zoomLevel: number;
  @observable private _isZooming: boolean = false;
  
  private zoomChangeCallbacks: ((level: number) => void)[] = [];
  
  private config: ZoomConfig = {
    minZoom: 0.3,
    maxZoom: 8.0,
    defaultZoom: 1.0,
    numberThreshold: 1.5
  };

  private baseDistance: number = 12;
  private baseHeight: number = 8;
  private originalPosition: THREE.Vector3;
  private targetPosition: THREE.Vector3;
  private animationId: number | null = null;

  constructor(@inject(SceneManager) private sceneManager: SceneManager) {
    this._zoomLevel = this.config.defaultZoom;
    this.originalPosition = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();
    this.updateOriginalPosition();
  }

  @computed
  get zoomLevel(): number {
    return this._zoomLevel;
  }

  @computed
  get isZooming(): boolean {
    return this._isZooming;
  }

  @computed
  get shouldShowNumbers(): boolean {
    return this._zoomLevel >= this.config.numberThreshold;
  }

  @computed
  get zoomPercentage(): number {
    const normalized = (this._zoomLevel - this.config.minZoom) / 
      (this.config.maxZoom - this.config.minZoom);
    return Math.max(0, Math.min(1, normalized));
  }

  private updateOriginalPosition(): void {
    this.originalPosition.copy(this.sceneManager.camera.position);
  }

  @action
  public setZoomLevel(level: number, animate: boolean = true): void {
    const clampedLevel = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, level));
    
    if (Math.abs(clampedLevel - this._zoomLevel) < 0.01) return;
    
    this._zoomLevel = clampedLevel;
    
    // Notify all listeners
    this.zoomChangeCallbacks.forEach(callback => callback(this._zoomLevel));
    
    if (animate) {
      this.animateToZoom();
    } else {
      this.updateCameraPosition();
    }
  }

  public onZoomChange(callback: (level: number) => void): void {
    this.zoomChangeCallbacks.push(callback);
  }

  public removeZoomChangeCallback(callback: (level: number) => void): void {
    const index = this.zoomChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.zoomChangeCallbacks.splice(index, 1);
    }
  }

  @action
  public adjustZoom(delta: number): void {
    this.setZoomLevel(this._zoomLevel + delta);
  }

  @action
  public resetZoom(): void {
    this.setZoomLevel(this.config.defaultZoom);
  }

  public adjustCameraForGrid(rows: number, columns: number): void {
    const maxDimension = Math.max(rows, columns);
    this.baseDistance = maxDimension * 2 + 8;
    this.baseHeight = maxDimension * 1.5 + 6;
    
    this.originalPosition.set(0, this.baseHeight, this.baseDistance);
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const inverseFactor = 1 / this._zoomLevel;
    const distance = this.baseDistance * inverseFactor;
    const height = this.baseHeight * inverseFactor;
    
    this.sceneManager.camera.position.set(0, height, distance);
    this.sceneManager.camera.lookAt(0, 0, 0);
  }

  private animateToZoom(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this._isZooming = true;
    const startPosition = this.sceneManager.camera.position.clone();
    
    const inverseFactor = 1 / this._zoomLevel;
    const targetDistance = this.baseDistance * inverseFactor;
    const targetHeight = this.baseHeight * inverseFactor;
    this.targetPosition.set(0, targetHeight, targetDistance);

    const startTime = Date.now();
    const duration = 300;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      this.sceneManager.camera.position.lerpVectors(startPosition, this.targetPosition, easeProgress);
      this.sceneManager.camera.lookAt(0, 0, 0);
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this._isZooming = false;
        this.animationId = null;
      }
    };

    animate();
  }

  public handleWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.15 : 0.15;
    this.adjustZoom(delta);
  }


  public getConfig(): ZoomConfig {
    return { ...this.config };
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}