/**
 * Scène de chargement (GAME_DESIGN.md §7.1).
 *
 * Phase 1 : il n'y a aucun fichier à charger, tous les visuels sont des
 * placeholders générés par code. La barre de progression et le manifeste sont
 * néanmoins déjà en place : la phase 2 consistera à remplir ASSETS, couche par
 * couche. Comme `createPlaceholders` ne génère que les clés absentes, une
 * texture chargée ici remplace automatiquement son placeholder.
 */

import Phaser from 'phaser';
import { UI } from '../config.js';
import { createPlaceholders } from '../systems/placeholders.js';
import { label } from '../systems/ui.js';

/**
 * Manifeste des assets définitifs.
 * Les clés reprennent celles des placeholders (PARALLAX[].texture, 'player-run',
 * `obstacle-<clé>`, 'coin'), pour un remplacement sans toucher au gameplay.
 * @type {{key: string, path: string}[]}
 */
const ASSETS = [
  // Exemple (phase 4) :
  // { key: 'bg-ciel', path: 'assets/backgrounds/ciel.png' },
];

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.drawLoadingBar();

    for (const asset of ASSETS) {
      this.load.image(asset.key, asset.path);
    }
  }

  drawLoadingBar() {
    const { width, height } = this.scale.gameSize;
    const barWidth = Math.min(520, width * 0.55);
    const barHeight = 10;
    const x = (width - barWidth) / 2;
    const y = height * 0.58;

    label(this, width / 2, height * 0.46, 'PARIS RUNNER', {
      size: 44, bold: true, color: UI.colors.stone,
    });
    const caption = label(this, width / 2, y + 34, 'Chargement…', {
      size: 18, color: UI.colors.textDim,
    });

    const track = this.add.graphics();
    track.lineStyle(1, 0x6b6557, 0.9).strokeRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

    const fill = this.add.graphics();
    const render = (progress) => {
      fill.clear();
      fill.fillStyle(0xcfc6b4, 0.9).fillRect(x, y, barWidth * progress, barHeight);
    };
    render(0);

    this.load.on('progress', render);
    this.load.once('complete', () => {
      render(1);
      caption.setText('Prêt');
    });
  }

  create() {
    // Tous les placeholders gris, aux dimensions des futurs visuels.
    createPlaceholders(this);

    this.scene.start('Menu');
  }
}
