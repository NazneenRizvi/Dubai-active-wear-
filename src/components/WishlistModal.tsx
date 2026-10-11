import React, { useRef, useEffect } from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

export const WishlistModal: React.FC = () => {
  const { wishlist, isWishlistOpen, setIsWishlistOpen, toggleWishlist, addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the modal content area
  useEffect(() => {
    if (!isWishlistOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsWishlistOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isWishlistOpen, setIsWishlistOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isWishlistOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsWishlistOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWishlistOpen, setIsWishlistOpen]);

  if (!isWishlistOpen) return null;

  return (
    <div
      onClick={() => setIsWishlistOpen(false)}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-2xl max-h-[90vh] shadow-2xl border border-neutral-300 flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#111111] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-neutral-800 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            <h2 className="text-sm sm:text-base font-black font-display tracking-wider uppercase">
              My Saved Wishlist ({wishlist.length})
            </h2>
          </div>
          <button
            onClick={() => setIsWishlistOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close wishlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist Items List */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {wishlist.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Your wishlist is empty
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Tap the heart icon on any activewear piece to save it here for later.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  START EXPLORING
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wishlist.map((product) => (
                <div
                  key={product.id}
                  className="border border-neutral-200 bg-[#FAF9F8] p-3 flex gap-3 relative group"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-24 object-cover border border-neutral-200 shrink-0 bg-white"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">
                        {product.categoryLabel}
                      </span>
                      <h4 className="text-xs font-black uppercase text-neutral-900 line-clamp-1">
                        {product.name}
                      </h4>
                      <p className="text-xs font-bold text-neutral-900 mt-1">
                        {formatPrice(product.usdPrice, product.pkrPrice)}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          addToCart(product, product.colors[0], product.sizes[0], 1);
                        }}
                        className="flex-1 py-1.5 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Move to Bag</span>
                      </button>

                      <button
                        onClick={() => toggleWishlist(product)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
