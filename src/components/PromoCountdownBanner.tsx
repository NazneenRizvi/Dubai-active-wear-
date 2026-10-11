import React, { useState, useEffect } from 'react';
import { Timer, Tag, ArrowRight, Check, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface PromoCountdownBannerProps {
  onShopSale?: () => void;
}

export const PromoCountdownBanner: React.FC<PromoCountdownBannerProps> = ({ onShopSale }) => {
  const { applyPromoCode } = useCart();
  const [copied, setCopied] = useState(false);

  // Countdown timer initialized to 8 hours 42 mins from load, ticking down
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 42,
    seconds: 15
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 12, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText('FLASH40');
    applyPromoCode('FLASH40');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <section className="relative w-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-black text-white py-8 sm:py-10 px-4 sm:px-8 border-y border-neutral-800 overflow-hidden my-10">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
        {/* Left Side: Offer copy */}
        <div className="text-center lg:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-black uppercase tracking-widest rounded-full">
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>LIMITED TIME DROP · 40% OFF</span>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight uppercase leading-tight">
            EXCLUSIVE FLASH ACTIVE SALE
          </h3>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg">
            Use code <strong className="text-white font-mono bg-neutral-800 px-1.5 py-0.5 rounded-xs">FLASH40</strong> at checkout for an instant 40% discount across our entire seamless lineup.
          </p>
        </div>

        {/* Center: Live Countdown Clock */}
        <div className="flex items-center gap-3 sm:gap-4 text-center">
          <div className="flex flex-col items-center">
            <span className="w-14 sm:w-16 py-2 bg-neutral-900 border border-neutral-700 text-xl sm:text-2xl font-black font-mono tracking-wider text-amber-400 shadow-md">
              {pad(timeLeft.hours)}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 mt-1 tracking-wider">Hours</span>
          </div>
          <span className="text-xl font-bold text-neutral-600 -mt-4">:</span>

          <div className="flex flex-col items-center">
            <span className="w-14 sm:w-16 py-2 bg-neutral-900 border border-neutral-700 text-xl sm:text-2xl font-black font-mono tracking-wider text-amber-400 shadow-md">
              {pad(timeLeft.minutes)}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 mt-1 tracking-wider">Mins</span>
          </div>
          <span className="text-xl font-bold text-neutral-600 -mt-4">:</span>

          <div className="flex flex-col items-center">
            <span className="w-14 sm:w-16 py-2 bg-neutral-900 border border-neutral-700 text-xl sm:text-2xl font-black font-mono tracking-wider text-amber-400 shadow-md">
              {pad(timeLeft.seconds)}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 mt-1 tracking-wider">Secs</span>
          </div>
        </div>

        {/* Right Side: CTA Button and Coupon Copy */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="px-5 py-3.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>CODE APPLIED!</span>
              </>
            ) : (
              <>
                <Tag className="w-4 h-4 text-amber-400" />
                <span>APPLY CODE: FLASH40</span>
              </>
            )}
          </button>

          <button
            onClick={onShopSale}
            className="px-6 py-3.5 bg-white text-black hover:bg-neutral-200 text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
          >
            <span>SHOP SALE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
