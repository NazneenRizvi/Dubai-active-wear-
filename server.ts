import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { STORE_OWNER_EMAIL } from './src/config.ts';
import { db } from './src/db/index.ts';
import { quoteCheckout, shippingDetails } from './src/lib/checkout.ts';
import { getAllOrders, insertOrder, confirmPaidOrder, updateOrderState, deleteOrderById, getLiveDashboardStats } from './src/db/orders.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const app = express();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const appUrl = process.env.APP_URL?.replace(/\/$/, '');
const allowedOrigins = [appUrl, ...(process.env.CORS_ORIGINS || '').split(',')].filter(Boolean);
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) }));
const isOwner = (req: AuthRequest) => !!req.user?.emailVerified && req.user.email === STORE_OWNER_EMAIL.toLowerCase().trim();
const requireOwner = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!isOwner(req)) return res.status(403).json({ error: 'Store owner access required.' });
  next();
};
const requireVerifiedEmail = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.user?.email || !req.user.emailVerified) return res.status(403).json({ error: 'Verify your email using the link in your inbox, then sign in again.' });
  next();
};
const serverError = (res: express.Response, error: unknown) => {
  console.error('[API failed]', error instanceof Error ? error.message : 'Unknown error');
  return res.status(503).json({ error: 'The service is temporarily unavailable. Please retry. Your order has not been confirmed.' });
};
async function confirmSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid' || session.mode !== 'payment' || !session.metadata?.orderId || !session.metadata?.email || session.amount_total == null || !session.currency) throw new Error('Payment is not complete.');
  return confirmPaidOrder(session.metadata.orderId, session.metadata.email, session.currency, session.amount_total);
}
// Stripe requires the untouched request bytes for signature verification.
app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '256kb' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.sendStatus(503);
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'] as string, process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return res.status(400).json({ error: 'Invalid webhook signature.' }); }
  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid') await confirmSession(session);
    }
    res.json({ received: true });
  } catch (error) { serverError(res, error); }
});
app.use(express.json({ limit: '256kb' }));
app.get(['/healthz', '/livez', '/startup', '/liveness'], (_req, res) => { res.send('OK'); });
app.get('/readyz', async (_req, res) => {
  if (!db) return res.status(503).send('Database unavailable');
  try { await db.execute('select 1'); res.send('OK'); } catch { res.status(503).send('Database unavailable'); }
});
app.get('/api/orders', requireAuth, requireVerifiedEmail, async (req: AuthRequest, res) => {
  // A customer's filter always comes from the verified identity, never the URL.
  const email = isOwner(req) ? (typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : undefined) : req.user!.email;
  try { res.json(await getAllOrders(email)); } catch (error) { serverError(res, error); }
});
// An order can only be created by the hosted payment checkout flow.
app.post('/api/orders', requireAuth, (_req, res) => { res.status(405).json({ error: 'Use secure checkout to place an order.' }); });
app.post('/api/checkout/quote', requireAuth, requireVerifiedEmail, (req, res) => {
  try { res.json(quoteCheckout(req.body)); } catch (error) { res.status(400).json({ error: (error as Error).message }); }
});
app.post('/api/checkout/session', requireAuth, requireVerifiedEmail, async (req: AuthRequest, res) => {
  if (!stripe || !appUrl || !db || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Online checkout is temporarily unavailable. Please try again later.' });
  let quote: ReturnType<typeof quoteCheckout>, details: ReturnType<typeof shippingDetails>;
  try { quote = quoteCheckout(req.body); details = shippingDetails(req.body); }
  catch (error) { return res.status(400).json({ error: (error as Error).message }); }
  try {
    const id = `ICON-${randomUUID()}`;
    // Persist first: a database failure must prevent redirecting a customer to payment.
    await insertOrder({ ...details, ...quote, id, email: req.user!.email!, status: 'pending', paymentMethod: 'credit_card' });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', allowed_payment_method_types: ['card'], customer_email: req.user!.email,
      client_reference_id: id, metadata: { orderId: id, uid: req.user!.uid, email: req.user!.email! },
      line_items: [{ price_data: { currency: quote.currency.toLowerCase(), unit_amount: Math.round(quote.total * 100), product_data: { name: `ICON Activewear order ${id}`, description: quote.items.map(item => `${item.name} (${item.color}, ${item.size}) × ${item.quantity}`).join('; ').slice(0, 500) } }, quantity: 1 }],
      success_url: `${appUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?payment=cancelled`,
    }, { idempotencyKey: id });
    if (!session.url) throw new Error('Checkout URL missing.');
    res.json({ checkoutUrl: session.url });
  } catch (error) { serverError(res, error); }
});
app.get('/api/checkout/session/:id', requireAuth, requireVerifiedEmail, async (req: AuthRequest, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments are unavailable.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(String(req.params.id));
    if (session.metadata?.uid !== req.user!.uid || session.metadata?.email !== req.user!.email) return res.sendStatus(403);
    if (session.payment_status !== 'paid') return res.status(409).json({ error: 'Payment is still processing. Check your orders again shortly.' });
    res.json({ order: await confirmSession(session) });
  } catch (error) { serverError(res, error); }
});
app.patch('/api/orders/:id/status', requireAuth, requireOwner, async (req, res) => {
  const { status, trackingCarrier, trackingNumber } = req.body;
  if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(status) || [trackingCarrier, trackingNumber].some(value => value !== undefined && (typeof value !== 'string' || value.length > 200))) return res.status(400).json({ error: 'Invalid order update.' });
  try {
    const updated = await updateOrderState(String(req.params.id), status, trackingCarrier, trackingNumber);
    if (!updated) return res.status(404).json({ error: 'Order not found or payment is pending.' });
    res.json({ success: true, order: updated });
  } catch (error) { serverError(res, error); }
});
app.delete('/api/orders/:id', requireAuth, requireOwner, async (req, res) => {
  try { res.json(await deleteOrderById(String(req.params.id))); } catch (error) { serverError(res, error); }
});
app.get('/api/dashboard/stats', requireAuth, requireOwner, async (_req, res) => {
  try { res.json(await getLiveDashboardStats()); } catch (error) { serverError(res, error); }
});
app.use('/api', (_req, res) => { res.status(404).json({ error: 'API route not found.' }); });
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  if (process.env.NODE_ENV === 'production') {
    if (!fs.existsSync(path.join(distPath, 'index.html'))) throw new Error('Run npm run build before starting production.');
    app.use(express.static(distPath));
    app.use((_req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  app.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => console.log('ICON Activewear server ready'));
}
if (process.env.NODE_ENV !== 'test') void startServer();
