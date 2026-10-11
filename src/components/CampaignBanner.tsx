import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CampaignBannerProps {
  onShopClick?: () => void;
}

export const CampaignBanner: React.FC<CampaignBannerProps> = ({ onShopClick }) => {
  const handleScroll = () => {
    if (onShopClick) {
      onShopClick();
    } else {
      const el = document.getElementById('shop-low-impact');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="relative w-full bg-black text-white overflow-hidden my-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-8">
          {/* Left Text Column matching reference */}
          <div className="md:col-span-6 space-y-4 text-center md:text-left z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight uppercase leading-tight">
              BRING THE GYM<br />TO YOU.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md tracking-wider">
              Zero distractions. High-retention compression knit built to sculpt, stabilize, and endure your most intense training days.
            </p>
            <div className="pt-2">
              <button
                onClick={handleScroll}
                className="px-8 py-3.5 bg-white text-black text-xs font-black tracking-widest uppercase hover:bg-neutral-200 active:scale-95 transition-all shadow-md inline-flex items-center gap-2 group cursor-pointer"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Right Image Column matching reference */}
          <div className="md:col-span-6 flex justify-center md:justify-end relative">
            <div className="relative w-full max-w-[500px] aspect-[16/10] sm:aspect-[4/3] rounded-sm overflow-hidden border border-neutral-800">
              <img
                src="/images/campaign_dark_fitness_1790852253184.jpg"
                alt="Fitness athlete in white sports bra in gym lighting"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Subtle slogan from reference */}
              <div className="absolute bottom-3 right-4 text-right">
                <p className="text-[10px] tracking-widest text-neutral-400 uppercase font-mono">
                  EMBRACE YOUR JOURNEY
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
