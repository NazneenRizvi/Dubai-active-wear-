import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOrders, finiteNumber } from '../src/lib/orders.ts';
test('null/error responses have an empty order fallback', () => {
  for (const value of [null, undefined, {}, { error: 'missing table' }, 'html']) assert.deepEqual(normalizeOrders(value), []);
});
test('nullable snake_case database fields cannot crash dashboard search or totals', () => {
  const [order] = normalizeOrders([null, { id: 123, customer_name: null, email: 19, phone: null, total: '12.95', items: null }]);
  assert.equal(order.id.toLowerCase(), '123');
  assert.equal(order.customerName.toLowerCase(), '');
  assert.equal(order.email.toLowerCase(), '');
  assert.equal(order.total, 12.95);
  assert.deepEqual(order.items, []);
});
test('invalid numbers and item rows do not poison charts', () => {
  const [order] = normalizeOrders([{ id: 'test', total: 'bad', items: [null, { price: 'NaN', quantity: '2', name: null }] }]);
  assert.equal(order.total, 0);
  assert.equal(order.items[0].price, 0);
  assert.equal(order.items[0].quantity, 2);
  assert.equal(finiteNumber(Infinity), 0);
});
test('successful empty response clears stale orders', () => {
  assert.deepEqual(normalizeOrders([]), []);
});
