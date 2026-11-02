import type { Order } from '../types';
export const finiteNumber = (value: unknown): number => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};
const text = (value: unknown) => typeof value === 'string' ? value : '';
export function normalizeOrders(value: unknown): Order[] {
  if (!Array.isArray(value)) return [];
  return value.filter(row => row && typeof row === 'object' && row.id != null).map(row => ({
    ...row, id: String(row.id),
    customerName: text(row.customerName ?? row.customer_name).trim(),
    email: text(row.email).trim().toLowerCase(), phone: text(row.phone).trim(), city: text(row.city).trim(),
    address: text(row.address).trim(), postalCode: text(row.postalCode ?? row.postal_code).trim(),
    country: text(row.country), currency: text(row.currency) || 'USD',
    status: text(row.status) || 'confirmed', notes: text(row.notes),
    createdAt: text(row.createdAt ?? row.created_at),
    total: finiteNumber(row.total), subtotal: finiteNumber(row.subtotal),
    shipping: finiteNumber(row.shipping), discount: finiteNumber(row.discount),
    items: (Array.isArray(row.items) ? row.items : []).filter(item => item && typeof item === 'object').map(item => ({
      ...item, productId: text(item.productId ?? item.product_id), name: text(item.name),
      color: text(item.color), size: text(item.size), image: text(item.image),
      price: finiteNumber(item.price), quantity: finiteNumber(item.quantity),
    })),
  }));
}
