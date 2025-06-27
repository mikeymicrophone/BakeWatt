import * as THREE from 'three';
import { injectable, inject } from 'inversify';
import { observable, action } from 'mobx';
import { SceneManager } from '@/core/engine/SceneManager';
import { CameraZoomManager } from '@/core/engine/CameraZoomManager';

interface CubeInfo {
  mesh: THREE.Mesh;
  number: number;
  textSprite?: THREE.Sprite;
}

@injectable()
export class CubeGrid {
  @observable private cubes: CubeInfo[] = [];
  private group: THREE.Group;
  private geometry: THREE.BoxGeometry;
  private material: THREE.MeshLambertMaterial;
  private productMaterial: THREE.MeshLambertMaterial;
  private rows: number = 0;
  private columns: number = 0;

  constructor(
    @inject(SceneManager) private sceneManager: SceneManager,
    @inject(CameraZoomManager) private zoomManager: CameraZoomManager
  ) {
    this.group = new THREE.Group();
    this.geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    this.material = new THREE.MeshLambertMaterial({ 
      color: 0x007acc,
      transparent: true,
      opacity: 0.9
    });
    this.productMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xff6b35,
      transparent: true,
      opacity: 0.95
    });
    
    this.sceneManager.scene.add(this.group);
  }

  @action
  public createGrid(rows: number, columns: number): void {
    this.clearGrid();
    this.rows = rows;
    this.columns = columns;
    
    const spacing = 1.0;
    const totalWidth = (columns - 1) * spacing;
    const totalDepth = (rows - 1) * spacing;
    const offsetX = -totalWidth / 2;
    const offsetZ = -totalDepth / 2;
    const totalCubes = rows * columns;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const cubeNumber = row * columns + col + 1;
        const isProductCube = cubeNumber === totalCubes;
        
        const cubeMaterial = isProductCube ? this.productMaterial.clone() : this.material.clone();
        const cube = new THREE.Mesh(this.geometry, cubeMaterial);
        
        cube.position.set(
          offsetX + col * spacing,
          0.4,
          offsetZ + row * spacing
        );
        
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        // Add visual variety for non-product cubes
        if (!isProductCube) {
          const material = cube.material as THREE.MeshLambertMaterial;
          const hue = (row * columns + col) / totalCubes;
          material.color.setHSL(0.6 + hue * 0.3, 0.7, 0.6);
        }
        
        // Start with scale 0 for animation
        cube.scale.setScalar(0);
        
        const cubeInfo: CubeInfo = {
          mesh: cube,
          number: cubeNumber
        };
        
        this.cubes.push(cubeInfo);
        this.group.add(cube);
        
        // Animate cube appearance
        this.animateCubeIn(cube, (row * columns + col) * 50);
      }
    }

    // Position camera to view the grid nicely
    this.adjustCameraForGrid(rows, columns);
    
    // Update number visibility based on current zoom
    this.updateNumberVisibility();
  }

  private animateCubeIn(cube: THREE.Mesh, delay: number): void {
    setTimeout(() => {
      const startTime = Date.now();
      const duration = 300;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for bounce effect
        const easeOut = 1 - Math.pow(1 - progress, 3);
        cube.scale.setScalar(easeOut);
        
        // Add a little bounce
        cube.position.y = 0.4 + Math.sin(progress * Math.PI) * 0.2;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          cube.position.y = 0.4;
        }
      };
      
      animate();
    }, delay);
  }

  private adjustCameraForGrid(rows: number, columns: number): void {
    this.zoomManager.adjustCameraForGrid(rows, columns);
  }

  public updateNumberVisibility(): void {
    const shouldShow = this.zoomManager.shouldShowNumbers;
    
    this.cubes.forEach(cubeInfo => {
      if (shouldShow && !cubeInfo.textSprite) {
        cubeInfo.textSprite = this.createTextSprite(cubeInfo.number.toString());
        cubeInfo.textSprite.position.copy(cubeInfo.mesh.position);
        cubeInfo.textSprite.position.y += 0.6;
        this.group.add(cubeInfo.textSprite);
      } else if (!shouldShow && cubeInfo.textSprite) {
        this.group.remove(cubeInfo.textSprite);
        this.disposeTextSprite(cubeInfo.textSprite);
        cubeInfo.textSprite = undefined;
      }
    });
  }

  private createTextSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    // Set canvas size
    canvas.width = 128;
    canvas.height = 128;
    
    // Configure text style
    context.fillStyle = 'white';
    context.font = 'bold 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Add background circle
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.beginPath();
    context.arc(64, 64, 50, 0, Math.PI * 2);
    context.fill();
    
    // Draw text
    context.fillStyle = 'white';
    context.fillText(text, 64, 64);
    
    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.6, 0.6, 1);
    
    return sprite;
  }

  private disposeTextSprite(sprite: THREE.Sprite): void {
    if (sprite.material.map) {
      sprite.material.map.dispose();
    }
    sprite.material.dispose();
  }

  @action
  public clearGrid(): void {
    this.cubes.forEach(cubeInfo => {
      this.group.remove(cubeInfo.mesh);
      cubeInfo.mesh.geometry.dispose();
      (cubeInfo.mesh.material as THREE.Material).dispose();
      
      if (cubeInfo.textSprite) {
        this.group.remove(cubeInfo.textSprite);
        this.disposeTextSprite(cubeInfo.textSprite);
      }
    });
    this.cubes = [];
    this.rows = 0;
    this.columns = 0;
  }

  public getGridSize(): { rows: number; columns: number } {
    return { rows: this.rows, columns: this.columns };
  }

  public destroy(): void {
    this.clearGrid();
    this.sceneManager.scene.remove(this.group);
    this.geometry.dispose();
    this.material.dispose();
    this.productMaterial.dispose();
  }
}