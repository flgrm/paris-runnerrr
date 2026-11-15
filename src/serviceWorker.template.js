/**
 * Service worker de Paris Runner — cache simple des assets (GAME_DESIGN.md §9).
 *
 * Ce fichier est un gabarit : au build, tools/serviceWorkerPlugin.js remplace
 * les deux marqueurs ci-dessous et écrit le résultat dans dist/sw.js.
 *
 *  - Installation : tous les fichiers du build sont mis en cache d'un coup, donc
 *    le jeu fonctionne hors ligne dès la deuxième ouverture.
 *  - Page HTML : réseau d'abord (pour recevoir les mises à jour), cache en
 *    secours si le réseau est absent ou trop lent.
 *  - Autres fichiers : cache d'abord. Leur nom contient une empreinte du
 *    contenu, donc un fichier en cache n'est jamais périmé.
 *  - Mise à jour : chaque déploiement change VERSION, donc le navigateur
 *    installe un nouveau worker qui remplace l'ancien cache. Aucune action
 *    demandée au joueur : la nouvelle version s'affiche à l'ouverture suivante.
 */

const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;

const PREFIX = 'paris-runner-';
const CACHE = `${PREFIX}${VERSION}`;
const NAVIGATION_TIMEOUT = 3000;
const INDEX_URL = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // `reload` : on contourne le cache HTTP pour ne pas figer une page périmée.
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

/**
 * Nos fichiers ne dépendent d'aucun en-tête de requête. Sans `ignoreVary`, un
 * serveur qui répond « Vary: … » (GitHub Pages le fait) empêche de resservir à
 * la page une copie que le worker a téléchargée lui-même à l'installation.
 */
const MATCH = { ignoreVary: true };

function isCacheable(response) {
  return response && response.status === 200 && response.type === 'basic';
}

/** Page HTML : réseau d'abord, borné dans le temps, sinon la copie en cache. */
async function handleNavigation(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((resolve, reject) => { setTimeout(reject, NAVIGATION_TIMEOUT); }),
    ]);
    if (isCacheable(response)) cache.put(INDEX_URL, response.clone());
    return response;
  } catch {
    const cached = await cache.match(INDEX_URL, MATCH);
    return cached ?? Response.error();
  }
}

/** Assets : cache d'abord, sinon réseau (et on garde la réponse). */
async function handleAsset(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, MATCH);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  // Les autres origines (statistiques, par exemple) ne nous regardent pas.
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(request.mode === 'navigate' ? handleNavigation(request) : handleAsset(request));
});
