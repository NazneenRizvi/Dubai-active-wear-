import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Check, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotalUsd,
    discountUsd,
    shippingUsd,
    totalUsd,
    isFreeShipping,
    freeShippingThresholdUsd,
    amountNeededForFreeShippingUsd,
    promoCode,
    promoDiscountPercent,
    applyPromoCode,
    removePromoCode,
    setIsCheckoutOpen
  } = useCart();

  const { formatPrice } = useCurrency();
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);

  // Outside click listener for drawer content
  useEffect(() => {
    if (!isCartOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isCartOpen, setIsCartOpen]);

  // Escape key listener
  useEffect(() => {
    if (!isCartOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    setPromoMessage({ text: res.message, isError: !res.success });
    if (res.success) {
      setPromoInput('');
    }
  };

  const freeShippingProgress = Math.min(
    100,
    ((freeShippingThresholdUsd - amountNeededForFreeShippingUsd) / freeShippingThresholdUsd) * 100
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div ref={drawerRef} className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-neutral-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-[#FAF9F8]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-neutral-900" />
              <h2 className="text-sm font-black font-display tracking-wider uppercase text-neutral-900">
                Your Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 text-neutral-500 hover:text-black transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 text-xs">
            {isFreeShipping ? (
              <p className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                🎉 You have unlocked FREE Delivery! (Orders above 150 AED)
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-neutral-700">
                  Add <span className="font-bold text-black">{formatPrice(amountNeededForFreeShippingUsd)}</span> more for <span className="font-bold">FREE DELIVERY</span> (Free on 150 AED+)
                </p>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-black h-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-neutral-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-800 uppercase tracking-wider">
                    Your bag is empty
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Explore our seamless collection and find your fit.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-black text-white text-xs font-bold tracking-widest uppercase hover:bg-neutral-800 transition-colors"
                >
                  START SHOPPING
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-24 bg-neutral-100 shrink-0 overflow-hidden border border-neutral-200">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-extrabold uppercase text-neutral-900 tracking-wider">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-400 hover:text-red-600 transition-colors ml-2"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block border border-neutral-300"
                            style={{ backgroundColor: item.selectedColor.hex }}
                          />
                          {item.selectedColor.name}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-neutral-700">Size: {item.selectedSize}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-300 text-xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-neutral-600 hover:bg-neutral-100"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 tabular-nums font-semibold min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-neutral-600 hover:bg-neutral-100"
                        >
                          +
                        </button>
                      </div>

                      {/* Total Item Price */}
                      <div className="text-xs font-bold text-neutral-900 tabular-nums">
                        {formatPrice(
                          item.product.usdPrice * item.quantity,
                          item.product.pkrPrice ? item.product.pkrPrice * item.quantity : undefined
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="border-t border-neutral-200 bg-[#FAF9F8] p-6 space-y-4">
              {/* Promo Code Input */}
              <div>
                {promoCode ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Tag className="w-3.5 h-3.5" /> Code: {promoCode} ({promoDiscountPercent}% OFF)
                    </span>
                    <button
                      onClick={removePromoCode}
                      className="text-neutral-500 hover:text-black font-semibold text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Discount code (e.g. WELCOME10)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 bg-white focus:outline-hidden focus:border-black uppercase tracking-wider"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {promoMessage && (
                  <p className={`text-[11px] mt-1 ${promoMessage.isError ? 'text-red-600' : 'text-emerald-700'}`}>
                    {promoMessage.text}
                  </p>
                )}
              </div>

              {/* Subtotal Calculation */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-semibold text-neutral-900">
                    {formatPrice(subtotalUsd)}
                  </span>
                </div>

                {discountUsd > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Promo Discount</span>
                    <span className="tabular-nums">-{formatPrice(discountUsd)}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600">
                  <span>Estimated Shipping</span>
                  <span className="tabular-nums font-semibold">
                    {shippingUsd === 0 ? 'FREE' : formatPrice(shippingUsd)}
                  </span>
                </div>

                <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm font-black text-neutral-900">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(totalUsd)}</span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-black tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-500 tracking-wider uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
                <span>Encrypted 256-Bit SSL Checkout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
