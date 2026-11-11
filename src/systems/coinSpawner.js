/**
 * Génération des pièces (GAME_DESIGN.md §4).
 *
 * Les pièces arrivent en lignes ou en arcs : l'arc suit une trajectoire de saut,
 * ce qui récompense le joueur qui saute au bon moment. Une pièce qui tomberait
 * dans un obstacle est écartée — on incite à prendre des risques, pas à perdre.
 */

import Phaser from 'phaser';
import { COINS, GAME, WORLD } from '../config.js';
import Coin from '../entities/Coin.js';
import Pool from './pool.js';

export default class CoinSpawner {
  constructor(scene) {
    this.scene = scene;
    this.pool = new Pool(scene, Coin, COINS.poolSize);
    this.probe = new Phaser.Geom.Rectangle();
    this.reset();
  }

  reset() {
    this.pool.releaseAll();
    this.distanceToNext = GAME.width;
  }

  /**
   * @param {number} speed
   * @param {number} progress
   * @param {(rect: Phaser.Geom.Rectangle) => boolean} isBlocked
   *        renvoie vrai si la zone est déjà occupée par un obstacle
   */
  spawnGroup(speed, progress, isBlocked) {
    const count = Phaser.Math.Between(COINS.count.min, COINS.count.max);
    const startX = GAME.width + WORLD.spawnMargin;
    const step = COINS.spacingTime * speed;
    const isArc = Math.random() < COINS.arcChance;
    const arcHeight = Phaser.Math.Between(COINS.arcHeight.min, COINS.arcHeight.max);
    const lineHeight = Phaser.Utils.Array.GetRandom(COINS.lineHeights);

    for (let i = 0; i < count; i += 1) {
      const x = startX + i * step;
      let height;
      if (isArc) {
        // Arc : sinusoïde qui épouse la cloche d'un saut.
        const t = count === 1 ? 0.5 : i / (count - 1);
        height = COINS.arcBase + Math.sin(t * Math.PI) * arcHeight;
      } else {
        height = lineHeight;
      }

      const y = WORLD.groundY - height;
      const size = COINS.size;
      this.probe.setTo(x - size / 2, y - size / 2, size, size);
      if (isBlocked(this.probe)) continue;

      const coin = this.pool.acquire();
      if (coin) coin.spawn(x, y);
    }

    const gapTime = Phaser.Math.Linear(COINS.gapTime.start, COINS.gapTime.end, progress);
    const jitter = Phaser.Math.FloatBetween(1 - COINS.gapJitter, 1 + COINS.gapJitter);
    this.distanceToNext = count * step + gapTime * jitter * speed;
  }

  update(delta, speed, progress, isBlocked) {
    this.pool.forEachActive((coin) => {
      coin.update(delta, speed);
      if (coin.x < -WORLD.despawnMargin) coin.recycle();
    });

    this.distanceToNext -= speed * (delta / 1000);
    if (this.distanceToNext <= 0) this.spawnGroup(speed, progress, isBlocked);
  }

  forEachActive(callback) {
    this.pool.forEachActive(callback);
  }

  destroy() {
    this.pool.destroy();
  }
}
