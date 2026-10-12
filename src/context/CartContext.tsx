import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductColor, ProductSize, Order } from '../types';
import { normalizeOrders } from '../lib/orders';
import { apiRequest } from '../lib/api';
import { useAuth } from './AuthContext';
import { PRODUCTS } from '../data/products';
import { STORE_OWNER_CONFIG, STORE_OWNER_EMAIL } from '../config';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, color: ProductColor, size: ProductSize, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotalUsd: number;
  promoCode: string;
  promoDiscountPercent: number;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  discountUsd: number;
  isFreeShipping: boolean;
  freeShippingThresholdUsd: number;
  amountNeededForFreeShippingUsd: number;
  shippingUsd: number;
  totalUsd: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  selectedProductForDetail: Product | null;
  setSelectedProductForDetail: (product: Product | null) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  isAdminViewOpen: boolean;
  setIsAdminViewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Wishlist
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;

  // Products Catalog (with Admin CRUD)
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  
  // Store Owner & Order Management (For Nazneen)
  orders: Order[];
  ordersError: string;
  ordersLoading: boolean;
  refreshOrders: () => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status'], trackingCarrier?: string, trackingNumber?: string) => void;
  deleteOrder: (orderId: string) => void;
  clearAllOrders: () => void;
  isOwnerOrdersOpen: boolean;
  setIsOwnerOrdersOpen: (open: boolean) => void;
  isCustomerOrdersOpen: boolean;
  setIsCustomerOrdersOpen: (open: boolean) => void;
  ownerEmail: string;
  ownerWhatsApp: string;
  setOwnerWhatsApp: (phone: string) => void;
}

