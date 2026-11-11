# Paris Runner

Endless runner dans les rues de Paris. Vite + Phaser 3.

Cahier des charges : [GAME_DESIGN.md](GAME_DESIGN.md) · Règles de contribution : [CLAUDE.md](CLAUDE.md)

## État

Étapes 1 et 2 de la feuille de route : socle technique et gameplay complet,
avec des **placeholders gris** à la place des visuels définitifs.

En place : scènes Boot / Menu / Jeu / Pause / Game over, parallaxe à sept
couches, saut, saut à hauteur variable, double saut, glissade, quinze types
d'obstacles avec comportements propres, pièces en lignes et en arcs, record
sauvegardé localement, déploiement automatique sur GitHub Pages.

## Développement

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

Ajoutez `?debug=1` à l'URL pour afficher les hitboxes, le compteur de fps et la
vitesse courante — c'est le moyen le plus simple de vérifier le rendu sur un
vrai téléphone.

## Commandes

| Action | Mobile | Clavier |
|---|---|---|
| Saut | Tap à droite, ou swipe vers le haut | Espace / Haut / W |
| Double saut | Second tap en l'air | Seconde pression en l'air |
| Glissade | Tap à gauche, ou swipe vers le bas | Bas / S |
| Pause | Bouton en haut à droite | Échap / P |

Un appui court donne un saut plus bas qu'un appui maintenu.

## Organisation

```
src/
├── config.js            toutes les valeurs de gameplay, et rien d'autre
├── main.js              configuration Phaser et mise à l'échelle
├── scenes/              Boot, Menu, Game, Pause, GameOver
├── entities/            Player, Obstacle, Coin
└── systems/             parallaxe, spawners, pool, comportements,
                         commandes, placeholders, sauvegarde, UI
reference/               ancien prototype, en lecture seule
```

Pour équilibrer le jeu, on ne touche qu'à `src/config.js` : gravité, vitesses,
hitboxes, fréquences d'apparition, planchers d'équité, couches de parallaxe.

## Visuels

Phase 1 : tous les visuels sont des placeholders gris générés par code dans
`src/systems/placeholders.js`, aux dimensions exactes des futurs assets.

Phase 2 : il suffira de remplir le tableau `ASSETS` de `src/scenes/BootScene.js`.
Les placeholders ne sont générés que pour les clés absentes, donc une texture
chargée remplace automatiquement la sienne — couche par couche, sans toucher au
gameplay.

## Déploiement

Chaque push sur `main` déclenche [le workflow Pages](.github/workflows/deploy.yml).
Le chemin de base est défini par `base` dans `vite.config.js` et doit
correspondre au nom du dépôt.
