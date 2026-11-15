/**
 * PWA et finitions mobiles (GAME_DESIGN.md §2 et §9).
 *
 *  - enregistrement du service worker (build de production uniquement : en
 *    développement, un cache ne ferait que masquer les modifications) ;
 *  - plein écran et paysage au lancement d'une partie, là où le navigateur le
 *    permet. Sur iPhone, Safari n'offre pas le plein écran à une page web :
 *    il faut installer le jeu sur l'écran d'accueil, où le manifest s'en charge.
 */

import { MOBILE } from '../config.js';

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      // On demande explicitement s'il existe une version plus récente : sans ça,
      // le navigateur décide seul du moment, et un joueur peut garder longtemps
      // l'ancien cache après un déploiement.
      .then((registration) => registration.update())
      // Sans service worker, le jeu marche quand même : il n'est juste pas hors ligne.
      .catch(() => {});
  });
}

/** Le jeu tourne-t-il comme une application installée ? */
export function isInstalled() {
  return window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

/**
 * Passe en plein écran paysage. À appeler depuis un geste du joueur (le
 * navigateur refuse sinon). Tout échec est silencieux : c'est du confort.
 */
export function enterImmersiveMode(scene) {
  if (!MOBILE.fullscreenOnPlay || isInstalled()) return;
  if (!scene.sys.game.device.input.touch || scene.sys.game.device.os.desktop) return;

  const scale = scene.scale;
  if (!scale.fullscreen.available || scale.isFullscreen) return;

  // Le verrouillage d'orientation n'est accepté qu'une fois en plein écran.
  scale.once('enterfullscreen', () => {
    try {
      const lock = window.screen.orientation?.lock?.('landscape');
      if (lock && typeof lock.catch === 'function') lock.catch(() => {});
    } catch {
      // Non pris en charge : le message « tournez votre téléphone » prend le relais.
    }
  });

  try {
    scale.startFullscreen();
  } catch {
    // Refusé par le navigateur : on joue dans la page, comme avant.
  }
}
