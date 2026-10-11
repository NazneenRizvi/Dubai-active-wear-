import React from 'react';
import { Truck, ShieldCheck, CheckCircle2, RotateCcw, Award, Star, Sparkles, MapPin } from 'lucide-react';

const TRUST_BADGES = [
  {
    icon: Truck,
    title: 'FREE DELIVERY OVER 150 AED',
    desc: 'Across Dubai, Abu Dhabi, Sharjah & all UAE'
  },
  {
    icon: ShieldCheck,
    title: '100% SQUAT-PROOF PROMISE',
    desc: 'Tested non-sheer 280 GSM circular micro-knit'
  },
  {
    icon: CheckCircle2,
    title: 'CARDS, APPLE PAY & COD',
    desc: 'Pay securely with UAE card, Apple Pay, or cash on delivery'
  },
  {
    icon: RotateCcw,
    title: '30-DAY EASY EXCHANGE',
    desc: 'Hassle-free size swap support on WhatsApp'
  },
  {
    icon: Award,
    title: 'CIRCULAR KNIT TECH',
    desc: 'Zero front seams for maximum anti-chafe comfort'
  },
  {
    icon: MapPin,
    title: 'DISPATCH FROM DUBAI HQ',
    desc: 'Direct same-day/next-day UAE fulfillment'
  }
];

const TESTIMONIALS = [
  {
    name: 'Ayesha Khan',
    city: 'Karachi (Clifton)',
    rating: 5,
    title: 'Best seamless leggings in Pakistan',
    text: 'I ordered the Balance Seamless Leggings in Olive Heather. The waistband does not roll down at all during deadlifts and squats! The fabric feels identical to international brands.',
    product: 'Balance Seamless Leggings',
    date: '2 days ago'
  },
  {
    name: 'Dr. Fatima Tariq',
    city: 'Lahore (DHA)',
    rating: 5,
    title: 'Super fast COD delivery',
    text: 'Received my parcel in 2 days via Trax COD. The packaging was luxury grade and the low-impact sports bra is so flattering and supportive. Will definitely order the pink set next!',
    product: 'Cloud Ribbed Sports Bra',
    date: '4 days ago'
  },
  {
    name: 'Zainab Rizwan',
    city: 'Islamabad (F-7)',
    rating: 5,
    title: 'True squat-proof non-sheer knit',
    text: 'Usually seamless leggings turn transparent in deep squats, but ICON activewear is completely opaque and compressive. Customer support on WhatsApp answered my sizing questions in 5 mins!',
    product: 'Elite Compression Leggings',
    date: '1 week ago'
  }
];

export const TrustMarquee: React.FC = () => {
  return (
    <section className="w-full bg-[#FAF9F8] border-b border-neutral-200 py-12 sm:py-16 overflow-hidden">
      {/* 1. Animated Trust Badges Marquee Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {TRUST_BADGES.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-4 bg-white border border-neutral-200 hover:border-black transition-colors shadow-2xs group"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-100 group-hover:bg-black group-hover:text-white transition-colors flex items-center justify-center text-neutral-800 mb-2.5">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900 leading-tight">
                  {badge.title}
                </h4>
                <p className="text-[10px] text-neutral-500 mt-1 leading-snug">
                  {badge.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Customer Testimonials Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 pb-3 border-b border-neutral-200 gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>REAL ATHLETE FEEDBACK</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-neutral-900 uppercase">
              LOVED BY 10,000+ ATHLETES ACROSS PAKISTAN
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <span>4.9 / 5 Average Rating</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="bg-white p-6 border border-neutral-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">{t.date}</span>
                </div>

                <h4 className="text-sm font-black uppercase text-neutral-900 tracking-wide">
                  "{t.title}"
                </h4>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {t.text}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-neutral-900">{t.name}</p>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                      Verified Buyer
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">{t.city}</p>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-50 px-2 py-1 border border-neutral-200">
                  {t.product}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
