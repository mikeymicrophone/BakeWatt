import * as THREE from 'three';
import { injectable, inject } from 'inversify';
import { observable, action } from 'mobx';
import { SceneManager } from '@/core/engine/SceneManager';

@injectable()
export class CubeGrid {
  @observable private cubes: THREE.Mesh[] = [];
  private group: THREE.Group;
  private geometry: THREE.BoxGeometry;
  private material: THREE.MeshLambertMaterial;

  constructor(@inject(SceneManager) private sceneManager: SceneManager) {
    this.group = new THREE.Group();
    this.geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    this.material = new THREE.MeshLambertMaterial({ 
      color: 0x007acc,
      transparent: true,
      opacity: 0.9
    });
    
    this.sceneManager.scene.add(this.group);
  }

  @action
  public createGrid(rows: number, columns: number): void {
    this.clearGrid();
    
    const spacing = 1.0;
    const totalWidth = (columns - 1) * spacing;
    const totalDepth = (rows - 1) * spacing;
    const offsetX = -totalWidth / 2;
    const offsetZ = -totalDepth / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const cube = new THREE.Mesh(this.geometry, this.material.clone());
        
        cube.position.set(
          offsetX + col * spacing,
          0.4,
          offsetZ + row * spacing
        );
        
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        // Add some visual variety
        const material = cube.material as THREE.MeshLambertMaterial;
        const hue = (row * columns + col) / (rows * columns);
        material.color.setHSL(0.6 + hue * 0.3, 0.7, 0.6);
        
        // Start with scale 0 for animation
        cube.scale.setScalar(0);
        
        this.cubes.push(cube);
        this.group.add(cube);
        
        // Animate cube appearance
        this.animateCubeIn(cube, (row * columns + col) * 50);
      }
    }

    // Position camera to view the grid nicely
    this.adjustCameraForGrid(rows, columns);
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
    const maxDimension = Math.max(rows, columns);
    const distance = maxDimension * 2 + 8;
    const height = maxDimension * 1.5 + 6;
    
    this.sceneManager.camera.position.set(0, height, distance);
    this.sceneManager.camera.lookAt(0, 0, 0);
  }

  @action
  public clearGrid(): void {
    this.cubes.forEach(cube => {
      this.group.remove(cube);
      cube.geometry.dispose();
      (cube.material as THREE.Material).dispose();
    });
    this.cubes = [];
  }

  public getGridSize(): { rows: number; columns: number } {
    if (this.cubes.length === 0) return { rows: 0, columns: 0 };
    
    // Calculate from current cubes (this is a simple approach)
    const positions = this.cubes.map(cube => ({ x: cube.position.x, z: cube.position.z }));
    const uniqueX = [...new Set(positions.map(p => p.x))].sort((a, b) => a - b);
    const uniqueZ = [...new Set(positions.map(p => p.z))].sort((a, b) => a - b);
    
    return { rows: uniqueZ.length, columns: uniqueX.length };
  }

  public destroy(): void {
    this.clearGrid();
    this.sceneManager.scene.remove(this.group);
    this.geometry.dispose();
    this.material.dispose();
  }
}