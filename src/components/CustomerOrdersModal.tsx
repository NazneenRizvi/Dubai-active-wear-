import React, { useRef, useEffect } from 'react';
import { X, Package, ShoppingBag, Truck, CheckCircle, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

export const CustomerOrdersModal: React.FC = () => {
  const { isCustomerOrdersOpen, setIsCustomerOrdersOpen, orders, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

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

  // Filter orders placed by this specific customer
  const myOrders = orders.filter(
    (order) => order.email?.toLowerCase().trim() === user?.email?.toLowerCase().trim()
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm flex items-center gap-1">
            <Clock className="w-3 h-3" /> Order Confirmed
          </span>
        );
      case 'processing':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm flex items-center gap-1">
            <Package className="w-3 h-3" /> Packing & Quality Check
          </span>
        );
      case 'shipped':
        return (
          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm flex items-center gap-1">
            <Truck className="w-3 h-3" /> Out for Delivery
          </span>
        );
      case 'delivered':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Delivered
          </span>
        );
      default:
        return (
          <span className="bg-neutral-100 text-neutral-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">
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
        className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-300 flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#111111] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-neutral-800 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm sm:text-base font-black font-display tracking-wider uppercase">
                My Order History
              </h2>
              <p className="text-[10px] sm:text-[11px] text-neutral-400">
                Logged in as: <strong className="text-white">{user?.email}</strong>
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

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {myOrders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                No orders found yet
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Orders placed using <span className="font-semibold text-neutral-800">{user?.email}</span> will show here with real-time delivery status and receipts.
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
            myOrders.map((order) => (
              <div
                key={order.id}
                className="border border-neutral-200 bg-[#FAF9F8] p-4 sm:p-5 space-y-3 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-neutral-500">Order ID:</span>
                    <p className="font-mono font-bold text-xs sm:text-sm text-neutral-900">
                      {order.id}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Items */}
                <div className="space-y-2 py-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-14 object-cover border border-neutral-200 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-neutral-500">
                          Color: {item.color} · Size: {item.size} · Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold tabular-nums text-neutral-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery & Total */}
                <div className="pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1.5 text-neutral-600 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate max-w-[240px] sm:max-w-xs">{order.address}, {order.city}</span>
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
