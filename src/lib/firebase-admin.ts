import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Server-only configuration. Do not expose service account credentials to VITE_*.
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  initializeApp({
    credential: serviceAccount ? cert(JSON.parse(serviceAccount)) : applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'icone-active-wear-2',
  });
}
export const adminAuth = getAuth();
