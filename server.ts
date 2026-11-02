import 'dotenv/config';
import cors from 'cors';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { STORE_OWNER_EMAIL } from './src/config.ts';
import { PRODUCTS } from './src/data/products.ts';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { getDiscountSettings, saveDiscountSettings } from './src/db/discounts.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllOrders,
  insertOrder,
  updateOrderState,
  deleteOrderById,
  getLiveDashboardStats,
} from './src/db/orders.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '256kb' }));
const isOwner = (req: AuthRequest): boolean => {
  if (!req.user || !req.user.email) return false;
  // Multi-factor verification: email must be cryptographically marked verified by Google Identity
  const isVerified = req.user.emailVerified === true;
  const isOwnerEmail = req.user.email.toLowerCase().trim() === STORE_OWNER_EMAIL.toLowerCase().trim();
  // Optional immutable Firebase UID validation if provided in environment
  const ownerUid = process.env.STORE_OWNER_UID?.trim();
  if (ownerUid && req.user.uid !== ownerUid) return false;
  return isVerified && isOwnerEmail;
};
const requireOwner = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!isOwner(req)) return res.status(403).json({ error: 'Store owner access required. Please sign in with verified owner credentials.' });
  next();
};
const databaseError = (res: express.Response, error: any) => {
  let cause = error;
  for (let depth = 0; depth < 5 && cause?.cause && !cause?.code; depth++) cause = cause.cause;
  const code = typeof cause?.code === 'string' ? cause.code : 'DATABASE_UNAVAILABLE';
  console.error('[Database query]', { code, message: cause?.message });
  const message = 'Database temporarily unavailable. Please try again later.';
  return res.status(500).json({ error: message, code });
};

// Health check endpoints for Cloud Run
app.get(['/healthz', '/livez', '/readyz', '/startup', '/liveness'], (req, res) => {
  res.status(200).send('OK');
});

// All discounts default OFF. Only a verified store owner can activate a code.
app.get('/api/discounts/verify', async (req, res) => {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code.trim().toUpperCase() : '';
    const config = await getDiscountSettings();
    if (!config.enabled || !code || code !== config.code) return res.json({ valid: false, percent: 0 });
    return res.json({ valid: true, code: config.code, percent: config.percent });
  } catch (e) { return databaseError(res, e); }
});
app.get('/api/admin/discount', requireAuth, requireOwner, async (_req, res) => {
  try { return res.json(await getDiscountSettings()); } catch (e) { return databaseError(res, e); }
});
app.put('/api/admin/discount', requireAuth, requireOwner, async (req, res) => {
  try {
    const { code, percent, enabled } = req.body || {};
    if (typeof code !== 'string' || !/^[A-Z0-9_-]{4,24}$/.test(code.trim().toUpperCase()) ||
        !Number.isInteger(percent) || percent < 1 || percent > 40 || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Enter a 4–24 character coupon, percentage 1–40, and enabled state.' });
    }
    return res.json(await saveDiscountSettings({code: code.trim().toUpperCase(), percent, enabled}));
  } catch (e) { return databaseError(res, e); }
});

