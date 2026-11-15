/**
 * Plugin Vite : génère dist/sw.js à partir de src/serviceWorker.template.js.
 *
 * Il y injecte la liste des fichiers du build (dont les noms changent à chaque
 * version) et une empreinte de cette liste, qui sert de numéro de version du
 * cache. Pas de dépendance supplémentaire : le besoin tient en quelques lignes.
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

function listFiles(dir, root = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, root);
    return [relative(root, full).split('\\').join('/')];
  });
}

export default function serviceWorkerPlugin({ template = 'src/serviceWorker.template.js' } = {}) {
  let config;
  return {
    name: 'paris-runner-service-worker',
    apply: 'build',
    // Après les plugins de Vite : index.html doit déjà faire partie du build
    // pour entrer dans la liste (sans lui, pas de démarrage hors ligne).
    enforce: 'post',
    configResolved(resolved) {
      config = resolved;
    },
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle).filter((file) => !file.endsWith('.map'));
      const publicFiles = config.publicDir ? listFiles(config.publicDir) : [];
      // Chemins relatifs à sw.js, lui-même à la racine du site : valable quel
      // que soit le chemin de base (GitHub Pages ou autre).
      const precache = [...new Set([...built, ...publicFiles])].sort();
      if (!precache.includes('index.html')) {
        this.error('index.html est absent du build : le service worker serait inutilisable hors ligne.');
      }

      const hash = createHash('sha256');
      for (const file of precache) {
        hash.update(file);
        const asset = bundle[file];
        if (asset) hash.update(asset.type === 'chunk' ? asset.code : asset.source);
        else hash.update(readFileSync(join(config.publicDir, file)));
      }
      const version = hash.digest('hex').slice(0, 12);

      const source = readFileSync(resolve(config.root, template), 'utf8')
        .replace("'__VERSION__'", JSON.stringify(version))
        .replace('__PRECACHE__', JSON.stringify(precache));

      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
