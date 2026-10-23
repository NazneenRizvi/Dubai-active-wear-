import React from 'react';
import { Home, Sparkles, Search, Heart, ShoppingBag, User as UserIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentRoute?: string;
  onNavigateRoute?: (route: string) => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute = '/',
  onNavigateRoute,
  onNavigateSection
}) => {
  const {
    totalItemsCount,
    setIsCartOpen,
    setIsSearchOpen,
    wishlist,
    setIsWishlistOpen,
    setIsCustomerOrdersOpen
  } = useCart();

  const { isAuthenticated, openAuthModal } = useAuth();

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateRoute) {
      onNavigateRoute('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleShopClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateRoute) {
      onNavigateRoute('/shop');
    } else if (onNavigateSection) {
      onNavigateSection('catalog-section');
    } else {
      const el = document.getElementById('catalog-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateRoute) {
      onNavigateRoute('/search');
    } else {
      setIsSearchOpen(true);
    }
  };

  const handleSavedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateRoute) {
      onNavigateRoute('/saved');
    } else {
      setIsWishlistOpen(true);
    }
  };

  const handleBagClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateRoute) {
      onNavigateRoute('/bag');
    } else {
      setIsCartOpen(true);
    }
  };

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateRoute) {
      onNavigateRoute('/account');
    } else {
      if (!isAuthenticated) {
        openAuthModal('login');
      } else {
        setIsCustomerOrdersOpen(true);
      }
    }
  };

  const isHomeActive = currentRoute === '/' || currentRoute === '/home';
  const isShopActive = currentRoute === '/shop';
  const isSearchActive = currentRoute === '/search';
  const isSavedActive = currentRoute === '/saved' || currentRoute === '/wishlist';
  const isBagActive = currentRoute === '/bag' || currentRoute === '/cart';
  const isAccountActive = currentRoute === '/account';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-neutral-200 px-1 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom),0.5rem)]"
    >
      <div className={`grid ${isAuthenticated ? 'grid-cols-6' : 'grid-cols-5'} items-center text-center}`}>
        {/* 1. Home */}
        <button
          type="button"
          onClick={handleHomeClick}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
            isHomeActive ? 'text-black font-extrabold' : 'text-neutral-500 hover:text-black'
          }`}
          aria-label="Home"
          aria-current={isHomeActive ? 'page' : undefined}
        >
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] uppercase mt-0.5 tracking-tight">Home</span>
          {isHomeActive && <span className="absolute bottom-0 w-3 h-0.5 bg-black rounded-full" />}
        </button>

        {/* 2. Shop */}
        <button
          type="button"
          onClick={handleShopClick}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
            isShopActive ? 'text-black font-extrabold' : 'text-neutral-500 hover:text-black'
          }`}
          aria-label="Shop Catalog"
          aria-current={isShopActive ? 'page' : undefined}
        >
          <Sparkles className={`w-5 h-5 ${isShopActive ? 'text-black stroke-[2.5]' : 'text-amber-500 stroke-2'}`} />
          <span className="text-[10px] uppercase mt-0.5 tracking-tight">Shop</span>
          {isShopActive && <span className="absolute bottom-0 w-3 h-0.5 bg-black rounded-full" />}
        </button>

        {/* 3. Search */}
        <button
          type="button"
          onClick={handleSearchClick}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
            isSearchActive ? 'text-black font-extrabold' : 'text-neutral-500 hover:text-black'
          }`}
          aria-label="Search Catalog"
        >
          <Search className={`w-5 h-5 ${isSearchActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] uppercase mt-0.5 tracking-tight">Search</span>
          {isSearchActive && <span className="absolute bottom-0 w-3 h-0.5 bg-black rounded-full" />}
        </button>

        {/* 4. Saved (Wishlist) */}
        <button
          type="button"
          onClick={handleSavedClick}
          className={`relative flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            isSavedActive ? 'text-black font-extrabold' : 'text-neutral-500 hover:text-black'
          }`}
          aria-label="Saved Items"
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${isSavedActive ? 'fill-black stroke-[2.5]' : 'stroke-2'}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase mt-0.5 tracking-tight">Saved</span>
          {isSavedActive && <span className="absolute bottom-0 w-3 h-0.5 bg-black rounded-full" />}
        </button>

        {isAuthenticated && <>
        {/* 5. Bag (Cart) */}
        <button
          type="button"
          onClick={handleBagClick}
          className={`relative flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            isBagActive ? 'text-black font-extrabold' : 'text-neutral-500 hover:text-black'
          }`}
          aria-label="Shopping Bag"
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${isBagActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-black text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                {totalItemsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase mt-0.5 tracking-tight">Bag</span>
          {isBagActive && <span className="absolute bottom-0 w-3 h-0.5 bg-black rounded-full" />}
        </button>

        </>}
        {/* 6. Account */}
        <button
          type="button"
          onClick={handleAccountClick}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
            isAccountActive ? 'text-black font-extrabold' : 'text-neutral-500 hover:text-black'
          }`}
          aria-label={isAuthenticated ? 'My Orders' : 'Sign In'}
        >
          <UserIcon className={`w-5 h-5 ${isAccountActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] uppercase mt-0.5 tracking-tight truncate max-w-[48px]">
            {isAuthenticated ? 'Orders' : 'Account'}
          </span>
          {isAccountActive && <span className="absolute bottom-0 w-3 h-0.5 bg-black rounded-full" />}
        </button>
      </div>
    </nav>
  );
};

