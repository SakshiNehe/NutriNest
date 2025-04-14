import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALQBBJsLovyIsqBTuhnYqPInqfihiVgMM",
  authDomain: "nutrinest-d74dd.firebaseapp.com",
  projectId: "nutrinest-d74dd",
  storageBucket: "nutrinest-d74dd.appspot.com",
  messagingSenderId: "19881105211",
  appId: "1:19881105211:web:c7627cf1fce50462a9c91e",
  measurementId: "G-FZHHVSN7ZW"
};

// Firebase instance variables
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

// Initialize Firebase in a more robust way
const initializeFirebase = () => {
  try {
    console.log("Starting Firebase initialization...");
    // Check if Firebase app is already initialized
    if (getApps().length === 0) {
      console.log("Initializing new Firebase app instance");
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      console.log("Firebase app already initialized, reusing existing instance");
      firebaseApp = getApps()[0];
    }

    // Initialize Auth
    if (!firebaseAuth) {
      console.log("Initializing Firebase Auth");
      if (Platform.OS === 'web') {
        firebaseAuth = getAuth(firebaseApp);
        console.log("Firebase Auth initialized for web");
      } else {
        firebaseAuth = initializeAuth(firebaseApp, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
        console.log("Firebase Auth initialized for React Native with AsyncStorage persistence");
      }
    } else {
      console.log("Auth already initialized");
    }

    // Initialize Firestore
    if (!firebaseDb) {
      firebaseDb = getFirestore(firebaseApp);
      console.log("Firestore initialized successfully");
    }

    // Initialize Analytics if supported
    isSupported()
      .then(supported => {
        if (supported) {
          const analytics = getAnalytics(firebaseApp);
          console.log("Firebase Analytics initialized successfully");
        } else {
          console.log("Firebase Analytics not supported on this platform");
        }
      })
      .catch(error => {
        console.warn("Firebase Analytics initialization error:", error);
      });

    console.log("Firebase initialization complete");
    return { 
      app: firebaseApp, 
      auth: firebaseAuth, 
      db: firebaseDb 
    };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Ensure we return valid objects even if initialization fails
    return { 
      app: firebaseApp || null, 
      auth: firebaseAuth || null, 
      db: firebaseDb || null 
    };
  }
};

// Initialize Firebase when this module is imported
const firebase = initializeFirebase();

// Helper to check if Firebase is initialized
export const isFirebaseInitialized = () => {
  return !!firebase.app && !!firebase.auth && !!firebase.db;
};

// Export the Firebase instances
export const auth = firebase.auth;
export const db = firebase.db;
export default firebase.app;

// Expose a method to reinitialize Firebase if needed
export const reinitializeFirebase = initializeFirebase; 