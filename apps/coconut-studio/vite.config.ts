import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: {
    strictPort: true,
    port: 5174
  },
  build: {
    sourcemap: true,
    target: 'es2022',
    assetsInlineLimit: 0
  }
});