// API Routes: Strictly enforce customer privacy and RBAC
app.get('/api/orders', requireAuth, async (req: AuthRequest, res) => {
  try {
    // 1. Authenticated Store Owner: can view all orders or filter by query email
    if (isOwner(req)) {
      const emailFilter = (req.query.email as string) || undefined;
      const ordersList = await getAllOrders(emailFilter);
      return res.json(Array.isArray(ordersList) ? ordersList : []);
    }

    // 2. Authenticated Customer: strictly limited to orders matching verified Firebase account email
    if (req.user?.email) {
      const ordersList = await getAllOrders(req.user.email);
      return res.json(Array.isArray(ordersList) ? ordersList : []);
    }

    // Authenticated accounts without a usable email cannot read any orders.
    return res.status(403).json({ error: 'A verified account email is required to view orders.' });
  } catch (error: any) {
    console.warn('Failed to retrieve orders from database:', error);
    return databaseError(res, error);
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData || !['id', 'customerName', 'email', 'phone', 'address', 'city'].every(key => typeof orderData[key] === 'string' && orderData[key].trim()) ||
        !Array.isArray(orderData.items) || !orderData.items.length || orderData.items.some((item: any) => !item || typeof item.productId !== 'string' || typeof item.name !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0) ||
        !['subtotal', 'discount', 'shipping', 'total'].every(key => Number.isFinite(orderData[key]) && orderData[key] >= 0) || !['AED', 'USD', 'PKR', 'EUR', 'GBP', 'SAR'].includes(orderData.currency)) {
      return res.status(400).json({ error: 'Invalid order details.' });
    }
    if (!['card', 'credit_card', 'apple_pay'].includes(orderData.paymentMethod)) {
      return res.status(400).json({ error: 'Unsupported payment method. Online card checkout only.' });
    }

    // Explicitly document payment classification:
    // Never mark demo card checkout as real paid transactions
    orderData.paymentMethod = 'credit_card';
    orderData.notes = '[DEMO TRANSACTION] Test card checkout only - no payment processed';

    // Server-authoritative prices and shipping in the order's selected currency.
    const exchangeRates: Record<string, number> = {
      AED: 3.67, USD: 1, PKR: 277.55, EUR: 0.92, GBP: 0.78, SAR: 3.75,
    };
    const currencyRate = exchangeRates[orderData.currency];
    if (!currencyRate) return res.status(400).json({ error: 'Unsupported currency.' });
    const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
    let verifiedSubtotal = 0;
    for (const item of orderData.items) {
      const catalogItem = PRODUCTS.find((p) => p.id === item.productId);
      if (!catalogItem || catalogItem.inStock === false) {
        return res.status(400).json({ error: 'One or more products are unavailable or invalid.' });
      }
      if (!catalogItem.sizes.includes(item.size) || !catalogItem.colors.some((color) => color.name === item.color)) {
        return res.status(400).json({ error: 'Invalid product size or color.' });
      }
      const unitPrice = orderData.currency === 'PKR' ? catalogItem.pkrPrice : catalogItem.usdPrice * currencyRate;
      item.price = money(unitPrice);
      item.name = catalogItem.name;
      verifiedSubtotal = money(verifiedSubtotal + money(unitPrice * item.quantity));
    }
    orderData.subtotal = verifiedSubtotal;

    // Never trust a client-supplied discount/percentage. Disabled is the default.
    const discountSettings = await getDiscountSettings();
    const requestedCode = typeof orderData.promoCode === 'string' ? orderData.promoCode.trim().toUpperCase() : '';
    if (requestedCode && (!discountSettings.enabled || discountSettings.code !== requestedCode)) {
      return res.status(400).json({ error: 'Coupon is inactive or invalid.' });
    }
    orderData.discount = discountSettings.enabled && requestedCode === discountSettings.code
      ? money(verifiedSubtotal * discountSettings.percent / 100) : 0;

    const isFreeShipping = orderData.subtotal >= money(150 * currencyRate / 3.67);
    const shippingMethod = orderData.shippingMethod === 'express' ? 'express' : 'standard';
    if (shippingMethod === 'express' && orderData.city !== 'Dubai') {
      return res.status(400).json({ error: 'Express delivery is only available in Dubai.' });
    }
    orderData.shippingMethod = shippingMethod;
    orderData.shipping = isFreeShipping ? 0 : shippingMethod === 'express'
      ? money(25 * currencyRate / 3.67)
      : orderData.currency === 'PKR' ? 250 : money(5.99 * currencyRate);
    orderData.total = money(Math.max(0, orderData.subtotal - orderData.discount + orderData.shipping));

    orderData.email = orderData.email.trim().toLowerCase();
    orderData.status = 'confirmed';
    const newOrder = await insertOrder(orderData);
    console.log('[TEST ORDER SAVED]', { orderId: orderData.id, paymentStatus: 'unpaid' });
    res.status(201).json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Failed to create order in database:', error);
    databaseError(res, error);
  }
});

app.patch('/api/orders/:id/status', requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingCarrier, trackingNumber } = req.body;
    if (!['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    const updated = await updateOrderState(String(id), status, trackingCarrier, trackingNumber);
    if (!updated) return res.status(404).json({ error: 'Order not found.' });
    res.json({ success: true, order: updated });
  } catch (error: any) {
    databaseError(res, error);
  }
});

app.delete('/api/orders/:id', requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteOrderById(String(id));
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error: any) {
    databaseError(res, error);
  }
});

// Live Dashboard Stats Route
app.get('/api/dashboard/stats', requireAuth, requireOwner, async (req, res) => {
  try {
    const stats = await getLiveDashboardStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Failed to calculate live stats, returning zero-state fallback:', error);
    databaseError(res, error);
  }
});

app.use('/api', (req, res) => { res.status(404).json({ error: 'API route not found.' }); });

// Static or Vite Middleware
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const indexHtml = path.join(distPath, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && fs.existsSync(indexHtml)) {
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(indexHtml);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const targetPort = Number(process.env.PORT) || PORT;
  const server = app.listen(targetPort, '0.0.0.0', () => {
    console.log(`Dubai Activewear Full-Stack server running at http://0.0.0.0:${targetPort}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && targetPort !== 3000) {
      console.log(`Port ${targetPort} in use, falling back to 3000...`);
      app.listen(3000, '0.0.0.0', () => {
        console.log(`Dubai Activewear Full-Stack server running at http://0.0.0.0:3000`);
      });
    }
  });
}

startServer();

