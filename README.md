Suivi ESP — Suivi réglementaire des équipements sous pression
Outil web de suivi réglementaire des équipements sous pression (ESP), conçu pour aider les
équipes HSE, maintenance et direction à respecter les obligations de l'arrêté du 20/11/2017
relatif au suivi en service des équipements sous pression (inspections périodiques,
requalifications périodiques, contrôle DREAL).
Objectif du projet
Tenir un inventaire des équipements sous pression avec leur fiche technique (catégorie de
risque A/B/C/exempté, fluide, PS, volume, organisme habilité...).
Calculer automatiquement les prochaines échéances (inspection / requalification) et signaler
les retards ou approches d'échéance par un code couleur (vert / orange / rouge / non conforme).
Centraliser l'historique des contrôles et les métadonnées documentaires associées.
Suivre le workflow de validation (à faire → en cours → réalisé → validé par organisme agréé).
Fournir un tableau de bord de conformité pour la direction.
Les données sont persistées automatiquement (voir section Persistance des données
ci-dessous) : rien ne se perd entre deux sessions.
> **Avertissement** : les périodicités par défaut (1 an / 10 ans / 40 ans) sont indicatives.
> Elles doivent être adaptées au plan d'inspection reconnu ou aux prescriptions spécifiques de
> chaque équipement, sous la responsabilité de l'organisme habilité et du service HSE.
Prérequis
Node.js version 18 ou supérieure (recommandé : 20 LTS)
npm (installé avec Node.js)
Vérifier les versions installées :
```bash
node -v
npm -v
```
Installation locale
```bash
npm install
```
Lancer en développement
```bash
npm run dev
```
L'application est alors accessible sur `http://localhost:5173` (ou le port indiqué dans le
terminal), avec rechargement à chaud à chaque modification du code.
Build de production
```bash
npm run build
```
Le résultat est généré dans le dossier `dist/`. Pour prévisualiser ce build localement avant
déploiement :
```bash
npm run preview
```
Persistance des données et partage multi-utilisateurs
L'application détecte automatiquement son environnement d'exécution, par ordre de priorité :
Firebase (Firestore) — si `src/firebaseConfig.js` a été rempli avec un vrai projet
Firebase : les données sont stockées dans le cloud, partagées entre tous les
utilisateurs, et synchronisées en temps réel (une modification faite sur un PC apparaît
automatiquement sur les écrans des autres utilisateurs, sans rechargement de page). C'est la
configuration recommandée pour un usage à plusieurs. Un badge en haut de l'application
indique « Données partagées » quand ce mode est actif.
`window.storage` — si l'app tourne comme artifact dans Claude.ai et que Firebase n'est
pas configuré : stockage persistant mais propre à chaque utilisateur Claude.ai (non partagé).
`localStorage` — repli final (hors Claude.ai, Firebase non configuré) : stockage local au
navigateur uniquement. Un badge orange « Données locales uniquement » s'affiche dans ce cas :
chaque PC/navigateur a sa propre copie des données, rien n'est partagé.
Cette sélection automatique permet d'utiliser exactement le même code source dans tous les cas ;
il n'y a rien à modifier dans l'application elle-même pour activer le partage, seulement à
renseigner un fichier de configuration (voir ci-dessous).
Configuration Firebase (partage multi-utilisateurs, gratuit)
Une fois configuré, tous les utilisateurs de l'application — depuis n'importe quel PC, n'importe
quel navigateur — voient les mêmes équipements, contrôles et documents, mis à jour en temps réel.
Aucune ligne de commande n'est nécessaire, tout se fait depuis la console web de Firebase.
Créer un projet Firebase : aller sur console.firebase.google.com,
se connecter avec un compte Google, cliquer sur « Ajouter un projet », lui donner un nom (ex.
`suivi-esp`), puis suivre les étapes (Google Analytics peut être désactivé, il n'est pas
nécessaire).
Créer la base de données : dans le menu de gauche du projet, aller dans Firestore
Database → « Créer une base de données ». Choisir une région proche (ex. `eur3 (europe-west)`), puis démarrer en mode production.
Régler les règles de sécurité : dans l'onglet Règles de Firestore, remplacer le
contenu par :
```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /suivi_esp_donnees/{document} {
         allow read, write: if true;
       }
     }
   }
   ```
