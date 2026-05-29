import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@iluvcoconut/contracts': fileURLToPath(new URL('../../packages/coconut-contracts/src/index.ts', import.meta.url)),
      '@iluvcoconut/core': fileURLToPath(new URL('../../packages/coconut-core/src/index.ts', import.meta.url)),
      '@iluvcoconut/pixi': fileURLToPath(new URL('../../packages/coconut-renderer-pixi/src/index.ts', import.meta.url)),
      '@iluvcoconut/renderer-api': fileURLToPath(new URL('../../packages/coconut-renderer-api/src/index.ts', import.meta.url))
    }
  },
  build: {
    sourcemap: true,
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js']
        }
      }
    }
  }
});
