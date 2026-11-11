/**
 * Écran d'accueil (GAME_DESIGN.md §7.2) : titre, record, bouton Jouer et
 * rappel des commandes adapté à l'appareil. La parallaxe tourne au ralenti en
 * fond, pour montrer tout de suite de quoi il s'agit.
 */

import Phaser from 'phaser';
import { GAME, RUN, UI } from '../config.js';
import Parallax from '../systems/parallax.js';
import { getHighScore } from '../systems/storage.js';
import { button, controlsHint, label, panel } from '../systems/ui.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    // La scène est réutilisée au retour du jeu : on repart d'un état propre.
    this.starting = false;
    this.parallax = new Parallax(this);
    this.cameras.main.fadeIn(UI.fadeDuration, 0, 0, 0);
    // Phaser n'appelle pas `shutdown()` tout seul : on s'abonne explicitement.
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    panel(this, 620, 400, GAME.height / 2 - 10);

    label(this, GAME.width / 2, GAME.height / 2 - 150, 'PARIS RUNNER', {
      size: 56, bold: true, color: UI.colors.stone,
    });
    label(this, GAME.width / 2, GAME.height / 2 - 103, 'Traversez Paris sans vous faire renverser', {
      size: 19, color: UI.colors.textDim,
    });

    const best = getHighScore();
    label(
      this,
      GAME.width / 2,
      GAME.height / 2 - 52,
      best > 0 ? `Record : ${best}` : 'Aucun record pour le moment',
      { size: 26, color: UI.colors.gold, bold: best > 0 },
    );

    button(this, GAME.width / 2, GAME.height / 2 + 20, 'JOUER', () => this.startGame());

    label(this, GAME.width / 2, GAME.height / 2 + 115, controlsHint(this), {
      size: 17, color: UI.colors.textDim,
    });

    // Lancement au clavier aussi.
    this.input.keyboard.once('keydown-SPACE', () => this.startGame());
    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
  }

  startGame() {
    if (this.starting) return;
    this.starting = true;
    this.cameras.main.fadeOut(UI.fadeDuration, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
  }

  update(time, delta) {
    // Défilement lent : le décor vit sans donner l'impression que la partie a commencé.
    this.parallax.update(delta, RUN.speedStart * 0.25);
  }

  onShutdown() {
    this.parallax?.destroy();
  }
}
