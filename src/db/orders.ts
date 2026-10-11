import { db, disablePostgres } from './index.ts';
import { normalizeOrders } from '../lib/orders.ts';
import { orders, orderItems } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

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

interface InMemoryOrder {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
  currency: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: string;
  paymentMethod: string;
  shippingMethod: string;
  trackingCarrier?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  items: Array<{
    productId: string;
    name: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
}

// Real in-memory orders store — starts clean with 0 orders for real sales only
const memoryOrders: InMemoryOrder[] = [];

export async function getAllOrders(email?: string) {
  if (db) {
    try {
      const rawOrders = await db
        .select()
        .from(orders)
        .where(email ? eq(orders.email, email) : undefined)
        .orderBy(desc(orders.createdAt));
      const allItems = await db.select().from(orderItems);

      return normalizeOrders(
        rawOrders.map((ord: any) => {
          const itemsForOrder = allItems.filter((it: any) => it.orderId === ord.id);
          return {
            ...ord,
            createdAt: ord.createdAt?.toISOString() || '',
            items: itemsForOrder.map((it: any) => ({
              productId: it.productId,
              name: it.name,
              color: it.color,
              size: it.size,
              quantity: it.quantity,
              price: it.price,
              image: it.image || '',
            })),
          };
        })
      );
    } catch (error: any) {
      console.warn('[PostgreSQL query fallback] Using in-memory orders:', error?.message || error);
      disablePostgres(error);
    }
  }

  // In-memory fallback
  const filtered = email
    ? memoryOrders.filter((o) => (o.email || '').toLowerCase().trim() === email.toLowerCase().trim())
    : memoryOrders;

  return normalizeOrders(filtered);
}

export async function insertOrder(data: OrderInput) {
  const newMemoryOrder: InMemoryOrder = {
    id: data.id,
    customerName: data.customerName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    postalCode: data.postalCode || '',
    country: data.country || '',
    currency: data.currency || 'AED',
    subtotal: Number(data.subtotal) || 0,
    discount: Number(data.discount) || 0,
    shipping: Number(data.shipping) || 0,
    total: Number(data.total) || 0,
    status: data.status || 'confirmed',
    paymentMethod: data.paymentMethod || 'cash_on_delivery',
    shippingMethod: data.shippingMethod || 'standard',
    trackingCarrier: data.trackingCarrier || '',
    trackingNumber: data.trackingNumber || '',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    items: (data.items || []).map((item) => ({
      productId: item.productId,
      name: item.name,
      color: item.color,
      size: item.size,
      quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
      price: Number(item.price) || 0,
      image: item.image || '',
    })),
  };

  memoryOrders.unshift(newMemoryOrder);

  if (db) {
    try {
      await db.transaction(async (tx: any) => {
        await tx.insert(orders).values({
          id: data.id,
          customerName: data.customerName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          postalCode: data.postalCode || '',
          country: data.country || '',
          currency: data.currency || 'AED',
          subtotal: Number(data.subtotal) || 0,
          discount: Number(data.discount) || 0,
          shipping: Number(data.shipping) || 0,
          total: Number(data.total) || 0,
          status: data.status || 'confirmed',
          paymentMethod: data.paymentMethod || 'cash_on_delivery',
          shippingMethod: data.shippingMethod || 'standard',
          trackingCarrier: data.trackingCarrier || null,
          trackingNumber: data.trackingNumber || null,
          notes: data.notes || null,
        });

        if (data.items && data.items.length > 0) {
          await tx.insert(orderItems).values(
            data.items.map((item) => ({
              orderId: data.id,
              productId: item.productId,
              name: item.name,
              color: item.color,
              size: item.size,
              quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
              price: Number(item.price) || 0,
              image: item.image || null,
            }))
          );
        }
      });
    } catch (error: any) {
      console.warn('[PostgreSQL insert fallback] Stored order in memory only:', error?.message || error);
      disablePostgres(error);
    }
  }

  return newMemoryOrder;
}

export async function updateOrderState(
  orderId: string,
  status: string,
  trackingCarrier?: string,
  trackingNumber?: string
) {
  const existing = memoryOrders.find((o) => o.id === orderId);
  if (existing) {
    existing.status = status;
    if (trackingCarrier !== undefined) existing.trackingCarrier = trackingCarrier;
    if (trackingNumber !== undefined) existing.trackingNumber = trackingNumber;
  }

  if (db) {
    try {
      const [updated] = await db
        .update(orders)
        .set({
          status,
          ...(trackingCarrier ? { trackingCarrier } : {}),
          ...(trackingNumber ? { trackingNumber } : {}),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (updated) return updated;
    } catch (error) {
      console.warn('[PostgreSQL update fallback] Updated order in memory only:', error);
    }
  }

  return existing || null;
}

export async function deleteOrderById(orderId: string) {
  const index = memoryOrders.findIndex((o) => o.id === orderId);
  if (index !== -1) {
    memoryOrders.splice(index, 1);
  }

  if (db) {
    try {
      await db.transaction(async (tx: any) => {
        await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
        await tx.delete(orders).where(eq(orders.id, orderId));
      });
    } catch (error) {
      console.warn('[PostgreSQL delete fallback] Deleted order in memory only:', error);
    }
  }

  return { success: true };
}

export async function getLiveDashboardStats() {
  const allOrders = await getAllOrders();

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
