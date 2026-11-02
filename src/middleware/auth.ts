
import type { Request, Response, NextFunction } from 'express';
import {
  initializeApp,
  getApps,
  applicationDefault,
  cert,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    emailVerified?: boolean;
    picture?: string;
  };
}

// Firebase Admin SDK must only run on the backend.
const projectId =
  process.env.FIREBASE_PROJECT_ID || 'icone-active-wear-2';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

const adminApp =
  getApps()[0] ||
  initializeApp({
    credential: serviceAccount
      ? cert(JSON.parse(serviceAccount))
      : applicationDefault(),
    projectId,
  });

const adminAuth = getAuth(adminApp);

async function verifyFirebaseToken(req: AuthRequest) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing authentication token');
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    throw new Error('Empty authentication token');
  }

  // Firebase Admin SDK verifies the ID token signature,
  // expiration, issuer and Firebase project.
  const decoded = await adminAuth.verifyIdToken(token, true);

  req.user = {
    uid: decoded.uid,
    email: decoded.email?.toLowerCase().trim(),
    name: decoded.name,
    emailVerified: decoded.email_verified === true,
    picture: decoded.picture,
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await verifyFirebaseToken(req);
    next();
  } catch (error) {
    console.warn('[Auth] Authentication failed');
    return res.status(401).json({
      error: 'Unauthorized: Please sign in again.',
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers.authorization) {
    return next();
  }

  try {
    await verifyFirebaseToken(req);
    next();
  } catch (error) {
    console.warn('[Auth] Invalid optional token');
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired session.',
    });
  }
};

