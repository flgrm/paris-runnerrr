/**
 * Placeholders gris — phase 1 du pipeline d'assets (GAME_DESIGN.md §6).
 *
 * Toutes les textures du jeu sont générées ici, aux dimensions exactes des
 * futurs visuels définitifs. La phase 2 consistera à charger
 * `assets/backgrounds/<couche>.png` et `assets/sprites/<nom>.png` dans BootScene :
 * comme on ne génère que les clés absentes, une texture chargée prend
 * automatiquement le pas sur son placeholder, couche par couche, sans toucher
 * au reste du code.
 */

import { COINS, GAME, OBSTACLES, PARALLAX, PLAYER, WORLD } from '../config.js';

/** Teintes de gris neutres : la profondeur est gérée par les `tint` de la parallaxe. */
const GREY = {
  darkest: 0x3a3a3a,
  dark: 0x4e4e4e,
  mid: 0x6a6a6a,
  light: 0x8a8a8a,
  lighter: 0xa6a6a6,
  lightest: 0xc2c2c2,
};

/** Dessine un bloc gris lisible : corps, liseré clair en haut, ombre en bas. */
function block(g, x, y, w, h, fill = GREY.mid) {
  g.fillStyle(fill, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(GREY.lighter, 0.35);
  g.fillRect(x, y, w, Math.max(1, Math.round(h * 0.06)));
  g.fillStyle(GREY.darkest, 0.3);
  g.fillRect(x, y + h - Math.max(1, Math.round(h * 0.06)), w, Math.max(1, Math.round(h * 0.06)));
  g.lineStyle(2, GREY.darkest, 0.5);
  g.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

/** Génère une texture depuis un Graphics temporaire, si la clé est libre. */
function makeTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, Math.ceil(width), Math.ceil(height));
  g.destroy();
}

/** Génère une texture depuis un canvas 2D (dégradés, flou), si la clé est libre. */
function makeCanvasTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;
  const canvasTexture = scene.textures.createCanvas(key, Math.ceil(width), Math.ceil(height));
  if (!canvasTexture) return;
  draw(canvasTexture.getContext(), Math.ceil(width), Math.ceil(height));
  canvasTexture.refresh();
}

/* ------------------------------------------------------------------ */
/* Couches de parallaxe                                               */
/* ------------------------------------------------------------------ */

function skyTexture(scene, layer) {
  makeCanvasTexture(scene, layer.texture, PARALLAX.tileWidth, layer.height, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#b6b6b6');
    gradient.addColorStop(0.55, '#d4d4d4');
    gradient.addColorStop(1, '#efefef');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });
}

