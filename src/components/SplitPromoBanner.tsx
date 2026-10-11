import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SplitPromoBannerProps {
  onCategorySelect?: (cat: string) => void;
}

export const SplitPromoBanner: React.FC<SplitPromoBannerProps> = ({ onCategorySelect }) => {
  const handleSelect = (category: string) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    } else {
      const el = document.getElementById('shop-seamless');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 my-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Banner: SHOP BOTTOMS matching reference */}
        <div className="relative group overflow-hidden bg-neutral-100 border border-neutral-200 aspect-[16/10] sm:aspect-[16/9] flex items-center">
          <img
            src="/images/promo_split_bottoms_1790852297885.jpg"
            alt="Fitness athlete stretching in athletic bottoms"
            className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent sm:w-2/3" />

          <div className="relative z-10 p-6 sm:p-10 space-y-3 max-w-xs">
            <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-neutral-900 uppercase leading-none">
              SHOP<br />BOTTOMS
            </h3>
            <p className="text-xs text-neutral-600 font-medium">
              High-waist cycle shorts & squat-proof compression leggings.
            </p>
            <div>
              <button
                onClick={() => handleSelect('bottoms')}
                className="px-6 py-2.5 bg-black text-white text-xs font-bold tracking-widest uppercase hover:bg-neutral-800 transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Banner: SHOP MUST HAVES matching reference */}
        <div className="relative group overflow-hidden bg-neutral-900 border border-neutral-800 aspect-[16/10] sm:aspect-[16/9] flex items-center">
          <img
            src="/images/campaign_dark_fitness_1790852253184.jpg"
            alt="Athlete in gym training gear"
            className="absolute inset-0 w-full h-full object-cover object-right transform transition-transform duration-700 group-hover:scale-105 opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent sm:w-3/4" />

          <div className="relative z-10 p-6 sm:p-10 space-y-3 max-w-xs text-white">
            <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight uppercase leading-none">
              SHOP<br />MUST HAVES
            </h3>
            <p className="text-xs text-neutral-300 font-medium">
              Our most coveted drop: rib knit tanks and low-impact staples.
            </p>
            <div>
              <button
                onClick={() => handleSelect('must-haves')}
                className="px-6 py-2.5 bg-white text-black text-xs font-bold tracking-widest uppercase hover:bg-neutral-200 transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
