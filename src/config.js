/**
 * Paris Runner — configuration centralisée.
 *
 * TOUTES les valeurs de gameplay vivent ici (cf. CLAUDE.md et GAME_DESIGN.md §9).
 * Rien de chiffré en dur dans les scènes ou les entités : pour équilibrer le jeu,
 * on ne touche qu'à ce fichier.
 *
 * Unités : pixels et secondes dans la résolution de référence 1280×720 (16:9).
 * Les vitesses sont en px/s, les accélérations en px/s², les durées en ms.
 */

/** Résolution de référence et rendu. */
export const GAME = {
  width: 1280,
  height: 720,
  backgroundColor: '#0e1420',
  /** Limite de densité de pixels prise en compte (évite de rendre en 3x inutilement). */
  maxPixelRatio: 2,
  targetFps: 60,
  /** Affiche les hitboxes et un compteur de fps (?debug=1 dans l'URL le force aussi). */
  debug: false,
};

/** Le monde : sol, gravité, repères verticaux. */
export const WORLD = {
  gravity: 2800,
  /** Ligne de contact des pieds du coureur (haut du trottoir). */
  groundY: 600,
  /** Épaisseur du trottoir dessiné sous la ligne de sol. */
  sidewalkHeight: 40,
  /** Hauteur de la chaussée visible sous le trottoir. */
  roadHeight: 80,
  /** Marge à droite de l'écran où les éléments apparaissent. */
  spawnMargin: 220,
  /** Marge à gauche au-delà de laquelle on recycle les éléments. */
  despawnMargin: 320,
};

/** La course : vitesse, montée en difficulté, score. */
export const RUN = {
  speedStart: 420,
  speedMax: 1000,
  /** Gain de vitesse par seconde (montée continue). */
  speedRamp: 9,
  /** Durée (s) au bout de laquelle la difficulté est considérée comme maximale. */
  difficultyRampSeconds: 75,
  /** Points par pixel parcouru. */
  scorePerPixel: 0.1,
  /** Points par pièce. */
  coinScore: 10,
  /** Délai (ms) avant que les commandes répondent au début d'une partie. */
  startDelay: 350,
};

/** Le coureur. */
export const PLAYER = {
  /** Position horizontale fixe à l'écran. */
  x: 240,
  /** Dimensions du sprite debout / en glissade (les placeholders les reprennent). */
  run: { width: 54, height: 108 },
  slide: { width: 82, height: 54 },
  /** Hitbox = ~80 % du sprite (GAME_DESIGN.md §4). */
  hitboxScale: 0.8,

  /** Saut. */
  jumpVelocity: -980,
  doubleJumpVelocity: -840,
  maxJumps: 2,
  /**
   * Saut à hauteur variable : si la touche est relâchée alors que le coureur
   * monte encore plus vite que cette valeur, la montée est coupée net.
   */
  jumpCutVelocity: -400,
  /** Tolérance (ms) pour sauter juste après avoir quitté le sol. */
  coyoteTime: 90,
  /** Tolérance (ms) : un saut demandé juste avant l'atterrissage est mémorisé. */
  jumpBufferTime: 130,

  /** Glissade. */
  slideDuration: 500,
  slideCooldown: 140,
  /** Une glissade demandée en l'air accélère la chute. */
  slideFastFallVelocity: 900,

  /**
   * Animation des placeholders (sera remplacée par les spritesheets).
   * On incline le sprite au lieu de le redimensionner : la hitbox d'Arcade est
   * un AABB qui ignore la rotation, donc le cycle de course ne la fait pas vibrer.
   */
  runTiltAmplitude: 2.5,
  runTiltSpeed: 14,
  /** Rotation (deg) du placeholder pendant le double saut, pour un retour visible. */
  doubleJumpSpin: -360,
  doubleJumpSpinDuration: 420,
};

