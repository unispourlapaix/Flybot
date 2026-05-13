# Flybot React (3D isométrique pixel art)

Version React du jeu Flybot, jouable dans le navigateur.

## Fonctionnalités
- Rendu isométrique pixel art coloré sur canvas.
- Papillon poussé par le vent avec inertie.
- Contrôle vertical souris + tactile.
- Obstacles, score, et bonus : Fleur / Soleil / Abeille.

## Déploiement automatique GitHub Pages (prêt à l’emploi)
Le workflow `.github/workflows/deploy-pages.yml` publie automatiquement le jeu à chaque push sur `main`.

### Activer GitHub Pages
1. Pousse le dépôt sur GitHub.
2. Va dans **Settings > Pages**.
3. Dans **Build and deployment**, choisis **Source: GitHub Actions**.
4. Push sur `main` (ou lance le workflow manuellement depuis l’onglet **Actions**).
5. L’URL sera affichée dans le job `Deploy to GitHub Pages`.

## Tester en ligne (sans setup)
### Option A — Netlify Drop
1. Va sur https://app.netlify.com/drop
2. Glisse-dépose le dossier du projet (ou zip).
3. Récupère l’URL publique.

### Option B — Vercel
1. Pousse le repo sur GitHub.
2. Va sur https://vercel.com/new
3. Importe le repo puis clique **Deploy**.

## Tester en local
Ouvrir `index.html` dans un navigateur (connexion internet requise pour charger React/Babel via CDN).
