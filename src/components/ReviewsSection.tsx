import React, { useState } from 'react';
import { Star, CheckCircle2, ThumbsUp } from 'lucide-react';
import { TESTIMONIALS } from '../data/products';

export const ReviewsSection: React.FC = () => {
  const [likes, setLikes] = useState<Record<string, number>>({ '1': 48, '2': 36, '3': 52 });
  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});

  const handleLike = (id: string) => {
    if (hasLiked[id]) return;
    setLikes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setHasLiked((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section id="reviews-section" className="w-full bg-[#FAF9F8] border-y border-neutral-200 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-neutral-200 gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-neutral-500 uppercase">
              ATHLETE VERIFIED
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-neutral-900 uppercase mt-1">
              COMMUNITY REVIEWS
            </h2>
          </div>

          {/* Social Proof Metric Lockup */}
          <div className="flex items-center gap-6 text-xs text-neutral-700">
            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-extrabold text-neutral-900 text-sm">4.9 / 5.0</span>
            </div>
            <span className="text-neutral-300">|</span>
            <span>Over 14,200+ Verified Orders</span>
            <span className="text-neutral-300 hidden sm:inline">|</span>
            <span className="hidden sm:inline">98% Fit Accuracy</span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-white p-6 border border-neutral-200 flex flex-col justify-between space-y-4 hover:border-neutral-400 transition-colors shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Buyer
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed italic">
                  "{t.content}"
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase text-neutral-900">{t.author}</h4>
                  <p className="text-[11px] text-neutral-500">{t.role} · {t.location}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Purchased: {t.productPurchased}</p>
                </div>

                <button
                  onClick={() => handleLike(t.id)}
                  className={`flex items-center gap-1 text-[11px] px-2 py-1 border transition-colors ${
                    hasLiked[t.id]
                      ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                      : 'border-neutral-200 text-neutral-500 hover:text-black hover:border-neutral-400'
                  }`}
                  aria-label="Helpful review"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>{likes[t.id]}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
