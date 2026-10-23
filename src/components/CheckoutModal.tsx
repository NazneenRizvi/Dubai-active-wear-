import React, { useEffect, useState, useRef } from 'react';
import { X, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { apiRequest } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import type { Order } from '../types';

type Quote = { currency: string; subtotal: number; discount: number; shipping: number; total: number; items: Order['items'] };
const emptyAddress = { customerName: '', phone: '', address: '', city: 'Dubai', postalCode: '', country: 'United Arab Emirates' };

export const CheckoutModal: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = useRef(user?.id);
  currentUserId.current = user?.id;
  const { currency } = useCurrency();
  const { items, promoCode, isCheckoutOpen, setIsCheckoutOpen, clearCart, refreshOrders, setIsCustomerOrdersOpen } = useCart();
  const [address, setAddress] = useState(emptyAddress);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [returnSession, setReturnSession] = useState<string | null>(null);

  // Reset all personal checkout data when the signed-in account changes.
  useEffect(() => {
    setAddress({ ...emptyAddress, customerName: user?.name || '' });
    setQuote(null); setCompletedOrder(null); setError(''); setNotice(''); setBusy(false); setReturnSession(null);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success' && params.get('session_id')) {
      setReturnSession(params.get('session_id')); setIsCheckoutOpen(true);
    } else if (params.get('payment') === 'cancelled') {
      setNotice('Payment was cancelled. Your cart is unchanged.'); setIsCheckoutOpen(true);
    }
  }, [user?.id]);

  useEffect(() => {
    setQuote(null); setError('');
  }, [items, currency, promoCode]);

  useEffect(() => {
    if (!isCheckoutOpen) { setCompletedOrder(null); setQuote(null); setError(''); setReturnSession(null); }
  }, [isCheckoutOpen]);

  useEffect(() => {
    if (!returnSession || !user) return;
    let active = true;
    setBusy(true); setError('');
    apiRequest(`/api/checkout/session/${encodeURIComponent(returnSession)}`).then(async data => {
      if (!active) return;
      if (!data.order) throw new Error('Payment confirmation is unavailable.');
      setCompletedOrder(data.order); clearCart();
      await refreshOrders();
      if (active) { setReturnSession(null); cleanPaymentUrl(); }
    }).catch(error => { if (active) setError(error.message || 'Could not verify payment. Please check your orders before trying again.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [returnSession, user?.id]);

  useEffect(() => {
    if (!isCheckoutOpen) return;
    const listener = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) setIsCheckoutOpen(false); };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [isCheckoutOpen, busy]);

  function cleanPaymentUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('payment'); url.searchParams.delete('session_id');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }
  const payload = () => ({ ...address, currency, promoCode, paymentMethod: 'credit_card', items: items.map(item => ({ productId: item.product.id, color: item.selectedColor.name, size: item.selectedSize, quantity: item.quantity })) });
  const review = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const id = user?.id;
    try {
      const data = await apiRequest('/api/checkout/quote', { method: 'POST', body: JSON.stringify(payload()) });
      if (id === currentUserId.current) setQuote(data);
    }
    catch (error) { if (id === currentUserId.current) setError(error instanceof Error ? error.message : 'Could not calculate your order.'); }
    finally { if (id === currentUserId.current) setBusy(false); }
  };
  const pay = async () => {
    if (busy || !quote) return;
    setBusy(true); setError('');
    const id = user?.id;
    try {
      const result = await apiRequest('/api/checkout/session', { method: 'POST', body: JSON.stringify(payload()) });
      if (id !== currentUserId.current) return;
      const url = new URL(result.checkoutUrl);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Invalid payment link.');
      window.location.assign(url.href);
    } catch (error) { if (id === currentUserId.current) { setError(error instanceof Error ? error.message : 'Checkout is unavailable. Please retry.'); setBusy(false); } }
  };
  const money = (amount: number, code: string) => new Intl.NumberFormat('en', { style: 'currency', currency: code }).format(amount);
  if (!user || !isCheckoutOpen) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Secure checkout" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto flex items-start sm:items-center justify-center p-4" onClick={() => { if (!busy) setIsCheckoutOpen(false); }}>
      <div className="relative bg-white w-full max-w-xl p-6 sm:p-8 my-8 shadow-2xl" onClick={event => event.stopPropagation()}>
        <button aria-label="Close checkout" disabled={busy} onClick={() => setIsCheckoutOpen(false)} className="absolute top-4 right-4 p-2"><X size={20} /></button>
        <p className="text-xs tracking-widest text-neutral-500 mb-2">ICON ACTIVEWEAR</p>
        <h2 className="text-2xl font-black uppercase mb-5">{completedOrder ? 'Payment confirmed' : returnSession ? 'Checking your payment' : quote ? 'Review your order' : 'Secure checkout'}</h2>
        {error && <p role="alert" className="bg-red-50 text-red-700 border border-red-200 p-3 text-sm mb-4">{error}</p>}
        {notice && <p role="status" className="bg-neutral-100 p-3 text-sm mb-4">{notice}</p>}
        {completedOrder ? <div className="space-y-4">
          <CheckCircle className="text-emerald-600" size={36} />
          <p>Your payment has been verified and your order is saved.</p>
          <p className="text-sm break-all">Order: {completedOrder.id}</p>
          <p className="font-bold">{money(completedOrder.total, completedOrder.currency)}</p>
          <button onClick={() => { setIsCheckoutOpen(false); setIsCustomerOrdersOpen(true); }} className="bg-black text-white w-full py-3 font-bold">VIEW MY ORDERS</button>
        </div> : returnSession ? <div className="space-y-4">
          <p>{busy ? 'Please wait while we verify your payment securely.' : 'Your order will only be confirmed after the payment provider verifies it.'}</p>
          {!busy && <button onClick={() => { setIsCheckoutOpen(false); setIsCustomerOrdersOpen(true); }} className="border border-black w-full py-3">CHECK MY ORDERS</button>}
        </div> : items.length === 0 ? <p>Your cart is empty. Add a product to continue.</p> : quote ? <div className="space-y-4">
          <p className="text-sm text-neutral-600">{address.customerName} · {user.email}<br />{address.address}, {address.city}, {address.country}</p>
          <ul className="divide-y">{quote.items.map((item, index) => <li key={index} className="py-3 text-sm flex justify-between gap-3"><span>{item.name}<br /><span className="text-neutral-500">{item.color} / {item.size} × {item.quantity}</span></span><span>{money(item.price * item.quantity, quote.currency)}</span></li>)}</ul>
          <dl className="space-y-2 text-sm border-t pt-4">
            {([['Subtotal', quote.subtotal], ['Discount', -quote.discount], ['Shipping', quote.shipping], ['Total', quote.total]] as const).map(([label, amount]) => <div key={label} className={`flex justify-between ${label === 'Total' ? 'text-lg font-black pt-2' : ''}`}><dt>{label}</dt><dd>{money(amount, quote.currency)}</dd></div>)}
          </dl>
          <p className="text-xs text-neutral-500 flex gap-2"><Lock size={14} />Pay by card on Stripe. Available wallets appear on supported devices.</p>
          <button disabled={busy} onClick={pay} className="bg-black text-white w-full py-4 font-bold disabled:opacity-50">{busy ? 'CONNECTING…' : 'CONTINUE TO SECURE PAYMENT'}</button>
          <button disabled={busy} onClick={() => setQuote(null)} className="flex gap-2 text-sm items-center"><ArrowLeft size={16} />Edit delivery details</button>
        </div> : <form onSubmit={review} className="space-y-4">
          <p className="text-sm text-neutral-600">Signed in as {user.email}</p>
          {Object.entries(address).map(([key, value]) => <label key={key} className="block text-xs font-bold uppercase">{({ customerName: 'Full name', phone: 'Phone number', address: 'Delivery address', city: 'City', postalCode: 'Postal code (optional)', country: 'Country' } as Record<string, string>)[key]}
            <input name={key} autoComplete={({ customerName: 'name', phone: 'tel', address: 'street-address', city: 'address-level2', postalCode: 'postal-code', country: 'country-name' } as Record<string, string>)[key]} type={key === 'phone' ? 'tel' : 'text'} required={key !== 'postalCode'} maxLength={key === 'postalCode' ? 30 : 500} value={value} onChange={event => setAddress(prev => ({ ...prev, [key]: event.target.value }))} className="mt-1 w-full border border-neutral-300 p-3 text-sm font-normal normal-case" />
          </label>)}
          <p className="text-xs text-neutral-500">Delivery is standard shipping. Your final total is calculated before payment.</p>
          <button disabled={busy} className="bg-black text-white w-full py-4 font-bold disabled:opacity-50">{busy ? 'CALCULATING…' : 'REVIEW ORDER'}</button>
          {!auth.currentUser?.emailVerified && <button type="button" className="text-sm underline" onClick={async () => {
            try { if (auth.currentUser) await sendEmailVerification(auth.currentUser); setNotice('Verification email sent. Open the link, then sign out and sign in again.'); }
            catch { setError('Could not send verification email. Please try again later.'); }
          }}>Resend email verification</button>}
        </form>}
      </div>
    </div>
  );
};
