import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, User as UserIcon, ChevronDown, Menu, X, Instagram, Facebook, Share2, Heart, Sliders } from 'lucide-react';
import { useCurrency, CurrencyCode, CURRENCIES } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { STORE_OWNER_EMAIL } from '../config';
import { UserDropdown } from './UserDropdown';

interface NavbarProps {
  currentRoute?: string;
  onNavigateRoute?: (route: string) => void;
  onOpenBrandStory?: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute = '/',
  onNavigateRoute,
  onOpenBrandStory,
  onNavigateSection
}) => {
  const { currency, setCurrency, currentCurrencyDetails } = useCurrency();
  const {
    totalItemsCount,
    setIsCartOpen,
    setIsSearchOpen,
    setIsCustomerOrdersOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    wishlist,
    setIsAdminViewOpen
  } = useCart();
  const { user, isAuthenticated, isOwner, openAuthModal, logout } = useAuth();

  const isStoreOwner = !!user && user.email?.toLowerCase().trim() === STORE_OWNER_EMAIL.toLowerCase().trim();

  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => { setIsMobileMenuOpen(false); }, [currentRoute]);
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsMobileMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', closeOnEscape); };
  }, [isMobileMenuOpen]);

  const handleNavClick = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    if (sectionId === 'catalog-section' || sectionId === 'shop-all') {
      if (onNavigateRoute) onNavigateRoute('/shop');
      else if (onNavigateSection) onNavigateSection('catalog-section');
    } else if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* 1. Top Announcement Bar matching reference */}
      <div className="bg-neutral-950 text-white text-[11px] font-medium tracking-widest text-center py-2 px-4 uppercase border-b border-neutral-900 flex items-center justify-between">
        <div className="hidden sm:block text-[10px] tracking-wider text-neutral-400">
          📍 DUBAI, UAE 🇦🇪
        </div>
        <div className="flex-1 text-center">
          <span className="font-bold text-amber-300">FREE DELIVERY ON ORDERS ABOVE 150 AED</span>
          <span className="hidden md:inline text-neutral-400"> · Express Delivery across Dubai & All Emirates 🇦🇪</span>
        </div>
        <div className="hidden sm:block text-[10px] tracking-wider text-neutral-400">
          CARDS & APPLE PAY / COD
        </div>
      </div>

      {/* 2. Upper Utility Bar */}
      <div className="border-b border-neutral-100 bg-[#FAF9F8] px-4 sm:px-8 py-1.5 text-xs text-neutral-600 hidden md:flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
          <span>Official Premium Activewear Brand · Dubai, UAE</span>
        </div>

        <div className="flex items-center gap-6">
          {/* Currency Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className="flex items-center gap-1 font-semibold text-neutral-800 hover:text-black transition-colors py-0.5 cursor-pointer"
            >
              <span>{currentCurrencyDetails.code}</span>
              <span className="text-neutral-400">({currentCurrencyDetails.symbol})</span>
              <ChevronDown className="w-3 h-3 ml-0.5 text-neutral-500" />
            </button>

            {isCurrencyDropdownOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-neutral-200 rounded-none shadow-lg z-50 py-1">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      setCurrency(code);
                      setIsCurrencyDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-neutral-100 transition-colors cursor-pointer ${
                      currency === code ? 'font-bold bg-neutral-50 text-black' : 'text-neutral-700'
                    }`}
                  >
                    <span>{code}</span>
                    <span className="text-neutral-400">{CURRENCIES[code].symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Account / Auth Dropdown with Outside-Click Handler */}
          <UserDropdown variant="top-bar" />

          {/* Social Icons */}
          <div className="flex items-center gap-3 pl-3 border-l border-neutral-200 text-neutral-500">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-900 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-900 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-900 transition-colors"
              aria-label="Pinterest"
            >
              <Share2 className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. Main Brand Navigation Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Mobile menu control */}
        <div className="flex items-center shrink-0 md:hidden">
          {/* Mobile menu hamburger (opens navigation drawer without redirecting) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="md:hidden p-1.5 -ml-1 text-neutral-800 hover:text-black hover:bg-neutral-100 rounded-xs transition-colors shrink-0 cursor-pointer"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Brand Logo: ICON ACTIVEWEAR */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigateRoute) onNavigateRoute('/');
            else handleNavClick('catalog-section');
          }}
          className="text-xs min-[360px]:text-sm sm:text-xl md:text-2xl font-black tracking-tight sm:tracking-widest font-display text-neutral-900 uppercase truncate cursor-pointer text-left min-w-0"
        >
          <span>ICON ACTIVEWEAR</span>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-bold tracking-wider uppercase text-neutral-800">
          <button
            onClick={() => handleNavClick('catalog-section')}
            className="hover:text-black relative py-1 transition-colors group cursor-pointer"
          >
            SHOP
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-200 group-hover:w-full"></span>
          </button>
          <button
            onClick={() => {
              if (onOpenBrandStory) {
                onOpenBrandStory();
              } else {
                handleNavClick('brand-story');
              }
            }}
            className="hover:text-black relative py-1 transition-colors group cursor-pointer"
          >
            OUR BRAND
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-200 group-hover:w-full"></span>
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className="hover:text-black relative py-1 transition-colors group cursor-pointer"
          >
            CONTACT
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-200 group-hover:w-full"></span>
          </button>
        </nav>

        {/* Right Action Icons: Search, Wishlist, User, Cart */}
        <div className="flex items-center gap-0.5 sm:gap-3 shrink-0 pr-0.5 sm:pr-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 text-neutral-700 hover:text-black transition-colors cursor-pointer"
            aria-label="Search activewear"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist Button - hidden on screens under 390px to prevent overflow with bottom nav */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="hidden min-[390px]:flex p-1.5 text-neutral-700 hover:text-black transition-colors relative items-center cursor-pointer"
            aria-label="Saved Wishlist"
            title="My Saved Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center animate-scale-in">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Mobile User Icon Dropdown - hidden on screens under 370px, handled by bottom nav */}
          <UserDropdown variant="icon" className="hidden min-[370px]:flex md:hidden" />

          {/* Cart Bag Icon with dynamic counter badge - never cut off on mobile */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-1.5 sm:p-2 text-neutral-800 hover:text-black transition-colors relative flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Shopping bag"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-0.5 right-0 bg-black text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center animate-scale-in shadow-xs pointer-events-none">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {isMobileMenuOpen && createPortal(
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu" className="md:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 max-w-[310px] w-full bg-white shadow-2xl flex flex-col z-10 animate-fade-in overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-[#111111] text-white">
              <div>
                <span className="text-xs font-black tracking-widest uppercase font-display block">
                  ICON ACTIVEWEAR
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Karachi Flagship Store
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="p-5 flex-1 space-y-4">
              <div className="flex flex-col space-y-2 text-xs font-black tracking-wider uppercase text-neutral-900">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onNavigateRoute) onNavigateRoute('/shop');
                    else handleNavClick('catalog-section');
                  }}
                  className="text-left py-2.5 px-2 hover:bg-neutral-100 rounded-sm border-b border-neutral-100 transition-colors flex items-center justify-between font-extrabold text-black cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Shop All Drops</span>
                    <span className="text-[9px] bg-black text-white px-1.5 py-0.5 font-mono">/SHOP</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">01</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('shop-seamless')}
                  className="text-left py-2.5 px-2 hover:bg-neutral-100 rounded-sm border-b border-neutral-100 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Seamless Leggings</span>
                  <span className="text-[10px] text-neutral-400 font-mono">02</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('shop-low-impact')}
                  className="text-left py-2.5 px-2 hover:bg-neutral-100 rounded-sm border-b border-neutral-100 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Sports Bras</span>
                  <span className="text-[10px] text-neutral-400 font-mono">03</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenBrandStory) onOpenBrandStory();
                  }}
                  className="text-left py-2.5 px-2 hover:bg-neutral-100 rounded-sm border-b border-neutral-100 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Our Brand Story</span>
                  <span className="text-[10px] text-neutral-400 font-mono">04</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('contact')}
                  className="text-left py-2.5 px-2 hover:bg-neutral-100 rounded-sm border-b border-neutral-100 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Contact & WhatsApp</span>
                  <span className="text-[10px] text-neutral-400 font-mono">05</span>
                </button>
              </div>

              {/* Account Actions in Mobile Drawer */}
              <div className="pt-2 border-t border-neutral-200">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-neutral-100 rounded-sm flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                        className="text-[11px] text-red-600 font-bold underline shrink-0 cursor-pointer ml-2"
                      >
                        Sign Out
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsCustomerOrdersOpen(true);
                      }}
                      className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-neutral-300" />
                      <span>My Order History</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsWishlistOpen(true);
                      }}
                      className="w-full py-2 bg-white border border-neutral-300 text-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>Saved Wishlist ({wishlist.length})</span>
                    </button>

                    {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsAdminViewOpen(true);
                      }}
                      className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-neutral-700" />
                      <span>⚙️ Admin Portal</span>
                    </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuthModal('login');
                      }}
                      className="w-full py-3 bg-black text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Customer Sign In / Join</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Currency selection on mobile */}
              <div className="pt-2 border-t border-neutral-200">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Select Currency
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <button
                      key={code}
                      onClick={() => setCurrency(code)}
                      className={`px-2 py-1.5 text-xs text-center border cursor-pointer ${
                        currency === code
                          ? 'border-black bg-black text-white font-bold'
                          : 'border-neutral-300 text-neutral-700 hover:border-black'
                      }`}
                    >
                      {code} ({CURRENCIES[code].symbol})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>, document.body
      )}
    </header>
  );
};
