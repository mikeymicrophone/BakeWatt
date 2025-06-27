import * as THREE from 'three';
import { injectable } from 'inversify';
import { observable, action } from 'mobx';

@injectable()
export class SceneManager {
  @observable public scene: THREE.Scene;
  @observable public camera: THREE.PerspectiveCamera;
  @observable public renderer: THREE.WebGLRenderer;
  
  private animationId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.initialize();
  }

  private initialize(): void {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupLighting();
    this.setupResizeHandling();
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = new THREE.Fog(0x1a1a1a, 50, 200);
  }

  private setupCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 12);
    this.camera.lookAt(0, 0, 0);
  }

  private setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4444ff, 0.3);
    fillLight.position.set(-5, 0, -5);
    this.scene.add(fillLight);
  }

  private setupResizeHandling(): void {
    const container = document.getElementById('three-container');
    if (!container) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.handleResize(width, height);
      }
    });
    
    this.resizeObserver.observe(container);
  }

  @action
  private handleResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public mount(container: HTMLElement): void {
    container.appendChild(this.renderer.domElement);
    this.startRenderLoop();
  }

  public unmount(): void {
    this.stopRenderLoop();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.render();
    };
    animate();
  }

  private stopRenderLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  @action
  public clearScene(): void {
    const objectsToRemove: THREE.Object3D[] = [];
    
    this.scene.traverse((child) => {
      if (child !== this.scene && child.type !== 'Light') {
        objectsToRemove.push(child);
      }
    });

    objectsToRemove.forEach(obj => {
      this.scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}