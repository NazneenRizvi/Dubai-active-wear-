import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';
if (!getApps().length) {
  initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  });
}
export const adminAuth = getAuth();
