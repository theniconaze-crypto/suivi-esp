// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB6gFF8uic6QMOnrHAvX7nyfs87gHgIxgg",
  authDomain: "suivi-esp.firebaseapp.com",
  projectId: "suivi-esp",
  storageBucket: "suivi-esp.firebasestorage.app",
  messagingSenderId: "556406528167",
  appId: "1:556406528167:web:e731bedb048ace7d262382",
  measurementId: "G-DDVF575HZE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);