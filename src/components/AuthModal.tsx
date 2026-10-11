import React, { useState, useRef, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Check, Crown, Eye, EyeOff } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { STORE_OWNER_CONFIG, STORE_OWNER_EMAIL } from '../config';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, register } = useAuth();
  const { setIsOwnerOrdersOpen } = useCart();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    if (!email.trim()) { setError('Enter your email first.'); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess('If this email has an account, a reset link will be sent.');
    } catch (error) { console.error('Password reset failed:', error); setError('Could not request a password reset. Please retry.'); }
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
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            {success}
          </div>
        )}

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
