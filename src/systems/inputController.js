/**
 * Commandes (GAME_DESIGN.md §3).
 *
 * Clavier : Espace / Haut / W = saut, Bas / S = glissade, Échap / P = pause.
 * Tactile : la moitié droite saute, la gauche glisse (zones larges et
 * pardonnantes), et les swipes haut/bas fonctionnent partout sur l'écran.
 *
 * Le contrôleur ne fait qu'émettre des intentions : 'jump', 'jumpRelease',
 * 'slide', 'pause'. C'est la scène qui décide quoi en faire, ce qui garde la
 * latence nulle et le code testable.
 */

import Phaser from 'phaser';
import { INPUT } from '../config.js';

export default class InputController extends Phaser.Events.EventEmitter {
  constructor(scene) {
    super();
    this.scene = scene;
    /** @type {Map<number, {x:number, y:number, time:number, resolved:boolean}>} */
    this.touches = new Map();

    const keyboard = scene.input.keyboard;

    this.onKeyDown = (event) => {
      switch (event.code) {
        case 'Space': case 'ArrowUp': case 'KeyW':
          event.preventDefault();
          this.emit('jump');
          break;
        case 'ArrowDown': case 'KeyS':
          event.preventDefault();
          this.emit('slide');
          break;
        case 'Escape': case 'KeyP':
          event.preventDefault();
          this.emit('pause');
          break;
        default:
          break;
      }
    };

    this.onKeyUp = (event) => {
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        this.emit('jumpRelease');
      }
    };

    keyboard.on('keydown', this.onKeyDown);
    keyboard.on('keyup', this.onKeyUp);

    // Tactile : on agit dès le contact (aucune latence perceptible). Un swipe
    // franc dans l'autre sens corrige ensuite l'intention.
    this.onPointerDown = (pointer) => {
      const width = this.scene.scale.gameSize.width;
      const isSlideZone = pointer.x < width * INPUT.slideZoneRatio;
      this.touches.set(pointer.id, {
        x: pointer.x, y: pointer.y, time: pointer.downTime, isSlideZone, swiped: false,
      });
      this.emit(isSlideZone ? 'slide' : 'jump');
    };

    this.onPointerMove = (pointer) => {
      const start = this.touches.get(pointer.id);
      if (!start || start.swiped || !pointer.isDown) return;
      if (this.scene.time.now - start.time > INPUT.swipeMaxDuration) return;

      const dy = pointer.y - start.y;
      if (Math.abs(dy) < INPUT.swipeThreshold) return;
      // Un geste surtout horizontal n'est pas un swipe vertical.
      if (Math.abs(dy) < Math.abs(pointer.x - start.x)) return;

      start.swiped = true;
      const wantsJump = dy < 0;
      // N'émet que si le swipe contredit ce que la zone avait déclenché.
      if (wantsJump && start.isSlideZone) this.emit('jump');
      else if (!wantsJump && !start.isSlideZone) this.emit('slide');
    };

    this.onPointerUp = (pointer) => {
      this.touches.delete(pointer.id);
      // Règle la hauteur du saut en cours ; sans effet si le coureur ne monte pas.
      this.emit('jumpRelease');
    };

    const input = scene.input;
    input.on('pointerdown', this.onPointerDown);
    input.on('pointermove', this.onPointerMove);
    input.on('pointerup', this.onPointerUp);
    input.on('pointerupoutside', this.onPointerUp);
  }

  destroy() {
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      keyboard.off('keydown', this.onKeyDown);
      keyboard.off('keyup', this.onKeyUp);
    }
    const input = this.scene.input;
    input.off('pointerdown', this.onPointerDown);
    input.off('pointermove', this.onPointerMove);
    input.off('pointerup', this.onPointerUp);
    input.off('pointerupoutside', this.onPointerUp);
    this.touches.clear();
    this.removeAllListeners();
  }
}
