import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, doublePrecision } from 'drizzle-orm/pg-core';

// Users table linked with Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('customer').notNull(), // 'customer' | 'owner'
  createdAt: timestamp('created_at').defaultNow(),
});

// Live Store Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(), // e.g. ORD-84920
  customerName: text('customer_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  postalCode: text('postal_code').default(''),
  country: text('country').default(''),
  currency: text('currency').default('USD').notNull(),
  subtotal: doublePrecision('subtotal').notNull(),
  discount: doublePrecision('discount').default(0).notNull(),
  shipping: doublePrecision('shipping').default(0).notNull(),
  total: doublePrecision('total').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: text('payment_method').default('credit_card').notNull(),
  shippingMethod: text('shipping_method').default('standard').notNull(),
  trackingCarrier: text('tracking_carrier'),
  trackingNumber: text('tracking_number'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Order items breakdown table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: text('order_id')
    .references(() => orders.id)
    .notNull(),
  productId: text('product_id').notNull(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  size: text('size').notNull(),
  quantity: integer('quantity').notNull(),
  price: doublePrecision('price').notNull(),
  image: text('image'),
});

// Relations
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

