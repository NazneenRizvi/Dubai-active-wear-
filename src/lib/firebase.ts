import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase Web SDK uses public VITE_* config values, NEVER private service account keys.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'icone-active-wear-2',
};

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
  console.warn('Firebase web configuration missing. Configure VITE_FIREBASE_API_KEY and VITE_FIREBASE_AUTH_DOMAIN in your local .env file.');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
