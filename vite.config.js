import { defineConfig } from 'vite';

/**
 * `base` doit correspondre au nom du dépôt pour GitHub Pages
 * (https://flgrm.github.io/paris-runnerrr/).
 *
 * On se cale sur `mode` et non sur `command` : `vite preview` tourne en
 * `command: 'serve'` tout en servant le build de production. Avec `command`,
 * l'aperçu cherchait ses assets à la racine et renvoyait des 404.
 *   - `vite dev`     → mode 'development' → base '/'
 *   - `vite build`   → mode 'production'  → base '/paris-runnerrr/'
 *   - `vite preview` → mode 'production'  → base '/paris-runnerrr/'
 */
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/paris-runnerrr/' : '/',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1600,
  },
}));
