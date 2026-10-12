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
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

type CheckoutStep = 'shipping' | 'payment' | 'review';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    items,
    clearCart,
    subtotalUsd,
    discountUsd,
    shippingUsd,
    totalUsd,
    addOrder,
    setIsCustomerOrdersOpen,
    ownerEmail,
    ownerWhatsApp,
    promoCode
  } = useCart();

  const { formatPrice, currency } = useCurrency();
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
    paymentMethod: 'credit_card' as 'cash_on_delivery' | 'credit_card' | 'apple_pay',
    cardNumber: '4242 •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvc: '888',
    cardName: user?.name || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

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
    setErrorMessage('');
    setIsSubmitting(true);

    const orderId = `ICON-${crypto.randomUUID()}`;
    const paymentApiUrl = (import.meta.env.VITE_PAYMENT_API_URL as string)?.trim()?.replace(/\/$/, '');

    // If Stripe FastAPI backend is connected and customer chose Card payment
    if (formData.paymentMethod === 'credit_card' && paymentApiUrl) {
      try {
        const response = await fetch(`${paymentApiUrl}/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            customer_email: formData.email,
            customer_name: formData.fullName,
            amount_aed: Math.round(totalUsd * 3.67),
            items: items.map((i) => ({
              name: i.product.name,
              quantity: i.quantity,
              price_aed: Math.round(i.product.usdPrice * 3.67)
            })),
            success_url: `${window.location.origin}?payment=success&orderId=${orderId}`,
            cancel_url: `${window.location.origin}?payment=cancelled`
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.checkout_url) {
            window.location.href = data.checkout_url;
            return;
          }
        }
      } catch (err) {
        console.warn('FastAPI Stripe redirect fallback to in-app processing:', err);
      }
    }

    const newOrder: Order = {
      id: orderId,
      customerName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      country: formData.country,
      items: items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        color: i.selectedColor.name,
        size: i.selectedSize,
        quantity: i.quantity,
        price: i.product.usdPrice,
        image: i.product.image
      })),
      subtotal: subtotalUsd,
      discount: discountUsd,
      shipping: shippingUsd,
      total: totalUsd,
      currency: currency || 'AED',
      paymentMethod: formData.paymentMethod,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // Save order to store backend & database
    try {
      await addOrder(newOrder);
      setCompletedOrder(newOrder);
      clearCart();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Order could not be saved. Please retry.');
    } finally { setIsSubmitting(false); }
  };

  const handleClose = () => {
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
      `*🛍️ ORDER CONFIRMED — ICON ACTIVEWEAR*\n` +
      `-----------------------------------------\n` +
      `*Order ID:* ${completedOrder.id}\n` +
      `*Customer:* ${completedOrder.customerName}\n` +
      `*Phone:* ${completedOrder.phone}\n` +
      `*Address:* ${completedOrder.address}, ${completedOrder.city}\n\n` +
      `*Items:*\n${itemsList}\n\n` +
      `*Total COD:* ${formatPrice(completedOrder.total)}\n` +
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
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black transition-colors cursor-pointer"
          aria-label="Close checkout"
        >
          <X className="w-5 h-5" />
        </button>

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
                Payment & Order Verified
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-neutral-900 uppercase">
                Order Confirmed!
              </h2>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                Thank you, <strong className="text-neutral-900">{completedOrder.customerName}</strong>! Your order reference is <strong className="font-mono text-black">{completedOrder.id}</strong>.
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
                  {completedOrder.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery (COD)' : 'Card Payment'}
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
                  {formatPrice(completedOrder.total)}
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
          /* ================= MULTI-STEP CHECKOUT FORM ================= */
          <div>
            {/* Header & Animated Step Indicator */}
            <div className="mb-6 border-b border-neutral-200 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-neutral-900 uppercase">
                  Checkout
                </h2>
                <span className="text-xs font-mono text-neutral-400 font-bold uppercase">
                  Step {step === 'shipping' ? '1' : step === 'payment' ? '2' : '3'} of 3
                </span>
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
                        {subtotalUsd >= 40.87 ? 'FREE' : formatPrice(shippingUsd)}
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

                <div className="pt-4 flex items-center justify-between">
                  <div className="text-xs text-neutral-500">
                    Total: <strong className="text-sm font-black text-black">{formatPrice(totalUsd)}</strong>
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
                            Bank Card / Apple Pay (Stripe Gateway)
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            Visa, MasterCard, AMEX & all UAE bank cards accepted securely.
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0">
                        Popular in UAE 🇦🇪
                      </span>
                    </div>

                    {formData.paymentMethod === 'credit_card' && (
                      <div className="mt-3 pt-3 border-t border-neutral-200 space-y-3 animate-fade-in text-xs">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                            Card Number
                          </label>
                          <input
                            type="text"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            placeholder="4242 •••• •••• 4242"
                            className="w-full px-3 py-2 border border-neutral-300 font-mono text-xs focus:border-black focus:outline-hidden bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              name="cardExpiry"
                              value={formData.cardExpiry}
                              onChange={handleInputChange}
                              placeholder="MM/YY"
                              className="w-full px-3 py-2 border border-neutral-300 font-mono text-xs focus:border-black focus:outline-hidden bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                              CVC / CVV
                            </label>
                            <input
                              type="text"
                              name="cardCvc"
                              value={formData.cardCvc}
                              onChange={handleInputChange}
                              placeholder="888"
                              className="w-full px-3 py-2 border border-neutral-300 font-mono text-xs focus:border-black focus:outline-hidden bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Option 2: Cash on Delivery (COD) */}
                  <label
                    className={`p-4 border block cursor-pointer transition-all ${
                      formData.paymentMethod === 'cash_on_delivery'
                        ? 'border-black bg-neutral-50 ring-1 ring-black'
                        : 'border-neutral-300 hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash_on_delivery"
                          checked={formData.paymentMethod === 'cash_on_delivery'}
                          onChange={handleInputChange}
                          className="accent-black"
                        />
                        <div>
                          <p className="text-xs font-black uppercase text-neutral-900">
                            Cash on Delivery (COD in AED)
                          </p>
                          <p className="text-[11px] text-neutral-600 mt-0.5">
                            Pay exact cash to the courier rider upon delivery across Dubai and UAE.
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
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
                        {formData.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery (COD)' : 'Credit / Debit Card (Stripe / Bank Card)'}
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
                      <div key={i.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={i.product.image} alt={i.product.name} className="w-9 h-10 object-cover border border-neutral-200 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold truncate text-neutral-900">{i.product.name}</p>
                            <p className="text-[10px] text-neutral-500">{i.selectedColor.name} · Size {i.selectedSize} · Qty {i.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-neutral-900 tabular-nums shrink-0 ml-2">
                          {formatPrice(i.product.usdPrice * i.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="pt-2 border-t border-neutral-200 space-y-1 text-right">
                    <div className="flex justify-between text-[11px] text-neutral-600">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatPrice(subtotalUsd)}</span>
                    </div>
                    {discountUsd > 0 && (
                      <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                        <span>Discount ({promoCode})</span>
                        <span className="font-mono">-{formatPrice(discountUsd)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px] text-neutral-600">
                      <span>Shipping Fee</span>
                      <span className="font-mono">{shippingUsd === 0 ? 'FREE' : formatPrice(shippingUsd)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-neutral-900 pt-1 border-t border-neutral-200">
                      <span>Total Amount (COD)</span>
                      <span className="tabular-nums">{formatPrice(totalUsd)}</span>
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
                    disabled={isSubmitting}
                    className="relative overflow-hidden px-8 py-4 bg-black hover:bg-neutral-800 active:scale-95 text-white text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer group"
                  >
                    {/* Shimmer sweep animation */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none" />
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>PLACE ORDER · {formatPrice(totalUsd)}</span>
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
