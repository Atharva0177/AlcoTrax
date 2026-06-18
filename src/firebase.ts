import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Read Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Enable persistence (persists across page reloads on same device/browser)
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.warn('Failed to set auth persistence:', error);
});

export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign in error", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    // Clear all session-related localStorage to ensure clean logout
    localStorage.removeItem('activeDrinks');
    localStorage.removeItem('activeWaterVolume');
    localStorage.removeItem('activeStartTime');
    localStorage.removeItem('activeLastDrinkTimestamp');
    localStorage.removeItem('activeBac');
    localStorage.removeItem('activePeakBac');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('medicalInfo');
    localStorage.removeItem('drinkLibrary');
    localStorage.removeItem('friends');
    localStorage.removeItem('emergencyContact');
    localStorage.removeItem('homeAddress');
    localStorage.removeItem('sessionHistory');
    localStorage.removeItem('recentDrinks');
    localStorage.removeItem('badges');
  } catch (error) {
    console.error("Logout error", error);
    throw error;
  }
};
