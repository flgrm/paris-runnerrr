import { defineConfig } from 'vite';

// `base` doit correspondre au nom du dépôt pour GitHub Pages
// (https://flgrm.github.io/paris-runnerrr/). En dev, on reste à la racine.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/paris-runnerrr/' : '/',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1600,
  },
}));
