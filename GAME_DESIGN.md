# Paris Runner — Game Design Document

> Cahier des charges de référence. Toute décision de code ou de design doit être cohérente avec ce document. En cas de doute, demander plutôt que supposer.

## 1. Pitch

Un endless runner dans les rues de Paris. Le joueur court sur les pavés et esquive ce que la ville lui envoie : voitures, vélos, trottinettes, piétons, pigeons, rats, mobilier urbain. La vitesse augmente avec le temps. L'objectif est d'aller le plus loin possible et de battre son record.

**Promesse visuelle :** un Paris crédible et réaliste, pas une carte postale cartoon.

## 2. Plateformes et cibles

- **Cible principale :** smartphone en mode paysage (iOS Safari, Android Chrome).
- **Cible secondaire :** navigateur desktop au clavier.
- **Distribution :** web via GitHub Pages, installable en PWA (ajout à l'écran d'accueil, plein écran).
- **Performance :** 60 fps stables sur un smartphone milieu de gamme récent. Pas de chute sous 50 fps en pleine partie.

## 3. Contrôles

| Action | Mobile | Clavier |
|---|---|---|
| Saut | Tap moitié droite de l'écran (ou swipe haut) | Espace / Flèche haut / W |
| Double saut | Second tap en l'air | Seconde pression en l'air |
| Glissade | Tap moitié gauche (ou swipe bas) | Flèche bas / S |
| Pause | Bouton pause en haut | Échap / P |

- Les zones tactiles doivent être larges et pardonnantes.
- Retour visuel immédiat à chaque input (aucune latence perceptible).
- Saut à hauteur variable : un appui long donne un saut plus haut (à valider en test).

## 4. Mécaniques de jeu

### Course
- Défilement horizontal automatique de droite à gauche.
- Vitesse initiale modérée, puis augmentation progressive par paliers ou de façon continue (à calibrer), avec un plafond.
- Score = distance parcourue + pièces ramassées.

### Mouvements du personnage
- **Saut** : arc avec gravité réaliste, pas flottant.
- **Double saut** : un seul par saut, se recharge au contact du sol.
- **Glissade** : hitbox réduite en hauteur pendant une durée courte, pour passer sous les obstacles aériens.

### Collisions
- Hitboxes plus petites que les sprites (environ 80 %) pour un ressenti juste.
- Une collision avec un obstacle = game over (v1). Système de vies ou de bouclier possible plus tard.
- Exception, les toits : on peut atterrir sur le dessus des voitures, des camionnettes et des abribus en arrivant par le haut. Y atterrir recharge le double saut. Les percuter de face reste un game over.

### Pièces
- Pièces dorées animées, placées en lignes ou en arcs qui suivent les trajectoires de saut.
- Elles incitent à prendre des risques (pièces placées près des obstacles).

### Record
- Meilleur score sauvegardé localement (localStorage, encapsulé dans un try/catch).
- Affiché sur l'écran d'accueil et à l'écran de game over, avec un message « Nouveau record ! » le cas échéant.

## 5. Obstacles

Chaque obstacle a un comportement propre. La variété des comportements compte plus que le nombre d'obstacles.

| Obstacle | Position | Comportement | Esquive |
|---|---|---|---|
| Voiture | Sol | Arrive plus vite que le décor, peut freiner brusquement | Saut / double saut, ou atterrir sur le toit |
| Vélo | Sol | Rapide, trajectoire droite | Saut |
| Trottinette électrique | Sol | Accélérations irrégulières | Saut |
| Piéton | Sol | Marche erratique, peut s'arrêter ou changer de sens | Saut |
| Pigeon | Air bas ou air haut (2 hauteurs) | S'envole au passage, battements d'ailes | Glissade (bas) / rester au sol (haut) |
| Rat | Sol, petit | Traverse rapidement | Petit saut |
| Mobilier urbain | Sol, fixe | Bancs, potelets, poubelles, colonnes Morris, barrières | Saut ou glissade selon la hauteur |
| Abribus | Sol, fixe, haut et long | Plateforme : des pièces sont posées sur le toit | Monter dessus (saut) ou le franchir en double saut |
| Échafaudage / auvent | Aérien, fixe | Barre horizontale | Glissade |

### Génération
- Pool d'objets réutilisés (object pooling), pas d'allocation en pleine partie.
- Difficulté progressive : obstacles simples au début, combinaisons (sol + aérien) ensuite.
- Règle d'équité : toujours une solution possible. Jamais deux obstacles impossibles à enchaîner à la vitesse courante.

## 6. Direction artistique

