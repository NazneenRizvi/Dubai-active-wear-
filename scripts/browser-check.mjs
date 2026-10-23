const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const origin = 'http://127.0.0.1:3000';
for (let attempt = 0; attempt < 60; attempt++) {
  try { if ((await fetch(origin + '/healthz')).ok) break; } catch {}
  if (attempt === 59) throw new Error('Server did not start.');
  await new Promise(resolve => setTimeout(resolve, 500));
}
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
const report = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let email = 'first@example.com';
    const token = () => {
      const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
      return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ sub: email, user_id: email, email, email_verified: true, name: 'Test Customer', aud: 'test', iss: 'https://securetoken.google.com/test', auth_time: Math.floor(Date.now()/1000), iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 3600, firebase: { sign_in_provider: 'password' } })}.test`;
    };
    await page.route('https://identitytoolkit.googleapis.com/**', async route => {
      if (route.request().url().includes('signInWithPassword')) email = route.request().postDataJSON().email;
      const user = { localId: email, email, emailVerified: true, displayName: 'Test Customer', providerUserInfo: [{ providerId: 'password', email, federatedId: email }], createdAt: '1700000000000', lastLoginAt: '1700000000000' };
      const data = route.request().url().includes('accounts:lookup') ? { users: [user] } : { ...user, idToken: token(), refreshToken: 'test-refresh', expiresIn: '3600', registered: true };
      await route.fulfill({ json: data, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' } });
    });
    await page.route('**/api/orders', route => route.fulfill({ json: [] }));
    await page.route('**/api/checkout/quote', route => {
      const request = route.request().postDataJSON();
      const subtotal = request.items.reduce((sum, item) => sum + item.quantity * 100, 0);
      return route.fulfill({ json: { currency: request.currency, items: request.items.map(item => ({ ...item, name: 'Test product', price: 100 })), subtotal, discount: 0, shipping: 0, total: subtotal } });
    });
    await page.route('**/api/checkout/session', route => route.fulfill({ status: 503, json: { error: 'Online checkout is temporarily unavailable. Please try again later.' } }));
    await page.addInitScript(() => { localStorage.setItem('fj_cart', '[{"id":"legacy-private-cart"}]'); localStorage.setItem('fj_orders', '[{"id":"legacy-private-order"}]'); });
    await page.goto(origin, { waitUntil: 'networkidle' });
    assert.equal(await page.getByRole('button', { name: 'Shopping bag', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'ADD TO CART', exact: true }).first().click();
    await page.getByRole('button', { name: 'Continue with Google', exact: true }).waitFor();
    await page.screenshot({ path: `artifacts/google-login-${viewport.width}.png`, fullPage: false });
    const signIn = async address => {
      await page.getByPlaceholder('athlete@example.com').fill(address);
      await page.locator('input[type=password]').fill('test-password');
      await page.getByRole('button', { name: 'SIGN IN', exact: true }).click();
      await page.getByRole('button', { name: 'Close auth dialog' }).waitFor({ state: 'hidden' });
    };
    await signIn('first@example.com');
    await page.getByRole('button', { name: 'ADD TO CART', exact: true }).first().click();
    await page.getByRole('button', { name: 'Close cart' }).waitFor();
    await page.getByRole('button', { name: 'Close cart' }).click();
    await page.getByRole('button', { name: 'BUY IT NOW', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Secure checkout' });
    await dialog.waitFor();
    for (const [field, value] of Object.entries({ customerName: 'Test Customer', phone: '+971500000000', address: 'Test street', city: 'Dubai', country: 'United Arab Emirates' })) await dialog.locator(`[name=${field}]`).fill(value);
    await dialog.getByRole('button', { name: 'REVIEW ORDER' }).click();
    await dialog.getByRole('button', { name: 'CONTINUE TO SECURE PAYMENT' }).click();
    await dialog.getByRole('alert').filter({ hasText: 'temporarily unavailable' }).waitFor();
    assert.equal(await page.getByText('Payment confirmed', { exact: true }).count(), 0);
    await page.screenshot({ path: `artifacts/checkout-${viewport.width}.png`, fullPage: false });
    await page.getByRole('button', { name: 'Close checkout' }).click();
    if (viewport.width > 600) await page.getByRole('button', { name: 'Hi, Test' }).click();
    else await page.getByRole('button', { name: 'User account', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Sign Out', exact: true }).click();
    await page.getByRole('button', { name: 'Shopping bag', exact: true }).waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => Object.keys(sessionStorage).some(key => key.startsWith('fj_cart_'))), false);
    assert.equal(await page.evaluate(() => localStorage.getItem('fj_cart')), null);
    assert.equal(await page.evaluate(() => localStorage.getItem('fj_orders')), null);
    await page.getByRole('button', { name: 'ADD TO CART', exact: true }).first().click();
    await signIn('second@example.com');
    await page.getByRole('button', { name: 'Shopping bag', exact: true }).first().click();
    await page.getByText(/Your (bag|cart) is empty/i).first().waitFor();
    await page.getByRole('button', { name: 'Close cart' }).click();
    assert.equal(/\bcod\b|cash on delivery/i.test(await page.locator('body').innerText()), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `artifacts/storefront-${viewport.width}.png`, fullPage: false });
    assert.deepEqual(errors, [], `Browser errors at ${viewport.width}`);
    report.push({ viewport, passed: true, checks: ['Google button visible', 'anonymous cart hidden', 'login required to add', 'add to cart', 'buy it now', 'payment failure has no false success', 'sign-out clears cart', 'account isolation', 'no offline payment UI', 'no horizontal overflow', 'no uncaught browser errors'], note: 'Firebase and checkout API mocked. Live sign-in/payment not verified.' });
    await context.close();
  }
} finally { await writeFile('artifacts/browser-report.json', JSON.stringify(report, null, 2)); await browser.close(); }
