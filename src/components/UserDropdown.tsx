import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, ChevronDown, ShoppingBag, Heart, Sliders, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { STORE_OWNER_EMAIL } from '../config';

interface UserDropdownProps {
  variant?: 'top-bar' | 'icon';
  className?: string;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ variant = 'top-bar', className = '' }) => {
  const { user, isAuthenticated, isOwner, openAuthModal, logout } = useAuth();
  const { setIsCustomerOrdersOpen, setIsWishlistOpen, setIsAdminViewOpen } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Strictly check if the currently authenticated user's email matches the store owner email
  const isStoreOwner = !!user && user.email?.toLowerCase().trim() === STORE_OWNER_EMAIL.toLowerCase().trim();

  // Outside click listener: closes dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isAuthenticated) {
    if (variant === 'top-bar') {
      return (
        <button
          onClick={() => openAuthModal('login')}
          className={`hover:text-black transition-colors font-medium flex items-center gap-1 cursor-pointer ${className}`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>My Account</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => openAuthModal('login')}
        className={`p-1.5 text-neutral-700 hover:text-black transition-colors cursor-pointer ${className}`}
        aria-label="User account"
      >
        <UserIcon className="w-5 h-5" />
      </button>
    );
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Account';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'top-bar' ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 transition-colors font-bold text-xs cursor-pointer hover:text-black text-neutral-800"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span className="truncate max-w-[130px]">Hi, {firstName}</span>
          <ChevronDown
            className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-1.5 text-neutral-700 hover:text-black transition-colors cursor-pointer flex items-center"
          aria-label="User account"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <UserIcon className="w-5 h-5" />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 shadow-2xl z-50 py-1 text-left animate-fade-in"
        >
          {/* User Profile Header */}
          <div className="px-3.5 py-2.5 border-b border-neutral-100 bg-neutral-50/80">
            <p className="font-bold text-xs truncate text-neutral-900">{user?.name}</p>
            <p className="text-[10px] truncate text-neutral-500 font-mono">{user?.email}</p>
          </div>

          {/* Action Links */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              setIsCustomerOrdersOpen(true);
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center justify-between cursor-pointer border-b border-neutral-100"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-neutral-600" />
              <span>My Order History</span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              setIsWishlistOpen(true);
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center gap-2 cursor-pointer border-b border-neutral-100"
          >
            <Heart className="w-3.5 h-3.5 text-red-500" />
            <span>Saved Wishlist</span>
          </button>

          {isOwner && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              setIsAdminViewOpen(true);
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-neutral-900 hover:bg-neutral-100 transition-colors flex items-center justify-between cursor-pointer border-b border-neutral-100"
          >
            <span className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin Portal</span>
            </span>
            <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-xs font-mono font-bold">
              OWNER
            </span>
          </button>
          )}

          {/* Sign Out */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
