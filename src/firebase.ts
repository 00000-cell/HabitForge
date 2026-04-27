import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADJyvD8cMF5cetUf2UuCtvR6BW8Cz5pFg",
  authDomain: "habitforge-4ca05.firebaseapp.com",
  projectId: "habitforge-4ca05",
  storageBucket: "habitforge-4ca05.firebasestorage.app",
  messagingSenderId: "836165835849",
  appId: "1:836165835849:web:020d819b6f0f06e33ff398"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
