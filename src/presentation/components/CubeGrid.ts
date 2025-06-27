import * as THREE from 'three';
import { injectable, inject } from 'inversify';
import { observable, action } from 'mobx';
import { SceneManager } from '@/core/engine/SceneManager';
import { CameraZoomManager } from '@/core/engine/CameraZoomManager';

interface CubeInfo {
  mesh: THREE.Mesh;
  number: number;
  baseMaterial: THREE.MeshLambertMaterial;
  numberedMaterial?: THREE.MeshLambertMaterial;
  isRemoved?: boolean;
  originalPosition?: THREE.Vector3;
}

@injectable()
export class CubeGrid {
  @observable private cubes: CubeInfo[] = [];
  private group: THREE.Group;
  private geometry: THREE.BoxGeometry;
  private material: THREE.MeshLambertMaterial;
  private productMaterial: THREE.MeshLambertMaterial;
  private removedMaterial: THREE.MeshLambertMaterial;
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
    this.removedMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xff4444,
      transparent: true,
      opacity: 0.8
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
        
        // Store the base material
        const baseMaterial = cubeMaterial;
        
        // Add visual variety for non-product cubes
        if (!isProductCube) {
          const hue = (row * columns + col) / totalCubes;
          baseMaterial.color.setHSL(0.6 + hue * 0.3, 0.7, 0.6);
        }
        
        // Start with scale 0 for animation
        cube.scale.setScalar(0);
        
