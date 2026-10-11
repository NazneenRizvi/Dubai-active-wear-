import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ProductCategory } from '../types';

interface FeaturedCategoriesProps {
  onSelectCategory: (category: ProductCategory) => void;
  activeCategory: ProductCategory;
}

interface CategoryCard {
  id: ProductCategory;
  title: string;
  tagline: string;
  count: string;
  image: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    id: 'seamless-leggings',
    title: 'SEAMLESS LEGGINGS',
    tagline: 'High-waist contour & 100% squat-proof compression',
    count: '6 Styles',
    image: '/images/product_seamless_leggings_1790852268334.jpg'
  },
  {
    id: 'sports-bras',
    title: 'SPORTS BRAS',
    tagline: 'Medium & low-impact strappy lift engineered to breathe',
    count: '4 Styles',
    image: '/images/product_sports_bra_1790852283602.jpg'
  },
  {
    id: 'bottoms',
    title: 'SHORTS & BOTTOMS',
    tagline: 'High-waist cycle shorts & training bottoms with zero chafing',
    count: '3 Styles',
    image: '/images/promo_split_bottoms_1790852297885.jpg'
  },
  {
    id: 'must-haves',
    title: 'MUST-HAVE STAPLES',
    tagline: 'Rib knit active tanks & form-fitting gym essentials',
    count: '3 Styles',
    image: '/images/campaign_dark_fitness_1790852253184.jpg'
  }
];

export const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({
  onSelectCategory,
  activeCategory
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-neutral-200 gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>DISCOVER THE LINEUP</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-neutral-900 uppercase">
            FEATURED COLLECTIONS
          </h2>
        </div>
        <p className="text-xs text-neutral-500 max-w-sm">
          Precision-tailored activewear engineered with circular micro-knit technology in Karachi, Pakistan.
        </p>
      </div>

      {/* Horizontal Scrollable Row with Hover Zoom */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`group relative overflow-hidden bg-white border cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'border-black ring-2 ring-black shadow-md'
                  : 'border-neutral-200 hover:border-black hover:shadow-md'
              }`}
            >
              {/* Image Container with Zoom effect on hover */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                {/* Count Badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase text-neutral-900 shadow-xs">
                  {cat.count}
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 text-white space-y-1">
                  <h3 className="text-sm sm:text-base font-black font-display tracking-wider uppercase leading-tight group-hover:text-amber-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-neutral-300 line-clamp-1 leading-snug">
                    {cat.tagline}
                  </p>

                  <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-amber-300 uppercase">
                    <span>SHOP NOW</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
