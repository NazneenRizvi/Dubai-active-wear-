# Verification of this change

- `npm run lint`: passed (TypeScript frontend and server).
- `npm test`: all 12 regression tests passed, including unauthorized order access, unverified identities, failed database/payment services, pricing, promos and normalization.
- `npm run build`: passed. Vite reports a large main bundle (~946 kB before gzip).
- Production server started successfully.
- Chromium browser checks passed at 1440×1000 and 390×844: Google sign-in button, hidden anonymous cart, login requirement, Add to Cart, Buy It Now, payment failure preserving cart/no false success, logout clearing the cart, account isolation, no offline-payment UI, no horizontal overflow, no uncaught browser errors.
- Browser Firebase/authentication and checkout API responses were mocked. No real Google sign-in, Stripe charge/webhook or production database write was performed.

Screenshots and the browser report are produced under `artifacts/` by `scripts/browser-check.mjs`. Live Google/Stripe/database configuration remains necessary; see DEPLOYMENT.md.
