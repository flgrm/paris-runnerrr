/**
 * Briques d'interface partagées par les scènes (GAME_DESIGN.md §7).
 * Styles et couleurs viennent de UI dans src/config.js.
 */

import Phaser from 'phaser';
import { GAME, UI } from '../config.js';

/** Titre, sous-titre, libellé : un style de texte cohérent partout. */
export function label(scene, x, y, text, options = {}) {
  const item = scene.add
    .text(x, y, text, {
      fontFamily: UI.fontFamily,
      fontSize: `${options.size ?? 24}px`,
      color: options.color ?? UI.colors.text,
      align: options.align ?? 'center',
      fontStyle: options.bold ? 'bold' : 'normal',
      lineSpacing: options.lineSpacing ?? 8,
    })
    .setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);

  // Ombre portée : le HUD doit rester lisible sur un ciel clair comme sur
  // l'asphalte sombre, sans cadre opaque qui mangerait l'écran du téléphone.
  if (options.shadow !== false) {
    item.setShadow(0, 2, 'rgba(0,0,0,0.85)', 6, false, true);
  }
  return item;
}

/** Panneau semi-opaque centré, pour les menus et les overlays. */
export function panel(scene, width, height, y = GAME.height / 2) {
  const rect = scene.add
    .rectangle(GAME.width / 2, y, width, height, UI.colors.panel, UI.colors.panelAlpha)
    .setOrigin(0.5, 0.5);
  rect.setStrokeStyle(2, 0x6b6557, 0.9);
  return rect;
}

/**
 * Bouton tactile. La zone cliquable est volontairement plus large que le
 * rectangle visible : les cibles doivent être pardonnantes sur mobile.
 */
export function button(scene, x, y, text, onClick, options = {}) {
  const width = options.width ?? 280;
  const height = options.height ?? 72;
  const container = scene.add.container(x, y);

  const background = scene.add
    .rectangle(0, 0, width, height, 0x000000, 0)
    .setStrokeStyle(2, 0xcfc6b4, 0.9);
  const fill = scene.add.rectangle(0, 0, width - 6, height - 6, 0xcfc6b4, 0.12);
  const caption = label(scene, 0, 0, text, { size: options.size ?? 28, bold: true });

  container.add([fill, background, caption]);
  container.setSize(width, height);
  container.setInteractive(
    new Phaser.Geom.Rectangle(-width / 2 - 20, -height / 2 - 20, width + 40, height + 40),
    Phaser.Geom.Rectangle.Contains,
  );

  const setHighlight = (on) => {
    fill.setFillStyle(0xcfc6b4, on ? 0.26 : 0.12);
    container.setScale(on ? 1.03 : 1);
  };

  container.on('pointerover', () => setHighlight(true));
  container.on('pointerout', () => setHighlight(false));
  container.on('pointerdown', () => setHighlight(true));
  container.on('pointerup', () => {
    setHighlight(false);
    onClick();
  });

  return container;
}

/** Vrai si l'appareil est tactile : sert à afficher les bonnes commandes. */
export function isTouchDevice(scene) {
  return scene.sys.game.device.input.touch && !scene.sys.game.device.os.desktop;
}

/** Rappel des commandes, adapté à l'appareil (GAME_DESIGN.md §7). */
export function controlsHint(scene) {
  return isTouchDevice(scene)
    ? 'Tapez à droite pour sauter (deux fois pour le double saut)\nTapez à gauche pour glisser'
    : 'Espace / Haut : sauter (deux fois pour le double saut)\nBas : glisser   ·   Échap : pause';
}
