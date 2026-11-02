import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut
} from 'firebase/auth';
import { User } from '../types';
import { STORE_OWNER_EMAIL, STORE_OWNER_CONFIG } from '../config';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  login: (email: string, password: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    localStorage.removeItem('fj_user');
    return onAuthStateChanged(auth, current => {
      setUser(current ? { id: current.uid, name: current.displayName || current.email?.split('@')[0] || 'Customer', email: current.email || '' } : null);
    });
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const isOwner = !!user && user.email?.toLowerCase().trim() === STORE_OWNER_EMAIL.toLowerCase().trim();

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true };
    } catch (error: any) {
      console.warn('[Auth] Sign in credential check:', error?.code || error?.message);
      const code = error?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        return {
          success: false,
          code,
          message: 'Incorrect password or email. If you forgot your password, click the reset button below.'
        };
      }
      if (code === 'auth/user-not-found') {
        return {
          success: false,
          code,
          message: 'No account found with this email. Please click "Create Account" to register.'
        };
      }
      if (code === 'auth/invalid-email') {
        return {
          success: false,
          code,
          message: 'Please enter a valid email address.'
        };
      }
      if (code === 'auth/too-many-requests') {
        return {
          success: false,
          code,
          message: 'Access temporarily disabled due to multiple failed attempts. Please wait a few minutes or reset your password.'
        };
      }
      return {
        success: false,
        code,
        message: error?.message || 'Sign in failed. Check your email and password.'
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      if (password.length < 6) {
        return {
          success: false,
          code: 'auth/weak-password',
          message: 'Password must be at least 6 characters long.'
        };
      }
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(result.user, { displayName: name });
      setUser({ id: result.user.uid, email: result.user.email || '', name });
      return { success: true };
    } catch (error: any) {
      console.warn('[Auth] Registration check:', error?.code || error?.message);
      const code = error?.code;
      if (code === 'auth/email-already-in-use') {
        return {
          success: false,
          code,
          message: 'This email is already registered! Please click "Sign In" below or reset your password.'
        };
      }
      if (code === 'auth/weak-password') {
        return {
          success: false,
          code,
          message: 'Password is too weak. Please use at least 6 characters.'
        };
      }
      if (code === 'auth/invalid-email') {
        return {
          success: false,
          code,
          message: 'Please enter a valid email address.'
        };
      }
      if (code === 'auth/operation-not-allowed') {
        return {
          success: false,
          code,
          message: 'Email/Password sign-in is disabled in your Firebase console. Please enable it in Authentication > Sign-in method.'
        };
      }
      return {
        success: false,
        code,
        message: error?.message || 'Registration failed. Check your details and try again.'
      };
    }
  };

  const loginWithGoogle = async () => {
    try {
      googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleAuthProvider);
      const u = result.user;
      setUser({
        id: u.uid,
        name: u.displayName || u.email?.split('@')[0] || 'Customer',
        email: u.email || ''
      });
      return { success: true };
    } catch (error: any) {
      console.warn('[Auth] Google sign in check:', error?.code || error?.message);
      const code = error?.code;
      const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      if (code === 'auth/unauthorized-domain') {
        return {
          success: false,
          code,
          message: `Domain Unauthorized in Firebase: Please add "${host}" to Firebase Console > Authentication > Settings > Authorized Domains, or sign in using Email/Password below.`
        };
      }
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return {
          success: false,
          code,
          message: `Google popup closed. This happens when "${host}" is not added to Firebase Authorized Domains, or if popups are blocked in iframes. Please continue with Email/Password below.`
        };
      }
      if (code === 'auth/popup-blocked') {
        return {
          success: false,
          code,
          message: 'Popup was blocked by your browser. Please allow popups or use email/password below.'
        };
      }
      if (code === 'auth/operation-not-allowed') {
        return {
          success: false,
          code,
          message: 'Google provider is not enabled in Firebase Console. Please enable Google under Authentication > Sign-in method.'
        };
      }
      return { success: false, code, message: error?.message || 'Google sign-in failed. Please use email/password.' };
    }
  };

  const logout = () => { void signOut(auth).catch(error => console.error('Sign out failed:', error)); };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isOwner,
        login,
        loginWithGoogle,
        register,
        logout,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
