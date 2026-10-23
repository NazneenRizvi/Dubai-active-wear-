import { db } from './index.ts';
import { normalizeOrders } from '../lib/orders.ts';
import { orders, orderItems } from './schema.ts';
import { eq, desc, and, inArray } from 'drizzle-orm';

export interface OrderInput {
  id: string; customerName: string; email: string; phone: string; address: string; city: string;
  postalCode?: string; country?: string; currency: string; subtotal: number; discount: number;
  shipping: number; total: number; status: string; paymentMethod: string; shippingMethod?: string;
  items: Array<{ productId: string; name: string; color: string; size: string; quantity: number; price: number; image?: string }>;
}
function database() {
  if (!db) throw new Error('Database is unavailable. No order has been saved.');
  return db;
}
export async function getAllOrders(email?: string) {
  const connection = database();
  const rows = await connection.select().from(orders).where(email ? eq(orders.email, email) : undefined).orderBy(desc(orders.createdAt));
  if (!rows.length) return [];
  const items = await connection.select().from(orderItems).where(inArray(orderItems.orderId, rows.map(row => row.id)));
  return normalizeOrders(rows.map(row => ({ ...row, createdAt: row.createdAt?.toISOString() || '', items: items.filter(item => item.orderId === row.id) })));
}
export async function insertOrder(data: OrderInput) {
  const connection = database();
  await connection.transaction(async (tx: any) => {
    const { items, ...row } = data;
    await tx.insert(orders).values(row);
    await tx.insert(orderItems).values(items.map(item => ({ ...item, orderId: data.id })));
  });
  return data;
}
// Only a verified Stripe session may change a pending order to confirmed.
export async function confirmPaidOrder(id: string, email: string, currency: string, amountMinor: number) {
  const connection = database();
  const [order] = await connection.select().from(orders).where(eq(orders.id, id));
  if (!order || order.email !== email || order.currency.toLowerCase() !== currency.toLowerCase() || Math.round(order.total * 100) !== amountMinor) throw new Error('Payment does not match the stored order.');
  await connection.update(orders).set({ status: 'confirmed' }).where(and(eq(orders.id, id), eq(orders.status, 'pending')));
  return (await getAllOrders(email)).find(order => order.id === id);
}
export async function updateOrderState(id: string, status: string, trackingCarrier?: string, trackingNumber?: string) {
  const connection = database();
  const [updated] = await connection.update(orders).set({ status, ...(trackingCarrier !== undefined ? { trackingCarrier } : {}), ...(trackingNumber !== undefined ? { trackingNumber } : {}) }).where(and(eq(orders.id, id), inArray(orders.status, ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']))).returning();
  return updated || null;
}
export async function deleteOrderById(id: string) {
  const connection = database();
  await connection.transaction(async (tx: any) => {
    const [row] = await tx.select().from(orders).where(eq(orders.id, id)).for('update');
    if (row?.status === 'pending') throw new Error('Pending payments cannot be deleted.');
    await tx.delete(orderItems).where(eq(orderItems.orderId, id));
    await tx.delete(orders).where(eq(orders.id, id));
  });
  return { success: true };
}

export async function getLiveDashboardStats() {
  const allOrders = (await getAllOrders()).filter(order => !['pending', 'cancelled'].includes(order.status));

  const totalOrders = allOrders.length;
  // Calculate total revenue standardized to AED
  const totalRevenue = allOrders.reduce((sum, o) => {
    const val = typeof o.total === 'number' ? o.total : Number(o.total) || 0;
    if (o.currency === 'AED') return sum + val;
    if (o.currency === 'USD') return sum + Math.round(val * 3.67);
    if (o.currency === 'PKR') return sum + Math.round(val / 75.5);
    return sum + val;
  }, 0);
  const uniqueEmails = new Set(allOrders.map((o) => (o.email || '').toLowerCase().trim()).filter(Boolean));
  const totalCustomers = uniqueEmails.size;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Top sellers based on live actual purchases
  const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of allOrders) {
    for (const item of order.items) {
      const existing = productSalesMap.get(item.productId) || {
        name: item.name,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      const itemRev = order.currency === 'AED'
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

  // Revenue trend by date from actual orders
  const dateMap = new Map<string, { revenue: number; orders: number }>();
  for (const order of allOrders) {
    const dateKey = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Recent';
    const existing = dateMap.get(dateKey) || { revenue: 0, orders: 0 };
    const orderVal = order.currency === 'AED'
      ? order.total
      : order.currency === 'USD'
      ? Math.round(order.total * 3.67)
      : Math.round(order.total / 75.5);
    existing.revenue += orderVal;
    existing.orders += 1;
    dateMap.set(dateKey, existing);
  }

  const revenueTrend = Array.from(dateMap.entries()).map(([day, val]) => ({
    day,
    revenue: val.revenue,
    orders: val.orders,
  }));

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

