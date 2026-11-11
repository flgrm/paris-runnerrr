/**
 * Game over (GAME_DESIGN.md §7.5) : score, record, rejouer en un tap.
 *
 * Overlay posé au-dessus de la scène de jeu figée : on voit où on s'est fait
 * renverser, et « Rejouer » relance la partie sans recharger la scène.
 */

import Phaser from 'phaser';
import { GAME, UI } from '../config.js';
import { button, label, panel } from '../systems/ui.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  /** @param {{score:number, coins:number, best:number, isRecord:boolean}} data */
  init(data) {
    this.result = {
      score: data.score ?? 0,
      coins: data.coins ?? 0,
      best: data.best ?? 0,
      isRecord: data.isRecord ?? false,
    };
  }

  create() {
    this.leaving = false;
    const { score, coins, best, isRecord } = this.result;
    const centerX = GAME.width / 2;
    const centerY = GAME.height / 2;

    this.add.rectangle(0, 0, GAME.width, GAME.height, 0x05070c, 0.62).setOrigin(0, 0);
    const board = panel(this, 600, 400, centerY - 10);

    label(this, centerX, centerY - 160, 'RENVERSÉ', {
      size: 46, bold: true, color: UI.colors.stone,
    });

    if (isRecord) {
      const banner = label(this, centerX, centerY - 112, 'Nouveau record !', {
        size: 26, bold: true, color: UI.colors.gold,
      });
      this.tweens.add({
        targets: banner,
        alpha: { from: 0.45, to: 1 },
        duration: 620,
        yoyo: true,
        repeat: -1,
      });
    } else {
      label(this, centerX, centerY - 112, `Record : ${best}`, {
        size: 22, color: UI.colors.textDim,
      });
    }

    label(this, centerX, centerY - 56, `Score ${score}`, { size: 34, bold: true });
    label(this, centerX, centerY - 18, `${coins} pièce${coins === 1 ? '' : 's'} ramassée${coins === 1 ? '' : 's'}`, {
      size: 19, color: UI.colors.gold,
    });

    button(this, centerX, centerY + 48, 'REJOUER', () => this.replay());
    button(this, centerX, centerY + 132, 'MENU', () => this.backToMenu(), {
      width: 220, size: 22, height: 60,
    });

    // Apparition douce du panneau.
    this.tweens.add({
      targets: board,
      scaleY: { from: 0.9, to: 1 },
      duration: 180,
      ease: 'Quad.easeOut',
    });

    this.input.keyboard.on('keydown-SPACE', () => this.replay());
    this.input.keyboard.on('keydown-ENTER', () => this.replay());
  }

  replay() {
    if (this.leaving) return;
    this.leaving = true;
    const game = this.scene.get('Game');
    this.scene.stop();
    game.restartRun();
  }

  backToMenu() {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.stop();
    this.scene.stop('Game');
    this.scene.start('Menu');
  }
}
