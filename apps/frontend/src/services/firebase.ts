
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase Console'dan alacağınız proje ayarları
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Validate Config
// Check if apiKey is present and is NOT the placeholder string
const isConfigured = 
  !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" && 
  !firebaseConfig.apiKey.includes("YOUR_");

let app;
let auth: Auth;
let db: Firestore;

if (isConfigured) {
  try {
    // Prevent multiple initializations
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase API Keys not found or invalid. Falling back to MOCK DATA mode.");
}

export { auth, db };
// Export flag to let other services know if they should use Firebase or Mocks
export const isFirebaseEnabled = isConfigured && !!app; 

export default app;
