export type ProductCategory = 'seamless-leggings' | 'sports-bras' | 'bottoms' | 'must-haves' | 'all';

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: 'seamless-leggings' | 'sports-bras' | 'bottoms' | 'must-haves';
  categoryLabel: string;
  usdPrice: number;
  pkrPrice: number;
  originalPriceUsd?: number;
  originalPricePkr?: number;
  image: string;
  hoverImage?: string;
  colors: ProductColor[];
  sizes: ProductSize[];
  description: string;
  details: string[];
  fabric: string;
  supportLevel?: 'Low Support' | 'Medium Support' | 'High Support' | 'Maximum Compression';
  rating: number;
  reviewsCount: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
}

export interface CartItem {
  id: string; // unique item id (productId + color + size)
  product: Product;
  selectedColor: ProductColor;
  selectedSize: ProductSize;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'owner' | 'customer';
  isOwner?: boolean;
  token?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;
  paymentMethod: 'credit_card' | 'cash_on_delivery' | 'apple_pay';
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
  notes?: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
  minSpendUsd?: number;
  isActive: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  isVerified: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: ProductCategory;
  description: string;
  image: string;
  productCount: number;
}

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  features: string[];
  image: string;
  ctaText: string;
  categoryLink: string;
}

export interface StoreSettings {
  ownerName: string;
  ownerEmail: string;
  ownerWhatsApp: string;
  currencyDefault: string;
  announcementText?: string;
  siteName?: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  exchangeRateFromUsd: number; // e.g. 1 USD = 277.5 PKR
  format: (amountUsd: number) => string;
}
