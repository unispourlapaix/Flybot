# Flybot — 3D isométrique zen

Expérience **3D isométrique zen** avec un jardin alpin, ciel pastel, lac calme et ambiance printemps fleuri.

## Nouveautés
- Version navigateur **sans React, sans JSX et sans Babel** : moteur isolé dans `game.js` pour éviter les erreurs de parsing HTML/JavaScript au chargement.
- Script volontairement compatible ES5-ish (fonctions classiques, pas de JSX/React) pour réduire les erreurs de syntaxe navigateur.
- Favicon intégré en data URI pour éviter le 404 `/favicon.ico` sur GitHub Pages.
- Déploiement Pages validé par `npm test` avant publication, avec version visible dans l’interface, cache HTML désactivé et URL versionnée `game.js?v=...` pour éviter de servir un ancien moteur.
- Plateau isométrique uni et relaxant (sans quadrillage), avec relief doux, sentier organique et petit lac pastel.
- **Mode Zen** : moins d’obstacles, vitesse plus douce, lecture plus relax.
- Ambiance visuelle plus relaxante : ciel pastel, soleil doux, nuages lents et fleurs alpines.

## Vérification
Avant de publier, lancer :

```bash
npm test
```

Ce test vérifie les scripts JavaScript locaux et inline sans supprimer de fonctions de gameplay : il détecte les erreurs de syntaxe et refuse le retour de React/JSX/Babel.
- Forêt latérale animée (gauche/droite) avec arbres stylisés en couches géométriques.
- Animations des arbres et fleurs recalées sur la grille isométrique du sol (cohérence perspective).
- Montagnes recalées sur la perspective du sol isométrique, avec palette plus verte/printanière (moins grise).
- Gameplay conservé : vent, inertie, obstacles et bonus (`Fleur`, `Soleil`, `Abeille`).
- Papillon redessiné style monarque (orange/noir, points blancs), plus fidèle visuellement et cohérent avec la perspective isométrique.
- **Mode Cool** : moins d’obstacles, vitesse plus douce, lecture plus relax.

## Contrôles
- Souris/tactile vertical pour guider le papillon.

## Déploiement
GitHub Pages via `.github/workflows/deploy-pages.yml`.
