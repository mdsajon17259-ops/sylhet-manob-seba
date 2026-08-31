import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAURpgGmu-BUyrWPleA9yWLkcmKyNXCPxU",
  authDomain: "sylhetmanobseba.firebaseapp.com",
  projectId: "sylhetmanobseba",
  storageBucket: "sylhetmanobseba.firebasestorage.app",
  messagingSenderId: "556428994983",
  appId: "1:556428994983:web:b74ca1055abc95d2252e82",
  measurementId: "G-YS5K10MZE4"
};

// Initialize Firebase safely (avoid multi-instance re-init)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
