import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3750,
    host: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});