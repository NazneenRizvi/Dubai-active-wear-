import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'prod-balance-seamless',
    name: 'BALANCE SEAMLESS LEGGINGS',
    slug: 'balance-seamless-leggings',
    category: 'seamless-leggings',
    categoryLabel: 'SHOP SEAMLESS',
    usdPrice: 28.99,
    pkrPrice: 8046.40,
    originalPriceUsd: 36.00,
    originalPricePkr: 10000.00,
    image: '/images/product_seamless_leggings_1790852268334.jpg',
    hoverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Olive Heather', hex: '#636b57' },
      { name: 'Charcoal Grey', hex: '#3e3e40' },
      { name: 'Navy Dusk', hex: '#283149' },
      { name: 'Warm Taupe', hex: '#877c73' },
      { name: 'Blush Rose', hex: '#cf9893' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Designed for effortless movement, our Balance Seamless Leggings feature a ribbed high-rise waistband that never rolls down. Engineered with 4-way stretch circular knit microfiber for complete squat-proof confidence.',
    details: [
      'High-waisted compression contour waistband',
      '100% squat-proof non-sheer knit',
      'Sweat-wicking, fast-drying seamless yarn',
      'Subtle glute-enhancing ribbed texture'
    ],
    fabric: '88% Polyamide, 12% Elastane',
    supportLevel: 'Medium Support',
    rating: 4.9,
    reviewsCount: 342,
    isNew: true,
    isBestSeller: true,
    inStock: true
  },
  {
    id: 'prod-elite-seamless',
    name: 'ELITE SEAMLESS LEGGINGS',
    slug: 'elite-seamless-leggings',
    category: 'seamless-leggings',
    categoryLabel: 'SHOP SEAMLESS',
    usdPrice: 32.99,
    pkrPrice: 9073.60,
    originalPriceUsd: 40.00,
    originalPricePkr: 11000.00,
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
    hoverImage: '/images/product_seamless_leggings_1790852268334.jpg',
    colors: [
      { name: 'Obsidian Black', hex: '#111111' },
      { name: 'Forest Moss', hex: '#2f3e30' },
      { name: 'Cloud Grey', hex: '#9ea3a8' },
      { name: 'Deep Plum', hex: '#482d3f' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'The Elite Seamless Leggings deliver ultra-supportive zoning along the thighs and lower back. Formulated with second-skin compressive yarn that breathes during intense cardio and heavy lift sessions.',
    details: [
      'Zoned compressive panelling',
      'Zero front seam for zero chafing',
      'Deep ribbed anti-slip waistband',
      'Reinforced gusset for mobility'
    ],
    fabric: '85% Nylon Microfiber, 15% Spandex',
    supportLevel: 'Maximum Compression',
    rating: 4.8,
    reviewsCount: 218,
    isBestSeller: true,
    inStock: true
  },
  {
    id: 'prod-core-seamless',
    name: 'CORE SEAMLESS LEGGINGS',
    slug: 'core-seamless-leggings',
    category: 'seamless-leggings',
    categoryLabel: 'SHOP SEAMLESS',
    usdPrice: 30.99,
    pkrPrice: 8560.00,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Camo Heather', hex: '#4f5548' },
      { name: 'Charcoal Grey', hex: '#2a2a2a' },
      { name: 'Ocean Mist', hex: '#4d6978' },
      { name: 'Sage Green', hex: '#778a76' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Our iconic jacquard camo knit seamless leggings blend subtle textured shading with full athletic flex. Soft to the touch yet sturdy enough for HIIT, Pilates, and weekend conditioning.',
    details: [
      'Jacquard camo seamless weave',
      'Breathable heat-release eyelets',
      'Contoured glute micro-ribbing',
      'Ankle crop length fit'
    ],
    fabric: '90% Polyamide, 10% Elastane',
    supportLevel: 'Medium Support',
    rating: 4.9,
    reviewsCount: 189,
    inStock: true
  },
  {
    id: 'prod-impact-seamless',
    name: 'IMPACT SEAMLESS LEGGINGS',
    slug: 'impact-seamless-leggings',
    category: 'seamless-leggings',
    categoryLabel: 'SHOP SEAMLESS',
    usdPrice: 27.99,
    pkrPrice: 7875.20,
    originalPriceUsd: 34.00,
    originalPricePkr: 9500.00,
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    hoverImage: '/images/product_seamless_leggings_1790852268334.jpg',
    colors: [
      { name: 'Midnight Navy', hex: '#1c2833' },
      { name: 'Jet Black', hex: '#0a0a0a' },
      { name: 'Espresso', hex: '#3d2b24' },
      { name: 'Dusty Berry', hex: '#6d4350' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Maximum agility without compromise. The Impact Leggings offer high-density compression knit that holds shape session after session without sagging or pilling.',
    details: [
      'Engineered squat-proof double knit',
      'Targeted calf cooling ventilation',
      'No-slip stay-put waistband',
      'Flatlock ergonomic construction'
    ],
    fabric: '86% Nylon, 14% Elastane',
    supportLevel: 'High Support',
    rating: 4.7,
    reviewsCount: 164,
    inStock: true
  },
  {
    id: 'prod-bold-sports-bra',
    name: 'BOLD SPORTS BRA',
    slug: 'bold-sports-bra',
    category: 'sports-bras',
    categoryLabel: 'SHOP LOW IMPACT',
    usdPrice: 24.00,
    pkrPrice: 6676.80,
    originalPriceUsd: 30.00,
    originalPricePkr: 8300.00,
    image: '/images/product_sports_bra_1790852283602.jpg',
    hoverImage: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Crisp White', hex: '#fcfcfc' },
      { name: 'Terracotta', hex: '#b35d45' },
      { name: 'Sage Green', hex: '#82917d' },
      { name: 'Onyx Black', hex: '#181818' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Minimalist aesthetic meets low-to-medium athletic support. The Bold Sports Bra features an open cross-back strap geometry that frees your shoulder blades while giving reliable hold.',
    details: [
      'Removable molded cup padding',
      'Criss-cross back straps for free scapular movement',
      'Wide bottom band that stays flush without digging',
      'Anti-odor antimicrobial treatment'
    ],
    fabric: '82% Polyamide, 18% Elastane',
    supportLevel: 'Low Support',
    rating: 4.9,
    reviewsCount: 295,
    isBestSeller: true,
    inStock: true
  },
  {
    id: 'prod-excel-sports-bra',
    name: 'EXCEL SPORTS BRA',
    slug: 'excel-sports-bra',
    category: 'sports-bras',
    categoryLabel: 'SHOP LOW IMPACT',
    usdPrice: 21.50,
    pkrPrice: 5992.00,
    originalPriceUsd: 28.00,
    originalPricePkr: 7700.00,
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80',
    hoverImage: '/images/product_sports_bra_1790852283602.jpg',
    colors: [
      { name: 'Heather Grey', hex: '#777b80' },
      { name: 'Dusty Rose', hex: '#bf8e93' },
      { name: 'Mocha Tan', hex: '#7a6458' },
      { name: 'Muted Olive', hex: '#586150' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Ultra-lightweight everyday movement bra. Crafted with butter-soft micro-modal blend that feels invisible under clothes or styled on its own for hot yoga and gym sessions.',
    details: [
      'Butter-soft second-skin touch',
      'Plunge scoop neckline',
      'Non-restrictive flexible underband',
      'Quick-drying sweat management'
    ],
    fabric: '80% Microfiber Nylon, 20% Spandex',
    supportLevel: 'Low Support',
    rating: 4.8,
    reviewsCount: 178,
    inStock: true
  },
  {
    id: 'prod-bold-marble-bra',
    name: 'BOLD SPORTS BRA (MARBLE)',
    slug: 'bold-sports-bra-marble',
    category: 'sports-bras',
    categoryLabel: 'SHOP LOW IMPACT',
    usdPrice: 24.00,
    pkrPrice: 6676.80,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    hoverImage: '/images/product_sports_bra_1790852283602.jpg',
    colors: [
      { name: 'Granite Marble', hex: '#949599' },
      { name: 'Chalk White', hex: '#f2f2f0' },
      { name: 'Smoke Black', hex: '#262626' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Limited edition sublimated marble print. Seamless jacquard knitting prevents print distortion when stretched, preserving crisp contrast through heavy squats and bends.',
    details: [
      'Sublimated zero-fade active print',
      'Reinforced double-layered chest panel',
      'Smooth laser-cut armholes',
      'Four-way stretch retention'
    ],
    fabric: '84% Polyester, 16% Spandex',
    supportLevel: 'Low Support',
    rating: 4.7,
    reviewsCount: 142,
    inStock: true
  },
  {
    id: 'prod-ultra-sports-bra',
    name: 'ULTRA SPORTS BRA',
    slug: 'ultra-sports-bra',
    category: 'sports-bras',
    categoryLabel: 'SHOP LOW IMPACT',
    usdPrice: 24.00,
    pkrPrice: 6676.80,
    originalPriceUsd: 32.00,
    originalPricePkr: 8900.00,
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
    hoverImage: '/images/product_sports_bra_1790852283602.jpg',
    colors: [
      { name: 'Pure White', hex: '#ffffff' },
      { name: 'Sunset Coral', hex: '#de6857' },
      { name: 'Seafoam Mint', hex: '#7aa39c' },
      { name: 'Deep Steel', hex: '#374151' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Engineered for all-day athletic versatility. Provides locked-in security with breathable mesh ventilation channels down the spine for instant thermal cooling.',
    details: [
      'Racerback silhouette with breathable mesh channel',
      'Non-slip wide band',
      'Removable padding with internal stabilizer',
      'Chafe-resistant smooth seams'
    ],
    fabric: '85% Nylon, 15% Elastane',
    supportLevel: 'Medium Support',
    rating: 4.9,
    reviewsCount: 211,
    isNew: true,
    inStock: true
  },
  {
    id: 'prod-airlift-shorts',
    name: 'AIRLIFT CYCLING SHORTS',
    slug: 'airlift-cycling-shorts',
    category: 'bottoms',
    categoryLabel: 'SHOP BOTTOMS',
    usdPrice: 19.99,
    pkrPrice: 5490.00,
    originalPriceUsd: 26.00,
    originalPricePkr: 7200.00,
    image: '/images/promo_split_bottoms_1790852297885.jpg',
    hoverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Sky Cerulean', hex: '#77a2c7' },
      { name: 'Charcoal Heather', hex: '#404347' },
      { name: 'Lavender Mist', hex: '#9d94b8' },
      { name: 'Jet Black', hex: '#111111' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: '6-inch inseam cycling shorts that hug without pinching. The tapered leg hem features silicone micro-grippers to ensure zero ride-up during sprints and lunges.',
    details: [
      '6-inch inseam ideal for studio & running',
      'Anti-slip micro-dot silicone leg hem',
      'Hidden interior waistband card pocket',
      'Sweat-wicking cooling finish'
    ],
    fabric: '82% Polyamide, 18% Elastane',
    supportLevel: 'Medium Support',
    rating: 4.8,
    reviewsCount: 167,
    isBestSeller: true,
    inStock: true
  },
  {
    id: 'prod-sculpt-tank',
    name: 'SCULPT TRAINING TANK',
    slug: 'sculpt-training-tank',
    category: 'must-haves',
    categoryLabel: 'SHOP MUST HAVES',
    usdPrice: 17.50,
    pkrPrice: 4890.00,
    image: '/images/hero_pink_activewear_1790852235638.jpg',
    hoverImage: '/images/campaign_dark_fitness_1790852253184.jpg',
    colors: [
      { name: 'Blush Coral', hex: '#e89e99' },
      { name: 'Chalk White', hex: '#f7f6f2' },
      { name: 'Dark Slate', hex: '#212529' },
      { name: 'Washed Olive', hex: '#6b705c' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'The iconic ribbed cropped tank featured in our campaign. High-stretch performance rib knit that retains shape after 100+ wash cycles, pairing seamlessly with any leggings.',
    details: [
      'Cropped silhouette hitting right at natural waist',
      'High round neckline with racer cut armholes',
      'Breathable micro-rib knit texture',
      'Reinforced colorfast yarns'
    ],
    fabric: '92% Nylon, 8% Spandex',
    supportLevel: 'Low Support',
    rating: 4.9,
    reviewsCount: 310,
    isBestSeller: true,
    inStock: true
  }
];

export const TESTIMONIALS = [
  {
    id: '1',
    author: 'Ayla S.',
    role: 'Certified Pilates & Barre Instructor',
    location: 'London, UK',
    content: 'The Balance Seamless leggings are genuinely squat-proof. I test activewear everyday teaching classes, and these hold up without rolling down once. The fabric thickness is perfection.',
    rating: 5,
    productPurchased: 'Balance Seamless Leggings'
  },
  {
    id: '2',
    author: 'Zainab M.',
    role: 'CrossFit Athlete & Powerlifter',
    location: 'Lahore, PK',
    content: 'Shipping was super fast, ordered in PKR with Cash on Delivery and arrived in 2 days. The Elite seamless compression is on par with $120 high-end brands at a fraction of the cost.',
    rating: 5,
    productPurchased: 'Elite Seamless Leggings'
  },
  {
    id: '3',
    author: 'Elena R.',
    role: 'Marathoner & Strength Coach',
    location: 'New York, US',
    content: 'The Bold Sports Bra has the most comfortable strap layout for shoulder workouts. No digging into my traps, and the sweat-wicking knit dries in minutes after training.',
    rating: 5,
    productPurchased: 'Bold Sports Bra'
  }
];
