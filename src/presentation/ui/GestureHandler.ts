import { injectable, inject } from 'inversify';
import { observable, action } from 'mobx';
import { CameraZoomManager } from '@/core/engine/CameraZoomManager';

interface TouchInfo {
  id: number;
  x: number;
  y: number;
}

@injectable()
export class GestureHandler {
  @observable private _isActive: boolean = false;
  
  private touches: Map<number, TouchInfo> = new Map();
  private initialDistance: number = 0;
  private lastScale: number = 1;
  private element: HTMLElement | null = null;

  constructor(@inject(CameraZoomManager) private zoomManager: CameraZoomManager) {}

  public mount(element: HTMLElement): void {
    this.element = element;
    this.addEventListeners();
  }

  public unmount(): void {
    if (this.element) {
      this.removeEventListeners();
      this.element = null;
    }
  }

  private addEventListeners(): void {
    if (!this.element) return;

    // Touch events for mobile
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });

    // Mouse wheel for desktop
    this.element.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
  }

  private removeEventListeners(): void {
    if (!this.element) return;

    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('wheel', this.handleWheel.bind(this));
  }

  private handleTouchStart(event: TouchEvent): void {
    this.updateTouches(event);
    
    if (this.touches.size === 2) {
      this.startPinch();
      event.preventDefault();
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    this.updateTouches(event);
    
    if (this.touches.size === 2 && this._isActive) {
      this.updatePinch();
      event.preventDefault();
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    this.updateTouches(event);
    
    if (this.touches.size < 2) {
      this.endPinch();
    }
  }

  private handleWheel(event: WheelEvent): void {
    this.zoomManager.handleWheel(event);
  }

  private updateTouches(event: TouchEvent): void {
    this.touches.clear();
    
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      this.touches.set(touch.identifier, {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY
      });
    }
  }

  @action
  private startPinch(): void {
    if (this.touches.size !== 2) return;
    
    const touchArray = Array.from(this.touches.values());
    this.initialDistance = this.calculateDistance(touchArray[0], touchArray[1]);
    this.lastScale = 1;
    this._isActive = true;
  }

  private updatePinch(): void {
    if (this.touches.size !== 2 || !this._isActive) return;
    
    const touchArray = Array.from(this.touches.values());
    const currentDistance = this.calculateDistance(touchArray[0], touchArray[1]);
    
    if (this.initialDistance > 0) {
      const scale = currentDistance / this.initialDistance;
      const deltaScale = scale - this.lastScale;
      
      // Apply smoothing and convert to zoom delta
      if (Math.abs(deltaScale) > 0.01) {
        const zoomDelta = deltaScale * 2.0; // Increase sensitivity
        this.zoomManager.adjustZoom(zoomDelta);
        this.lastScale = scale;
      }
    }
  }

  @action
  private endPinch(): void {
    this._isActive = false;
    this.initialDistance = 0;
    this.lastScale = 1;
  }

  private calculateDistance(touch1: TouchInfo, touch2: TouchInfo): number {
    const dx = touch2.x - touch1.x;
    const dy = touch2.y - touch1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public get isActive(): boolean {
    return this._isActive;
  }
}