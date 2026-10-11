import React, { useState, useRef, useEffect } from 'react';
import { X, ShoppingBag, Star, Check, ShieldCheck, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { ProductColor, ProductSize } from '../types';

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, toggleWishlist, isInWishlist } = useCart();
  const { formatPrice } = useCurrency();

  const product = quickViewProduct;

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(() => {
    return product ? product.colors[0] : null;
  });

  const [selectedSize, setSelectedSize] = useState<ProductSize>('S');
  const [justAdded, setJustAdded] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the modal content area
  useEffect(() => {
    if (!product) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setQuickViewProduct(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [product, setQuickViewProduct]);

  // Close on Escape key
  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuickViewProduct(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, setQuickViewProduct]);

  if (!product) return null;

  const activeColor = selectedColor || product.colors[0];
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, activeColor, selectedSize, 1);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      setQuickViewProduct(null);
    }, 1200);
  };

  return (
    <div
      onClick={() => setQuickViewProduct(null)}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-2xl shadow-2xl border border-neutral-300 transform transition-all duration-300 scale-100 flex flex-col md:flex-row overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-black hover:text-white rounded-full transition-colors z-20 cursor-pointer shadow-xs"
          aria-label="Close quick view"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Product Image */}
        <div className="md:w-1/2 relative aspect-[3/4] bg-neutral-100 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          {product.isNew && (
            <span className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 animate-pulse">
              NEW
            </span>
          )}
        </div>

        {/* Right Side: Quick Add Details */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">
              {product.categoryLabel}
            </span>
            <h3 className="text-base sm:text-lg font-black font-display tracking-tight uppercase text-neutral-900 mt-1">
              {product.name}
            </h3>

            {/* Price */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-base font-black text-neutral-900 tabular-nums">
                {formatPrice(product.usdPrice, product.pkrPrice)}
              </span>
              {product.originalPriceUsd && (
                <span className="text-xs text-neutral-400 line-through tabular-nums">
                  {formatPrice(product.originalPriceUsd, product.originalPricePkr)}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-neutral-300'}`}
                  />
                ))}
              </div>
              <span className="font-bold text-neutral-800">{product.rating}</span>
              <span>({product.reviewsCount} reviews)</span>
            </div>

            {/* Color Swatches */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Color: <span className="font-normal text-neutral-500">{activeColor.name}</span>
              </label>
              <div className="flex items-center gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c)}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                      activeColor.name === c.name
                        ? 'scale-125 ring-2 ring-black ring-offset-2 border-transparent'
                        : 'border-neutral-300 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                  Select Size
                </label>
                <span className="text-[10px] text-emerald-700 font-bold uppercase">
                  True to size fit
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`py-2 text-xs font-bold uppercase transition-colors cursor-pointer border ${
                      selectedSize === s
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white text-neutral-800 border-neutral-200 hover:border-black'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                disabled={justAdded}
                className="flex-1 py-3 bg-black hover:bg-neutral-800 active:scale-95 text-white text-xs font-black tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>ADDED TO BAG!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD TO BAG ({selectedSize})</span>
                  </>
                )}
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 border transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-neutral-200 hover:border-black text-neutral-700'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

            <p className="text-[10px] text-center text-neutral-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Cash on Delivery & Free Exchange in Pakistan</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
