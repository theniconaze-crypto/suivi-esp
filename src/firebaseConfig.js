/* ============================================================
   CONFIGURATION FIREBASE
   ============================================================ */
export const firebaseConfig = {
  apiKey: "AIzaSyB6gFF8uic6QMOnrHAvX7nyfs87gHgIxgg",
  authDomain: "suivi-esp.firebaseapp.com",
  projectId: "suivi-esp",
  storageBucket: "suivi-esp.firebasestorage.app",
  messagingSenderId: "556406528167",
  appId: "1:556406528167:web:e731bedb048ace7d262382",
};

// Détecte si la config ci-dessus est toujours le placeholder par défaut.
export const firebaseConfigEstRenseignee =
  firebaseConfig.apiKey !== "VOTRE_API_KEY" && !!firebaseConfig.projectId;