/** Zones et seuils des commandes. */
export const INPUT = {
  /** Le tap sur cette fraction gauche de l'écran déclenche la glissade. */
  slideZoneRatio: 0.45,
  /** Distance (px) minimale d'un swipe pour être pris en compte. */
  swipeThreshold: 48,
  /** Durée (ms) maximale d'un swipe. */
  swipeMaxDuration: 350,
};

/**
 * Catalogue des obstacles.
 *
 * - `slot`      : 'ground' (sol), 'airLow' (aérien bas, à passer en glissade),
 *                 'airHigh' (aérien haut, à passer en restant au sol).
 * - `bottom`    : hauteur du bas de l'obstacle au-dessus du sol (slots aériens).
 * - `avoid`     : esquive attendue, utilisé par les règles d'équité.
 * - `speedMul`  : vitesse propre, en multiple de la vitesse de course.
 * - `minProgress` : difficulté (0 → 1) à partir de laquelle l'obstacle apparaît.
 * - `weight`    : poids dans le tirage aléatoire.
 * - `behaviour` : comportement appliqué chaque frame (voir systems/behaviours.js).
 */
export const OBSTACLES = {
  voiture: {
    label: 'Voiture', slot: 'ground', width: 190, height: 80,
    avoid: 'jump', speedMul: 1.35, minProgress: 0, weight: 10,
    behaviour: 'car',
    /** Freinage brusque : probabilité, décélération, durée (ms). */
    brakeChance: 0.35, brakeSpeedMul: 0.55, brakeDuration: 700,
  },
  camionnette: {
    label: 'Camionnette', slot: 'ground', width: 215, height: 95,
    avoid: 'jump', speedMul: 1.2, minProgress: 0.3, weight: 5,
    behaviour: 'car', brakeChance: 0.25, brakeSpeedMul: 0.6, brakeDuration: 800,
  },
  velo: {
    label: 'Vélo', slot: 'ground', width: 90, height: 92,
    avoid: 'jump', speedMul: 1.5, minProgress: 0.1, weight: 8,
    behaviour: 'straight',
  },
  trottinette: {
    label: 'Trottinette', slot: 'ground', width: 46, height: 96,
    avoid: 'jump', speedMul: 1.25, minProgress: 0.2, weight: 7,
    behaviour: 'scooter',
    /** Accélérations irrégulières : amplitude (en multiple de vitesse) et période (ms). */
    surgeAmplitude: 0.3, surgePeriod: 900,
  },
  pieton: {
    label: 'Piéton', slot: 'ground', width: 48, height: 112,
    avoid: 'jump', speedMul: 1.0, minProgress: 0, weight: 8,
    behaviour: 'pedestrian',
    /** Marche erratique : chance de s'arrêter / de repartir, vitesse propre. */
    wanderSpeed: 90, stopChance: 0.4, stopDuration: 600, turnChance: 0.35,
  },
  pigeonBas: {
    label: 'Pigeon', slot: 'airLow', width: 62, height: 40, bottom: 66,
    avoid: 'slide', speedMul: 1.1, minProgress: 0.15, weight: 7,
    behaviour: 'pigeon',
    /** Oscillation du vol, puis envol au passage du coureur. */
    bobAmplitude: 10, bobSpeed: 5, flyAwayDistance: 220, flyAwaySpeed: -320,
  },
  pigeonHaut: {
    label: 'Pigeon haut', slot: 'airHigh', width: 62, height: 40, bottom: 150,
    avoid: 'stay', speedMul: 1.1, minProgress: 0.25, weight: 5,
    behaviour: 'pigeon',
    bobAmplitude: 12, bobSpeed: 4.5, flyAwayDistance: 180, flyAwaySpeed: -260,
  },
  rat: {
    label: 'Rat', slot: 'ground', width: 56, height: 30,
    avoid: 'jump', speedMul: 1.8, minProgress: 0.1, weight: 6,
    behaviour: 'straight',
  },
  banc: {
    label: 'Banc', slot: 'ground', width: 110, height: 60,
    avoid: 'jump', speedMul: 1, minProgress: 0, weight: 6, behaviour: 'static',
  },
  potelet: {
    label: 'Potelet', slot: 'ground', width: 22, height: 80,
    avoid: 'jump', speedMul: 1, minProgress: 0, weight: 5, behaviour: 'static',
  },
  poubelle: {
    label: 'Poubelle', slot: 'ground', width: 60, height: 92,
    avoid: 'jump', speedMul: 1, minProgress: 0.1, weight: 5, behaviour: 'static',
  },
  colonneMorris: {
    label: 'Colonne Morris', slot: 'ground', width: 70, height: 130,
    avoid: 'jump', speedMul: 1, minProgress: 0.35, weight: 4, behaviour: 'static',
  },
  barriere: {
    label: 'Barrière', slot: 'ground', width: 124, height: 70,
    avoid: 'jump', speedMul: 1, minProgress: 0.2, weight: 5, behaviour: 'static',
  },
  echafaudage: {
    label: 'Échafaudage', slot: 'airLow', width: 150, height: 44, bottom: 64,
    avoid: 'slide', speedMul: 1, minProgress: 0.3, weight: 6, behaviour: 'static',
  },
  auvent: {
    label: 'Auvent', slot: 'airLow', width: 118, height: 36, bottom: 70,
    avoid: 'slide', speedMul: 1, minProgress: 0.2, weight: 5, behaviour: 'static',
  },
};

