Dubai Activewear review patch (TEST / STAGING ONLY)

- Removed promotional COD wording across new checkout and product UI; old database documents are untouched.
- New API orders reject COD; test-card transactions are recorded unpaid (not actual payments).
- Customer-facing order refs use DA- followed by 10 characters derived from the unique internal UUID; internal Firestore IDs unchanged. This is a display reference, not an atomic sequential counter.
- No active Stripe payout or production payment integration supplied. Payment confirmations MUST come from verified gateway webhooks before enabling real checkout.
- Client orders are no longer stored in localStorage; backend is source of truth. Existing browser-stored data is removed on app load.
- Do NOT push to live Vercel without running tests and manual staging checks.
- Archive does not include .env, secrets or node_modules.
- Review outstanding issues: published sample reviews/testimonials, discount coupon validation, real auth tests, rate limiting, CORS and hosting, source audit.
