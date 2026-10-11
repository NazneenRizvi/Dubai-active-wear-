# Verification performed

- `npm run lint`: passed (frontend, server.ts and Vite config included).
- `npm test`: 4 regression tests passed for null/non-array responses, malformed order/item fields, finite numeric fallbacks and empty order lists.
- `npm run build`: passed. Vite reports a large main bundle (~931 kB before gzip); code splitting remains an optional performance improvement.
- Local headless Chromium at 390×844: hamburger opens without navigation, drawer covers viewport, visible SHOP changes to `/shop`, direct `/shop` reload works, all six bottom links work, Back closes the active overlay.
- Dashboard: owner portal opens/closes repeatedly; Firebase sign-in was mocked (no real account used). A mocked missing-table API response renders the error/retry state, with zero orders. Retrying with nullable order fields succeeds without a React runtime exception.
- Dashboard desktop screenshot was inspected at 1440×1000 using test data only.
- Checkout: mocked 503 response retains cart and displays the failure; mocked confirmed save clears cart. No real order was submitted.
- Production server: `/`, `/shop`, `/search`, `/saved`, `/bag`, `/account`, `/admin` return the SPA HTML; unconfigured database API returns JSON 503 instead of false success.

Not verified: real Supabase tables, live database transactions, real Firebase credentials, hosted domain, delivery/payment integration or the separate unused FastAPI service. These require the owner's service configuration. This is not a claim that the store is ready for real sales; see DEPLOYMENT.md.

## Owner-only navigation update

Public navbar/footer Admin links removed. Mobile and account-menu Admin actions require the signed-in owner. Normal sign-in opens the owner dashboard for the configured owner, and customer account/orders for other users. TypeScript and build checks passed.
