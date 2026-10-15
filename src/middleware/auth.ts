
import { Request, Response, NextFunction } from 'express';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    emailVerified?: boolean;
    picture?: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  try {
    // Cryptographically verify token directly with Google Firebase Identity API
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
        signal: AbortSignal.timeout(6000),
      }
    );

    if (!verifyRes.ok) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token signature or expired session' });
    }

    const data = (await verifyRes.json()) as any;
    const verifiedUser = data.users?.[0];
    if (!verifiedUser || !verifiedUser.localId) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = {
      uid: verifiedUser.localId,
      email: verifiedUser.email?.toLowerCase().trim(),
      name: verifiedUser.displayName,
      emailVerified: verifiedUser.emailVerified,
      picture: verifiedUser.photoUrl,
    };

    return next();
  } catch (error) {
    console.error('[Security] Token verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
};
