import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteCheckout, shippingDetails } from '../src/lib/checkout.ts';
import { PRODUCTS } from '../src/data/products.ts';
const product = PRODUCTS.find(product => product.inStock)!;
const input = (changes = {}) => ({ currency: 'AED', paymentMethod: 'credit_card', items: [{ productId: product.id, color: product.colors[0].name, size: product.sizes[0], quantity: 1, price: 0 }], ...changes });
test('uses catalog prices and ignores forged totals and discounts', () => {
  const quote = quoteCheckout(input({ subtotal: 0, discount: 999, total: 0 }));
  assert.equal(quote.items[0].price, Math.round(product.usdPrice * 3.67 * 100) / 100);
  assert.equal(quote.discount, 0);
  assert.equal(quote.total, quote.subtotal + quote.shipping);
});
test('unknown products, currencies, variants, quantities, and offline payments are rejected', () => {
  for (const override of [{ currency: 'constructor' }, { currency: 'SAR' }, { paymentMethod: 'offline' }, { promoCode: 'fake' }, { items: [] }, { items: [{ productId: 'fake', price: 0, quantity: 1 }] }]) assert.throws(() => quoteCheckout(input(override)));
  for (const item of [{ quantity: 0 }, { quantity: 1.5 }, { quantity: 100 }, { color: 'fake' }, { size: 'fake' }]) {
    const valid = input(); assert.throws(() => quoteCheckout({ ...valid, items: [{ ...valid.items[0], ...item }] }));
  }
});
test('discounts are derived only from a recognized promo code', () => {
  const quote = quoteCheckout(input({ promoCode: ' welcome10 ', discount: 999 }));
  assert.equal(quote.discount, Math.round(quote.subtotal * 10) / 100);
  assert.equal(quoteCheckout(input({ promoCode: 'FREESHIP' })).shipping, 0);
});
test('every displayed currency has its own server rate', () => {
  for (const [currency, rate] of Object.entries({ USD: 1, AED: 3.67, GBP: .78, EUR: .92, CAD: 1.38 })) {
    assert.equal(quoteCheckout(input({ currency })).items[0].price, Math.round(product.usdPrice * rate * 100) / 100);
  }
  assert.equal(quoteCheckout(input({ currency: 'PKR' })).items[0].price, product.pkrPrice);
});
test('shipping details require an actual delivery address', () => {
  assert.throws(() => shippingDetails({}));
  assert.equal(shippingDetails({ customerName: ' Test ', phone: '123', address: 'Street', city: 'Dubai', country: 'UAE' }).customerName, 'Test');
});