/**
 * Génération des obstacles.
 *
 * Les écarts sont exprimés en secondes et convertis en pixels à la vitesse
 * courante : la difficulté monte sans jamais rendre une combinaison injouable
 * (règle d'équité, GAME_DESIGN.md §5).
 */
export const SPAWN = {
  /** Écart entre deux motifs : du plus large (début) au plus serré (fin). */
  patternGapTime: { start: 1.5, end: 0.85 },
  /** Variation aléatoire appliquée à l'écart entre motifs. */
  patternGapJitter: 0.22,

  /**
   * Planchers d'équité, en secondes, entre deux obstacles d'un même motif.
   * Clés : `<esquive précédente>-<esquive suivante>`.
   * Un saut dure ~0,7 s et une glissade 0,5 s : il faut avoir atterri avant
   * de devoir glisser, et s'être relevé avant de devoir sauter.
   */
  minGapTime: {
    default: 0.45,
    'jump-jump': 0.42,
    'jump-slide': 0.9,
    'slide-jump': 0.72,
    'slide-slide': 0.6,
    'jump-stay': 0.85,
    'stay-jump': 0.3,
  },

  /** Taille maximale du pool d'obstacles réutilisés (aucune allocation en jeu). */
  poolSize: 24,

  /** Motifs. `dt` = retard en secondes par rapport au premier élément du motif. */
  patterns: [
    { id: 'simple', minProgress: 0, weight: 14, parts: [{ slot: 'any', dt: 0 }] },
    { id: 'duo-sol', minProgress: 0.15, weight: 6,
      parts: [{ slot: 'ground', dt: 0 }, { slot: 'ground', dt: 0.45 }] },
    { id: 'sol-aerien', minProgress: 0.3, weight: 5,
      parts: [{ slot: 'ground', dt: 0 }, { slot: 'airLow', dt: 0.95 }] },
    { id: 'aerien-sol', minProgress: 0.35, weight: 4,
      parts: [{ slot: 'airLow', dt: 0 }, { slot: 'ground', dt: 0.78 }] },
    { id: 'haut-bas', minProgress: 0.45, weight: 3,
      parts: [{ slot: 'airHigh', dt: 0 }, { slot: 'ground', dt: 0.55 }] },
    { id: 'trio', minProgress: 0.65, weight: 3,
      parts: [{ slot: 'ground', dt: 0 }, { slot: 'ground', dt: 0.42 }, { slot: 'airLow', dt: 1.35 }] },
  ],
};