⚠️ Ces règles ouvrent la lecture/écriture à quiconque connaît l'URL de Firestore associée à
votre projet (pas seulement l'URL du site). C'est suffisant pour un usage interne où l'outil
n'est pas largement diffusé, mais ne convient pas si les données sont confidentielles et
exposées publiquement. Pour restreindre l'accès à des utilisateurs authentifiés, ajouter
Firebase Authentication (email/mot de passe ou compte Google) est l'évolution recommandée
— demandez à être accompagné pour cette étape si besoin.
Récupérer la configuration de l'application : toujours dans la console Firebase, aller
dans les paramètres du projet (icône ⚙️) → « Vos applications » → « Ajouter une application » →
choisir le web (icône `</>`) → donner un nom → ne pas cocher « Firebase Hosting ». Firebase
affiche alors un bloc `firebaseConfig` avec des valeurs (`apiKey`, `projectId`, etc.).
Coller ces valeurs dans `src/firebaseConfig.js` du projet, à la place des valeurs
d'exemple (`VOTRE_API_KEY`, etc.).
Envoyer la modification sur GitHub (remplacer `src/firebaseConfig.js` dans le dépôt). Le
workflow GitHub Actions rebuild et redéploie automatiquement le site avec Firebase activé.
Tant que `src/firebaseConfig.js` garde ses valeurs d'exemple, l'application continue de
fonctionner normalement en mode local (rien ne casse) — le partage n'est simplement pas actif.
Limites et alternatives
Solution	Partagé entre utilisateurs	Temps réel	Configuration
`localStorage` (par défaut)	❌ Non	—	Aucune
`window.storage` (Claude.ai)	❌ Non (par utilisateur Claude.ai)	❌ Non	Aucune
Firebase Firestore	✅ Oui	✅ Oui	Console Firebase (voir ci-dessus)
Le tier gratuit de Firestore (50 000 lectures et 20 000 écritures par jour) est très largement
suffisant pour ce type d'outil interne. Si un contrôle d'accès plus strict est nécessaire
(utilisateurs nommés, rôles, traçabilité des modifications), Firebase Authentication peut être
ajouté sans changer l'architecture globale.
Structure du projet
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
    ├── firebaseConfig.js     # Identifiants du projet Firebase (à renseigner, voir plus haut)
    └── index.css             # Import des directives Tailwind
```
Technologies utilisées
React 18
Vite (build tool)
Tailwind CSS (classes utilitaires de base)
lucide-react (icônes)
Déploiement automatique (GitHub Actions → GitHub Pages)
Le dépôt contient un workflow (`.github/workflows/deploy.yml`) qui construit et publie
automatiquement le site à chaque envoi de fichiers sur la branche `main` — aucune commande,
aucune installation de Node.js en local n'est nécessaire. Tout se passe sur les serveurs de
GitHub.
Mise en place (une seule fois) :
Créer un dépôt GitHub et y déposer tous les fichiers de ce projet (glisser-déposer via
l'interface web GitHub fonctionne très bien, pas besoin de `git` en ligne de commande).
Aller dans Settings → Pages du dépôt.
Sous "Build and deployment", choisir la source "GitHub Actions" (et non "Deploy from a
branch").
C'est tout. Le workflow se déclenche automatiquement à chaque envoi de fichiers sur `main` :
il installe les dépendances, lance `npm run build`, puis publie le contenu de `dist/` sur
GitHub Pages.
Pour suivre ou relancer un déploiement : onglet Actions du dépôt (chaque envoi de fichiers
y apparaît comme une exécution du workflow "Build & déploiement (GitHub Pages)"). L'URL du site
publié est indiquée dans les paramètres Pages une fois le premier déploiement terminé.
Ce workflow ne fait que compiler et publier le site statique : pour Vercel ou Netlify (autres
options possibles), voir la procédure fournie séparément.
Licence / usage
Projet fourni comme outil de suivi interne. Les périodicités réglementaires par défaut sont
indicatives et ne remplacent pas l'avis d'un organisme habilité ni la lecture de l'arrêté du
20/11/2017 et de ses textes d'application.
