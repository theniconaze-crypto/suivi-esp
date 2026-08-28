export const firebaseConfig = {
  apiKey: "AIzaSyB6gFF8uic6QMOnrHAvX7nyfs87gHgIxgg",
  authDomain: "Suivi-ESP.firebaseapp.com",
  projectId: "Suivi-ESP",
  storageBucket: "Suivi-ESP.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx",
};

// Détecte si la config ci-dessus est toujours le placeholder par défaut.
export const firebaseConfigEstRenseignee =
  firebaseConfig.apiKey !== "AIzaSyB6gFF8uic6QMOnrHAvX7nyfs87gHgIxgg" && !!firebaseConfig.projectId;
