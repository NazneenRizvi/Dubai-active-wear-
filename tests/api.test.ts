import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV = 'test';
// No live Firebase, Stripe, or database credentials are used in these tests.
delete process.env.DATABASE_URL;
delete process.env.SQL_HOST;
delete process.env.STRIPE_SECRET_KEY;
const { app } = await import('../server.ts');
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const port = (server.address() as { port: number }).port;
const originalFetch = globalThis.fetch;
try {
  await test('order history and legacy creation require authentication', async () => {
    for (const route of ['/api/orders', '/api/orders?email=someone@example.com']) {
      assert.equal((await originalFetch(`http://127.0.0.1:${port}${route}`)).status, 401);
    }
    assert.equal((await originalFetch(`http://127.0.0.1:${port}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
  });
  await test('unverified email identities cannot view order history', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ users: [{ localId: 'test', email: 'customer@example.com', emailVerified: false }] }), { status: 200 });
    assert.equal((await originalFetch(`http://127.0.0.1:${port}/api/orders?email=someone@example.com`, { headers: { Authorization: 'Bearer fake' } })).status, 403);
  });
  await test('database and payment outages return errors instead of fake success', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ users: [{ localId: 'test', email: 'customer@example.com', emailVerified: true }] }), { status: 200 });
    const headers = { Authorization: 'Bearer fake', 'Content-Type': 'application/json' };
    assert.equal((await originalFetch(`http://127.0.0.1:${port}/api/orders`, { headers })).status, 503);
    assert.equal((await originalFetch(`http://127.0.0.1:${port}/api/orders`, { method: 'POST', headers, body: '{}' })).status, 405);
    assert.equal((await originalFetch(`http://127.0.0.1:${port}/api/checkout/session`, { method: 'POST', headers, body: '{}' })).status, 503);
    assert.equal((await originalFetch(`http://127.0.0.1:${port}/api/orders/test/status`, { method: 'PATCH', headers, body: '{"status":"confirmed"}' })).status, 403);
  });
} finally { globalThis.fetch = originalFetch; server.close(); }
