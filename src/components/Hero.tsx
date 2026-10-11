import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onShopClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onShopClick }) => {
  const handleScrollToShop = () => {
    if (onShopClick) {
      onShopClick();
    }
    const el = document.getElementById('catalog-section') || document.getElementById('shop-seamless');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full bg-[#f6cac9]/30 overflow-hidden border-b border-[#eed1d1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-8 md:gap-12">
          {/* Left Column: Model Image */}
          <div className="md:col-span-7 flex justify-center md:justify-start order-2 md:order-1">
            <div className="relative w-full max-w-[580px] aspect-[16/10] sm:aspect-[16/9] md:aspect-[4/3] rounded-sm overflow-hidden shadow-sm group">
              <img
                src="/images/hero_pink_activewear_1790852235638.jpg"
                alt="Fitness model in pink ribbed tank and seamless leggings"
                className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Right Column: Hero Copy matching reference */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left order-1 md:order-2 space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-neutral-900 uppercase leading-[1.05]">
              NEW RELEASES
            </h1>

            <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-neutral-700 uppercase">
              JOIN THE MOVEMENT
            </p>

            <div className="pt-2">
              <button
                onClick={handleScrollToShop}
                className="px-8 py-3.5 bg-black text-white text-xs sm:text-sm font-bold tracking-widest uppercase hover:bg-neutral-800 active:scale-95 transition-all duration-200 shadow-sm flex items-center gap-2 group cursor-pointer"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div className="pt-4 flex items-center gap-6 text-[11px] text-neutral-600 tracking-wider uppercase border-t border-neutral-300/60 mt-4 w-full justify-center md:justify-start">
              <span>· Circular Knit Tech</span>
              <span>· Zero Chafing</span>
              <span>· 4-Way Flex</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