        const cubeInfo: CubeInfo = {
          mesh: cube,
          number: cubeNumber,
          baseMaterial: baseMaterial,
          isRemoved: false,
          originalPosition: cube.position.clone()
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
      if (shouldShow && !cubeInfo.numberedMaterial) {
        // Create numbered material
        cubeInfo.numberedMaterial = this.createNumberedMaterial(
          cubeInfo.number.toString(),
          cubeInfo.baseMaterial.color.clone()
        );
        cubeInfo.mesh.material = cubeInfo.numberedMaterial;
      } else if (!shouldShow && cubeInfo.numberedMaterial) {
        // Switch back to base material
        cubeInfo.mesh.material = cubeInfo.baseMaterial;
        this.disposeNumberedMaterial(cubeInfo.numberedMaterial);
        cubeInfo.numberedMaterial = undefined;
      }
    });
  }

  private createNumberedMaterial(text: string, baseColor: THREE.Color): THREE.MeshLambertMaterial {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    // Set canvas size for cube face
    canvas.width = 256;
    canvas.height = 256;
    
    // Fill with base color
    context.fillStyle = `rgb(${Math.floor(baseColor.r * 255)}, ${Math.floor(baseColor.g * 255)}, ${Math.floor(baseColor.b * 255)})`;
    context.fillRect(0, 0, 256, 256);
    
    // Configure text style
    context.font = 'bold 120px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    context.shadowColor = 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = 8;
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    
    // Draw white text
    context.fillStyle = 'white';
    context.fillText(text, 128, 128);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create material with the texture
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: false,
      opacity: 1.0
    });
    
    return material;
  }

  private disposeNumberedMaterial(material: THREE.MeshLambertMaterial): void {
    if (material.map) {
      material.map.dispose();
    }
    material.dispose();
  }

  @action
  public clearGrid(): void {
    this.cubes.forEach(cubeInfo => {
      this.group.remove(cubeInfo.mesh);
      cubeInfo.mesh.geometry.dispose();
      
      // Dispose base material
      cubeInfo.baseMaterial.dispose();
      
      // Dispose numbered material if it exists
      if (cubeInfo.numberedMaterial) {
        this.disposeNumberedMaterial(cubeInfo.numberedMaterial);
      }
    });
    this.cubes = [];
    this.rows = 0;
    this.columns = 0;
  }

  public getGridSize(): { rows: number; columns: number } {
    return { rows: this.rows, columns: this.columns };
  }

  // Subtraction visualization methods
  @action
  public createSubtractionGrid(totalAmount: number, removeAmount: number): void {
    this.clearGrid();
    
    // Limit visualization to reasonable size
    const maxCubes = Math.min(totalAmount, 20);
    
    // Calculate grid dimensions - prefer wide layout for subtraction
    let columns = Math.ceil(Math.sqrt(maxCubes * 1.5));
    let rows = Math.ceil(maxCubes / columns);
    
    this.rows = rows;
    this.columns = columns;
    
    const spacing = 1.0;
    const totalWidth = (columns - 1) * spacing;
    const totalDepth = (rows - 1) * spacing;
    const offsetX = -totalWidth / 2;
    const offsetZ = -totalDepth / 2;

    // Create cubes for the total amount
    for (let i = 0; i < maxCubes; i++) {
      const row = Math.floor(i / columns);
      const col = i % columns;
      const cubeNumber = i + 1;
      
      const cubeMaterial = this.material.clone();
      const cube = new THREE.Mesh(this.geometry, cubeMaterial);
      
      const x = offsetX + col * spacing;
      const z = offsetZ + row * spacing;
      
      cube.position.set(x, 0.4, z);
      cube.castShadow = true;
      cube.receiveShadow = true;
      
      // Color based on whether it will be removed
      const willBeRemoved = i < removeAmount;
      if (willBeRemoved) {
        cubeMaterial.color.setHex(0xff6b35); // Orange for cubes to be removed
      } else {
        cubeMaterial.color.setHex(0x4CAF50); // Green for cubes that remain
      }
      
      // Start with scale 0 for animation
      cube.scale.setScalar(0);
      
      const cubeInfo: CubeInfo = {
        mesh: cube,
        number: cubeNumber,
        baseMaterial: cubeMaterial,
        isRemoved: false,
        originalPosition: cube.position.clone()
      };
      
      this.cubes.push(cubeInfo);
      this.group.add(cube);
      
      // Animate cube appearance
      this.animateCubeIn(cube, i * 50);
    }

    // Position camera to view the grid nicely
    this.adjustCameraForGrid(rows, columns);
    
    // Update number visibility based on current zoom
    this.updateNumberVisibility();
  }

  @action
  public animateSubtraction(removeAmount: number): void {
    const cubesToRemove = this.cubes.slice(0, Math.min(removeAmount, this.cubes.length));
    const spacing = 1.0;
    
    // Calculate position for removed cubes (to the right of the grid)
    const rightOffset = (this.columns * spacing) / 2 + spacing * 2;
    
    cubesToRemove.forEach((cubeInfo, index) => {
      cubeInfo.isRemoved = true;
      
      // Change material to removed color
      cubeInfo.baseMaterial.color.setHex(0xff4444);
      
      // Calculate new position (stack removed cubes)
      const newRow = Math.floor(index / 3); // 3 cubes per row in removed area
      const newCol = index % 3;
      
      const targetX = rightOffset + newCol * spacing * 0.8;
      const targetZ = -newRow * spacing * 0.8;
      const targetY = 0.4;
      
      // Animate movement
      this.animateCubeMovement(cubeInfo.mesh, {
        x: targetX,
        y: targetY,
        z: targetZ
      }, 800, index * 100);
    });
  }

  private animateCubeMovement(cube: THREE.Mesh, targetPos: {x: number, y: number, z: number}, duration: number, delay: number): void {
    setTimeout(() => {
      const startPos = cube.position.clone();
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth movement
        const easeInOut = progress < 0.5 
          ? 2 * progress * progress 
          : -1 + (4 - 2 * progress) * progress;
        
        // Interpolate position
        cube.position.x = startPos.x + (targetPos.x - startPos.x) * easeInOut;
        cube.position.y = startPos.y + (targetPos.y - startPos.y) * easeInOut + Math.sin(progress * Math.PI) * 0.3; // Arc motion
        cube.position.z = startPos.z + (targetPos.z - startPos.z) * easeInOut;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          cube.position.set(targetPos.x, targetPos.y, targetPos.z);
        }
      };
      
      animate();
    }, delay);
  }

  public destroy(): void {
    this.clearGrid();
    this.sceneManager.scene.remove(this.group);
    this.geometry.dispose();
    this.material.dispose();
    this.productMaterial.dispose();
    this.removedMaterial.dispose();
  }
}