// Free Delivery on orders above 150 AED across UAE (150 AED / 3.67 = ~40.87 USD)
const FREE_SHIPPING_THRESHOLD_USD = 40.87;

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fj_cart');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Dynamic Catalog with LocalStorage persistence
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fj_custom_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          return PRODUCTS;
        }
      }
    }
    return PRODUCTS;
  });

  // Wishlist
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fj_wishlist');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  const [promoCode, setPromoCode] = useState<string>('');
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAdminViewOpen, setIsAdminViewOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Store Owner Dashboard state
  const [isOwnerOrdersOpen, setIsOwnerOrdersOpen] = useState(false);
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);
  const ownerEmail = STORE_OWNER_EMAIL;
  const [ownerWhatsApp, setOwnerWhatsAppState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fj_owner_whatsapp') || STORE_OWNER_CONFIG.whatsapp;
    }
    return STORE_OWNER_CONFIG.whatsapp;
  });

  const setOwnerWhatsApp = (phone: string) => {
    setOwnerWhatsAppState(phone);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fj_owner_whatsapp', phone);
    }
  };

  const { user } = useAuth();
  
  // Local storage loader for orders
  const loadStoredOrders = (): Order[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('fj_orders');
      return saved ? normalizeOrders(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  };

  const [orders, setOrders] = useState<Order[]>(() => loadStoredOrders());
  const [ordersError, setOrdersError] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Sync orders to localStorage whenever orders change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fj_orders', JSON.stringify(orders));
      } catch {
        // ignore storage errors
      }
    }
  }, [orders]);

  const refreshOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await apiRequest('/api/orders');
      if (Array.isArray(data)) {
        setOrders(normalizeOrders(data));
        setOrdersError('');
      } else {
        setOrders(loadStoredOrders());
      }
    } catch {
      // Backend unavailable; use local orders seamlessly
      setOrders(loadStoredOrders());
      setOrdersError('');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchInit = async () => {
      try {
        const data = await apiRequest('/api/orders');
        if (active && Array.isArray(data)) {
          setOrders(normalizeOrders(data));
        }
      } catch {
        if (active) {
          setOrders(loadStoredOrders());
        }
      }
    };
    void fetchInit();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Save cart to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fj_cart', JSON.stringify(items));
    }
  }, [items]);

  // Save wishlist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fj_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist]);

  // Save products to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fj_custom_products', JSON.stringify(products));
    }
  }, [products]);

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  const addProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const updateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const addOrder = async (order: Order) => {
    // 1. Instantly save to state and localStorage (ensures zero 404 block for dummy cards)
    const normalized = normalizeOrders([order])[0] || order;
    setOrders((prev) => [normalized, ...prev.filter((o) => o.id !== normalized.id)]);

    // 2. Try sending to backend if available (without crashing if backend is offline)
    try {
      await apiRequest('/api/orders', { method: 'POST', body: JSON.stringify(normalized) });
    } catch {
      // Backend offline on Vercel: safely persisted in browser storage
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status'], trackingCarrier?: string, trackingNumber?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status, ...(trackingCarrier ? { trackingCarrier } : {}), ...(trackingNumber ? { trackingNumber } : {}) }
          : o
      )
    );

    try {
      await apiRequest(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, trackingCarrier, trackingNumber }),
      });
    } catch {
      // safely fallback to local update
    }
  };

  const deleteOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' });
    } catch {
      // safely fallback
    }
  };

  const clearAllOrders = () => {
    setOrdersError('Delete individual orders to avoid accidental bulk deletion.');
  };

  const addToCart = (product: Product, color: ProductColor, size: ProductSize, quantity = 1) => {
    const itemId = `${product.id}-${color.name.toLowerCase().replace(/\s+/g, '-')}-${size}`;

    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === itemId);
      if (existing) {
        return prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prevItems,
        {
          id: itemId,
          product,
          selectedColor: color,
          selectedSize: size,
          quantity
        }
      ];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const applyPromoCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'WELCOME10') {
      setPromoCode('WELCOME10');
      setPromoDiscountPercent(10);
      return { success: true, message: '10% Welcome discount applied!' };
    } else if (cleanCode === 'ICON15' || cleanCode === 'VIP15') {
      setPromoCode(cleanCode);
      setPromoDiscountPercent(15);
      return { success: true, message: '15% VIP discount applied!' };
    } else if (cleanCode === 'FITNESS20' || cleanCode === 'MOVEMENT20') {
      setPromoCode(cleanCode);
      setPromoDiscountPercent(20);
      return { success: true, message: '20% Athlete discount applied!' };
    } else if (cleanCode === 'FLASH40') {
      setPromoCode('FLASH40');
      setPromoDiscountPercent(40);
      return { success: true, message: '40% Flash Sale discount applied!' };
    } else if (cleanCode === 'FREESHIP') {
      setPromoCode('FREESHIP');
      setPromoDiscountPercent(0);
      return { success: true, message: 'Free Shipping unlocked!' };
    } else {
      return { success: false, message: 'Invalid promo code. Try ICON15, FLASH40, or WELCOME10' };
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setPromoDiscountPercent(0);
  };

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalUsd = items.reduce((acc, item) => acc + item.product.usdPrice * item.quantity, 0);
  const discountUsd = (subtotalUsd * promoDiscountPercent) / 100;
  const isFreeShipping = promoCode === 'FREESHIP' || subtotalUsd >= FREE_SHIPPING_THRESHOLD_USD || items.length === 0;
  const amountNeededForFreeShippingUsd = Math.max(0, FREE_SHIPPING_THRESHOLD_USD - subtotalUsd);
  const shippingUsd = isFreeShipping || items.length === 0 ? 0 : 5.99;
  const totalUsd = Math.max(0, subtotalUsd - discountUsd + shippingUsd);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotalUsd,
        promoCode,
        promoDiscountPercent,
        applyPromoCode,
        removePromoCode,
        discountUsd,
        isFreeShipping,
        freeShippingThresholdUsd: FREE_SHIPPING_THRESHOLD_USD,
        amountNeededForFreeShippingUsd,
        shippingUsd,
        totalUsd,
        isCartOpen,
        setIsCartOpen,
        selectedProductForDetail,
        setSelectedProductForDetail,
        quickViewProduct,
        setQuickViewProduct,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isSearchOpen,
        setIsSearchOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isAdminViewOpen,
        setIsAdminViewOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        orders,
        ordersError,
        ordersLoading,
        refreshOrders,
        addOrder,
        updateOrderStatus,
        deleteOrder,
        clearAllOrders,
        isOwnerOrdersOpen,
        setIsOwnerOrdersOpen,
        isCustomerOrdersOpen,
        setIsCustomerOrdersOpen,
        ownerEmail,
        ownerWhatsApp,
        setOwnerWhatsApp
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
