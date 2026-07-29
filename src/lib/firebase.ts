import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0289658697",
  appId: "1:457121555363:web:5f73dc5c03e5f5de0c3016",
  apiKey: "AIzaSyB9lEecL_H1KvE4OlyATUZ7yrPBwnXJHN8",
  authDomain: "gen-lang-client-0289658697.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-019514e1-54b4-43d3-b84e-0c71e6faf1d8",
  storageBucket: "gen-lang-client-0289658697.firebasestorage.app",
  messagingSenderId: "457121555363",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { app, auth, db };
