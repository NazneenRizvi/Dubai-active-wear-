import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp({
  ...firebaseConfig,
  ...(import.meta.env.VITE_FIREBASE_API_KEY ? { apiKey: import.meta.env.VITE_FIREBASE_API_KEY } : {}),
  ...(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? { authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN } : {}),
  ...(import.meta.env.VITE_FIREBASE_PROJECT_ID ? { projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID } : {}),
});
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
