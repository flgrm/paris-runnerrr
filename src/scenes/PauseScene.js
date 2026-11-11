/**
 * Pause (GAME_DESIGN.md §7.4) : reprendre ou quitter.
 *
 * Overlay posé au-dessus de la scène de jeu mise en pause : la partie reste
 * visible derrière, et reprend exactement là où elle s'était arrêtée.
 */

import Phaser from 'phaser';
import { GAME, UI } from '../config.js';
import { button, label, panel } from '../systems/ui.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create() {
    this.add.rectangle(0, 0, GAME.width, GAME.height, 0x05070c, 0.6).setOrigin(0, 0);
    panel(this, 520, 320);

    label(this, GAME.width / 2, GAME.height / 2 - 108, 'PAUSE', {
      size: 44, bold: true, color: UI.colors.stone,
    });

    button(this, GAME.width / 2, GAME.height / 2 - 20, 'REPRENDRE', () => this.resumeGame());
    button(this, GAME.width / 2, GAME.height / 2 + 70, 'QUITTER', () => this.quit(), {
      width: 240, size: 24,
    });

    this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
    this.input.keyboard.on('keydown-P', () => this.resumeGame());
    this.input.keyboard.on('keydown-SPACE', () => this.resumeGame());
  }

  resumeGame() {
    this.scene.stop();
    this.scene.resume('Game');
  }

  quit() {
    this.scene.stop();
    this.scene.stop('Game');
    this.scene.start('Menu');
  }
}
