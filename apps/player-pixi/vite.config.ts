import { fileURLToPath, URL } from 'node:url';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const GAMES_DIR = join(REPO_ROOT, 'games');

export default defineConfig({
  plugins: [serveGamesDirectory()],
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

function serveGamesDirectory(): Plugin {
  return {
    name: 'iluvcoconut-serve-games',
    configureServer(server) {
      server.middlewares.use('/games', (request, response, next) => {
        const url = request.url ? decodeURIComponent(request.url.split('?')[0] ?? '') : '';
        const filePath = normalize(join(GAMES_DIR, url));
        if (!filePath.startsWith(GAMES_DIR) || !existsSync(filePath)) {
          next();
          return;
        }

        response.setHeader('Content-Type', getContentType(filePath));
        createReadStream(filePath).pipe(response);
      });
    }
  };
}

function getContentType(filePath: string): string {
  if (extname(filePath) === '.json') return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}
