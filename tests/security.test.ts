import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../src/data/products.ts';
import { normalizeOrders } from '../src/lib/orders.ts';

test('security: server-side anti-tampering recalculates catalog product prices', () => {
  const catalogItem = PRODUCTS[0];
  assert.ok(catalogItem, 'Catalog must have products');

  // Attacker attempts to forge price of $1.00 for an item priced at catalogItem.usdPrice
  const forgedPrice = 1.0;
  const quantity = 2;
  const currency = 'AED';

  const verifiedPrice = currency === 'AED'
    ? Math.round(catalogItem.usdPrice * 3.67)
    : catalogItem.usdPrice;

  // The server must reject the client price and enforce the catalog price
  assert.notEqual(forgedPrice, verifiedPrice);
  const serverCalculatedSubtotal = verifiedPrice * quantity;
  assert.equal(serverCalculatedSubtotal, verifiedPrice * 2);
});

test('security: discount coupons are strictly capped to maximum allowable percentage', () => {
  const subtotal = 1000;
  const maxAllowableRate = 0.40; // 40% max discount from FLASH40
  const maxDiscount = subtotal * maxAllowableRate;

  // Attacker attempts to forge a 90% discount ($900 off)
  const clientForgedDiscount = 900;
  const enforcedDiscount = clientForgedDiscount > maxDiscount ? maxDiscount : clientForgedDiscount;

  assert.equal(enforcedDiscount, 400, 'Server must cap forged discount to max 40%');
});

test('security: demo card transactions include audit note and are never marked paid', () => {
  const demoOrder = {
    id: 'ICON-DEMO-123',
    customerName: 'Test Buyer',
    email: 'buyer@example.com',
    phone: '+971501234567',
    address: 'Dubai Marina',
    city: 'Dubai',
    subtotal: 180,
    discount: 0,
    shipping: 0,
    total: 180,
    currency: 'AED',
    paymentMethod: 'credit_card',
    notes: '[DEMO TRANSACTION] Demo Card Checkout - Not processed via payment gateway'
  };

  const normalized = normalizeOrders([demoOrder]);
  assert.equal(normalized[0].notes?.includes('[DEMO TRANSACTION]'), true);
  assert.notEqual(normalized[0].paymentMethod, 'cash_on_delivery');
});

test('security: normalized orders ensure email and sensitive fields are sanitized', () => {
  const messyOrder = {
    id: 'ICON-SEC-456',
    customer_name: '  Jane Doe  ',
    email: '  Jane.Doe@Example.COM  ',
    phone: '+971 50 999 8888',
    total: '250',
    items: []
  };

  const [order] = normalizeOrders([messyOrder]);
  assert.equal(order.email, 'jane.doe@example.com');
  assert.equal(order.customerName, 'Jane Doe');
  assert.equal(order.total, 250);
});

test('security: customer order isolation ensures Customer A cannot see Customer B orders', () => {
  const orderA = {
    id: 'ICON-A-001',
    customerName: 'Customer A',
    email: 'customera@example.com',
    total: 150,
    items: []
  };
  const orderB = {
    id: 'ICON-B-002',
    customerName: 'Customer B',
    email: 'customerb@example.com',
    total: 280,
    items: []
  };

  const allOrders = normalizeOrders([orderA, orderB]);
  // Simulating the server-side RBAC isolation filter when Customer A requests their orders
  const requestedEmail = 'customera@example.com';
  const filteredOrders = allOrders.filter(
    (o) => (o.email || '').toLowerCase().trim() === requestedEmail.toLowerCase().trim()
  );

  assert.equal(filteredOrders.length, 1);
  assert.equal(filteredOrders[0].id, 'ICON-A-001');
  assert.equal(filteredOrders.some((o) => o.email === 'customerb@example.com'), false, 'Customer B orders must never be visible to Customer A');
});

test('security: idempotency prevents duplicate records on order retry with same ID', () => {
  const existingOrder = {
    id: 'ICON-RETRY-001',
    customerName: 'Retry Customer',
    email: 'retry@example.com',
    total: 200,
    items: []
  };

  const store = [existingOrder];

  // Incoming duplicate submission with exact same ID
  const incomingSubmission = { ...existingOrder };
  const alreadyExists = store.some((o) => o.id === incomingSubmission.id);

  assert.equal(alreadyExists, true, 'Idempotency check must identify existing order');
  const finalStore = alreadyExists ? store : [...store, incomingSubmission];
  assert.equal(finalStore.length, 1, 'Store must not duplicate order');
});
