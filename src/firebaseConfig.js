export const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "Suivi-ESP.firebaseapp.com",
  projectId: "Suivi-ESP",
  storageBucket: "Suivi-ESP.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx",
};

// Détecte si la config ci-dessus est toujours le placeholder par défaut.
export const firebaseConfigEstRenseignee =
  firebaseConfig.apiKey !== "VOTRE_API_KEY" && !!firebaseConfig.projectId;
