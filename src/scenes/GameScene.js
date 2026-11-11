/**
 * Scène de jeu (GAME_DESIGN.md §7.3).
 *
 * Ordre d'une frame, et c'est important :
 *  1. Arcade Physics intègre la gravité du coureur (événement 'update' de Phaser) ;
 *  2. cette méthode update() déplace le décor, les obstacles et les pièces ;
 *  3. les collisions sont testées en AABB sur les positions de CETTE frame.
 * Aucun décalage de hitbox, même à 1000 px/s.
 */

import Phaser from 'phaser';
import { GAME, RUN, UI, WORLD } from '../config.js';
import Player from '../entities/Player.js';
import InputController from '../systems/inputController.js';
import Parallax from '../systems/parallax.js';
import ObstacleSpawner from '../systems/obstacleSpawner.js';
import CoinSpawner from '../systems/coinSpawner.js';
import { addCoins, getHighScore, submitScore } from '../systems/storage.js';
import { label } from '../systems/ui.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    // Le bas du monde est la ligne de sol : l'atterrissage est géré par la
    // physique, sans écrire de position à la main (donc sans désynchroniser la hitbox).
    this.physics.world.setBounds(0, -4000, GAME.width, WORLD.groundY + 4000);
    this.physics.world.gravity.y = WORLD.gravity;

    this.parallax = new Parallax(this);
    this.player = new Player(this);
    this.obstacles = new ObstacleSpawner(this);
    this.coinField = new CoinSpawner(this);

    this.playerBox = new Phaser.Geom.Rectangle();
    this.isObstacleAt = (rect) => this.rectHitsObstacle(rect);

    this.createHud();
    this.bindControls();

    if (GAME.debug) this.debugGraphics = this.add.graphics().setDepth(900);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.cameras.main.fadeIn(UI.fadeDuration, 0, 0, 0);

    this.startRun();
  }

  /* -------------------------------------------------------------- */
  /* Mise en place                                                  */
  /* -------------------------------------------------------------- */

  bindControls() {
    this.controls = new InputController(this);
    this.controls.on('jump', () => { if (this.acceptsInput()) this.player.requestJump(); });
    this.controls.on('jumpRelease', () => { if (this.acceptsInput()) this.player.releaseJump(); });
    this.controls.on('slide', () => { if (this.acceptsInput()) this.player.requestSlide(); });
    this.controls.on('pause', () => this.pauseRun());
  }

  acceptsInput() {
    return this.running && this.elapsed >= RUN.startDelay;
  }

  createHud() {
    const margin = UI.hud.margin;

    this.scoreLabel = label(this, margin, margin, 'SCORE', {
      size: UI.hud.labelSize, color: UI.colors.text, originX: 0, originY: 0,
    });
    this.scoreText = label(this, margin, margin + 20, '0', {
      size: UI.hud.fontSize, bold: true, originX: 0, originY: 0,
    });

    this.coinsText = label(this, margin, margin + 64, 'Pièces 0', {
      size: UI.hud.labelSize, color: UI.colors.gold, originX: 0, originY: 0,
    });

    this.bestText = label(this, GAME.width / 2, margin + 4, '', {
      size: UI.hud.labelSize, color: UI.colors.text, originX: 0.5, originY: 0,
    });

    // Bouton pause : large, en haut à droite, atteignable au pouce.
    this.pauseButton = this.add
      .container(GAME.width - margin - 26, margin + 26)
      .setSize(52, 52)
      .setDepth(100);
    const frame = this.add.rectangle(0, 0, 52, 52, 0x000000, 0.25).setStrokeStyle(2, 0xcfc6b4, 0.8);
    const barLeft = this.add.rectangle(-8, 0, 6, 22, 0xcfc6b4, 0.95);
    const barRight = this.add.rectangle(8, 0, 6, 22, 0xcfc6b4, 0.95);
    this.pauseButton.add([frame, barLeft, barRight]);
    this.pauseButton.setInteractive(
      new Phaser.Geom.Rectangle(-40, -40, 132, 132),
      Phaser.Geom.Rectangle.Contains,
    );
    this.pauseButton.on('pointerdown', () => this.pauseRun());

    for (const item of [this.scoreLabel, this.scoreText, this.coinsText, this.bestText]) {
      item.setDepth(100);
    }
  }

  /* -------------------------------------------------------------- */
  /* Cycle d'une partie                                             */
  /* -------------------------------------------------------------- */

  startRun() {
    this.running = true;
    this.elapsed = 0;
    this.distance = 0;
    this.score = 0;
    this.displayedScore = -1;
    this.coinCount = 0;
    this.speed = RUN.speedStart;
    this.best = getHighScore();

    this.parallax.reset();
    this.player.reset();
    this.obstacles.reset();
    this.coinField.reset();

    this.bestText.setText(this.best > 0 ? `Record ${this.best}` : '');
    this.coinsText.setText('Pièces 0');
    this.scoreText.setText('0');
  }

  /** Relance une partie sans recréer la scène (rejouer en un tap). */
  restartRun() {
    this.startRun();
    this.cameras.main.fadeIn(UI.fadeDuration, 0, 0, 0);
  }

  pauseRun() {
    if (!this.running) return;
    this.scene.pause();
    this.scene.launch('Pause');
  }

  gameOver() {
    if (!this.running) return;
    this.running = false;

    this.player.die();
    this.cameras.main.shake(240, 0.012);

    const isRecord = submitScore(this.score);
    addCoins(this.coinCount);

    // Laisse voir la chute avant d'afficher le panneau.
    this.time.delayedCall(650, () => {
      this.scene.launch('GameOver', {
        score: this.score,
        coins: this.coinCount,
        best: Math.max(this.best, this.score),
        isRecord,
      });
    });
  }

  /* -------------------------------------------------------------- */
  /* Collisions                                                     */
  /* -------------------------------------------------------------- */

  /** Vrai si un obstacle actif occupe ce rectangle (placement des pièces). */
  rectHitsObstacle(rect) {
    let blocked = false;
    this.obstacles.forEachActive((obstacle) => {
      if (blocked) return;
      if (Phaser.Geom.Intersects.RectangleToRectangle(rect, obstacle.getHitbox())) blocked = true;
    });
    return blocked;
  }

  checkObstacleCollisions() {
    const playerBox = this.player.getHitbox(this.playerBox);
    let hit = false;
    this.obstacles.forEachActive((obstacle) => {
      if (hit) return;
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBox, obstacle.getHitbox())) hit = true;
    });
    if (hit) this.gameOver();
  }

  checkCoinCollisions() {
    const playerBox = this.player.getHitbox(this.playerBox);
    this.coinField.forEachActive((coin) => {
      if (coin.collected) return;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(playerBox, coin.getHitbox())) return;
      this.collectCoin(coin);
    });
  }

  collectCoin(coin) {
    coin.collected = true;
    this.coinCount += 1;
    this.coinsText.setText(`Pièces ${this.coinCount}`);

    this.tweens.add({
      targets: coin,
      scale: 1.9,
      alpha: 0,
      y: coin.y - 40,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => coin.recycle(),
    });
  }

  /* -------------------------------------------------------------- */
  /* Boucle                                                         */
  /* -------------------------------------------------------------- */

  update(time, delta) {
    // Un onglet revenu au premier plan peut livrer un delta énorme : on le
    // borne pour ne pas téléporter le coureur à travers un obstacle.
    const dt = Math.min(delta, 1000 / 30);

    if (!this.running) {
      // Après la collision, le décor s'arrête net mais la chute continue.
      this.player.update(dt);
      this.drawDebug();
      return;
    }

    this.elapsed += dt;
    this.speed = Math.min(RUN.speedMax, RUN.speedStart + RUN.speedRamp * (this.elapsed / 1000));
    const progress = Phaser.Math.Clamp(
      this.elapsed / 1000 / RUN.difficultyRampSeconds,
      0,
      1,
    );

    this.parallax.update(dt, this.speed);
    this.player.update(dt);
    this.obstacles.update(dt, this.speed, progress, this.player.x);
    this.coinField.update(dt, this.speed, progress, this.isObstacleAt);

    this.distance += this.speed * (dt / 1000);
    this.score = Math.floor(this.distance * RUN.scorePerPixel) + this.coinCount * RUN.coinScore;
    if (this.score !== this.displayedScore) {
      this.displayedScore = this.score;
      this.scoreText.setText(String(this.score));
    }

    this.checkCoinCollisions();
    this.checkObstacleCollisions();
    this.drawDebug();
  }

  /** Hitboxes et compteur de fps (?debug=1). */
  drawDebug() {
    if (!this.debugGraphics) return;
    const g = this.debugGraphics;
    g.clear();

    g.lineStyle(1, 0x00ff88, 0.9);
    const box = this.player.getHitbox(this.playerBox);
    g.strokeRect(box.x, box.y, box.width, box.height);

    g.lineStyle(1, 0xff5544, 0.9);
    this.obstacles.forEachActive((obstacle) => {
      const rect = obstacle.getHitbox();
      g.strokeRect(rect.x, rect.y, rect.width, rect.height);
    });

    g.lineStyle(1, 0xffdd44, 0.8);
    this.coinField.forEachActive((coin) => {
      const rect = coin.getHitbox();
      g.strokeRect(rect.x, rect.y, rect.width, rect.height);
    });

    if (!this.fpsText) {
      this.fpsText = label(this, GAME.width - 24, GAME.height - 24, '', {
        size: 16, originX: 1, originY: 1, color: '#00ff88',
      }).setDepth(900);
    }
    this.fpsText.setText(
      `${Math.round(this.game.loop.actualFps)} fps · ${Math.round(this.speed)} px/s`,
    );
  }

  onShutdown() {
    this.controls?.destroy();
    this.obstacles?.destroy();
    this.coinField?.destroy();
    this.parallax?.destroy();
  }
}
