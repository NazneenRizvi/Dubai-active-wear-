
import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { normalizeOrders } from '../lib/orders.ts';

// Trusted server-only SDK. Never put service account credentials into VITE_* variables.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const projectId = process.env.FIREBASE_PROJECT_ID || 'icone-active-wear-2';

const adminApp = getApps()[0] || initializeApp({
  credential: serviceAccount
    ? cert(JSON.parse(serviceAccount))
    : applicationDefault(),
  projectId,
});

const firestoreDb = getFirestore(adminApp);

export interface OrderInput {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
  currency?: string;
  subtotal: number;
  discount?: number;
  shipping?: number;
  total: number;
  status?: string;
  paymentMethod?: string;
  shippingMethod?: string;
  trackingCarrier?: string;
  trackingNumber?: string;
  notes?: string;
  items?: Array<{
    productId: string;
    name: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
}

// Firestore is the sole source of truth.
// Never return temporary memory orders as real orders.
export async function getAllOrders(email?: string) {
  const snapshot = await firestoreDb.collection('orders').get();

  // TypeScript fix: identify email and createdAt fields.
  const records: Array<{
    id: string;
    email?: string;
    createdAt?: string;
  }> = snapshot.docs.map(d => ({
    ...d.data(),
    id: d.id,
  }));

  const filtered = email
    ? records.filter(
        o =>
          String(o.email || '').toLowerCase().trim() ===
          email.toLowerCase().trim()
      )
    : records;

  filtered.sort(
    (a, b) =>
      new Date(String(b.createdAt || 0)).getTime() -
      new Date(String(a.createdAt || 0)).getTime()
  );

  return normalizeOrders(filtered);
}

export async function insertOrder(data: OrderInput) {
  const cleanOrder = {
    id: data.id,
    customerName: data.customerName.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    city: data.city.trim(),
    postalCode: (data.postalCode || '').trim(),
    country: (data.country || 'United Arab Emirates').trim(),
    currency: data.currency || 'AED',
    subtotal: Number(data.subtotal) || 0,
    discount: Number(data.discount) || 0,
    shipping: Number(data.shipping) || 0,
    total: Number(data.total) || 0,
    status: data.status || 'confirmed',
    paymentMethod: data.paymentMethod || 'credit_card',
    shippingMethod: data.shippingMethod || 'standard',
    trackingCarrier: data.trackingCarrier || '',
    trackingNumber: data.trackingNumber || '',
    notes: data.notes || '',
    createdAt: (data as any).createdAt || new Date().toISOString(),
    items: (data.items || []).map(item => ({
      productId: item.productId,
      name: item.name,
      color: item.color,
      size: item.size,
      quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
      price: Number(item.price) || 0,
      image: item.image || '',
    })),
  };

  const orderDocRef = firestoreDb.collection('orders').doc(cleanOrder.id);

  // Atomic create: a concurrent retry cannot overwrite an existing order.
  try {
    await orderDocRef.create(cleanOrder);
    return normalizeOrders([cleanOrder])[0];
  } catch (error: any) {
    // Only duplicate-ID conflict may return an existing order,
    // and only for the same customer.
    if (error?.code === 6 || error?.code === 'already-exists') {
      const existing = await orderDocRef.get();

      if (
        !existing.exists ||
        String(existing.data()?.email || '').toLowerCase() !== cleanOrder.email
      ) {
        throw new Error('Order ID conflict. Please contact support.');
      }

      return normalizeOrders([
        { ...existing.data(), id: existing.id },
      ])[0];
    }

    console.error(
      '[Firestore order write failed]',
      error?.code || error?.message
    );

    throw new Error(
      'Database unavailable. Order could not be permanently saved.'
    );
  }
}

export async function updateOrderState(
  orderId: string,
  status: string,
  trackingCarrier?: string,
  trackingNumber?: string
) {
  const ref = firestoreDb.collection('orders').doc(orderId);

  const updatePayload: Record<string, unknown> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (trackingCarrier !== undefined) {
    updatePayload.trackingCarrier = trackingCarrier;
  }

  if (trackingNumber !== undefined) {
    updatePayload.trackingNumber = trackingNumber;
  }

  await ref.update(updatePayload);

  const doc = await ref.get();

  return doc.exists
    ? normalizeOrders([{ ...doc.data(), id: doc.id }])[0]
    : null;
}

export async function deleteOrderById(orderId: string) {
  await firestoreDb.collection('orders').doc(orderId).delete();
  return { success: true };
}

export async function getLiveDashboardStats() {
  const allOrders = await getAllOrders();

  const totalOrders = allOrders.length;

  // Standardize revenue calculation.
  const totalRevenue = allOrders.reduce((sum, o) => {
    const val =
      typeof o.total === 'number'
        ? o.total
        : Number(o.total) || 0;

    if (o.currency === 'AED') return sum + val;
    if (o.currency === 'USD') return sum + Math.round(val * 3.67);
    if (o.currency === 'PKR') return sum + Math.round(val / 75.5);

    return sum + val;
  }, 0);

  const uniqueEmails = new Set(
    allOrders
      .map(o => (o.email || '').toLowerCase().trim())
      .filter(Boolean)
  );

  const totalCustomers = uniqueEmails.size;

  const avgOrderValue =
    totalOrders > 0
      ? Math.round(totalRevenue / totalOrders)
      : 0;

  // Top selling products by quantity.
  const productSalesMap = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();

  for (const order of allOrders) {
    for (const item of order.items) {
      const existing = productSalesMap.get(item.productId) || {
        name: item.name,
        quantity: 0,
        revenue: 0,
      };

      existing.quantity += item.quantity;

      const itemRev =
        order.currency === 'AED'
          ? item.price * item.quantity
          : order.currency === 'USD'
          ? Math.round(item.price * item.quantity * 3.67)
          : Math.round((item.price * item.quantity) / 75.5);

      existing.revenue += itemRev;
      productSalesMap.set(item.productId, existing);
    }
  }

  const topSellers = Array.from(productSalesMap.entries())
    .map(([id, stats]) => ({
      id,
      name: stats.name,
      quantity: stats.quantity,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Revenue trend.
  const dateMap = new Map<
    string,
    { revenue: number; orders: number }
  >();

  for (const order of allOrders) {
    const dateKey = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : 'Recent';

    const existing = dateMap.get(dateKey) || {
      revenue: 0,
      orders: 0,
    };

    const orderVal =
      order.currency === 'AED'
        ? order.total
        : order.currency === 'USD'
        ? Math.round(order.total * 3.67)
        : Math.round(order.total / 75.5);

    existing.revenue += orderVal;
    existing.orders += 1;
    dateMap.set(dateKey, existing);
  }

  const revenueTrend = Array.from(dateMap.entries()).map(
    ([day, val]) => ({
      day,
      revenue: val.revenue,
      orders: val.orders,
    })
  );

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    avgOrderValue,
    revenueTrend,
    topSellers,
    latestOrders: allOrders.slice(0, 5),
  };
}
