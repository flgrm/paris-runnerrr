/**
 * Parallaxe multicouche (GAME_DESIGN.md §6).
 *
 * Une couche = un TileSprite dont on fait défiler `tilePositionX`. Les textures
 * sont raccordables horizontalement, donc le défilement est infini sans
 * recycler d'objets. Les couches, leurs vitesses et leurs teintes viennent
 * entièrement de PARALLAX dans src/config.js.
 */

import { GAME, PARALLAX } from '../config.js';

export default class Parallax {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} baseDepth profondeur de la première couche (la plus lointaine)
   */
  constructor(scene, baseDepth = -100) {
    this.scene = scene;
    this.layers = [];

    PARALLAX.layers.forEach((def, index) => {
      const tile = scene.add
        .tileSprite(0, def.y, GAME.width, def.height, def.texture)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(baseDepth + index);

      if (def.tint !== undefined && def.tint !== 0xffffff) tile.setTint(def.tint);
      if (def.alpha !== undefined) tile.setAlpha(def.alpha);

      this.layers.push({ def, tile });
    });
  }

  /**
   * @param {number} delta  temps écoulé en ms
   * @param {number} speed  vitesse de course courante en px/s
   */
  update(delta, speed) {
    const dt = delta / 1000;
    for (const { def, tile } of this.layers) {
      const layerSpeed = speed * def.speedMul + (def.ownSpeed ?? 0);
      tile.tilePositionX += layerSpeed * dt;
    }
  }

  /** Remet toutes les couches à leur position d'origine (nouvelle partie). */
  reset() {
    for (const { tile } of this.layers) tile.tilePositionX = 0;
  }

  destroy() {
    for (const { tile } of this.layers) tile.destroy();
    this.layers.length = 0;
  }
}
