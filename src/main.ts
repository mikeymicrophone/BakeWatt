import 'reflect-metadata';
import { Application } from '@/core/engine/Application';
// Import pantry components to register them
import '@/presentation/components/pantry';

async function main() {
  try {
    const app = new Application();
    await app.initialize();
    
    console.log('BakeWatt Multiplication Visualizer initialized successfully!');
    
    // Handle page cleanup
    window.addEventListener('beforeunload', () => {
      app.destroy();
    });
    
    // Make app available for debugging
    (window as any).appInstance = app;
    (window as any).testTabs = () => {
      console.log('Testing tab functionality...');
      const tabs = ['math', 'transfer', 'recipes', 'supplier', 'store'];
      tabs.forEach(tabName => {
        const btn = document.getElementById(`${tabName}-tab`);
        console.log(`Tab ${tabName}:`, btn ? 'Found' : 'Missing', btn);
      });
    };
    
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