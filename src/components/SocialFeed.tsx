import React from 'react';
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react';

const SOCIAL_POSTS = [
  {
    image: '/images/hero_pink_activewear_1790852235638.jpg',
    handle: '@iconactivewear.pk',
    likes: 1240,
    comments: 88,
    caption: 'Monday leg day sorted in the Balance Seamless set in Blush Rose 💕 #ICONActivewear'
  },
  {
    image: '/images/campaign_dark_fitness_1790852253184.jpg',
    handle: '@iconactivewear.pk',
    likes: 980,
    comments: 54,
    caption: 'Pure focus. Maximum compression knit engineered for personal records ⚡️'
  },
  {
    image: '/images/promo_split_bottoms_1790852297885.jpg',
    handle: '@iconactivewear.pk',
    likes: 1530,
    comments: 112,
    caption: 'High-waist cycle shorts that stay in place no matter how you stretch 🧘‍♀️'
  },
  {
    image: '/images/product_seamless_leggings_1790852268334.jpg',
    handle: '@iconactivewear.pk',
    likes: 2100,
    comments: 145,
    caption: 'Obsidian Black & Olive Heather restocked! Free delivery on Rs. 8,000+ orders across Pakistan 🇵🇰'
  }
];

export const SocialFeed: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 pb-3 border-b border-neutral-200 gap-3">
        <div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors mb-1"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-600" />
            <span>@ICONACTIVEWEAR.PK ON INSTAGRAM</span>
          </a>
          <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-neutral-900 uppercase">
            COMMUNITY IN MOTION
          </h3>
        </div>
        <p className="text-xs text-neutral-500 max-w-sm">
          Tag <strong className="text-neutral-900">#ICONActivewear</strong> on Instagram to be featured on our official brand lookbook.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {SOCIAL_POSTS.map((post, idx) => (
          <a
            key={idx}
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="group relative aspect-square overflow-hidden bg-neutral-100 border border-neutral-200 block"
          >
            <img
              src={post.image}
              alt={post.caption}
              className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            {/* Instagram overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5" />
                  <span>{post.handle}</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </div>

              <div className="flex items-center justify-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-white text-white" />
                  <span>{post.likes}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 fill-white text-white" />
                  <span>{post.comments}</span>
                </span>
              </div>

              <p className="text-[10px] text-neutral-200 line-clamp-2 leading-tight">
                {post.caption}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};
