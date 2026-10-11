# Fitness Junkies / ICON Activewear: corrected project

## What this ZIP actually contains

- Frontend: React 18 + Vite 5 + TypeScript + Tailwind CSS 4. **Not Next.js.**
- Active backend: Express (`server.ts`) + Drizzle + PostgreSQL (`src/db`).
- Login: Firebase Authentication. Enable Email/Password and create your owner account.
- Supabase can host the PostgreSQL database. This project does **not** use `supabase-js`, `VITE_SUPABASE_URL` or an anon key. Its queries run on the Express server using a private `DATABASE_URL`.
- `backend/` is a separate Python/FastAPI implementation. The storefront does not call it; its routes/models differ. Do not deploy it as a drop-in replacement for Express or run its table creation against these tables.

## Local run (Windows terminal in extracted project folder)

1. Install Node.js 22 or newer.
2. Run `npm ci`.
3. Copy `.env.example` to `.env` and fill your own settings. Never commit `.env` or service account JSON.
4. Run `npm run dev`, then open http://localhost:3000.
5. Click My Account and sign in. The owner email in `src/config.ts` opens the Admin Dashboard; customers open their own orders. Public navbar/footer Admin links are removed; the owner-only account menu retains Admin Portal. The old PIN and one-click bypass were removed.
6. `npm run lint`, `npm test`, and `npm run build` verify types, normalization tests and the production build.

The shop and navigation can display without a database. Orders need a configured backend/database. Missing configuration now gives a clear failure; it never pretends to have saved an order.

## Database setup

1. In your Supabase project, open **Connect**, choose the PostgreSQL **Session pooler** connection string, and copy it to server environment variable `DATABASE_URL` with the real database password. URL-encode special characters in the password. Keep SSL enabled using Supabase's connection/certificate instructions.
2. In a **new dedicated database**, review and run `database/setup.sql` in the SQL Editor. It defines `users`, `orders`, and `order_items`, matching `src/db/schema.ts`.
3. For an existing database, back it up and compare its columns/types first. The SQL includes an additive upgrade for the original ZIP's schema; it cannot automatically reconcile an unrelated Supabase table with a different structure. Do not delete data to make a migration pass.
4. Existing orders had amounts rounded and currency/address metadata omitted. The migration cannot reconstruct lost decimals or determine the correct currency of unrelated legacy rows. Check those records manually.
5. Row-level security is enabled with no public policies. Only the trusted Express backend should connect using server-held credentials. Never put the database URL, password, or Firebase service account in a `VITE_*` variable.

The anon/publishable Supabase key is not a Postgres password and is not needed in this architecture.

## Firebase setup

1. Use your own Firebase project; replace the bundled AI Studio project settings through the three `VITE_FIREBASE_*` variables in `.env.example`.
2. Enable Authentication → Email/Password.
3. Create the owner user with the exact email configured in `src/config.ts`, using a strong password you control. Create this account before public signup is available.
4. Set server `FIREBASE_PROJECT_ID` to the same project and `FIREBASE_SERVICE_ACCOUNT_JSON` to its service account JSON as a hosting secret (or use Application Default Credentials on a compatible Google host).
5. Add your deployed domain to Firebase authorized domains.
6. The browser now obtains real ID tokens; Express verifies them. Order lists are filtered to the signed-in email unless it is the configured owner. Updating/deleting orders and dashboard stats require owner authorization.

## Deploy this version on Render

Use a **Node Web Service**, which serves both the Vite build and Express API at one origin.

1. Upload the corrected project to a private GitHub repository. Include `package.json`, `package-lock.json`, `server.ts`, `src`, `public`, and configuration files; exclude `node_modules`, `.env`, credentials and `dist`.
2. Render → New → Web Service → connect that repository.
3. Root directory: repository root (where `package.json` is).
4. Build command: `npm ci --include=dev && npm run build`.
5. Start command: `npm start`.
6. Set `NODE_ENV=production`, `DATABASE_URL`, and all Firebase variables described above. Render supplies `PORT` automatically. Frontend `VITE_*` values must exist before the build; changing them requires rebuilding.
7. Deploy. Open the supplied Render URL, `/shop`, and `/admin`. Reload `/shop` directly to verify the SPA fallback.
8. Log in as owner, place a test COD order, verify it from another device, change its status, and confirm database rows. This live credential-backed test has not been performed here.

Reference: https://render.com/docs/deploy-node-express-app
Reference: https://supabase.com/docs/guides/database/connecting-to-postgres

A frontend-only Vercel upload will not run this Express backend. The original `src/vercel.json` was invalid for this project and pointed to a nonexistent `app/` directory, so it was removed. Use the Render path above for the current ZIP; a Vercel split deployment needs a separate API deployment/proxy adaptation.

## What remains before real customer sales

- Product edits, wishlist, cart and some settings remain browser-local. Product CRUD is not a shared database catalog; changes on one laptop do not publish to every visitor.
- Server-authoritative catalog prices, stock checking and promotion validation are not implemented. Submitted checkout totals are structurally validated but still originate in the browser. Treat this as a staging store until pricing/stock validation is connected.
- Card/Apple Pay/Razorpay are not integrated. Only COD submission is enabled; card checkout now reports that payments are not connected instead of pretending it charged a card.
- No transactional email, carrier booking or automated refunds are connected.
- Rates/conversions such as USD→PKR 277.5 are existing fixed demo values, not live FX rates.
- No actual Supabase credentials or schema dump were supplied. Query compatibility with YOUR database and real Firebase login must be tested after setup.

## Fixed behavior

- Dashboard hooks always run in the same order; opening/closing or signing in does not add hooks halfway through a render.
- Null/non-array API data is normalized. Totals default to zero; item arrays default to empty. Fetches time out, check HTTP status/content type, log errors and display a retry state.
- A successful empty order list clears stale state. Customer order data is no longer persisted as a shared localStorage order cache.
- Missing tables/columns report errors; failed writes return non-2xx responses. Checkout keeps the cart and displays the failure.
- Order+items creation/deletion use transactions. Decimal amounts, currency and shipping address fields are preserved.
- Mobile menu opens a full-viewport portal and closes on Escape. Visible SHOP routes to `/shop`.
- Bottom routes: Home `/`, Shop `/shop`, Search `/search`, Saved `/saved`, Bag `/bag`, Account `/account`. Search/Saved/Bag/Account use existing drawers/dialogs at their routes, preserving the design.
- Back/Forward closes the previous route's overlay. Closing a route dialog resets its URL. Express serves deep links.
- Product details are isolated in a keyed component so its hooks/state reset safely between products.