/** Les pièces. */
export const COINS = {
  size: 34,
  hitboxScale: 0.95,
  poolSize: 40,
  /** Écart entre deux groupes de pièces (s). */
  gapTime: { start: 2.6, end: 1.7 },
  gapJitter: 0.3,
  /** Espacement horizontal (s) entre deux pièces d'un même groupe. */
  spacingTime: 0.14,
  /** Nombre de pièces par groupe. */
  count: { min: 3, max: 6 },
  /** Hauteurs possibles au-dessus du sol pour une ligne droite. */
  lineHeights: [70, 140, 215],
  /** Arc : hauteur au sommet, pour suivre une trajectoire de saut. */
  arcHeight: { min: 120, max: 210 },
  arcBase: 60,
  /** Probabilité de tirer un arc plutôt qu'une ligne. */
  arcChance: 0.55,
  /** Rotation (deg/s) du placeholder, en attendant les pièces animées. */
  spinSpeed: 180,
};

/**
 * Parallaxe, du plus lointain au plus proche (GAME_DESIGN.md §6).
 *
 * `speedMul` est la fraction de la vitesse de course appliquée à la couche,
 * `ownSpeed` une vitesse propre qui défile même à l'arrêt (les nuages).
 *
 * Chaque couche s'arrête à la ligne d'horizon (y = WORLD.groundY) ou à la
 * couche qui la recouvre : on ne paie pas de fill rate pour des pixels
 * invisibles, ce qui compte sur un GPU mobile.
 * `tint`/`alpha` simulent la perspective atmosphérique sur les placeholders :
 * plus c'est loin, plus c'est clair et désaturé.
 *
 * `texture` est la clé Phaser de la couche. Les placeholders sont générés aux
 * mêmes dimensions que les futures textures `assets/backgrounds/<couche>.png`,
 * raccordables horizontalement : le remplacement se fera couche par couche sans
 * toucher à ce fichier.
 */
export const PARALLAX = {
  layers: [
    { key: 'ciel',       texture: 'bg-ciel',       speedMul: 0.02, y: 0,   height: 600, tint: 0xdfe8f2, alpha: 1 },
    { key: 'nuages',     texture: 'bg-nuages',     speedMul: 0.02, y: 0,   height: 300, tint: 0xffffff, alpha: 0.5, ownSpeed: 8 },
    // Les monuments doivent dépasser des toits : couche haute et silhouettes hautes.
    { key: 'monuments',  texture: 'bg-monuments',  speedMul: 0.06, y: 50,  height: 400, tint: 0xdfe5ea, alpha: 0.8 },
    { key: 'immeubles',  texture: 'bg-immeubles',  speedMul: 0.2,  y: 120, height: 480, tint: 0xd9d5cc, alpha: 1 },
    { key: 'devantures', texture: 'bg-devantures', speedMul: 0.45, y: 420, height: 180, tint: 0xc3bfb6, alpha: 1 },
    { key: 'rue',        texture: 'bg-rue',        speedMul: 1,    y: 600, height: 120, tint: 0xd2cec6, alpha: 1 },
    { key: 'premierPlan', texture: 'bg-premier-plan', speedMul: 1.6, y: 640, height: 80, tint: 0x7c7a74, alpha: 0.7 },
  ],
  /** Largeur des tuiles générées pour les placeholders (raccordables). */
  tileWidth: 1280,
};

/** Interface : HUD, menus. */
export const UI = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  colors: {
    text: '#e8e2d6',
    textDim: '#a8a194',
    gold: '#d8b25a',
    stone: '#cfc6b4',
    panel: 0x0e1420,
    panelAlpha: 0.88,
    accent: '#8f2f28',
  },
  hud: { margin: 24, fontSize: 28, labelSize: 16 },
  /** Durée (ms) du fondu entre les scènes. */
  fadeDuration: 240,
};

/** Sauvegarde locale. */
export const STORAGE = {
  highScoreKey: 'parisRunner.highScore',
  coinsKey: 'parisRunner.totalCoins',
};
