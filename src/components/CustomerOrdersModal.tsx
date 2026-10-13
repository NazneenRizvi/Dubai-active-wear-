import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Package,
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Search,
  Calendar
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Order } from '../types';

export const CustomerOrdersModal: React.FC = () => {
  const { isCustomerOrdersOpen, setIsCustomerOrdersOpen, orders } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside modal content
  useEffect(() => {
    if (!isCustomerOrdersOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsCustomerOrdersOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isCustomerOrdersOpen, setIsCustomerOrdersOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isCustomerOrdersOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCustomerOrdersOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCustomerOrdersOpen, setIsCustomerOrdersOpen]);

  if (!isCustomerOrdersOpen) return null;

  // Filter orders:
  // 1. If customer typed a search query (Order ID, Email, Phone, Name), filter from all orders
  // 2. If user is logged in, show orders matching user email
  // 3. If guest / not logged in and no search, show all orders placed in this browser session
  const query = searchQuery.trim().toLowerCase();

  const displayedOrders: Order[] = orders.filter((order) => {
    if (query) {
      const matchId = order.id?.toLowerCase().includes(query);
      const matchEmail = order.email?.toLowerCase().includes(query);
      const matchPhone = order.phone?.toLowerCase().includes(query);
      const matchName = order.customerName?.toLowerCase().includes(query);
      return matchId || matchEmail || matchPhone || matchName;
    }

    if (user?.email) {
      return order.email?.toLowerCase().trim() === user.email.toLowerCase().trim();
    }

    // Guest checkout: show all orders saved in this browser
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-none flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-700" /> Confirmed
          </span>
        );
      case 'processing':
        return (
          <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-none flex items-center gap-1.5">
            <Package className="w-3 h-3 text-blue-700" /> Packing & Quality Check
          </span>
        );
      case 'shipped':
        return (
          <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-none flex items-center gap-1.5">
            <Truck className="w-3 h-3 text-purple-700" /> Out for Delivery
          </span>
        );
      case 'delivered':
        return (
          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-none flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-700" /> Delivered
          </span>
        );
      default:
        return (
          <span className="bg-neutral-100 text-neutral-800 border border-neutral-300 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-none">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => setIsCustomerOrdersOpen(false)}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-300 flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#111111] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-neutral-800 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm sm:text-base font-black font-display tracking-wider uppercase">
                Track Orders & History
              </h2>
              <p className="text-[10px] sm:text-[11px] text-neutral-400">
                {user?.email ? (
                  <>Account: <strong className="text-white">{user.email}</strong></>
                ) : (
                  <>Track by Order ID, Phone, or Email</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCustomerOrdersOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close orders"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Track Bar */}
        <div className="p-4 sm:p-5 bg-neutral-50 border-b border-neutral-200">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID (e.g. ICON-...), email, or phone number..."
              className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black font-mono transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black text-xs font-bold px-1"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1.5">
            Tip: Enter your Order ID from checkout receipt to instantly track live delivery.
          </p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {displayedOrders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                {searchQuery ? 'No matching order found' : 'No orders found yet'}
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                {searchQuery ? (
                  <>Could not find any order matching "<span className="font-semibold text-neutral-800">{searchQuery}</span>". Please check your Order ID or phone number.</>
                ) : user?.email ? (
                  <>No orders found for <span className="font-semibold text-neutral-800">{user.email}</span>. You can search by your Order ID above or place a new order.</>
                ) : (
                  <>You haven't placed an order in this browser yet. Enter your Order ID in the search box above to track any existing order.</>
                )}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsCustomerOrdersOpen(false);
                    const el = document.getElementById('shop-seamless');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  START SHOPPING
                </button>
              </div>
            </div>
          ) : (
            displayedOrders.map((order) => (
              <div
                key={order.id}
                className="border border-neutral-300 bg-white p-4 sm:p-5 space-y-3 shadow-xs hover:border-black transition-colors"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-neutral-500 block">Order ID</span>
                    <p className="font-mono font-bold text-xs sm:text-sm text-neutral-900 break-all">
                      {order.id}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span>·</span>
                      <span>Customer: <strong className="text-neutral-700">{order.customerName}</strong></span>
                    </div>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Tracking info banner if shipped */}
                {Boolean((order as Order & { trackingCarrier?: string; trackingNumber?: string }).trackingNumber) && (
                  <div className="bg-purple-50 border border-purple-200 p-2.5 flex items-center justify-between text-xs text-purple-950">
                    <div>
                      <span className="font-bold text-[11px] block">
                        Carrier: {(order as Order & { trackingCarrier?: string; trackingNumber?: string }).trackingCarrier || 'Logistics Partner'}
                      </span>
                      <span className="font-mono text-[10px] text-purple-800">
                        Tracking #: {(order as Order & { trackingCarrier?: string; trackingNumber?: string }).trackingNumber}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                      In Transit
                    </span>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2 py-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs bg-neutral-50 p-2 border border-neutral-100">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-14 object-cover border border-neutral-200 shrink-0 bg-white"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-neutral-500">
                          Color: {item.color} · Size: {item.size} · Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold tabular-nums text-neutral-900 shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery & Total */}
                <div className="pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between text-xs gap-2">
                  <div className="flex items-start gap-1.5 text-neutral-600 text-[11px] max-w-xs">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                    <span>
                      {order.address}, {order.city} {order.phone ? `(Tel: ${order.phone})` : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 uppercase mr-1">Total:</span>
                    <strong className="text-sm font-black text-neutral-900">
                      {formatPrice(order.total)}
                    </strong>
                    <span className="text-[10px] text-neutral-500 block">
                      {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery (COD)' : 'Card Payment'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