### Principes
- **Réalisme dessiné / peint.** Aucun emoji, aucun style flat, cartoon ou vectoriel simpliste.
- Lumière crédible : ombres portées au sol, dégradés de ciel, perspective atmosphérique (les plans lointains sont plus clairs et désaturés).
- Palette parisienne : pierre de taille crème, zinc gris-bleu des toits, ardoise, vert bouteille des bancs et kiosques, ferronnerie noire.

### Parallaxe (du plus lointain au plus proche)
1. **Ciel** : dégradé et nuages lents.
2. **Monuments lointains** : tour Eiffel, Arc de Triomphe, Notre-Dame, Sacré-Cœur, en silhouettes atmosphériques.
3. **Immeubles haussmanniens** : façades en pierre, balcons filants aux 2e et 5e étages, toits mansardés en zinc, cheminées, devantures de cafés et de boutiques au rez-de-chaussée.
4. **Rue / trottoir** : pavés, bordures, réverbères, arbres d'alignement.
5. **Premier plan** (optionnel) : éléments flous qui passent vite pour la profondeur.

### Personnage
- Coureur parisien crédible, proportions réalistes.
- Animations : course (cycle fluide), saut, double saut (variation visible), glissade, chute au game over.

### Pipeline d'assets
- **Décision à trancher :** assets en images (peints ou générés) vs dessinés par le code. Par défaut, l'architecture doit supporter des images (spritesheets et textures de parallaxe en boucle).
- Phase 1 : placeholders (rectangles gris aux bonnes dimensions) pour valider le gameplay.
- Phase 2 : remplacement couche par couche par les visuels définitifs.
- Conventions :
  - `assets/sprites/<nom>.png` + données d'atlas si spritesheet
  - `assets/backgrounds/<couche>.png` : textures horizontalement raccordables (tileable)
  - Fournir les assets en @2x pour les écrans haute densité
  - Formats web optimisés (PNG pour la transparence, WebP si possible)

## 7. Écrans et flux

1. **Chargement** : barre de progression pendant le préchargement des assets.
2. **Accueil** : titre, record, bouton Jouer, rappel des contrôles adapté à l'appareil.
3. **Jeu** : HUD minimal (score, pièces, pause).
4. **Pause** : reprendre / quitter.
5. **Game over** : score, record, rejouer en un tap.
6. **Orientation** : si l'appareil est en portrait, afficher un message pour tourner l'écran.

## 8. Audio (v2)

Hors périmètre de la v1, mais l'architecture doit prévoir un gestionnaire audio : ambiance de rue, pas, saut, pièce, collision. Bouton muet.

## 9. Technique

- **Stack** : Vite + Phaser 3, JavaScript (ou TypeScript si justifié).
- **Scènes** : Boot (préchargement), Menu, Game, GameOver.
- **Mise à l'échelle** : Phaser Scale Manager, mode FIT avec résolution de référence en 16:9, rendu net sur écrans Retina.
- **Déploiement** : GitHub Actions → GitHub Pages à chaque push sur `main`.
- **PWA** : manifest, icônes, service worker simple pour le cache des assets, `display: fullscreen`, `orientation: landscape`.
- **Configuration centralisée** : toutes les valeurs de gameplay (gravité, vitesses, fréquences de spawn, hitboxes) dans un seul fichier `src/config.js`, pour faciliter l'équilibrage.

### Arborescence cible
```
paris-runner/
├── CLAUDE.md
├── GAME_DESIGN.md
├── index.html
├── public/
│   ├── manifest.webmanifest
│   └── icons/
├── assets/
│   ├── sprites/
│   └── backgrounds/
├── src/
│   ├── main.js
│   ├── config.js
│   ├── scenes/
│   ├── entities/
│   └── systems/
├── reference/          # ancien prototype, lecture seule
└── .github/workflows/
```

### Statistiques d'utilisation
- GoatCounter, sans cookie ni identifiant de visiteur : pages vues et événements anonymes (partie lancée, fin de partie par tranche de score, record battu).
- Désactivé en local, en mode debug, et tant qu'aucun code de site n'est renseigné dans `src/config.js`.

## 10. Hors périmètre v1

Classement en ligne, comptes utilisateurs, boutique, publicité, multijoueur, niveaux scénarisés.

## 11. Feuille de route

- [ ] **Étape 1** : socle technique (Vite, Phaser, scènes, déploiement Pages)
- [ ] **Étape 2** : gameplay complet avec placeholders, testé sur mobile
- [ ] **Étape 3** : PWA et finitions mobiles
- [ ] **Étape 4** : visuels définitifs, couche par couche (ciel → monuments → immeubles → rue → personnage → obstacles)
- [ ] **Étape 5** : équilibrage et polish (effets, transitions, feedbacks)
- [ ] **Étape 6** : audio
