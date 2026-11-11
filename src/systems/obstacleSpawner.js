/**
 * Génération des obstacles (GAME_DESIGN.md §5).
 *
 * Trois garanties :
 *  - pool d'objets réutilisés, aucune allocation en pleine partie ;
 *  - difficulté progressive : chaque obstacle et chaque motif a un seuil
 *    `minProgress`, donc les combinaisons n'arrivent qu'une fois le joueur lancé ;
 *  - équité : les écarts sont calculés en secondes à la vitesse courante, avec
 *    un plancher par couple d'esquives (SPAWN.minGapTime). Il faut avoir atterri
 *    avant d'avoir à glisser, et s'être relevé avant d'avoir à sauter — donc
 *    aucune combinaison n'est injouable, quelle que soit la vitesse.
 */

import Phaser from 'phaser';
import { GAME, OBSTACLES, SPAWN, WORLD } from '../config.js';
import Obstacle from '../entities/Obstacle.js';
import Pool from './pool.js';

/** Regroupe les clés d'obstacles par emplacement, une fois pour toutes. */
function groupKeysBySlot() {
  const bySlot = { ground: [], airLow: [], airHigh: [], any: [] };
  for (const [key, def] of Object.entries(OBSTACLES)) {
    if (bySlot[def.slot]) bySlot[def.slot].push(key);
    bySlot.any.push(key);
  }
  return bySlot;
}

export default class ObstacleSpawner {
  constructor(scene) {
    this.scene = scene;
    this.pool = new Pool(scene, Obstacle, SPAWN.poolSize);
    this.keysBySlot = groupKeysBySlot();
    this.reset();
  }

  reset() {
    this.pool.releaseAll();
    this.distanceToNext = GAME.width * 0.75;
  }

  /** Tire une clé d'obstacle pour un emplacement, selon la difficulté. */
  pickKey(slot, progress) {
    const keys = this.keysBySlot[slot] ?? this.keysBySlot.any;
    const eligible = keys.filter((key) => OBSTACLES[key].minProgress <= progress);
    const pool = eligible.length > 0 ? eligible : keys;

    let total = 0;
    for (const key of pool) total += OBSTACLES[key].weight;

    let roll = Math.random() * total;
    for (const key of pool) {
      roll -= OBSTACLES[key].weight;
      if (roll <= 0) return key;
    }
    return pool[pool.length - 1];
  }

  /** Tire un motif compatible avec la difficulté courante. */
  pickPattern(progress) {
    const eligible = SPAWN.patterns.filter((p) => p.minProgress <= progress);
    const pool = eligible.length > 0 ? eligible : [SPAWN.patterns[0]];

    let total = 0;
    for (const pattern of pool) total += pattern.weight;

    let roll = Math.random() * total;
    for (const pattern of pool) {
      roll -= pattern.weight;
      if (roll <= 0) return pattern;
    }
    return pool[pool.length - 1];
  }

  /** Plancher d'équité, en secondes, entre deux esquives successives. */
  static requiredGapTime(previousAvoid, nextAvoid) {
    return SPAWN.minGapTime[`${previousAvoid}-${nextAvoid}`] ?? SPAWN.minGapTime.default;
  }

  /** Bord droit de l'obstacle actif le plus avancé (ou -Infinity s'il n'y en a aucun). */
  rightmostEdge() {
    let edge = Number.NEGATIVE_INFINITY;
    let avoid = null;
    this.pool.forEachActive((obstacle) => {
      if (obstacle.rightEdge > edge) {
        edge = obstacle.rightEdge;
        avoid = obstacle.def.avoid;
      }
    });
    return { edge, avoid };
  }

  /**
   * Fait apparaître un motif complet.
   * Les écarts demandés par le motif sont élargis si le plancher d'équité
   * l'exige à la vitesse courante.
   */
  spawnPattern(speed, progress) {
    const pattern = this.pickPattern(progress);
    const keys = pattern.parts.map((part) => this.pickKey(part.slot, progress));

    let startX = GAME.width + WORLD.spawnMargin;

    // Équité avec le motif précédent, encore à l'écran.
    const previous = this.rightmostEdge();
    if (previous.avoid) {
      const needed = ObstacleSpawner.requiredGapTime(previous.avoid, OBSTACLES[keys[0]].avoid) * speed;
      startX = Math.max(startX, previous.edge + needed);
    }

    let cursorTime = 0;
    let previousDef = null;
    let lastKey = keys[0];

    pattern.parts.forEach((part, index) => {
      const key = keys[index];
      const def = OBSTACLES[key];
      let time = part.dt;

      if (previousDef) {
        // Écart minimal : temps de réaction/récupération + largeur de l'obstacle
        // précédent, le tout converti à la vitesse courante.
        const minTime = cursorTime
          + ObstacleSpawner.requiredGapTime(previousDef.avoid, def.avoid)
          + previousDef.width / speed;
        time = Math.max(time, minTime);
      }

      const obstacle = this.pool.acquire();
      if (obstacle) obstacle.spawn(key, startX + time * speed);

      cursorTime = time;
      previousDef = def;
      lastKey = key;
    });

    // Distance jusqu'au prochain motif : longueur du motif + respiration.
    const span = (startX - (GAME.width + WORLD.spawnMargin))
      + cursorTime * speed
      + OBSTACLES[lastKey].width;
    const gapTime = Phaser.Math.Linear(
      SPAWN.patternGapTime.start,
      SPAWN.patternGapTime.end,
      progress,
    );
    const jitter = Phaser.Math.FloatBetween(1 - SPAWN.patternGapJitter, 1 + SPAWN.patternGapJitter);
    this.distanceToNext = span + gapTime * jitter * speed;
  }

  /**
   * @param {number} delta    ms
   * @param {number} speed    px/s
   * @param {number} progress difficulté, de 0 à 1
   * @param {number} playerX  position du coureur
   */
  update(delta, speed, progress, playerX) {
    this.pool.forEachActive((obstacle) => {
      obstacle.update(delta, speed, playerX);
      if (obstacle.isGone()) obstacle.recycle();
    });

    this.distanceToNext -= speed * (delta / 1000);
    if (this.distanceToNext <= 0) this.spawnPattern(speed, progress);
  }

  forEachActive(callback) {
    this.pool.forEachActive(callback);
  }

  destroy() {
    this.pool.destroy();
  }
}
