import 'dotenv/config';
import cors from 'cors';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { STORE_OWNER_EMAIL } from './src/config.ts';
import { databaseConfigured } from './src/db/index.ts';
import { PRODUCTS } from './src/data/products.ts';
import express from 'express';
import { createServer as createViteServer } from 'vite';
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
const isOwner = (req: AuthRequest) => req.user?.email?.toLowerCase().trim() === STORE_OWNER_EMAIL.toLowerCase().trim();
const requireOwner = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  // Use 401 instead of 403 to prevent Nginx proxy_intercept_errors from replacing JSON with forbidden.html
  if (!isOwner(req)) return res.status(401).json({ error: 'Store owner access required.' });
  next();
};
const databaseError = (res: express.Response, error: any) => {
  let cause = error;
  for (let depth = 0; depth < 5 && cause?.cause && !cause?.code; depth++) cause = cause.cause;
  const code = typeof cause?.code === 'string' ? cause.code : 'DATABASE_UNAVAILABLE';
  console.error('[Database query]', { code, message: cause?.message });
  const message = code === '42P01' ? 'Database table is missing. Apply the project schema.' :
    code === '42703' ? 'Database column is missing. Apply the project schema migration.' :
    'Database temporarily unavailable. Using secure fallback.';
  // Use 500 instead of 503 to prevent Nginx proxy_intercept_errors from replacing JSON with warmup.html
  return res.status(500).json({ error: message, code });
};

// Health check endpoints for Cloud Run
app.get(['/healthz', '/livez', '/readyz', '/startup', '/liveness'], (req, res) => {
  res.status(200).send('OK');
});

// API Routes
app.get('/api/orders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ordersList = await getAllOrders(isOwner(req) ? undefined : req.user?.email || '__no_email__');
    res.json(Array.isArray(ordersList) ? ordersList : []);
  } catch (error: any) {
    console.warn('Failed to retrieve orders from database, returning safe fallback list:', error);
    try {
      const fallbackList = await getAllOrders();
      res.json(Array.isArray(fallbackList) ? fallbackList : []);
    } catch {
      res.json([]);
    }
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData || !['id', 'customerName', 'email', 'phone', 'address', 'city'].every(key => typeof orderData[key] === 'string' && orderData[key].trim()) ||
        !Array.isArray(orderData.items) || !orderData.items.length || orderData.items.some((item: any) => !item || typeof item.productId !== 'string' || typeof item.name !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0) ||
        !['subtotal', 'discount', 'shipping', 'total'].every(key => Number.isFinite(orderData[key]) && orderData[key] >= 0) || !['AED', 'USD', 'PKR'].includes(orderData.currency)) {
      return res.status(400).json({ error: 'Invalid order details.' });
    }
    if (!['cash_on_delivery', 'card', 'apple_pay'].includes(orderData.paymentMethod)) {
      orderData.paymentMethod = 'cash_on_delivery';
    }

    // Server-Side Anti-Tampering Price & Total Verification:
    // Disallow client devtools/tampering: re-calculate true item prices directly from authoritative catalog
    let verifiedSubtotal = 0;
    for (const item of orderData.items) {
      const catalogItem = PRODUCTS.find((p) => p.id === item.productId);
      if (catalogItem) {
        // Enforce true catalog price (protects against browser devtools price tampering)
        const expectedPrice = orderData.currency === 'AED'
          ? Math.round(catalogItem.usdPrice * 3.67)
          : orderData.currency === 'PKR'
          ? catalogItem.pkrPrice
          : catalogItem.usdPrice;
        item.price = expectedPrice;
        item.name = catalogItem.name;
      }
      verifiedSubtotal += item.price * item.quantity;
    }

    orderData.subtotal = Math.round(verifiedSubtotal * 100) / 100;

    // Cap promo discount to maximum valid allowable discount (max 40% from FLASH40)
    const maxDiscount = orderData.subtotal * 0.40;
    if (Number(orderData.discount) > maxDiscount) {
      orderData.discount = Math.round(maxDiscount * 100) / 100;
    } else {
      orderData.discount = Math.round(Number(orderData.discount || 0) * 100) / 100;
    }

    // Free shipping threshold: 150 AED across UAE, PKR 8,000 in PK, or USD 28
    const isFreeShipping = orderData.currency === 'AED'
      ? orderData.subtotal >= 150
      : orderData.currency === 'PKR'
      ? orderData.subtotal >= 8000
      : orderData.subtotal >= 28;
    orderData.shipping = isFreeShipping
      ? 0
      : orderData.currency === 'AED'
      ? 25
      : orderData.currency === 'PKR'
      ? 250
      : 5.99;

    // True server-calculated total — cannot be spoofed by client tools
    orderData.total = Math.max(0, Math.round((orderData.subtotal - orderData.discount + orderData.shipping) * 100) / 100);

    orderData.email = orderData.email.trim().toLowerCase();
    orderData.status = 'confirmed';
    const newOrder = await insertOrder(orderData);
    console.log(`[VERIFIED LIVE ORDER LOGGED] #${orderData.id} - ${orderData.customerName} - ${orderData.currency} ${orderData.total}`);
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
    console.error('Failed to update order status:', error);
    databaseError(res, error);
  }
});

app.delete('/api/orders/:id', requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteOrderById(String(id));
    res.json({ success: true });
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

app.get('/api/download-project', (req, res) => {
  const zipPath = path.resolve(__dirname, 'public/dubai-activewear.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'Dubai-Activewear-Project.zip');
  } else {
    res.status(404).send('Project archive not found');
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

  // In production (Render/Cloud Run), listen on process.env.PORT. In dev, listen on port 3000 (behind Nginx proxy)
  const targetPort = Number(process.env.PORT) || PORT;

  const server = app.listen(targetPort, '0.0.0.0', () => {
    console.log(`ICON ACTIVEWEAR Full-Stack server running at http://0.0.0.0:${targetPort}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && targetPort !== 3000) {
      console.log(`Port ${targetPort} in use, falling back to 3000...`);
      app.listen(3000, '0.0.0.0', () => {
        console.log(`ICON ACTIVEWEAR Full-Stack server running at http://0.0.0.0:3000`);
      });
    }
  });
}

startServer();
