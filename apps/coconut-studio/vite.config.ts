import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  plugins: [react()],
  resolve: {
    alias: {
      '@iluvcoconut/contracts': fileURLToPath(new URL('../../packages/coconut-contracts/src/index.ts', import.meta.url))
    }
  },
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
