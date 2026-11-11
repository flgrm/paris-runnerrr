/**
 * Un obstacle.
 *
 * Objet recyclé dans un pool (aucune allocation en pleine partie,
 * GAME_DESIGN.md §5). Le déplacement est fait à la main plutôt que par Arcade :
 * on reste maître de l'ordre des opérations et la hitbox testée est toujours
 * celle de la frame courante.
 */

import Phaser from 'phaser';
import { OBSTACLES, WORLD } from '../config.js';
import { getBehaviour, initBehaviourState } from '../systems/behaviours.js';

export default class Obstacle extends Phaser.GameObjects.Sprite {
  constructor(scene, x = 0, y = 0) {
    super(scene, x, y, 'obstacle-banc');
    this.setOrigin(0.5, 1);
    this.setDepth(15);

    /** @type {string} clé dans OBSTACLES */
    this.defKey = null;
    /** @type {object} définition courante */
    this.def = null;
    this.state = null;
    this.baseY = y;
    this.offsetY = 0;
    this.hitbox = new Phaser.Geom.Rectangle();
  }

  /**
   * (Ré)active l'obstacle à une position donnée.
   * @param {string} key clé dans OBSTACLES
   * @param {number} x   position horizontale du bord gauche
   */
  spawn(key, x) {
    const def = OBSTACLES[key];
    this.defKey = key;
    this.def = def;
    this.state = initBehaviourState(def);
    this.behaviour = getBehaviour(def.behaviour);

    this.setTexture(`obstacle-${key}`);
    this.setDisplaySize(def.width, def.height);

    this.baseY = WORLD.groundY - (def.bottom ?? 0);
    this.offsetY = 0;
    this.setPosition(x + def.width / 2, this.baseY);

    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    return this;
  }

  /** Bord droit (utile pour calculer les écarts d'équité). */
  get rightEdge() {
    return this.x + this.def.width / 2;
  }

  get leftEdge() {
    return this.x - this.def.width / 2;
  }

  /** Le dessus sert-il de plateforme ? */
  get landable() {
    return this.def.landable === true;
  }

  /** Hauteur (y monde) du toit : le bord visuel du sprite, pas la hitbox réduite. */
  get roofY() {
    return this.y - this.def.height;
  }

  /** Rectangle de collision : ~80 % du sprite (GAME_DESIGN.md §4). */
  getHitbox() {
    const def = this.def;
    const scale = def.hitboxScale ?? 0.8;
    const w = def.width * scale;
    const h = def.height * scale;
    // Au sol : aligné en bas (le haut reste pardonnant).
    // En l'air : centré, pour que le dessous comme le dessus soient justes.
    const top = def.slot === 'ground' ? this.y - h : this.y - def.height + (def.height - h) / 2;
    return this.hitbox.setTo(this.x - w / 2, top, w, h);
  }

  /**
   * @param {number} delta   ms
   * @param {number} speed   vitesse de course en px/s
   * @param {number} playerX position du coureur
   */
  update(delta, speed, playerX) {
    const velocityX = this.behaviour(this, this.def, speed, delta, playerX);
    this.x += velocityX * (delta / 1000);
    this.y = this.baseY + this.offsetY;
  }

  /** Sorti de l'écran ? */
  isGone() {
    return this.x + this.def.width / 2 < -WORLD.despawnMargin;
  }

  /** Renvoie l'objet au pool. */
  recycle() {
    this.setActive(false);
    this.setVisible(false);
    this.def = null;
    this.defKey = null;
  }
}
