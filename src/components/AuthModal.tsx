import React, { useState, useRef, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Check, Crown, Eye, EyeOff } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { STORE_OWNER_CONFIG, STORE_OWNER_EMAIL } from '../config';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, register, loginWithGoogle } = useAuth();
  const { setIsOwnerOrdersOpen } = useCart();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside the modal content area
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeAuthModal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isAuthModalOpen, closeAuthModal]);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  useEffect(() => {
    if (isAuthModalOpen) { setMode(authModalMode); setError(''); setSuccess(''); }
  }, [authModalMode, isAuthModalOpen]);
  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password, name);
        if (res.success) {
          setSuccess('Signed in successfully!');
          setTimeout(() => {
            closeAuthModal();
          }, 800);
        } else {
          setError(res.message || 'Login failed');
        }
      } else {
        const res = await register(name, email, password);
        if (res.success) {
          setSuccess('Account created successfully!');
          setTimeout(() => {
            closeAuthModal();
          }, 800);
        } else {
          setError(res.message || 'Registration failed');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address in the field below first, then click Forgot.');
      return;
    }
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(`Password reset email sent to ${email.trim()}! Please check your inbox (and spam folder) to set a new password.`);
    } catch (err: any) {
      console.warn('[Auth] Password reset notice:', err?.code || err?.message);
      const code = err?.code;
      if (code === 'auth/user-not-found') {
        setError('No account exists with this email address. Please click "Create Account".');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Could not request a password reset. Please verify your email and retry.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        setSuccess('Signed in with Google successfully!');
        setTimeout(() => {
          closeAuthModal();
        }, 800);
      } else {
        setError(res.message || 'Google sign-in could not be completed.');
      }
    } catch {
      setError('Google sign-in encountered an issue. Please try again or use email/password.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      onClick={closeAuthModal}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-md p-6 sm:p-8 rounded-none shadow-2xl border border-neutral-200"
      >
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-black transition-colors"
          aria-label="Close auth dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Lockup */}
        <div className="text-center mb-6">
          <p className="text-xs font-mono tracking-widest text-neutral-500 uppercase">FITNESS JUNKIES</p>
          <h2 className="text-xl font-black font-display tracking-tight text-neutral-900 uppercase mt-1">
            {mode === 'login' ? 'Welcome Back' : 'Join The Movement'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {mode === 'login'
              ? 'Access your orders, saved sizes, and member perks'
              : 'Create an account for 15% off your first order'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 mb-6">
          <button
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 pb-2.5 text-xs font-bold tracking-wider uppercase transition-colors text-center ${
              mode === 'login'
                ? 'border-b-2 border-black text-black'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 pb-2.5 text-xs font-bold tracking-wider uppercase transition-colors text-center ${
              mode === 'register'
                ? 'border-b-2 border-black text-black'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
            <p className="font-medium leading-relaxed">{error}</p>
            {error.toLowerCase().includes('already registered') && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="mt-2 text-xs font-bold text-black underline uppercase tracking-wider block hover:opacity-75 cursor-pointer"
              >
                → Click here to Sign In with this email
              </button>
            )}
            {error.toLowerCase().includes('create account') && (
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="mt-2 text-xs font-bold text-black underline uppercase tracking-wider block hover:opacity-75 cursor-pointer"
              >
                → Click here to Create an Account
              </button>
            )}
            {error.toLowerCase().includes('domain') && (
              <div className="mt-2 text-[11px] bg-white p-2.5 border border-red-200">
                <p className="font-bold text-neutral-900">Domain to add in Firebase Console:</p>
                <code className="block mt-1 font-mono text-[10px] bg-neutral-100 p-1.5 text-black select-all break-all border border-neutral-200">
                  {typeof window !== 'undefined' ? window.location.hostname : ''}
                </code>
                <p className="text-[10px] text-neutral-600 mt-1.5 leading-normal">
                  Go to <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong>, click <em>Add domain</em> and paste the domain above.
                </p>
              </div>
            )}
            {mode === 'login' && !error.toLowerCase().includes('create account') && !error.toLowerCase().includes('google') && (
              <div className="mt-2.5 pt-2 border-t border-red-200/60 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-[11px] font-bold text-red-900 underline hover:text-black cursor-pointer text-left"
                >
                  → Send password reset email {email ? `to ${email}` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="text-[11px] font-bold text-neutral-800 underline hover:text-black cursor-pointer text-left"
                >
                  Create New Account
                </button>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            {success}
          </div>
        )}

        {/* 1-Click Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full py-2.5 px-4 mb-4 border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isGoogleLoading ? 'Connecting...' : mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
        </button>

        {/* OR Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-neutral-200 w-full"></div>
          <span className="bg-white px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            or continue with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-hidden"
                />
                <UserIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-hidden"
              />
              <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold uppercase text-neutral-700">
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-[10px] text-neutral-500 hover:text-black underline cursor-pointer"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-hidden"
              />
              <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer focus:outline-hidden"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {mode === 'register' && (
              <p className="text-[10px] text-neutral-400 mt-1">
                Must be at least 6 characters
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold tracking-widest uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Customer Account Benefits */}
        <div className="mt-5 pt-4 border-t border-neutral-100 space-y-2 text-[11px] text-neutral-500">
          <p className="font-semibold text-neutral-800 uppercase tracking-wider text-[10px]">
            Member Account Privileges:
          </p>
          <div className="grid grid-cols-1 gap-1 text-neutral-600">
            <span className="flex items-center gap-1.5">✓ Live shipment & delivery tracking</span>
            <span className="flex items-center gap-1.5">✓ View complete past order history & receipts</span>
            <span className="flex items-center gap-1.5">✓ Faster checkout with saved delivery address</span>
          </div>
        </div>
      </div>
    </div>
  );
};
