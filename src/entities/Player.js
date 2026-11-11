/**
 * Le coureur.
 *
 * Seul objet du jeu géré par Arcade Physics : gravité + atterrissage sur la
 * limite basse du monde. Les obstacles et les pièces sont déplacés à la main et
 * testés en AABB dans la même frame (voir GameScene), ce qui évite toute
 * désynchronisation de hitbox à 1000 px/s.
 *
 * Mécaniques (GAME_DESIGN.md §4) : saut, saut à hauteur variable, double saut,
 * glissade, coyote time et mémorisation du saut.
 */

import Phaser from 'phaser';
import { PLAYER, WORLD } from '../config.js';

const POSES = {
  run: { texture: 'player-run', dims: PLAYER.run },
  slide: { texture: 'player-slide', dims: PLAYER.slide },
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, PLAYER.x, WORLD.groundY, POSES.run.texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.setDepth(20);
    this.setCollideWorldBounds(true);

    /** Ombre portée au sol, réduite quand le coureur est en l'air. */
    this.shadow = scene.add
      .image(PLAYER.x, WORLD.groundY + 6, 'ombre')
      .setOrigin(0.5, 0.5)
      .setDepth(19);

    this.pose = 'run';
    this.jumpsUsed = 0;
    this.sliding = false;
    this.slideTimer = 0;
    this.slideCooldownTimer = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.runTime = 0;
    this.alive = true;

    this.applyPose('run');
  }

  /* -------------------------------------------------------------- */
  /* Poses et hitbox                                                */
  /* -------------------------------------------------------------- */

  /**
   * Applique une pose : texture (placeholder aujourd'hui, animation demain)
   * et hitbox à ~80 % du sprite, alignée sur les pieds.
   */
  applyPose(pose) {
    const { texture, dims } = POSES[pose];
    this.pose = pose;
    this.setTexture(texture);
    // Le sprite occupe toujours les dimensions de config.js, quelle que soit la
    // résolution de la texture (un asset @2x passera donc sans rien changer).
    this.setDisplaySize(dims.width, dims.height);

    const bodyWidth = dims.width * PLAYER.hitboxScale;
    const bodyHeight = dims.height * PLAYER.hitboxScale;
    this.body.setSize(bodyWidth, bodyHeight, false);
    // `offset` s'exprime en pixels de texture : on divise par l'échelle.
    // Hitbox centrée horizontalement et alignée sur les pieds — la tête reste
    // pardonnante, comme demandé (hitbox à ~80 % du sprite).
    this.body.setOffset(
      (this.width - bodyWidth / this.scaleX) / 2,
      this.height - bodyHeight / this.scaleY,
    );
    this.body.updateFromGameObject();
    // En fin de frame, Arcade reporte sur le sprite l'écart (position − prevFrame).
    // Changer de hitbox déplace le haut du corps sans que le coureur ait bougé :
    // on réaligne prevFrame, sinon ce faux déplacement soulève le sprite (un
    // bond parasite à chaque fin de glissade).
    this.body.prev.copy(this.body.position);
    this.body.prevFrame.copy(this.body.position);
  }

  get grounded() {
    return this.body.blocked.down || this.body.touching.down;
  }

  /** Rectangle de collision courant, en coordonnées monde. */
  getHitbox(out) {
    const rect = out ?? new Phaser.Geom.Rectangle();
    const body = this.body;
    return rect.setTo(body.x, body.y, body.width, body.height);
  }

  /* -------------------------------------------------------------- */
  /* Commandes                                                      */
  /* -------------------------------------------------------------- */

  /** Demande de saut : mémorisée si le coureur est encore en l'air. */
  requestJump() {
    if (!this.alive) return;
    this.jumpBufferTimer = PLAYER.jumpBufferTime;
  }

  /** Relâchement de la commande : coupe la montée (saut à hauteur variable). */
  releaseJump() {
    if (this.body.velocity.y < PLAYER.jumpCutVelocity) {
      this.setVelocityY(PLAYER.jumpCutVelocity);
    }
  }

  /** Demande de glissade. En l'air, accélère la chute pour retomber plus vite. */
  requestSlide() {
    if (!this.alive) return;

    if (!this.grounded && this.coyoteTimer <= 0) {
      this.setVelocityY(Math.max(this.body.velocity.y, PLAYER.slideFastFallVelocity));
      return;
    }
    if (this.sliding || this.slideCooldownTimer > 0) return;

    this.sliding = true;
    this.slideTimer = PLAYER.slideDuration;
    this.applyPose('slide');
  }

  endSlide() {
    if (!this.sliding) return;
    this.sliding = false;
    this.slideTimer = 0;
    this.slideCooldownTimer = PLAYER.slideCooldown;
    this.applyPose('run');
  }

  /* -------------------------------------------------------------- */
  /* Cycle de vie                                                   */
  /* -------------------------------------------------------------- */

  /** Exécute un saut si le crédit le permet. */
  performJump() {
    const canFirstJump = this.grounded || this.coyoteTimer > 0;

    if (canFirstJump) {
      if (this.sliding) this.endSlide();
      this.setVelocityY(PLAYER.jumpVelocity);
      this.jumpsUsed = 1;
      this.coyoteTimer = 0;
      return true;
    }

    if (this.jumpsUsed < PLAYER.maxJumps) {
      this.setVelocityY(PLAYER.doubleJumpVelocity);
      this.jumpsUsed += 1;
      this.spinForDoubleJump();
      return true;
    }

    return false;
  }

  /** Retour visuel du double saut, en attendant l'animation définitive. */
  spinForDoubleJump() {
    this.scene.tweens.add({
      targets: this,
      angle: { from: 0, to: PLAYER.doubleJumpSpin },
      duration: PLAYER.doubleJumpSpinDuration,
      ease: 'Cubic.easeOut',
      onComplete: () => this.setAngle(0),
    });
  }

  update(delta) {
    if (!this.alive) return;

    const wasGrounded = this.grounded;
    this.runTime += delta;

    // Coyote time : on garde un court crédit de saut après avoir quitté le sol.
    if (wasGrounded) {
      this.coyoteTimer = PLAYER.coyoteTime;
      this.jumpsUsed = 0;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= delta;
    }

    // Saut mémorisé : déclenché dès qu'il devient possible.
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= delta;
      if (this.performJump()) this.jumpBufferTimer = 0;
    }

    if (this.slideCooldownTimer > 0) this.slideCooldownTimer -= delta;

    if (this.sliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) this.endSlide();
    }

    // Léger balancement de course sur le placeholder : retour visuel du cycle de pas.
    if (wasGrounded && !this.sliding) {
      this.setAngle(
        Math.sin((this.runTime / 1000) * PLAYER.runTiltSpeed) * PLAYER.runTiltAmplitude,
      );
    }

    // L'ombre rétrécit avec l'altitude : lecture immédiate de la hauteur de saut.
    const altitude = Phaser.Math.Clamp((WORLD.groundY - this.y) / 220, 0, 1);
    this.shadow.setScale(1 - altitude * 0.45, 1 - altitude * 0.35);
    this.shadow.setAlpha(0.8 - altitude * 0.5);
  }

  /** Chute au game over. */
  die() {
    this.alive = false;
    if (this.sliding) this.endSlide();
    this.setVelocity(-120, -420);
    this.body.setAllowGravity(true);
    this.setCollideWorldBounds(false);
    this.scene.tweens.add({
      targets: this,
      angle: -95,
      duration: 500,
      ease: 'Quad.easeOut',
    });
    this.scene.tweens.add({ targets: this.shadow, alpha: 0, duration: 250 });
  }

  /** Remise à zéro pour une nouvelle partie. */
  reset() {
    this.alive = true;
    this.jumpsUsed = 0;
    this.sliding = false;
    this.slideTimer = 0;
    this.slideCooldownTimer = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.runTime = 0;
    this.setAngle(0);
    this.setPosition(PLAYER.x, WORLD.groundY);
    this.setVelocity(0, 0);
    this.setCollideWorldBounds(true);
    this.applyPose('run');
    this.shadow.setAlpha(0.8).setScale(1, 1);
  }
}
