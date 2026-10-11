import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Users,
  Settings,
  BarChart3,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  Truck,
  Clock,
  Printer,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Filter,
  Crown,
  ShieldCheck,
  Sliders,
  Camera,
  Upload,
  Menu,
  Image as ImageIcon,
  Calendar,
  CalendarRange
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { STORE_OWNER_CONFIG } from '../config';
import { Order, Product, ProductCategory } from '../types';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'categories' | 'coupons' | 'customers' | 'settings';

export const AdminPanel: React.FC = () => {
  const {
    isAdminViewOpen,
    setIsAdminViewOpen,
    orders, ordersError, ordersLoading, refreshOrders,
    updateOrderStatus,
    deleteOrder,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    ownerWhatsApp,
    setOwnerWhatsApp,
    ownerEmail
  } = useCart();

  const { formatPrice } = useCurrency();
  const { user, isOwner, login } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Mobile image upload states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const CATALOG_PHOTO_PRESETS = [
    { label: 'Leggings', url: '/images/product_seamless_leggings_1790852268334.jpg' },
    { label: 'Bra', url: '/images/product_sports_bra_1790852283602.jpg' },
    { label: 'Fitness Set', url: '/images/campaign_dark_fitness_1790852253184.jpg' },
    { label: 'Pink Set', url: '/images/hero_pink_activewear_1790852235638.jpg' },
    { label: 'Split Shorts', url: '/images/promo_split_bottoms_1790852297885.jpg' },
  ];

  // Mobile client-side image compression for instant upload
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }

    try {
      setIsUploadingImage(true);
      const compressedDataUrl = await compressImage(file);
      setNewProdImage(compressedDataUrl);
      showToast('Photo uploaded from mobile!');
    } catch (err) {
      console.error('Mobile image upload error:', err);
      showToast('Could not process photo. Try another image.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // Search and filter states
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Tracking modal / dialog
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [trackingCarrier, setTrackingCarrier] = useState('Trax Logistics');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Add Product Form modal
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('seamless-leggings');
  const [newProdPricePkr, setNewProdPricePkr] = useState<number>(8500);
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdFabric, setNewProdFabric] = useState('88% Polyamide, 12% Elastane');

  const addProductModalRef = useRef<HTMLDivElement>(null);

  // Close Add Product modal when clicking outside
  useEffect(() => {
    if (!isAddProductModalOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (addProductModalRef.current && !addProductModalRef.current.contains(event.target as Node)) {
        setIsAddProductModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isAddProductModalOpen]);

  // Close Add Product modal on Escape key
  useEffect(() => {
    if (!isAddProductModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddProductModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddProductModalOpen]);

  // Toast notice
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  // Timeframe and Period Analysis state
  const [timeRangeFilter, setTimeRangeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [timeframeGrouping, setTimeframeGrouping] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [analyticsMetric, setAnalyticsMetric] = useState<'revenue' | 'orders'>('revenue');

  // Filter orders according to timeRangeFilter
  const timeFilteredOrders = useMemo(() => {
    if (orders.length === 0) return [];
    const now = new Date();
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      if (isNaN(orderDate.getTime())) return true;
      if (timeRangeFilter === 'today') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeRangeFilter === 'week') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (timeRangeFilter === 'month') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeRangeFilter === 'year') {
        return orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [orders, timeRangeFilter]);

  // Genuine KPIs calculated strictly from real store orders for selected timeframe (UAE AED)
  const periodRevenueAed = useMemo(() => {
    return timeFilteredOrders.reduce((acc, o) => {
      const val = typeof o.total === 'number' ? o.total : Number(o.total) || 0;
      if (o.currency === 'AED') return acc + val;
      if (o.currency === 'USD') return acc + Math.round(val * 3.67);
      if (o.currency === 'PKR') return acc + Math.round(val / 75.5);
      return acc + Math.round(val * 3.67);
    }, 0);
  }, [timeFilteredOrders]);

  const periodOrdersCount = timeFilteredOrders.length;

  const periodCustomersCount = useMemo(() => {
    return new Set(timeFilteredOrders.map((o) => o.email?.toLowerCase().trim()).filter(Boolean)).size;
  }, [timeFilteredOrders]);

  const periodAvgOrderValueAed = periodOrdersCount > 0 ? Math.round(periodRevenueAed / periodOrdersCount) : 0;

  // Multi-Period Breakdown (Daily, Weekly, Monthly, Yearly)
  const periodBreakdown = useMemo(() => {
    if (orders.length === 0) return [];

    const map = new Map<
      string,
      {
        sortKey: string;
        label: string;
        revenue: number;
        orders: number;
        customers: Set<string>;
        confirmed: number;
        shipped: number;
        delivered: number;
      }
    >();

    const getWeekDetails = (d: Date) => {
      const target = new Date(d.valueOf());
      const dayNr = (d.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
      }
      const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
      return { weekNumber, year: d.getFullYear() };
    };

    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      const date = isNaN(orderDate.getTime()) ? new Date() : orderDate;
      const val = typeof order.total === 'number' ? order.total : Number(order.total) || 0;
      const rev = order.currency === 'AED'
        ? val
        : order.currency === 'USD'
        ? Math.round(val * 3.67)
        : order.currency === 'PKR'
        ? Math.round(val / 75.5)
        : Math.round(val * 3.67);

      let key = '';
      let label = '';
      let sortKey = '';

      if (timeframeGrouping === 'daily') {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        sortKey = `${y}-${m}-${day}`;
        key = sortKey;
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } else if (timeframeGrouping === 'weekly') {
        const { weekNumber, year } = getWeekDetails(date);
        sortKey = `${year}-${String(weekNumber).padStart(2, '0')}`;
        key = sortKey;
        label = `Week ${weekNumber}, ${year}`;
      } else if (timeframeGrouping === 'yearly') {
        const year = date.getFullYear();
        sortKey = String(year);
        key = sortKey;
        label = `Year ${year}`;
      } else {
        // default monthly
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        sortKey = `${y}-${m}`;
        key = sortKey;
        label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      const existing = map.get(key) || {
        sortKey,
        label,
        revenue: 0,
        orders: 0,
        customers: new Set<string>(),
        confirmed: 0,
        shipped: 0,
        delivered: 0,
      };

      existing.revenue += rev;
      existing.orders += 1;
      if (order.email) existing.customers.add(order.email.toLowerCase().trim());
      if (order.status === 'confirmed') existing.confirmed += 1;
      else if (order.status === 'shipped') existing.shipped += 1;
      else if (order.status === 'delivered') existing.delivered += 1;

      map.set(key, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((item) => ({
        ...item,
        avgOrderValue: item.orders > 0 ? Math.round(item.revenue / item.orders) : 0,
        customerCount: item.customers.size,
      }));
  }, [orders, timeframeGrouping]);

  // Live Chart Data from Period Breakdown
  const liveChartData = useMemo(() => {
    return periodBreakdown.map((item) => ({
      name: item.label,
      value: analyticsMetric === 'revenue' ? item.revenue : item.orders,
      revenue: item.revenue,
      orders: item.orders,
    }));
  }, [periodBreakdown, analyticsMetric]);

  // Live Top Products calculated strictly from real customer purchases
  const liveTopProducts = useMemo(() => {
    if (orders.length === 0) return [];
    const productMap = new Map<string, { name: string; units: number; revenue: number }>();

    for (const order of orders) {
      if (!order.items) continue;
      for (const item of order.items) {
        const prodName = item.name || 'Activewear Item';
        const existing = productMap.get(prodName) || { name: prodName, units: 0, revenue: 0 };
        const qty = item.quantity || 1;
        const price = typeof item.price === 'number' ? item.price : Number(item.price) || 0;
        const itemRev = order.currency === 'AED'
          ? price * qty
          : order.currency === 'USD'
          ? Math.round(price * qty * 3.67)
          : order.currency === 'PKR'
          ? Math.round((price * qty) / 75.5)
          : Math.round(price * qty * 3.67);
        existing.revenue += itemRev;
        productMap.set(prodName, existing);
      }
    }

    return Array.from(productMap.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [orders]);

  if (!isAdminViewOpen || !isOwner) return null;

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesSearch =
      orderSearch === '' ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.phone.includes(orderSearch) ||
      o.city.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    const matchesSearch =
      productSearch === '' ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle Export to CSV
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'City', 'Status', 'Total USD', 'Date'];
    const rows = orders.map((o) => [
      o.id,
      `"${o.customerName}"`,
      o.email,
      o.phone,
      `"${o.city}"`,
      o.status,
      o.total,
      o.createdAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ICON_ACTIVEWEAR_ORDERS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders exported to CSV successfully!');
  };

  // Handle Create Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: newProdName.toUpperCase(),
      slug: newProdName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: newProdCategory as any,
      categoryLabel: newProdCategory === 'seamless-leggings' ? 'SHOP SEAMLESS' : 'ACTIVEWEAR',
      usdPrice: Math.round((newProdPricePkr / 3.67) * 100) / 100,
      pkrPrice: Math.round(newProdPricePkr * 75.5),
      image: newProdImage || '/images/hero_pink_activewear_1790852235638.jpg',
      colors: [
        { name: 'Obsidian Black', hex: '#111111' },
        { name: 'Blush Rose', hex: '#cf9893' }
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      description: newProdDesc || 'Premium high-density 280 GSM circular seamless activewear engineered for extreme performance and zero roll-down.',
      details: ['4-Way Micro-Knit', 'Zero front seam', 'Anti-slip ribbed waistband'],
      fabric: newProdFabric,
      rating: 5.0,
      reviewsCount: 1,
      isNew: true,
      inStock: true
    };

    addProduct(newProduct);
    setIsAddProductModalOpen(false);
    setNewProdName('');
    setNewProdImage('');
    setNewProdDesc('');
    showToast(`Product "${newProduct.name}" created successfully!`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#F8F9FA] flex text-neutral-900 font-sans">
      {(ordersError || ordersLoading) && <div role="status" className="fixed bottom-4 left-4 right-4 z-[60] bg-amber-50 border border-amber-300 p-3 text-sm">
        {ordersLoading ? 'Loading orders…' : `Orders unavailable: ${ordersError}`}
        {!ordersLoading && <button className="ml-3 underline" onClick={() => void refreshOrders()}>Retry</button>}
      </div>}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-black text-white px-4 py-2.5 rounded-sm shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in border border-neutral-700">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Desktop Left Sidebar Navigation */}
      <aside
        className={`hidden md:flex ${
          isSidebarOpen ? 'w-64' : 'w-16'
        } transition-all duration-300 bg-white border-r border-neutral-200 flex-col justify-between shrink-0 z-20`}
      >
        <div>
          {/* Logo & Toggle Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            {isSidebarOpen ? (
              <div>
                <span className="text-xs font-black tracking-widest uppercase font-display block text-neutral-900">
                  ICON ACTIVEWEAR
                </span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                  Store Admin HQ (Dubai, UAE)
                </span>
              </div>
            ) : (
              <span className="font-black text-sm">IA</span>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer"
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span>Dashboard Overview</span>}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'products' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              {isSidebarOpen && (
                <span className="flex-1 flex items-center justify-between">
                  <span>Products Catalog</span>
                  <span className="text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.2 rounded-full">
                    {products.length}
                  </span>
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'orders' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              {isSidebarOpen && (
                <span className="flex-1 flex items-center justify-between">
                  <span>Customer Orders</span>
                  <span className="text-[10px] bg-amber-400 text-black font-black px-1.5 py-0.2 rounded-full">
                    {orders.length}
                  </span>
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'coupons' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Tag className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span>Coupons & Discounts</span>}
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'customers' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span>Customers CRM</span>}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'settings' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span>Store & WhatsApp Settings</span>}
            </button>
          </nav>
        </div>

        {/* Bottom User & Return to Store */}
        <div className="p-3 border-t border-neutral-200 space-y-2">
          {isSidebarOpen && (
            <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 text-[11px]">
              <p className="font-bold text-neutral-900 truncate">{STORE_OWNER_CONFIG.name}</p>
              <p className="text-neutral-500 truncate">{ownerEmail}</p>
            </div>
          )}

          <button
            onClick={() => setIsAdminViewOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            {isSidebarOpen && <span>Return to Storefront</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar with Overlay */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col justify-between shadow-2xl z-10 animate-fade-in">
            <div>
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black tracking-widest uppercase font-display block text-neutral-900">
                    ICON ACTIVEWEAR
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    Admin HQ (Karachi)
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 text-neutral-500 hover:text-black cursor-pointer rounded-xs"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3 space-y-1 text-xs font-bold">
                <button
                  onClick={() => { setActiveTab('dashboard'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 transition-colors cursor-pointer ${
                    activeTab === 'dashboard' ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Dashboard Overview</span>
                </button>
                <button
                  onClick={() => { setActiveTab('products'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-3 transition-colors cursor-pointer ${
                    activeTab === 'products' ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 shrink-0" />
                    <span>Products Catalog</span>
                  </div>
                  <span className="text-[10px] bg-neutral-200 text-neutral-900 px-1.5 py-0.5 rounded-full font-bold">
                    {products.length}
                  </span>
                </button>
                <button
                  onClick={() => { setActiveTab('orders'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-3 transition-colors cursor-pointer ${
                    activeTab === 'orders' ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>Customer Orders</span>
                  </div>
                  <span className="text-[10px] bg-amber-400 text-black font-black px-1.5 py-0.5 rounded-full">
                    {orders.length}
                  </span>
                </button>
                <button
                  onClick={() => { setActiveTab('coupons'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 transition-colors cursor-pointer ${
                    activeTab === 'coupons' ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Tag className="w-4 h-4 shrink-0" />
                  <span>Coupons & Discounts</span>
                </button>
                <button
                  onClick={() => { setActiveTab('customers'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 transition-colors cursor-pointer ${
                    activeTab === 'customers' ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Customers CRM</span>
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 transition-colors cursor-pointer ${
                    activeTab === 'settings' ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Store & WhatsApp Settings</span>
                </button>
              </nav>
            </div>

            <div className="p-3 border-t border-neutral-200 space-y-2">
              <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 text-[11px]">
                <p className="font-bold text-neutral-900 truncate">{STORE_OWNER_CONFIG.name}</p>
                <p className="text-neutral-500 truncate">{ownerEmail}</p>
              </div>
              <button
                onClick={() => setIsAdminViewOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Storefront</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col w-full min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-neutral-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger to open sidebar drawer */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-1.5 -ml-1 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-sm cursor-pointer shrink-0"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-tight text-neutral-900 truncate">
                {activeTab === 'dashboard' && 'Executive Store Dashboard'}
                {activeTab === 'products' && 'Product Catalog Management'}
                {activeTab === 'orders' && 'Real-Time Orders Fulfillment'}
                {activeTab === 'coupons' && 'Promotions & Coupons'}
                {activeTab === 'customers' && 'Customers CRM'}
                {activeTab === 'settings' && 'Store Configuration'}
              </h1>
              <p className="text-[10px] text-neutral-500 hidden sm:block">Nazneen HQ Management</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Quick Add Product button directly in header on mobile */}
            {activeTab === 'products' && (
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="px-2.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden min-[380px]:inline">Add Item</span>
              </button>
            )}

            <a
              href={`https://wa.me/${ownerWhatsApp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp: {ownerWhatsApp}</span>
            </a>

            <button
              onClick={() => setIsAdminViewOpen(false)}
              className="p-1.5 text-neutral-500 hover:text-black cursor-pointer rounded-xs hover:bg-neutral-100"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile Horizontal Fast Tabs Pill Bar */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto p-2 bg-neutral-100 border-b border-neutral-200 shrink-0 sticky top-[49px] z-10">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-[11px] font-bold whitespace-nowrap rounded-sm transition-colors cursor-pointer shrink-0 ${
              activeTab === 'dashboard' ? 'bg-black text-white' : 'bg-white text-neutral-700 border border-neutral-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 text-[11px] font-bold whitespace-nowrap rounded-sm transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
              activeTab === 'products' ? 'bg-black text-white' : 'bg-white text-neutral-700 border border-neutral-200'
            }`}
          >
            <span>Products</span>
            <span className="text-[9px] px-1 bg-neutral-200 text-black rounded-full font-black">
              {products.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-[11px] font-bold whitespace-nowrap rounded-sm transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
              activeTab === 'orders' ? 'bg-black text-white' : 'bg-white text-neutral-700 border border-neutral-200'
            }`}
          >
            <span>Orders</span>
            <span className="text-[9px] px-1 bg-amber-400 text-black rounded-full font-black">
              {orders.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3 py-1.5 text-[11px] font-bold whitespace-nowrap rounded-sm transition-colors cursor-pointer shrink-0 ${
              activeTab === 'coupons' ? 'bg-black text-white' : 'bg-white text-neutral-700 border border-neutral-200'
            }`}
          >
            Coupons
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 text-[11px] font-bold whitespace-nowrap rounded-sm transition-colors cursor-pointer shrink-0 ${
              activeTab === 'customers' ? 'bg-black text-white' : 'bg-white text-neutral-700 border border-neutral-200'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-[11px] font-bold whitespace-nowrap rounded-sm transition-colors cursor-pointer shrink-0 ${
              activeTab === 'settings' ? 'bg-black text-white' : 'bg-white text-neutral-700 border border-neutral-200'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="p-3 sm:p-6 space-y-6">
            {/* Timeframe Filter Bar (Genuine Real Sales Only) */}
            <div className="bg-white p-3 sm:p-4 border border-neutral-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-neutral-600 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-neutral-900">
                  Analytics Filter:
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  100% Real Sales Only (No Fake Data)
                </span>
              </div>

              {/* Time Range Filter Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This Week' },
                    { id: 'month', label: 'This Month' },
                    { id: 'year', label: 'This Year' },
                  ] as const
                ).map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setTimeRangeFilter(range.id)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer shrink-0 ${
                      timeRangeFilter === range.id
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards Row (Strictly Real Data for Selected Timeframe) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-neutral-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <span>Total Income (Revenue)</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900">
                  AED {periodRevenueAed.toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1">
                  <span>
                    {periodOrdersCount > 0
                      ? `${periodOrdersCount} verified real purchase${periodOrdersCount > 1 ? 's' : ''}`
                      : 'AED 0 (Clean fresh store, 0 sales)'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 border border-neutral-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <span>Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900">
                  {periodOrdersCount} Orders
                </div>
                <div className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1">
                  <span>
                    {periodOrdersCount > 0
                      ? `${periodOrdersCount} genuine order${periodOrdersCount > 1 ? 's' : ''} in ${timeRangeFilter}`
                      : '0 orders recorded'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 border border-neutral-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <span>Total Customers</span>
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900">
                  {periodCustomersCount} {periodCustomersCount === 1 ? 'Buyer' : 'Buyers'}
                </div>
                <div className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1">
                  <span>
                    {periodCustomersCount > 0
                      ? `${periodCustomersCount} real UAE buyer${periodCustomersCount > 1 ? 's' : ''}`
                      : '0 buyer records'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 border border-neutral-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <span>Avg Order Value (AOV)</span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900">
                  AED {periodAvgOrderValueAed.toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-500 font-semibold">
                  <span>Target: 150 AED for Free Delivery</span>
                </div>
              </div>
            </div>

            {/* Income & Orders Period Analytics (Daily, Weekly, Monthly, Yearly) */}
            <div className="bg-white p-4 sm:p-6 border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-neutral-100">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-neutral-700" />
                    <span>
                      {analyticsMetric === 'revenue' ? 'Total Income (Revenue)' : 'Total Orders Volume'} — By{' '}
                      {timeframeGrouping === 'daily'
                        ? 'Day (Daily)'
                        : timeframeGrouping === 'weekly'
                        ? 'Week (Weekly)'
                        : timeframeGrouping === 'monthly'
                        ? 'Month (Monthly)'
                        : 'Year (Yearly)'}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Switch between Daily, Weekly, Monthly, and Yearly views for income and order counts
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Metric Switcher: Revenue vs Orders */}
                  <div className="flex items-center bg-neutral-100 p-0.5 rounded-xs border border-neutral-200">
                    <button
                      onClick={() => setAnalyticsMetric('revenue')}
                      className={`px-2.5 py-1 text-xs font-bold uppercase transition-colors cursor-pointer rounded-xs ${
                        analyticsMetric === 'revenue'
                          ? 'bg-black text-white shadow-xs'
                          : 'text-neutral-700 hover:text-black'
                      }`}
                    >
                      💰 Income (AED)
                    </button>
                    <button
                      onClick={() => setAnalyticsMetric('orders')}
                      className={`px-2.5 py-1 text-xs font-bold uppercase transition-colors cursor-pointer rounded-xs ${
                        analyticsMetric === 'orders'
                          ? 'bg-black text-white shadow-xs'
                          : 'text-neutral-700 hover:text-black'
                      }`}
                    >
                      🛍️ Orders Count
                    </button>
                  </div>

                  {/* Grouping Switcher: Daily, Weekly, Monthly, Yearly */}
                  <div className="flex items-center bg-neutral-100 p-0.5 rounded-xs border border-neutral-200">
                    {(
                      [
                        { id: 'daily', label: 'Daily' },
                        { id: 'weekly', label: 'Weekly' },
                        { id: 'monthly', label: 'Monthly' },
                        { id: 'yearly', label: 'Yearly' },
                      ] as const
                    ).map((grp) => (
                      <button
                        key={grp.id}
                        onClick={() => setTimeframeGrouping(grp.id)}
                        className={`px-2 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer rounded-xs ${
                          timeframeGrouping === grp.id
                            ? 'bg-white text-black font-black border border-neutral-300 shadow-2xs'
                            : 'text-neutral-600 hover:text-black'
                        }`}
                      >
                        {grp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart Visualization */}
              {liveChartData.length === 0 ? (
                <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-300 bg-neutral-50/60 rounded-xs">
                  <TrendingUp className="w-10 h-10 text-neutral-400 mb-2 stroke-1" />
                  <p className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                    Zero Sales Recorded Yet
                  </p>
                  <p className="text-[11px] text-neutral-500 max-w-sm mt-1">
                    Your real daily, weekly, monthly, and yearly income trends will plot here as customers place
                    orders on the storefront.
                  </p>
                </div>
              ) : (
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={liveChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#000000" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#000000" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(val) =>
                          analyticsMetric === 'revenue'
                            ? val >= 1000
                              ? `AED ${Math.round(val / 1000)}k`
                              : `AED ${val}`
                            : `${val}`
                        }
                      />
                      <Tooltip
                        formatter={(value: any) => [
                          analyticsMetric === 'revenue'
                            ? `AED ${Number(value).toLocaleString()}`
                            : `${value} Orders`,
                          analyticsMetric === 'revenue' ? 'Income' : 'Orders',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#000000"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorMetric)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Period Breakdown Ledger Table (Daily / Weekly / Monthly / Yearly Accounting Table) */}
            <div className="bg-white border border-neutral-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                    Accounting & Orders Breakdown Ledger
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Itemized sales totals, order quantities, and average order value grouped by{' '}
                    <span className="font-bold text-black uppercase">{timeframeGrouping}</span>
                  </p>
                </div>

                <div className="text-xs font-bold text-neutral-700 bg-neutral-100 px-3 py-1 rounded-xs">
                  {periodBreakdown.length} {timeframeGrouping} period{periodBreakdown.length !== 1 ? 's' : ''} on record
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200">
                    <tr>
                      <th className="p-3">Period</th>
                      <th className="p-3">Total Income (Revenue)</th>
                      <th className="p-3">Orders Count</th>
                      <th className="p-3">Avg Order Value (AOV)</th>
                      <th className="p-3">Unique Buyers</th>
                      <th className="p-3">Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {periodBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-400">
                          No orders or sales recorded yet. When customer sales occur, itemized period breakdowns will
                          appear here automatically.
                        </td>
                      </tr>
                    ) : (
                      periodBreakdown.map((row) => (
                        <tr key={row.sortKey} className="hover:bg-neutral-50 transition-colors">
                          <td className="p-3 font-bold text-neutral-900">{row.label}</td>
                          <td className="p-3 font-black text-neutral-900">AED {row.revenue.toLocaleString()}</td>
                          <td className="p-3 font-bold text-neutral-800">{row.orders} orders</td>
                          <td className="p-3 font-mono text-neutral-700">AED {row.avgOrderValue.toLocaleString()}</td>
                          <td className="p-3 text-neutral-700">{row.customerCount} customers</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 text-[10px]">
                              {row.confirmed > 0 && (
                                <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-800 rounded-xs font-bold">
                                  {row.confirmed} confirmed
                                </span>
                              )}
                              {row.shipped > 0 && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded-xs font-bold">
                                  {row.shipped} shipped
                                </span>
                              )}
                              {row.delivered > 0 && (
                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-xs font-bold">
                                  {row.delivered} delivered
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products Units Chart & Live Ranking */}
            <div className="bg-white p-6 border border-neutral-200 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                  Top Best Sellers By Real Volume
                </h3>
                <p className="text-xs text-neutral-500">Units sold to customers in Pakistan</p>
              </div>

              {liveTopProducts.length === 0 ? (
                <div className="h-48 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-300 bg-neutral-50/60 rounded-xs">
                  <Package className="w-8 h-8 text-neutral-400 mb-2 stroke-1" />
                  <p className="text-xs font-bold text-neutral-800 uppercase tracking-wider">No Items Sold Yet</p>
                  <p className="text-[11px] text-neutral-500 max-w-xs mt-1">
                    Your best-selling activewear pieces will rank here automatically once real customer orders are
                    placed.
                  </p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveTopProducts} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip formatter={(val: any) => [`${val} units`, 'Sold']} />
                      <Bar dataKey="units" fill="#111111" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Recent Orders Preview Table */}
            <div className="bg-white border border-neutral-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                    Latest Store Orders
                  </h3>
                  <p className="text-xs text-neutral-500">New customer orders ready for packing and dispatch</p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-black underline hover:text-neutral-600 cursor-pointer"
                >
                  View All Orders ({orders.length})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-neutral-400">
                          No orders placed yet. Orders from the storefront will appear here live!
                        </td>
                      </tr>
                    ) : (
                      orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-neutral-900">{order.id}</td>
                          <td className="p-3 font-semibold text-neutral-800">{order.customerName}</td>
                          <td className="p-3 font-mono">{order.phone}</td>
                          <td className="p-3">{order.city}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm bg-neutral-100 text-neutral-800">
                              {order.status}
                            </span>
                          </td>
                          <td className="p-3 font-black text-neutral-900">{formatPrice(order.total)}</td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                setEditingOrder(order);
                              }}
                              className="px-2 py-1 bg-black text-white text-[10px] font-bold uppercase hover:bg-neutral-800 cursor-pointer"
                            >
                              Dispatch
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products Catalog */}
        {activeTab === 'products' && (
          <div className="p-6 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 border border-neutral-200">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 focus:outline-hidden focus:border-black"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="text-xs border border-neutral-300 p-1.5 bg-white font-medium focus:outline-hidden"
                >
                  <option value="all">All Categories</option>
                  <option value="seamless-leggings">Seamless Leggings</option>
                  <option value="sports-bras">Sports Bras</option>
                  <option value="bottoms">Bottoms & Shorts</option>
                  <option value="must-haves">Must Haves</option>
                </select>
              </div>

              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Activewear Item</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-neutral-200 shadow-2xs overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price (AED)</th>
                    <th className="p-3">Price (USD)</th>
                    <th className="p-3">Sizes</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-3 flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-10 h-12 object-cover border border-neutral-200 shrink-0" />
                        <div>
                          <p className="font-bold text-neutral-900">{prod.name}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">SKU: {prod.slug}</p>
                        </div>
                      </td>
                      <td className="p-3 font-medium uppercase text-neutral-600">{prod.category}</td>
                      <td className="p-3 font-bold text-neutral-900">AED {Math.round(prod.usdPrice * 3.67).toLocaleString()}</td>
                      <td className="p-3 font-bold text-neutral-700">${prod.usdPrice}</td>
                      <td className="p-3 text-[11px] font-mono text-neutral-600">{prod.sizes.join(', ')}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm bg-emerald-100 text-emerald-800">
                          Active & In Stock
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${prod.name}?`)) {
                              deleteProduct(prod.id);
                              showToast(`Deleted ${prod.name}`);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Customer Orders & Dispatch */}
        {activeTab === 'orders' && (
          <div className="p-6 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 border border-neutral-200">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by order #, phone, customer..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 focus:outline-hidden focus:border-black"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="text-xs border border-neutral-300 p-1.5 bg-white font-medium focus:outline-hidden"
                >
                  <option value="all">All Statuses ({orders.length})</option>
                  <option value="confirmed">New Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                className="w-full sm:w-auto px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV for Courier</span>
              </button>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-neutral-200 shadow-2xs overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer & Contact</th>
                    <th className="p-3">Delivery Address</th>
                    <th className="p-3">Items Summary</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-neutral-400">
                        No orders match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-3">
                          <p className="font-mono font-bold text-neutral-900">{order.id}</p>
                          <p className="text-[10px] text-neutral-400">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </td>

                        <td className="p-3">
                          <p className="font-bold text-neutral-900">{order.customerName}</p>
                          <p className="font-mono text-emerald-700">{order.phone}</p>
                          <p className="text-[10px] text-neutral-400">{order.email}</p>
                        </td>

                        <td className="p-3 max-w-[200px]">
                          <p className="truncate text-neutral-800">{order.address}</p>
                          <p className="text-[10px] font-bold text-neutral-500 uppercase">{order.city}, PK</p>
                        </td>

                        <td className="p-3">
                          <p className="font-semibold text-neutral-900">{order.items.length} item(s)</p>
                          <p className="text-[10px] text-neutral-500 line-clamp-1">
                            {order.items.map((it) => `${it.name} (${it.size})`).join(', ')}
                          </p>
                        </td>

                        <td className="p-3">
                          <p className="font-black text-neutral-900">{formatPrice(order.total)}</p>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase">
                            {order.paymentMethod === 'cash_on_delivery' ? 'COD' : 'Paid'}
                          </p>
                        </td>

                        <td className="p-3">
                          <select
                            value={order.status}
                            onChange={(e) => {
                              updateOrderStatus(order.id, e.target.value as any);

                            }}
                            className="p-1 text-xs border border-neutral-300 font-bold uppercase rounded-xs bg-white cursor-pointer"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>

                        <td className="p-3 text-right space-x-2">
                          <a
                            href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `*Assalam-o-Alaikum ${order.customerName}!* 👋\n\n` +
                              `Your activewear order *${order.id}* from *ICON Activewear Karachi* is being processed!\n\n` +
                              `• *Total Amount:* ${formatPrice(order.total)} (Cash on Delivery)\n` +
                              `• *Shipping Address:* ${order.address}, ${order.city}\n\n` +
                              `Please confirm if you are available to receive the parcel at this address. Shukriya!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xs transition-colors cursor-pointer inline-block"
                            title="Chat with Customer on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => {
                              if (confirm(`Delete Order ${order.id}?`)) {
                                deleteOrder(order.id);
                                
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer inline-block"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Coupons */}
        {activeTab === 'coupons' && (
          <div className="p-6 space-y-4">
            <div className="bg-white p-5 border border-neutral-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                Active Promo Codes & Coupons
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-neutral-900 bg-white px-2 py-0.5 border border-neutral-300">
                      FLASH40
                    </span>
                    <span className="text-[10px] bg-amber-400 text-black font-black px-1.5 py-0.2 rounded-full uppercase">
                      40% OFF
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">Active Flash Sale promotion on all drops.</p>
                </div>

                <div className="p-4 border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-neutral-900 bg-white px-2 py-0.5 border border-neutral-300">
                      ICON15 / VIP15
                    </span>
                    <span className="text-[10px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase">
                      15% OFF
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">Newsletter signup VIP club reward.</p>
                </div>

                <div className="p-4 border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-neutral-900 bg-white px-2 py-0.5 border border-neutral-300">
                      FREESHIP
                    </span>
                    <span className="text-[10px] bg-blue-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase">
                      FREE COD
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">Free delivery unlock across Pakistan.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Customers */}
        {activeTab === 'customers' && (
          <div className="p-6 space-y-4">
            <div className="bg-white border border-neutral-200 shadow-2xs overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Total Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-bold text-neutral-900">{o.customerName}</td>
                      <td className="p-3 text-neutral-600">{o.email}</td>
                      <td className="p-3 font-mono text-emerald-700">{o.phone}</td>
                      <td className="p-3">{o.city}</td>
                      <td className="p-3 font-bold">1 Order ({formatPrice(o.total)})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Settings */}
        {activeTab === 'settings' && (
          <div className="p-6 max-w-2xl space-y-6">
            <div className="bg-white p-6 border border-neutral-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                Official Karachi HQ Settings
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">
                    Store Owner Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Nazneen Rizvi (Store Owner)"
                    className="w-full p-2 border border-neutral-300 bg-neutral-100 text-neutral-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">
                    Store Owner Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={ownerEmail}
                    className="w-full p-2 border border-neutral-300 bg-neutral-100 text-neutral-600 cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">
                    WhatsApp Order Receiving Phone Number
                  </label>
                  <input
                    type="text"
                    value={ownerWhatsApp}
                    onChange={(e) => setOwnerWhatsApp(e.target.value)}
                    className="w-full p-2 border border-neutral-300 focus:outline-hidden focus:border-black font-mono font-bold text-emerald-800"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Customer inquiries and instant 1-click orders from the storefront route directly to this WhatsApp number.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => showToast('Settings saved successfully!')}
                    className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                  >
                    Save Store Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal with Mobile Camera & Gallery Upload */}
      {isAddProductModalOpen && (
        <div
          onClick={() => setIsAddProductModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
        >
          {/* Hidden Mobile File & Camera Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageFileChange}
          />

          <div
            ref={addProductModalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-neutral-300 rounded-t-2xl sm:rounded-none space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-neutral-900">
                  Add Activewear Item
                </h3>
                <p className="text-[11px] text-neutral-500">Upload photos directly from your phone camera or gallery</p>
              </div>
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-black cursor-pointer rounded-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {/* Product Photo Upload Section (Mobile-First) */}
              <div className="border border-neutral-200 bg-neutral-50 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-black uppercase tracking-wider text-neutral-800 text-[11px]">
                    Product Photo (Mobile Upload)
                  </label>
                  {newProdImage && (
                    <button
                      type="button"
                      onClick={() => setNewProdImage('')}
                      className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Clear Photo
                    </button>
                  )}
                </div>

                {/* If photo is chosen, show preview */}
                {newProdImage ? (
                  <div className="relative rounded-sm overflow-hidden border border-neutral-300 bg-white p-2 flex items-center gap-3">
                    <img
                      src={newProdImage}
                      alt="Product preview"
                      className="w-20 h-24 object-cover rounded-xs border border-neutral-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>Photo Ready to Publish</span>
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        Optimized for mobile & fast storefront display
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold uppercase rounded-xs cursor-pointer border border-neutral-300"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold uppercase rounded-xs cursor-pointer border border-neutral-300 flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Retake</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Primary Big Mobile Upload Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => cameraInputRef.current?.click()}
                        className="p-3 bg-white border border-neutral-300 hover:border-black hover:bg-neutral-50 transition-all rounded-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group"
                      >
                        <div className="p-2 bg-neutral-100 group-hover:bg-black group-hover:text-white rounded-full transition-colors text-neutral-800">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xs text-neutral-900">Take Photo</span>
                        <span className="text-[10px] text-neutral-500">Use Mobile Camera</span>
                      </button>

                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-white border border-neutral-300 hover:border-black hover:bg-neutral-50 transition-all rounded-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group"
                      >
                        <div className="p-2 bg-neutral-100 group-hover:bg-black group-hover:text-white rounded-full transition-colors text-neutral-800">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xs text-neutral-900">Choose File</span>
                        <span className="text-[10px] text-neutral-500">Phone Photo Gallery</span>
                      </button>
                    </div>

                    {/* Quick Preset Activewear Choices */}
                    <div className="pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                        Or pick a sample photo preset:
                      </p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {CATALOG_PHOTO_PRESETS.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => setNewProdImage(preset.url)}
                            className="group relative aspect-square rounded-xs overflow-hidden border border-neutral-200 hover:border-black transition-all cursor-pointer"
                            title={preset.label}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[8px] font-bold py-0.5 truncate text-center px-0.5">
                              {preset.label.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Or URL Input */}
                    <div className="pt-1">
                      <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-0.5">
                        Or paste image link:
                      </label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={newProdImage}
                        onChange={(e) => setNewProdImage(e.target.value)}
                        className="w-full p-2 border border-neutral-300 bg-white text-xs focus:outline-hidden focus:border-black font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div>
                <label className="block font-bold uppercase text-neutral-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ULTRA GLUTE SEAMLESS SHORTS"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 focus:outline-hidden focus:border-black text-sm"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full p-2.5 border border-neutral-300 bg-white focus:outline-hidden text-xs"
                  >
                    <option value="seamless-leggings">Seamless Leggings</option>
                    <option value="sports-bras">Sports Bras</option>
                    <option value="bottoms">Bottoms & Shorts</option>
                    <option value="must-haves">Must Haves</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">Price (AED) *</label>
                  <input
                    type="number"
                    required
                    value={newProdPricePkr}
                    onChange={(e) => setNewProdPricePkr(Number(e.target.value))}
                    className="w-full p-2.5 border border-neutral-300 focus:outline-hidden focus:border-black font-bold text-sm"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block font-bold uppercase text-neutral-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="High density micro-knit designed for training in Karachi..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 focus:outline-hidden focus:border-black text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2.5 border border-neutral-300 text-neutral-700 font-bold uppercase cursor-pointer hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-wider cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Publish Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
