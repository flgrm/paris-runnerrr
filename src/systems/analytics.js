/**
 * Statistiques d'utilisation, via GoatCounter.
 *
 * GoatCounter ne dépose aucun cookie et ne stocke aucun identifiant de
 * visiteur : il compte des pages vues et des événements anonymes. Rien n'est
 * chargé tant que ANALYTICS.goatcounterCode est vide, ni en local, ni en mode
 * debug — les essais du développeur ne polluent pas les chiffres.
 *
 * Les statistiques ne doivent jamais gêner le jeu : si le script est bloqué
 * (bloqueur de publicité, hors ligne), `track` ne fait simplement rien.
 */

import { ANALYTICS, GAME } from '../config.js';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', ''];

function isEnabled() {
  if (!ANALYTICS.goatcounterCode || GAME.debug) return false;
  return !LOCAL_HOSTS.includes(window.location.hostname);
}

/** Charge le compteur. La page vue est comptée automatiquement au chargement. */
export function initAnalytics() {
  if (!isEnabled()) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = ANALYTICS.scriptUrl;
  script.dataset.goatcounter = `https://${ANALYTICS.goatcounterCode}.goatcounter.com/count`;
  document.head.appendChild(script);
}

/**
 * Compte un événement de jeu.
 * @param {string} name  identifiant stable, sans donnée personnelle
 * @param {string} title libellé lisible dans le tableau de bord
 */
export function track(name, title) {
  try {
    const counter = window.goatcounter;
    if (!isEnabled() || !counter || typeof counter.count !== 'function') return;
    counter.count({ path: name, title, event: true });
  } catch {
    // Volontairement silencieux : une statistique perdue ne vaut pas une erreur en jeu.
  }
}

/** Tranche de score, pour suivre la difficulté sans stocker chaque score. */
export function scoreBucket(score) {
  const bounds = ANALYTICS.scoreBuckets;
  let lower = 0;
  for (const upper of bounds) {
    if (score < upper) return `${lower}-${upper - 1}`;
    lower = upper;
  }
  return `${lower}+`;
}
