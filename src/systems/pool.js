/**
 * Pool d'objets réutilisés.
 *
 * Tout est alloué une fois à la création de la scène : en pleine partie, on ne
 * fait que réactiver des objets existants (GAME_DESIGN.md §5).
 */

export default class Pool {
  /**
   * @param {Phaser.Scene} scene
   * @param {Function} ClassType classe à instancier (scene, x, y)
   * @param {number} size taille fixe du pool
   */
  constructor(scene, ClassType, size) {
    this.items = [];
    for (let i = 0; i < size; i += 1) {
      const item = new ClassType(scene, 0, 0);
      scene.add.existing(item);
      item.recycle();
      this.items.push(item);
    }
  }

  /** @returns {object|null} un objet libre, ou null si le pool est saturé. */
  acquire() {
    for (const item of this.items) {
      if (!item.active) return item;
    }
    return null;
  }

  /** Itère sur les objets actifs. */
  forEachActive(callback) {
    for (const item of this.items) {
      if (item.active) callback(item);
    }
  }

  releaseAll() {
    for (const item of this.items) item.recycle();
  }

  destroy() {
    for (const item of this.items) item.destroy();
    this.items.length = 0;
  }
}
