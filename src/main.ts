import 'reflect-metadata';
import { Application } from '@/core/engine/Application';

async function main() {
  try {
    const app = new Application();
    await app.initialize();
    
    console.log('BakeWatt Multiplication Visualizer initialized successfully!');
    
    // Handle page cleanup
    window.addEventListener('beforeunload', () => {
      app.destroy();
    });
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}