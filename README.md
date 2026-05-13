# Flybot React (3D isométrique pixel art)

Version React du jeu Flybot, jouable dans le navigateur.

## Fonctionnalités
- Rendu isométrique pixel art coloré sur canvas.
- Papillon poussé par le vent avec inertie.
- Contrôle vertical souris + tactile.
- Obstacles, score, et bonus : Fleur / Soleil / Abeille.

## Déployer sur GitHub (GitHub Pages)

### 1) Pousser le projet sur GitHub
```bash
git init
git add .
git commit -m "Initial Flybot"
git branch -M main
git remote add origin https://github.com/<ton-user>/<ton-repo>.git
git push -u origin main
```

### 2) Activer GitHub Pages
1. Ouvre ton dépôt GitHub.
2. Va dans **Settings > Pages**.
3. Dans **Build and deployment**, choisis **Source: GitHub Actions**.

### 3) Déploiement automatique
Le workflow `.github/workflows/deploy-pages.yml` déploie automatiquement le site à chaque push sur `main`.
Tu peux aussi le lancer manuellement depuis l’onglet **Actions**.

### 4) Récupérer l’URL
Après un run réussi, l’URL publique est visible dans le job **Deploy to GitHub Pages**.
Format habituel : `https://<ton-user>.github.io/<ton-repo>/`

## Tester en local
Ouvrir `index.html` dans un navigateur (connexion internet requise pour charger React/Babel via CDN).
