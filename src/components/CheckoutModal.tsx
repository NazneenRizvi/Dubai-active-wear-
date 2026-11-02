import { orderReference } from '../lib/orderReference';
import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  CheckCircle,
  CreditCard,
  Truck,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  MessageCircle,
  Lock,
  ArrowLeft,
  Check,
  Clock,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

type CheckoutStep = 'shipping' | 'payment' | 'review';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotalUsd,
    discountUsd,
    shippingUsd,
    addOrder,
    setIsCustomerOrdersOpen,
    ownerEmail,
    ownerWhatsApp,
    promoCode
  } = useCart();

  const { currency, formatPrice, getRawPrice } = useCurrency();
  const { user } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: 'Dubai',
    postalCode: '00000',
    country: 'United Arab Emirates',
    shippingMethod: 'standard' as 'standard' | 'express',
    paymentMethod: 'credit_card' as 'credit_card'
  });

  const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  // All checkout rows and totals use the same currency and two-decimal arithmetic.
  const lineAmount = (usdPrice: number, quantity: number, pkrPrice?: number) =>
    roundMoney(getRawPrice(usdPrice * quantity, pkrPrice === undefined ? undefined : pkrPrice * quantity));
  const displaySubtotal = roundMoney(items.reduce((sum, item) =>
    sum + lineAmount(item.product.usdPrice, item.quantity, item.product.pkrPrice), 0));
  const displayDiscount = roundMoney(getRawPrice(discountUsd));
  const isFreeStandardShipping = shippingUsd === 0;
  const displayShipping = isFreeStandardShipping ? 0 : formData.shippingMethod === 'express'
    ? roundMoney(25 * CURRENCIES[currency].rateAgainstUsd / 3.67)
    : currency === 'PKR' ? 250 : roundMoney(getRawPrice(5.99));
  const displayTotal = roundMoney(Math.max(0, displaySubtotal - displayDiscount + displayShipping));
  // Convert an already converted order amount back to USD for existing formatter.
  const formatCurrencyAmount = (value: number) =>
    formatPrice(value / CURRENCIES[currency].rateAgainstUsd);


  const paymentApiUrl = (import.meta.env.VITE_PAYMENT_API_URL as string | undefined)?.trim()?.replace(/\/+$/, '') || '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const checkoutIdRef = useRef<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the modal content area
  useEffect(() => {
    if (!isCheckoutOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isCheckoutOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isCheckoutOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMessage('Please fill in your Full Name, Phone Number, and Delivery Address.');
      return;
    }
    setErrorMessage('');
    setStep('payment');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStep('review');
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    if (!paymentApiUrl) {
      setErrorMessage('Online payments are not available yet. No order has been placed.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Your bag is empty. Please add a product before checkout.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    if (!checkoutIdRef.current) {
      checkoutIdRef.current = `ICON-${crypto.randomUUID()}`;
    }
    const orderId = checkoutIdRef.current;

    // Payment session must be created by a trusted backend that calculates prices
    // from its own product catalogue. No local payment confirmation fallback.
    try {
      const response = await fetch(`${paymentApiUrl}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          customer_email: formData.email,
          customer_name: formData.fullName,
          amount_aed: Math.round(displayTotal * (3.67 / CURRENCIES[currency].rateAgainstUsd) * 100) / 100,
          items: items.map(i => ({
            product_id: i.product.id,
            name: i.product.name,
            quantity: i.quantity,
            size: i.selectedSize,
            color: i.selectedColor.name
          })),
          success_url: `${window.location.origin}?payment=success&orderId=${encodeURIComponent(orderId)}`,
          cancel_url: `${window.location.origin}?payment=cancelled`
        })
      });
      if (!response.ok) throw new Error('Payment service rejected the checkout request.');
      const data = await response.json();
      const destination = typeof data.checkout_url === 'string' ? data.checkout_url : '';
      const url = new URL(destination);
      if (url.protocol !== 'https:') throw new Error('Payment service returned an invalid secure checkout URL.');
      window.location.assign(url.toString());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Payment could not be started.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    checkoutIdRef.current = null;
    setCompletedOrder(null);
    setStep('shipping');
    setErrorMessage('');
    setIsCheckoutOpen(false);
  };

  const handleOpenMyOrders = () => {
    handleClose();
    setIsCustomerOrdersOpen(true);
  };

  // WhatsApp dispatch message url
  const whatsAppConfirmationUrl = (() => {
    if (!completedOrder) return '#';
    const cleanPhone = ownerWhatsApp.replace(/[^0-9]/g, '');
    const itemsList = completedOrder.items
      .map((i) => `• ${i.name} (${i.color}, Size ${i.size}) x${i.quantity}`)
      .join('\n');
    const msg = encodeURIComponent(
      `*🛍️ ORDER UPDATE — DUBAI ACTIVEWEAR*\n` +
      `-----------------------------------------\n` +
      `*Order ID:* ${orderReference(completedOrder.id)}\n` +
      `*Customer:* ${completedOrder.customerName}\n` +
      `*Phone:* ${completedOrder.phone}\n` +
      `*Address:* ${completedOrder.address}, ${completedOrder.city}\n\n` +
      `*Items:*\n${itemsList}\n\n` +
      `*Order Total:* ${formatCurrencyAmount(completedOrder.total)}\n` +
      `-----------------------------------------\n` +
      `Assalam-o-Alaikum Nazneen! Please dispatch this order to my address. Shukriya!`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  })();

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-none shadow-2xl border border-neutral-200 p-5 sm:p-8"
      >
        {/* Close Button */}
        {/* Close button moved to sticky header */}

        {completedOrder ? (
          /* ================= ORDER CONFIRMATION SCREEN ================= */
          <div className="text-center py-6 sm:py-10 space-y-6 max-w-lg mx-auto animate-fade-in">
            {/* Animated SVG Checkmark */}
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500 shadow-lg">
              <svg className="w-10 h-10 text-emerald-600 animate-scale-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 border border-emerald-200">
                Order Details (Payment Unverified)
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-neutral-900 uppercase">
                Order Confirmed!
              </h2>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                Thank you, <strong className="text-neutral-900">{completedOrder.customerName}</strong>! Your order reference is <strong className="font-mono text-black">{orderReference(completedOrder.id)}</strong>.
              </p>
            </div>

            {/* Order Details Badge */}
            <div className="bg-[#FAF9F8] border border-neutral-200 p-4 text-left text-xs space-y-2.5 shadow-2xs">
              <div className="flex justify-between border-b border-neutral-200 pb-2">
                <span className="text-neutral-500 uppercase tracking-wider text-[11px]">Estimated Delivery</span>
                <span className="font-bold text-neutral-900">Same-Day / 24h (Dubai) · 1–2 Days (UAE Emirates)</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-2">
                <span className="text-neutral-500 uppercase tracking-wider text-[11px]">Payment Mode</span>
                <span className="font-bold capitalize text-neutral-800">
                  Card Payment
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-2">
                <span className="text-neutral-500 uppercase tracking-wider text-[11px]">Delivery Address</span>
                <span className="font-medium text-neutral-800 text-right truncate max-w-[220px]">
                  {completedOrder.address}, {completedOrder.city}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-neutral-900 font-bold uppercase tracking-wider">Total Amount</span>
                <span className="font-black text-sm text-neutral-900 tabular-nums">
                  {formatCurrencyAmount(completedOrder.total)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleOpenMyOrders}
                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-black tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Track My Order Status</span>
              </button>

              <a
                href={whatsAppConfirmationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-black tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Send Order Receipt on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-neutral-500 hover:text-black underline cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (

          <div>
            {/* Header & Animated Step Indicator */}
            <div className="sticky top-0 bg-white z-10 border-b border-neutral-200 pb-4">
              <div className="flex items-center justify-between">
  <button
    onClick={handleClose}
    className="text-xs text-neutral-500 hover:text-black underline"
  >
    ← Back to Cart
  </button>
  <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-neutral-900 uppercase">
    Checkout
  </h2>
  <span className="text-xs font-mono text-neutral-400 font-bold uppercase">
    Step {step === 'shipping' ? '1' : step === 'payment' ? '2' : '3'} of 3
  </span>
  <button
    onClick={handleClose}
    className="p-2 text-neutral-500 hover:text-black"
    aria-label="Close checkout"
  >
    <X className="w-5 h-5" />
  </button>
</div>

              {/* Progress Bar & Step Labels */}
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold uppercase tracking-wider">
                  <span className={step === 'shipping' ? 'text-black' : 'text-neutral-400'}>
                    1. Shipping
                  </span>
                  <span className={step === 'payment' ? 'text-black' : 'text-neutral-400'}>
                    2. Payment
                  </span>
                  <span className={step === 'review' ? 'text-black' : 'text-neutral-400'}>
                    3. Review
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-black h-full transition-all duration-300"
                    style={{
                      width: step === 'shipping' ? '33.33%' : step === 'payment' ? '66.66%' : '100%'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Inline Error Notice */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-fade-in">
                {errorMessage}
              </div>
            )}

            {/* STEP 1: SHIPPING INFORMATION */}
            {step === 'shipping' && (
              <form onSubmit={handleShippingSubmit} className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Sarah Jenkins / Sana Khan"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. sarah@example.com"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+971 50 123 4567"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      Emirate / City *
                    </label>
                    <select
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white focus:border-black focus:outline-hidden"
                    >
                      <option value="Dubai">Dubai</option>
                      <option value="Abu Dhabi">Abu Dhabi</option>
                      <option value="Sharjah">Sharjah</option>
                      <option value="Ajman">Ajman</option>
                      <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                      <option value="Fujairah">Fujairah</option>
                      <option value="Umm Al Quwain">Umm Al Quwain</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                    Building / Villa, Street & Area (Dubai / UAE) *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g. Marina Heights Tower, Apt 1402, Dubai Marina"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 focus:border-black focus:outline-hidden"
                  />
                </div>

                {/* Shipping Method Selector Radio Cards */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-2">
                    Delivery Speed
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3 border flex items-center justify-between cursor-pointer transition-all ${
                        formData.shippingMethod === 'standard'
                          ? 'border-black bg-neutral-50 ring-1 ring-black'
                          : 'border-neutral-300 hover:border-black'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value="standard"
                          checked={formData.shippingMethod === 'standard'}
                          onChange={handleInputChange}
                          className="accent-black"
                        />
                        <div>
                          <p className="text-xs font-bold uppercase text-neutral-900">Standard UAE Courier</p>
                          <p className="text-[11px] text-neutral-500">1–2 Days across all 7 Emirates</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700">
                        {displayShipping === 0 ? 'FREE' : formatCurrencyAmount(displayShipping)}
                      </span>
                    </label>

                    <label
                      className={`p-3 border flex items-center justify-between cursor-pointer transition-all ${
                        formData.shippingMethod === 'express'
                          ? 'border-black bg-neutral-50 ring-1 ring-black'
                          : 'border-neutral-300 hover:border-black'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value="express"
                          checked={formData.shippingMethod === 'express'}
                          onChange={handleInputChange}
                          className="accent-black"
                        />
                        <div>
                          <p className="text-xs font-bold uppercase text-neutral-900">Same-Day Express Courier</p>
                          <p className="text-[11px] text-neutral-500">Dubai Only (Under 4 Hours)</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-neutral-900">25 AED</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="text-xs text-neutral-500">
                    Total: <strong className="text-sm font-black text-black">{formatCurrencyAmount(displayTotal)}</strong>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-black tracking-widest uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>CONTINUE TO PAYMENT</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: PAYMENT METHOD */}
            {step === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="space-y-5 animate-fade-in">
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase">
                    Select Payment Method (UAE)
                  </label>

                  {/* Option 1: Credit / Debit Card (Stripe & UAE Banks) */}
                  <label
                    className={`p-4 border block cursor-pointer transition-all ${
                      formData.paymentMethod === 'credit_card'
                        ? 'border-black bg-neutral-50 ring-1 ring-black'
                        : 'border-neutral-300 hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="credit_card"
                          checked={formData.paymentMethod === 'credit_card'}
                          onChange={handleInputChange}
                          className="accent-black"
                        />
                        <div>
                          <p className="text-xs font-black uppercase text-neutral-900">
                            Online card payment (secure checkout)
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            Available payment methods depend on the approved payment provider.
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0">
                        Online payment
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-neutral-600">
                      Card details will be entered only on the payment provider's secure hosted page.
                    </p>
                  </label>
                  {!paymentApiUrl && (
                    <p role="status" className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3">
                      Online payments are not configured yet. Checkout is temporarily unavailable.
                    </p>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Shipping</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-black tracking-widest uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>REVIEW ORDER</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: ORDER REVIEW & PLACE ORDER */}
            {step === 'review' && (
              <div className="space-y-5 animate-fade-in">
                {/* Summary Box */}
                <div className="border border-neutral-200 bg-[#FAF9F8] p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-mono">Delivering to</span>
                      <p className="font-bold text-neutral-900">{formData.fullName} ({formData.phone})</p>
                      <p className="text-neutral-600">{formData.address}, {formData.city}</p>
                    </div>
                    <button
                      onClick={() => setStep('shipping')}
                      className="text-[11px] text-neutral-600 underline hover:text-black cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-mono">Payment Mode</span>
                      <p className="font-bold text-neutral-900">
                        Secure Online Card Payment
                      </p>
                    </div>
                    <button
                      onClick={() => setStep('payment')}
                      className="text-[11px] text-neutral-600 underline hover:text-black cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Items Preview */}
                  <div className="space-y-2 py-1">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Items ({items.length})</span>
                    {items.map((i) => (
                      <div key={i.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={i.product.image} alt={i.product.name} className="w-9 h-10 object-cover border border-neutral-200 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold truncate text-neutral-900">{i.product.name}</p>
                            <p className="text-[10px] text-neutral-500">{i.selectedColor.name} · Size {i.selectedSize}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="inline-flex items-center border border-neutral-300 bg-white" aria-label={`Quantity for ${i.product.name}`}>
                                <button type="button" aria-label={`Decrease ${i.product.name} quantity`} disabled={i.quantity <= 1} onClick={() => updateQuantity(i.id, i.quantity - 1)} className="px-3 py-2 disabled:opacity-30 hover:bg-neutral-100">−</button>
                                <span className="px-2 tabular-nums font-bold">{i.quantity}</span>
                                <button type="button" aria-label={`Increase ${i.product.name} quantity`} disabled={i.quantity >= 10} onClick={() => updateQuantity(i.id, Math.min(10, i.quantity + 1))} className="px-3 py-2 disabled:opacity-30 hover:bg-neutral-100">+</button>
                              </div>
                              <button type="button" onClick={() => removeFromCart(i.id)} className="text-red-700 underline text-[10px]">Remove</button>
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-neutral-900 tabular-nums shrink-0 ml-2">
                          {formatCurrencyAmount(lineAmount(i.product.usdPrice, i.quantity, i.product.pkrPrice))}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="pt-2 border-t border-neutral-200 space-y-1 text-right">
                    <div className="flex justify-between text-[11px] text-neutral-600">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatCurrencyAmount(displaySubtotal)}</span>
                    </div>
                    {discountUsd > 0 && (
                      <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                        <span>Discount ({promoCode})</span>
                        <span className="font-mono">-{formatCurrencyAmount(displayDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px] text-neutral-600">
                      <span>Shipping Fee</span>
                      <span className="font-mono">{displayShipping === 0 ? 'FREE' : formatCurrencyAmount(displayShipping)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-neutral-900 pt-1 border-t border-neutral-200">
                      <span>Total Amount</span>
                      <span className="tabular-nums">{formatCurrencyAmount(displayTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    className="text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Payment</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || !paymentApiUrl || items.length === 0}
                    className="relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 bg-black hover:bg-neutral-800 active:scale-95 text-white text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer group"
                  >
                    {/* Shimmer sweep animation */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none" />
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>{isSubmitting ? 'OPENING SECURE PAYMENT…' : `PROCEED TO PAYMENT · ${formatCurrencyAmount(displayTotal)}`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
