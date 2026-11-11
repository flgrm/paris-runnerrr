/**
 * Point d'entrée.
 *
 * Mise à l'échelle : mode FIT sur une résolution de référence 16:9, centrée,
 * pour couvrir le smartphone en paysage comme le navigateur desktop
 * (GAME_DESIGN.md §9). Le rendu reste net sur écrans haute densité.
 */

import Phaser from 'phaser';
import { GAME, WORLD } from './config.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import PauseScene from './scenes/PauseScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import { initAnalytics } from './systems/analytics.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: GAME.backgroundColor,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME.width,
    height: GAME.height,
  },
  // Rendu net sur Retina, sans aller jusqu'à 3x (coût GPU inutile sur mobile).
  resolution: Math.min(window.devicePixelRatio || 1, GAME.maxPixelRatio),
  render: {
    antialias: true,
    roundPixels: false,
    powerPreference: 'high-performance',
  },
  fps: {
    target: GAME.targetFps,
    // Delta plafonné à la source : physique et scènes reçoivent le même temps.
    min: GAME.minFps,
    forceSetTimeOut: false,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: WORLD.gravity },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, PauseScene, GameOverScene],
};

// ?debug=1 dans l'URL active les hitboxes et le compteur de fps.
if (new URLSearchParams(window.location.search).has('debug')) {
  GAME.debug = true;
}

const game = new Phaser.Game(config);

// Sans effet tant qu'aucun code GoatCounter n'est renseigné dans config.js.
initAnalytics();

// En mode debug uniquement : l'instance est exposée pour l'inspection manuelle
// et les tests automatisés de rendu mobile.
if (GAME.debug) {
  window.parisRunner = game;
}

// Un changement d'orientation ou de barre d'adresse mobile doit recalculer la
// mise à l'échelle : sans ça, le canvas reste sur l'ancienne taille d'écran.
window.addEventListener('resize', () => game.scale.refresh());
window.addEventListener('orientationchange', () => {
  window.setTimeout(() => game.scale.refresh(), 120);
});
