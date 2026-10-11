import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { User } from '../types';
import { STORE_OWNER_EMAIL, STORE_OWNER_CONFIG } from '../config';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  login: (email: string, password: string, name?: string) => Promise<{ success: boolean; message?: string }>;
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
      console.error('Sign in failed:', error);
      const code = error?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        return { success: false, message: 'Invalid password. Please check your password or click Forgot.' };
      }
      if (code === 'auth/user-not-found') {
        return { success: false, message: 'No account found with this email. Please register first.' };
      }
      return { success: false, message: 'Sign in failed. Check your email and password.' };
    }
  };
  const register = async (name: string, email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(result.user, { displayName: name });
      setUser({ id: result.user.uid, email: result.user.email || '', name });
      return { success: true };
    } catch (error) { console.error('Registration failed:', error); return { success: false, message: 'Registration failed. Check your details and Firebase configuration.' }; }
  };
  const logout = () => { void signOut(auth).catch(error => console.error('Sign out failed:', error)); };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isOwner,
        login,
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
