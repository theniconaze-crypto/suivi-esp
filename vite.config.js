import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base relative ('./') : rend le build compatible avec un hébergement
// dans un sous-dossier (ex. GitHub Pages https://user.github.io/suivi-esp/).
// Pour un déploiement à la racine d'un domaine (Vercel, Netlify), '/' fonctionne aussi.
export default defineConfig({
  plugins: [react()],
  base: './',
});
