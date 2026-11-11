/**
 * Une pièce.
 *
 * Même principe que les obstacles : pool, déplacement manuel, hitbox AABB.
 * Le placeholder tourne sur lui-même en attendant la pièce dorée animée.
 */

import Phaser from 'phaser';
import { COINS } from '../config.js';

export default class Coin extends Phaser.GameObjects.Sprite {
  constructor(scene, x = 0, y = 0) {
    super(scene, x, y, 'coin');
    this.setOrigin(0.5, 0.5);
    this.setDepth(16);
    this.setDisplaySize(COINS.size, COINS.size);
    this.hitbox = new Phaser.Geom.Rectangle();
    this.collected = false;
  }

  spawn(x, y) {
    this.setPosition(x, y);
    this.setDisplaySize(COINS.size, COINS.size);
    this.setAngle(Phaser.Math.Between(0, 360));
    this.setAlpha(1);
    this.collected = false;
    this.setActive(true);
    this.setVisible(true);
    return this;
  }

  getHitbox() {
    const size = COINS.size * COINS.hitboxScale;
    return this.hitbox.setTo(this.x - size / 2, this.y - size / 2, size, size);
  }

  update(delta, speed) {
    this.x -= speed * (delta / 1000);
    this.angle += COINS.spinSpeed * (delta / 1000);
  }

  recycle() {
    this.setActive(false);
    this.setVisible(false);
    this.collected = false;
  }
}
