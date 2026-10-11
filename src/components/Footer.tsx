import React, { useState } from 'react';
import { ArrowRight, Check, Mail, ShieldCheck, Heart, Lock, MessageCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { STORE_OWNER_EMAIL, STORE_OWNER_CONFIG } from '../config';

interface FooterProps {
  onCategoryClick?: (category: string) => void;
  onOpenBrandStory?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onCategoryClick, onOpenBrandStory }) => {
  const { currentCurrencyDetails } = useCurrency();
  const { setIsAdminViewOpen } = useCart();
  const { user } = useAuth();
  const isStoreOwner = !!user && user.email?.toLowerCase().trim() === STORE_OWNER_EMAIL.toLowerCase().trim();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setSubscribing(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem('fj_subscribers');
        const parsed = existing ? JSON.parse(existing) : [];
        if (!parsed.includes(email.trim())) {
          localStorage.setItem('fj_subscribers', JSON.stringify([...parsed, email.trim()]));
        }
      }
      setSubscribed(true);
      setSubscribing(false);
      setEmail('');
    }, 400);
  };

  return (
    <footer id="contact" className="w-full bg-[#111111] text-white border-t border-neutral-800 scroll-mt-10">
      <div id="contact-section" />
      {/* 1. Value Props Strip */}
      <div className="border-b border-neutral-800 py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Free Delivery Above 150 AED</h4>
            <p className="text-[11px] text-neutral-400">Fast express delivery across Dubai and all UAE Emirates</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Squat-Proof Certified</h4>
            <p className="text-[11px] text-neutral-400">High-density 280 GSM seamless activewear</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Cards, Apple Pay & COD</h4>
            <p className="text-[11px] text-neutral-400">Secure online bank payments or cash on delivery</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Dubai HQ & WhatsApp Support</h4>
            <div className="flex flex-col gap-1 text-[11px]">
              <a
                href="https://wa.me/923113270742?text=Assalam-o-Alaikum!%20I%20have%20an%20inquiry%20regarding%20ICON%20Activewear."
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors"
                title="Chat with WhatsApp Support"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp: {STORE_OWNER_CONFIG.whatsappDisplay}</span>
              </a>
              <a
                href={`mailto:${STORE_OWNER_CONFIG.supportEmail}?subject=ICON%20Activewear%20Inquiry`}
                className="text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
                title={`Email ${STORE_OWNER_CONFIG.name} directly`}
              >
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                <span>{STORE_OWNER_CONFIG.supportEmail}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Brand & Newsletter Column */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-xl font-black font-display tracking-widest uppercase">
              ICON ACTIVEWEAR
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              Premium high-performance athletic apparel engineered for endurance and everyday fitness. Dispatched directly from Karachi, Pakistan.
            </p>

            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                Join the VIP club & get 15% off
              </p>
              {subscribed ? (
                <div className="p-3 bg-neutral-900 border border-emerald-500/50 text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Welcome! Use code <strong className="text-white">WELCOME10</strong> for your discount.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-300">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <button
                  onClick={() => onCategoryClick?.('seamless-leggings')}
                  className="hover:text-white transition-colors"
                >
                  Seamless Leggings
                </button>
              </li>
              <li>
                <button
                  onClick={() => onCategoryClick?.('sports-bras')}
                  className="hover:text-white transition-colors"
                >
                  Sports Bras
                </button>
              </li>
              <li>
                <button
                  onClick={() => onCategoryClick?.('bottoms')}
                  className="hover:text-white transition-colors"
                >
                  Cycling Shorts
                </button>
              </li>
              <li>
                <button
                  onClick={() => onCategoryClick?.('must-haves')}
                  className="hover:text-white transition-colors"
                >
                  Must Haves
                </button>
              </li>
              <li>
                <button
                  onClick={() => onCategoryClick?.('all')}
                  className="hover:text-white transition-colors"
                >
                  All Activewear
                </button>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-300">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <a
                  href="https://wa.me/923113270742?text=Assalam-o-Alaikum!%20I%20have%20an%20inquiry%20regarding%20ICON%20Activewear."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 text-emerald-500 font-semibold flex items-center gap-1 transition-colors"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp: {STORE_OWNER_CONFIG.whatsappDisplay}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${STORE_OWNER_CONFIG.supportEmail}?subject=ICON%20Activewear%20Inquiry`}
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Mail className="w-3 h-3 text-neutral-500" />
                  <span>{STORE_OWNER_CONFIG.supportEmail}</span>
                </a>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer" onClick={onOpenBrandStory}>
                  Our Fabric Technology
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Size Guide & Fit
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Shipping & Customs
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  30-Day Returns Portal
                </span>
              </li>
            </ul>
          </div>

          {/* Payment & Region */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-300">
              Global Fulfillment
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Shipping to over 45 countries worldwide. Displaying prices in <strong className="text-white">{currentCurrencyDetails.code} ({currentCurrencyDetails.symbol})</strong>.
            </p>

            <div className="pt-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1.5">
                Accepted Payment Methods:
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-neutral-300 uppercase">
                <span className="px-2 py-1 bg-neutral-900 border border-neutral-800">Visa</span>
                <span className="px-2 py-1 bg-neutral-900 border border-neutral-800">Mastercard</span>
                <span className="px-2 py-1 bg-neutral-900 border border-neutral-800">COD (PK)</span>
                <span className="px-2 py-1 bg-neutral-900 border border-neutral-800">Apple Pay</span>
                <span className="px-2 py-1 bg-neutral-900 border border-neutral-800">PayPal</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Legal & Copyright Bar */}
        <div className="mt-12 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} ICON ACTIVEWEAR Karachi. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-neutral-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-neutral-400 cursor-pointer">Terms of Service</span>

          </div>
        </div>
      </div>
    </footer>
  );
};