function cloudTexture(scene, layer) {
  makeCanvasTexture(scene, layer.texture, PARALLAX.tileWidth, layer.height, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    // Nuages doux et raccordables : tout amas qui dépasse à droite est redessiné à gauche.
    const puffs = [
      [160, 90, 150, 40], [430, 140, 110, 30], [700, 80, 180, 46],
      [980, 150, 120, 32], [1210, 100, 140, 38],
    ];
    // Flou léger : les nuages doivent se fondre dans le ciel, pas s'y découper.
    ctx.filter = 'blur(10px)';
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    for (const [cx, cy, rw, rh] of puffs) {
      for (const offset of [0, -w, w]) {
        ctx.beginPath();
        ctx.ellipse(cx + offset, cy, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + offset + rw * 0.45, cy - rh * 0.4, rw * 0.6, rh * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.filter = 'none';
  });
}

function monumentsTexture(scene, layer) {
  const w = PARALLAX.tileWidth;
  const h = layer.height;
  /*
   * Ligne d'horizon lointaine. Le pied des monuments est volontairement masqué
   * par la couche des immeubles : seul ce qui dépasse des toits (~280 px au-dessus
   * de la base de cette couche) est visible, donc chaque silhouette doit être
   * plus haute que ça pour se lire. Quatre monuments répartis tous les 320 px :
   * la tuile se raccorde sans coupure.
   */
  makeTexture(scene, layer.texture, w, h, (g) => {
    const base = h;
    const slot = w / 4;

    // Tour Eiffel
    const ex = slot * 0.5;
    g.fillStyle(GREY.lighter, 1);
    g.fillTriangle(ex - 95, base, ex + 95, base, ex, 10);
    // Évide le dessous des quatre piliers
    g.fillStyle(GREY.lightest, 0.75);
    g.fillTriangle(ex - 62, base, ex + 62, base, ex, base - 120);
    g.fillStyle(GREY.lighter, 1);
    g.fillRect(ex - 72, base - 128, 144, 14);
    g.fillRect(ex - 44, base - 240, 88, 11);
    g.fillRect(ex - 22, base - 330, 44, 8);

    // Arc de Triomphe
    const ax = slot * 1.5;
    g.fillStyle(GREY.lighter, 1);
    g.fillRect(ax - 100, base - 300, 200, 300);
    g.fillRect(ax - 114, base - 326, 228, 26);
    g.fillStyle(GREY.light, 0.5);
    g.fillRect(ax - 42, base - 210, 84, 210);

    // Notre-Dame : nef, deux tours, flèche
    const nx = slot * 2.5;
    g.fillStyle(GREY.lighter, 1);
    g.fillRect(nx - 120, base - 230, 240, 230);
    g.fillRect(nx - 112, base - 330, 66, 100);
    g.fillRect(nx + 46, base - 330, 66, 100);
    g.fillStyle(GREY.light, 0.55);
    g.fillRect(nx - 70, base - 190, 44, 190);
    g.fillRect(nx + 26, base - 190, 44, 190);
    g.fillStyle(GREY.lighter, 1);
    g.fillRect(nx - 8, base - 300, 16, 70);
    g.fillTriangle(nx - 16, base - 296, nx + 16, base - 296, nx, base - 380);

    // Sacré-Cœur, posé sur la butte Montmartre
    const sx = slot * 3.5;
    g.fillStyle(GREY.lightest, 0.5);
    g.fillTriangle(sx - 210, base, sx + 210, base, sx, base - 150);
    g.fillStyle(GREY.lighter, 1);
    g.fillRect(sx - 95, base - 250, 190, 160);
    g.fillCircle(sx, base - 262, 58);
    g.fillRect(sx - 8, base - 350, 16, 50);
    g.fillCircle(sx - 72, base - 248, 32);
    g.fillCircle(sx + 72, base - 248, 32);
  });
}

function buildingsTexture(scene, layer) {
  const w = PARALLAX.tileWidth;
  const h = layer.height;
  // Façades haussmanniennes : 5 travées de 256 px (1280 / 5) → raccord parfait.
  makeTexture(scene, layer.texture, w, h, (g) => {
    const bayWidth = w / 5;
    for (let i = 0; i < 5; i += 1) {
      const x = i * bayWidth;
      const facadeTop = 90 + (i % 3) * 22;
      const shade = [GREY.light, GREY.lighter, GREY.mid][i % 3];
      block(g, x, facadeTop, bayWidth - 4, h - facadeTop, shade);
      // Toit mansardé en zinc
      g.fillStyle(GREY.dark, 1);
      g.fillRect(x, facadeTop - 46, bayWidth - 4, 46);
      g.fillStyle(GREY.darkest, 0.5);
      g.fillRect(x + 22, facadeTop - 70, 16, 26);
      g.fillRect(x + bayWidth - 60, facadeTop - 66, 16, 22);
      // Fenêtres, 4 par étage
      const floors = Math.floor((h - facadeTop - 70) / 70);
      for (let f = 0; f < floors; f += 1) {
        const wy = facadeTop + 26 + f * 70;
        for (let c = 0; c < 4; c += 1) {
          const wx = x + 22 + c * ((bayWidth - 56) / 4);
          g.fillStyle(GREY.darkest, 0.62);
          g.fillRect(wx, wy, 34, 46);
          g.fillStyle(GREY.lightest, 0.18);
          g.fillRect(wx + 3, wy + 3, 12, 20);
        }
        // Balcons filants au 2e et au 5e
        if (f === 1 || f === 4) {
          g.fillStyle(GREY.darkest, 0.6);
          g.fillRect(x + 8, wy + 50, bayWidth - 20, 7);
        }
      }
    }
  });
}

function shopfrontsTexture(scene, layer) {
  const w = PARALLAX.tileWidth;
  const h = layer.height;
  // 8 devantures de 160 px → raccord parfait.
  makeTexture(scene, layer.texture, w, h, (g) => {
    const unit = w / 8;
    for (let i = 0; i < 8; i += 1) {
      const x = i * unit;
      block(g, x, 0, unit - 3, h, i % 2 ? GREY.light : GREY.mid);
      // Vitrine
      g.fillStyle(GREY.darkest, 0.55);
      g.fillRect(x + 18, h - 110, unit - 42, 92);
      g.fillStyle(GREY.lightest, 0.14);
      g.fillRect(x + 24, h - 104, 26, 44);
      // Store / enseigne
      g.fillStyle(GREY.light, 1);
      g.fillRect(x + 10, h - 132, unit - 26, 20);
    }
  });
}

function streetTexture(scene, layer) {
  const w = PARALLAX.tileWidth;
  const h = layer.height;
  // Trottoir pavé + bordure + chaussée. Le haut de la texture = la ligne de sol.
  makeTexture(scene, layer.texture, w, h, (g) => {
    const sidewalk = WORLD.sidewalkHeight;
    g.fillStyle(GREY.lighter, 1);
    g.fillRect(0, 0, w, sidewalk);
    // Pavés : 40 px de large (1280 / 32), 20 px de haut
    const paveW = 40;
    const paveH = 20;
    for (let row = 0; row * paveH < sidewalk; row += 1) {
      const offset = (row % 2) * (paveW / 2);
      for (let x = -paveW; x < w + paveW; x += paveW) {
        g.fillStyle(row % 2 ? GREY.light : GREY.lighter, 1);
        g.fillRect(x + offset, row * paveH, paveW - 2, paveH - 2);
      }
    }
    // Bordure de trottoir
    g.fillStyle(GREY.mid, 1);
    g.fillRect(0, sidewalk, w, 10);
    g.fillStyle(GREY.darkest, 0.4);
    g.fillRect(0, sidewalk + 10, w, 4);
    // Chaussée + bande centrale
    g.fillStyle(GREY.dark, 1);
    g.fillRect(0, sidewalk + 14, w, h - sidewalk - 14);
    g.fillStyle(GREY.lighter, 0.55);
    for (let x = 0; x < w; x += 160) {
      g.fillRect(x, sidewalk + 48, 80, 6);
    }
  });
}

function foregroundTexture(scene, layer) {
  const w = PARALLAX.tileWidth;
  const h = layer.height;
  // Masses sombres et floues qui filent au premier plan.
  makeCanvasTexture(scene, layer.texture, w, h, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.filter = 'blur(6px)';
    ctx.fillStyle = 'rgba(40,40,40,0.9)';
    const blobs = [[90, 54], [360, 70], [640, 46], [910, 64], [1180, 52]];
    for (const [cx, cw] of blobs) {
      for (const offset of [0, -width, width]) {
        ctx.beginPath();
        ctx.ellipse(cx + offset, height, cw, height * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.filter = 'none';
  });
}

function parallaxTextures(scene) {
  for (const layer of PARALLAX.layers) {
    switch (layer.key) {
      case 'ciel': skyTexture(scene, layer); break;
      case 'nuages': cloudTexture(scene, layer); break;
      case 'monuments': monumentsTexture(scene, layer); break;
      case 'immeubles': buildingsTexture(scene, layer); break;
      case 'devantures': shopfrontsTexture(scene, layer); break;
      case 'rue': streetTexture(scene, layer); break;
      case 'premierPlan': foregroundTexture(scene, layer); break;
      default:
        // Couche inconnue : bande grise neutre, aux bonnes dimensions.
        makeTexture(scene, layer.texture, PARALLAX.tileWidth, layer.height, (g) => {
          block(g, 0, 0, PARALLAX.tileWidth, layer.height, GREY.mid);
        });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Sprites                                                            */
/* ------------------------------------------------------------------ */

function playerTextures(scene) {
  const run = PLAYER.run;
  makeTexture(scene, 'player-run', run.width, run.height, (g) => {
    block(g, 0, 0, run.width, run.height, GREY.lightest);
    // Repères de silhouette : tête, torse, jambes (lecture des proportions).
    g.fillStyle(GREY.dark, 0.45);
    g.fillRect(0, 0, run.width, 24);
    g.fillRect(0, 62, run.width, 3);
    g.fillRect(run.width / 2 - 2, 65, 4, run.height - 65);
  });

  const slide = PLAYER.slide;
  makeTexture(scene, 'player-slide', slide.width, slide.height, (g) => {
    block(g, 0, 0, slide.width, slide.height, GREY.lightest);
    g.fillStyle(GREY.dark, 0.45);
    g.fillRect(slide.width - 26, 0, 26, slide.height);
  });
}

function obstacleTextures(scene) {
  for (const [key, def] of Object.entries(OBSTACLES)) {
    const shade = def.slot === 'ground' ? GREY.light : GREY.lighter;
    makeTexture(scene, `obstacle-${key}`, def.width, def.height, (g) => {
      block(g, 0, 0, def.width, def.height, shade);
      // Marque le sens de déplacement (vers la gauche).
      g.fillStyle(GREY.darkest, 0.35);
      g.fillTriangle(6, def.height / 2, 20, def.height / 2 - 8, 20, def.height / 2 + 8);
    });
  }
}

function coinTexture(scene) {
  const size = COINS.size;
  makeTexture(scene, 'coin', size, size, (g) => {
    g.fillStyle(GREY.lightest, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 1);
    g.lineStyle(2, GREY.dark, 0.7);
    g.strokeCircle(size / 2, size / 2, size / 2 - 2);
    g.fillStyle(GREY.mid, 0.7);
    g.fillCircle(size / 2, size / 2, size / 5);
  });
}

function particleTexture(scene) {
  makeTexture(scene, 'particule', 8, 8, (g) => {
    g.fillStyle(GREY.lightest, 1);
    g.fillRect(0, 0, 8, 8);
  });
}

function shadowTexture(scene) {
  makeCanvasTexture(scene, 'ombre', 128, 32, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0.45)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Point d'entrée : génère tous les placeholders manquants. */
export function createPlaceholders(scene) {
  parallaxTextures(scene);
  playerTextures(scene);
  obstacleTextures(scene);
  coinTexture(scene);
  particleTexture(scene);
  shadowTexture(scene);

  if (GAME.debug) {
    console.info('[placeholders] textures générées :', scene.textures.getTextureKeys().length);
  }
}
