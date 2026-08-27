# Suivi ESP — Suivi réglementaire des équipements sous pression

Outil web de suivi réglementaire des équipements sous pression (ESP), conçu pour aider les
équipes HSE, maintenance et direction à respecter les obligations de l'**arrêté du 20/11/2017
relatif au suivi en service des équipements sous pression** (inspections périodiques,
requalifications périodiques, contrôle DREAL).

## Objectif du projet

- Tenir un inventaire des équipements sous pression avec leur fiche technique (catégorie de
  risque A/B/C/exempté, fluide, PS, volume, organisme habilité...).
- Calculer automatiquement les prochaines échéances (inspection / requalification) et signaler
  les retards ou approches d'échéance par un code couleur (vert / orange / rouge / non conforme).
- Centraliser l'historique des contrôles et les métadonnées documentaires associées.
- Suivre le workflow de validation (à faire → en cours → réalisé → validé par organisme agréé).
- Fournir un tableau de bord de conformité pour la direction.

Les données sont **persistées automatiquement** (voir section *Persistance des données*
ci-dessous) : rien ne se perd entre deux sessions.

> **Avertissement** : les périodicités par défaut (1 an / 10 ans / 40 ans) sont indicatives.
> Elles doivent être adaptées au plan d'inspection reconnu ou aux prescriptions spécifiques de
> chaque équipement, sous la responsabilité de l'organisme habilité et du service HSE.

## Prérequis

- [Node.js](https://nodejs.org/) version 18 ou supérieure (recommandé : 20 LTS)
- npm (installé avec Node.js)

Vérifier les versions installées :

```bash
node -v
npm -v
```

## Installation locale

```bash
npm install
```

## Lancer en développement

```bash
npm run dev
```

L'application est alors accessible sur `http://localhost:5173` (ou le port indiqué dans le
terminal), avec rechargement à chaud à chaque modification du code.

## Build de production

```bash
npm run build
```

Le résultat est généré dans le dossier `dist/`. Pour prévisualiser ce build localement avant
déploiement :

```bash
npm run preview
```

## Persistance des données

L'application détecte automatiquement son environnement d'exécution :

- **Dans Claude.ai (artifact)** : elle utilise `window.storage` (API de persistance native des
  artifacts Claude — `get` / `set` / `delete` / `list`). Cette API **n'existe pas** en dehors de
  l'environnement Claude.ai.
- **En dehors de Claude.ai** (ce projet, une fois déployé sur GitHub Pages, Vercel, Netlify,
  ou en local) : le code bascule automatiquement sur un **adaptateur `localStorage`** qui
  reproduit la même interface asynchrone (`get`/`set`/`delete`/`list`). Aucune configuration
  n'est nécessaire — c'est déjà géré dans `src/App.jsx` (voir la fonction `storageBackend`).

Cette double implémentation permet d'utiliser exactement le même code source dans les deux
environnements.

### Limites de `localStorage` et alternatives possibles

`localStorage` est pratique pour démarrer (pas de backend à héberger) mais présente des
limites à connaître pour un usage en production :

| Limite | Impact |
|---|---|
| ~5-10 Mo par domaine | Suffisant pour quelques centaines d'équipements avec historique, mais pas illimité |
| Local au navigateur | Les données ne sont pas partagées entre postes/utilisateurs ni sauvegardées automatiquement |
| Pas de vrai multi-utilisateur | Chaque technicien verrait ses propres données, pas celles de ses collègues |
| Pas de sauvegarde côté serveur | Un vidage du cache navigateur = perte des données |

Pour un déploiement en usage réel (plusieurs utilisateurs, sauvegarde fiable, accès multi-poste),
deux évolutions recommandées, par ordre de complexité croissante :

1. **IndexedDB** (toujours 100% côté navigateur, mais capacité bien plus grande et requêtage
   plus riche que `localStorage`). Bibliothèques utiles : [`idb`](https://www.npmjs.com/package/idb)
   ou [Dexie.js](https://dexie.org/). Cela résout la limite de volume mais pas le
   multi-utilisateur / la sauvegarde centralisée.
2. **Backend externe** (recommandé pour un usage HSE multi-utilisateurs en entreprise) :
   exposer une API REST ou GraphQL simple (ex. Node/Express, ou un backend-as-a-service comme
   Supabase / Firebase) qui persiste les équipements dans une vraie base de données (PostgreSQL,
   SQLite, etc.), avec authentification des utilisateurs. Il suffirait alors de remplacer
   l'implémentation de `storageBackend` dans `src/App.jsx` par des appels `fetch()` vers cette
   API — le reste de l'application (calculs d'échéances, alertes, UI) n'a pas besoin de changer.

## Structure du projet

```
suivi-esp/
├── index.html              # Point d'entrée HTML (Vite)
├── package.json            # Dépendances et scripts npm
├── vite.config.js          # Configuration Vite (base relative pour GitHub Pages)
├── tailwind.config.js      # Configuration Tailwind CSS
├── postcss.config.js       # Configuration PostCSS (requis par Tailwind)
├── .gitignore
├── README.md
└── src/
    ├── main.jsx             # Point d'entrée React
    ├── App.jsx               # Composant principal (toute la logique métier + UI)
    └── index.css             # Import des directives Tailwind
```

## Technologies utilisées

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/) (build tool)
- [Tailwind CSS](https://tailwindcss.com/) (classes utilitaires de base)
- [lucide-react](https://lucide.dev/) (icônes)

## Déploiement automatique (GitHub Actions → GitHub Pages)

Le dépôt contient un workflow (`.github/workflows/deploy.yml`) qui construit et publie
automatiquement le site à chaque envoi de fichiers sur la branche `main` — **aucune commande,
aucune installation de Node.js en local n'est nécessaire**. Tout se passe sur les serveurs de
GitHub.

Mise en place (une seule fois) :

1. Créer un dépôt GitHub et y déposer tous les fichiers de ce projet (glisser-déposer via
   l'interface web GitHub fonctionne très bien, pas besoin de `git` en ligne de commande).
2. Aller dans **Settings → Pages** du dépôt.
3. Sous "Build and deployment", choisir la source **"GitHub Actions"** (et non "Deploy from a
   branch").
4. C'est tout. Le workflow se déclenche automatiquement à chaque envoi de fichiers sur `main` :
   il installe les dépendances, lance `npm run build`, puis publie le contenu de `dist/` sur
   GitHub Pages.

Pour suivre ou relancer un déploiement : onglet **Actions** du dépôt (chaque envoi de fichiers
y apparaît comme une exécution du workflow "Build & déploiement (GitHub Pages)"). L'URL du site
publié est indiquée dans les paramètres Pages une fois le premier déploiement terminé.

Ce workflow ne fait que compiler et publier le site statique : pour Vercel ou Netlify (autres
options possibles), voir la procédure fournie séparément.

## Licence / usage

Projet fourni comme outil de suivi interne. Les périodicités réglementaires par défaut sont
indicatives et ne remplacent pas l'avis d'un organisme habilité ni la lecture de l'arrêté du
20/11/2017 et de ses textes d'application.
