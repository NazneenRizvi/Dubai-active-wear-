import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CurrencyProvider } from './context/CurrencyContext';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturedCategories } from './components/FeaturedCategories';
import { TrustMarquee } from './components/TrustMarquee';
import { SocialFeed } from './components/SocialFeed';
import { ProductCard } from './components/ProductCard';
import { CampaignBanner } from './components/CampaignBanner';
import { SplitPromoBanner } from './components/SplitPromoBanner';
import { ReviewsSection } from './components/ReviewsSection';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { QuickViewModal } from './components/QuickViewModal';
import { WishlistModal } from './components/WishlistModal';
import { AdminPanel } from './components/AdminPanel';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { BrandStoryModal } from './components/BrandStoryModal';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ProductCategory, Product } from './types';
import { SlidersHorizontal, ArrowUpDown, Package, MessageCircle, X, Check, Filter } from 'lucide-react';

function Storefront() {
  const {
    selectedProductForDetail,
    setSelectedProductForDetail,
    products,
    isAdminViewOpen, isSearchOpen, isWishlistOpen, isCartOpen, isCustomerOrdersOpen,
    setIsAdminViewOpen,
    setIsCartOpen,
    setIsSearchOpen,
    setIsWishlistOpen,
    setIsCustomerOrdersOpen
  } = useCart();

  const { isAuthenticated, isOwner, openAuthModal, closeAuthModal, isAuthModalOpen } = useAuth();

  const [activeCategory, setActiveCategory] = useState<ProductCategory>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('all');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [maxPriceAed, setMaxPriceAed] = useState<number>(200);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isBrandStoryOpen, setIsBrandStoryOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Client-side Router State
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path && path !== '/') return path;
      if (hash && hash.startsWith('#/')) return hash.slice(1);
    }
    return '/';
  });

  const handleRoute = (route: string) => {
    const cleanRoute = route.toLowerCase().replace(/^#\/?/, '/').replace(/\/$/, '') || '/';
    setIsSearchOpen(false); setIsWishlistOpen(false); setIsCartOpen(false);
    setIsCustomerOrdersOpen(false); setIsAdminViewOpen(false); closeAuthModal();

    if (cleanRoute === '/shop' || cleanRoute === '#shop' || cleanRoute === '#/shop') {
      setCurrentRoute('/shop');
      const el = document.getElementById('catalog-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (cleanRoute === '/search' || cleanRoute === '#search' || cleanRoute === '#/search') {
      setCurrentRoute('/search');
      setIsSearchOpen(true);
    } else if (
      cleanRoute === '/saved' ||
      cleanRoute === '/wishlist' ||
      cleanRoute === '#saved' ||
      cleanRoute === '#/saved' ||
      cleanRoute === '#wishlist' ||
      cleanRoute === '#/wishlist'
    ) {
      setCurrentRoute('/saved');
      setIsWishlistOpen(true);
    } else if (
      cleanRoute === '/bag' ||
      cleanRoute === '/cart' ||
      cleanRoute === '#bag' ||
      cleanRoute === '#/bag' ||
      cleanRoute === '#cart' ||
      cleanRoute === '#/cart'
    ) {
      setCurrentRoute('/bag');
      setIsCartOpen(true);
    } else if (cleanRoute === '/account' || cleanRoute === '#account' || cleanRoute === '#/account') {
      setCurrentRoute('/account');
      if (isOwner) {
        window.history.replaceState({}, '', '/admin'); setCurrentRoute('/admin'); setIsAdminViewOpen(true);
      } else if (isAuthenticated) {
        setIsCustomerOrdersOpen(true);
      } else {
        openAuthModal('login');
      }
    } else if (cleanRoute === '/admin' || cleanRoute === '#admin' || cleanRoute === '#/admin') {
      if (isOwner) { setCurrentRoute('/admin'); setIsAdminViewOpen(true); }
      else {
        window.history.replaceState({}, '', '/account');
        setCurrentRoute('/account');
        if (isAuthenticated) setIsCustomerOrdersOpen(true); else openAuthModal('login');
      }
    } else if (cleanRoute === '/' || cleanRoute === '/home' || cleanRoute === '#home' || cleanRoute === '#/home') {
      setCurrentRoute('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateTo = (route: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', route);
    }
    handleRoute(route);
  };

  const routeHandler = useRef(handleRoute);
  routeHandler.current = handleRoute;

  // URL listener for back/forward buttons, hash change, and secret admin shortcut
  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash;
      const knownHash = /^#\/?(admin|shop|search|saved|wishlist|bag|cart|account|home)\/?$/.test(hash);
      routeHandler.current(knownHash ? hash : window.location.pathname);
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const route = window.location.pathname === '/admin' ? '/' : '/admin';
        window.history.pushState({}, '', route);
        routeHandler.current(route);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  useEffect(() => {
    if (isAuthenticated && (isAuthModalOpen || currentRoute === '/account')) {
      closeAuthModal(); navigateTo(isOwner ? '/admin' : '/account');
    }
    if (!isOwner) setIsAdminViewOpen(false);
  }, [isAuthenticated, isOwner]);

  const previousOverlay = useRef({ route: '/', open: false });
  useEffect(() => {
    const open = currentRoute === '/search' ? isSearchOpen : currentRoute === '/saved' ? isWishlistOpen :
      currentRoute === '/bag' ? isCartOpen : currentRoute === '/admin' ? isAdminViewOpen :
      currentRoute === '/account' ? isCustomerOrdersOpen || isAuthModalOpen : false;
    if (previousOverlay.current.route === currentRoute && previousOverlay.current.open && !open) {
      window.history.replaceState({}, '', '/'); setCurrentRoute('/');
    }
    previousOverlay.current = { route: currentRoute, open };
  }, [currentRoute, isSearchOpen, isWishlistOpen, isCartOpen, isAdminViewOpen, isCustomerOrdersOpen, isAuthModalOpen]);

  // Color options extracted dynamically
  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => p.colors.forEach((c) => map.set(c.name, c.hex)));
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  // Filtered and sorted products
  const seamlessProducts = useMemo(() => {
    return products.filter((p) => p.category === 'seamless-leggings');
  }, [products]);

  const lowImpactProducts = useMemo(() => {
    return products.filter((p) => p.category === 'sports-bras');
  }, [products]);

  // Multi-attribute Filtered list for PLP
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      // Price (AED)
      const priceAed = Math.round(p.usdPrice * 3.67);
      if (priceAed > maxPriceAed) return false;
      // Size
      if (selectedSizeFilter !== 'all' && !p.sizes.includes(selectedSizeFilter as any)) return false;
      // Color
      if (selectedColorFilter !== 'all' && !p.colors.some((c) => c.name === selectedColorFilter)) return false;
      // In Stock
      if (inStockOnly && !p.inStock) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.usdPrice - b.usdPrice;
      if (sortBy === 'price-desc') return b.usdPrice - a.usdPrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [products, activeCategory, maxPriceAed, selectedSizeFilter, selectedColorFilter, inStockOnly, sortBy]);

  const scrollToSection = (id: string) => {
    if (id === 'shop-seamless' || id === 'seamless-leggings') {
      setActiveCategory('seamless-leggings');
    } else if (id === 'shop-low-impact' || id === 'sports-bras') {
      setActiveCategory('sports-bras');
    } else if (id === 'bottoms') {
      setActiveCategory('bottoms');
    } else if (id === 'shop-all' || id === 'all') {
      setActiveCategory('all');
    }

    const targetId = (id === 'shop-seamless' || id === 'shop-low-impact' || id === 'bottoms' || id === 'shop-all')
      ? 'catalog-section'
      : id;

    const el = document.getElementById(targetId) || document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const hasActiveFilters =
    activeCategory !== 'all' ||
    selectedSizeFilter !== 'all' ||
    selectedColorFilter !== 'all' ||
    maxPriceAed < 200 ||
    inStockOnly;

  const resetAllFilters = () => {
    setActiveCategory('all');
    setSelectedSizeFilter('all');
    setSelectedColorFilter('all');
    setMaxPriceAed(200);
    setInStockOnly(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-neutral-900 pb-16 md:pb-0 overflow-x-hidden">
      {/* 1. Global Navigation */}
      <Navbar
        currentRoute={currentRoute}
        onNavigateRoute={navigateTo}
        onOpenBrandStory={() => setIsBrandStoryOpen(true)}
        onNavigateSection={scrollToSection}
      />

      <main className="flex-grow">
        {/* 2. Top Hero Carousel with Stagger Reveal & Shimmer CTA */}
        <Hero
          onShopClick={() => {
            scrollToSection('catalog-section');
          }}
        />

        {/* 3. Featured Categories Row with Hover Zoom */}
        <FeaturedCategories
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            scrollToSection('catalog-section');
          }}
        />

        {/* 5. Product Catalog & Filter Toolbar (PLP) */}
        <div id="shop-seamless" className="relative -top-24" />
        <div id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4 scroll-mt-20">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            {/* Category Navigation Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'all'
                    ? 'bg-black text-white'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:border-black'
                }`}
              >
                All Drops ({products.length})
              </button>
              <button
                onClick={() => setActiveCategory('seamless-leggings')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'seamless-leggings'
                    ? 'bg-black text-white'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:border-black'
                }`}
              >
                Seamless Leggings
              </button>
              <button
                onClick={() => setActiveCategory('sports-bras')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'sports-bras'
                    ? 'bg-black text-white'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:border-black'
                }`}
              >
                Sports Bras
              </button>
              <button
                onClick={() => setActiveCategory('bottoms')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'bottoms'
                    ? 'bg-black text-white'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:border-black'
                }`}
              >
                Shorts & Bottoms
              </button>
              <button
                onClick={() => setActiveCategory('must-haves')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  activeCategory === 'must-haves'
                    ? 'bg-black text-white'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:border-black'
                }`}
              >
                Must Haves
              </button>
            </div>

            {/* Filter Toggle & Sort Dropdown */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
              <button
                onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
                className={`px-3 py-2 border flex items-center gap-1.5 font-bold uppercase transition-colors cursor-pointer ${
                  hasActiveFilters ? 'border-black bg-black text-white' : 'border-neutral-300 bg-white text-neutral-800 hover:border-black'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters {hasActiveFilters && '(Active)'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-bold uppercase text-[11px] hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-neutral-300 px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-black cursor-pointer uppercase"
                >
                  <option value="featured">Featured Picks</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Expandable Advanced Filter Tray */}
          {isFilterDrawerOpen && (
            <div className="bg-white border border-neutral-200 p-4 sm:p-6 my-4 shadow-sm animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                  Filter Activewear By Specifications
                </h4>
                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="text-xs text-red-600 font-bold underline hover:text-red-800 cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-xs">
                {/* 1. Price Range Slider */}
                <div>
                  <div className="flex justify-between mb-1.5 font-bold uppercase">
                    <span>Max Price</span>
                    <span className="font-mono text-neutral-900">{maxPriceAed} AED</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="250"
                    step="5"
                    value={maxPriceAed}
                    onChange={(e) => setMaxPriceAed(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-mono">
                    <span>40 AED</span>
                    <span>250 AED</span>
                  </div>
                </div>

                {/* 2. Size Filter */}
                <div>
                  <label className="block font-bold uppercase mb-1.5">Size</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['all', 'XS', 'S', 'M', 'L', 'XL'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSizeFilter(s)}
                        className={`px-2.5 py-1 text-xs font-bold uppercase border cursor-pointer ${
                          selectedSizeFilter === s
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Color Filter */}
                <div>
                  <label className="block font-bold uppercase mb-1.5">Color</label>
                  <select
                    value={selectedColorFilter}
                    onChange={(e) => setSelectedColorFilter(e.target.value)}
                    className="w-full p-2 bg-white border border-neutral-300 font-medium cursor-pointer"
                  >
                    <option value="all">All Colors</option>
                    {availableColors.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Availability */}
                <div>
                  <label className="block font-bold uppercase mb-1.5">Availability</label>
                  <label className="flex items-center gap-2 cursor-pointer mt-2 text-neutral-700 font-semibold">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 accent-black"
                    />
                    <span>In-Stock Items Only</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 py-2">
              <span className="text-[11px] text-neutral-500 font-semibold">Active:</span>

              {activeCategory !== 'all' && (
                <span className="px-2.5 py-1 bg-neutral-100 text-neutral-800 text-[11px] font-bold uppercase flex items-center gap-1.5 border border-neutral-200">
                  <span>Category: {activeCategory}</span>
                  <button onClick={() => setActiveCategory('all')} className="hover:text-red-600 cursor-pointer">×</button>
                </span>
              )}

              {selectedSizeFilter !== 'all' && (
                <span className="px-2.5 py-1 bg-neutral-100 text-neutral-800 text-[11px] font-bold uppercase flex items-center gap-1.5 border border-neutral-200">
                  <span>Size: {selectedSizeFilter}</span>
                  <button onClick={() => setSelectedSizeFilter('all')} className="hover:text-red-600 cursor-pointer">×</button>
                </span>
              )}

              {selectedColorFilter !== 'all' && (
                <span className="px-2.5 py-1 bg-neutral-100 text-neutral-800 text-[11px] font-bold uppercase flex items-center gap-1.5 border border-neutral-200">
                  <span>Color: {selectedColorFilter}</span>
                  <button onClick={() => setSelectedColorFilter('all')} className="hover:text-red-600 cursor-pointer">×</button>
                </span>
              )}

              {maxPriceAed < 200 && (
                <span className="px-2.5 py-1 bg-neutral-100 text-neutral-800 text-[11px] font-bold uppercase flex items-center gap-1.5 border border-neutral-200">
                  <span>Under {maxPriceAed} AED</span>
                  <button onClick={() => setMaxPriceAed(200)} className="hover:text-red-600 cursor-pointer">×</button>
                </span>
              )}

              <button
                onClick={resetAllFilters}
                className="text-[11px] text-neutral-500 underline hover:text-black ml-1 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* 6. Product Grid (4 Columns) with Animated Badges */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-black font-display tracking-wider text-neutral-900 uppercase">
              {activeCategory === 'all' ? 'NEW ARRIVALS & BEST SELLERS' : activeCategory.toUpperCase().replace('-', ' ')}
            </h2>
            <span className="text-xs text-neutral-500 font-mono">
              Showing {filteredProducts.length} items
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-neutral-200 space-y-3">
              <Package className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="text-sm font-bold text-neutral-800 uppercase">No activewear matching your filters</p>
              <button
                onClick={resetAllFilters}
                className="px-5 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* 7. Mid-Page Split Promo Banner */}
        <SplitPromoBanner
          onCategorySelect={(cat) => {
            setActiveCategory(cat as ProductCategory);
            scrollToSection('catalog-section');
          }}
        />

        {/* 8. Trust Badges & Verified Testimonials Marquee */}
        <TrustMarquee />

        {/* 9. Campaign Banner: BRING THE GYM TO YOU */}
        <CampaignBanner onShopClick={() => {
          setActiveCategory('sports-bras');
          scrollToSection('catalog-section');
        }} />

        {/* 10. Community Reviews Section */}
        <ReviewsSection />

        {/* 11. Instagram Social Feed Lookbook */}
        <SocialFeed />
      </main>

      {/* 12. Comprehensive Footer */}
      <Footer
        onCategoryClick={(cat) => {
          setActiveCategory(cat as ProductCategory);
          scrollToSection('catalog-section');
        }}
        onOpenBrandStory={() => setIsBrandStoryOpen(true)}
      />

      {/* Modals & Overlays */}
      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
      />
      <QuickViewModal />
      <WishlistModal />
      <CartDrawer />
      <CheckoutModal />
      <SearchModal />
      <AuthModal />
      <BrandStoryModal
        isOpen={isBrandStoryOpen}
        onClose={() => setIsBrandStoryOpen(false)}
      />
      <CustomerOrdersModal />
      <AdminPanel />
      <MobileBottomNav
        currentRoute={currentRoute}
        onNavigateRoute={navigateTo}
        onNavigateSection={scrollToSection}
      />

      {/* Persistent Floating WhatsApp Quick Support (Always Accessible on Mobile & Desktop) */}
      <aside aria-label="Support chat" className="fixed bottom-18 sm:bottom-6 right-3 sm:right-6 z-30">
        <a
          href="https://wa.me/923113270742?text=Assalam-o-Alaikum!%20I%20have%20an%20inquiry%20regarding%20ICON%20Activewear."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-400/40 text-xs font-bold transition-all cursor-pointer hover:shadow-emerald-900/30"
          title="Chat with WhatsApp Support"
        >
          <MessageCircle className="w-4 h-4 fill-white text-white shrink-0" />
          <span className="hidden sm:inline font-bold">0311-3270742</span>
          <span className="sm:hidden font-bold">WhatsApp</span>
        </a>
      </aside>
    </div>
  );
}

export default function App() {
  return (
    <CurrencyProvider>
      <AuthProvider>
        <CartProvider>
          <Storefront />
        </CartProvider>
      </AuthProvider>
    </CurrencyProvider>
  );
}
