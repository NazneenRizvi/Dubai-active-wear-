# Deployment and live verification

This is a React/Vite frontend with an Express server. Deploy the whole Node application to a Node host (for example Cloud Run or Render). Run `npm ci`, `npm run build`, then `NODE_ENV=production npm start`. A static-only frontend deployment does not run the order/payment endpoints. If hosting the frontend separately, configure `VITE_API_BASE_URL` and add the frontend origin to the server's `CORS_ORIGINS`.

## Google / Gmail sign-in

In the Firebase project used by `firebase-applet-config.json`:

1. Enable **Authentication → Sign-in method → Google** and select the support email.
2. Add your actual website hostname under **Authentication → Settings → Authorized domains**. Add localhost for local testing.
3. Keep email/password enabled if you want that option. New password accounts receive an email verification link. Order history and checkout require a verified email. Google accounts normally provide a verified email automatically.
4. If using another Firebase project, set the three `VITE_FIREBASE_*` build variables from `.env.example`, and set the corresponding server `FIREBASE_API_KEY`. Never put service account credentials in a `VITE_` variable.

## Database

Set `DATABASE_URL` on the server using your host's secret settings. Apply `database/setup.sql` (review and back up an existing database first). Use your database provider's SSL/certificate settings. Orders and items are written in one transaction. Missing/unavailable databases return errors; they never fall back to browser storage or server memory. Pending payments cannot be manually marked paid or deleted.

## Stripe hosted checkout

Set these **server-only** variables:

- `STRIPE_SECRET_KEY`: start with a Stripe test key.
- `STRIPE_WEBHOOK_SECRET`: signing secret for this server's webhook endpoint.
- `APP_URL`: the frontend's canonical origin, such as `https://your-domain.example`.
- `CORS_ORIGINS`: optional comma-separated additional frontend origins.

Create a Stripe webhook for `https://YOUR_API_HOST/api/payments/webhook`, subscribing to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.

Customers pay on Stripe's hosted page. Available wallets depend on Stripe configuration, device, currency and account eligibility. The website never collects raw card numbers or security codes. There is no offline payment option.

The server validates catalog products, stock, variants, quantities, currency and promo codes. It calculates the price and shipping, saves a pending order, and creates a Stripe Checkout session. Only a signed webhook or an authenticated server-side retrieval of a paid Stripe session can confirm the order. Opening a success URL alone does not confirm an order. A payment failure leaves the cart unchanged. A session creation failure may leave an unpaid pending order for reconciliation.

## Verification before launch

Run `npm run lint`, `npm test`, and `npm run build`. The GitHub workflow also starts the production server and checks the desktop/mobile UI with mocked Firebase/API responses. These are browser behavior tests, not live authentication or payment verification.

Then test with your configured Firebase project and Stripe test mode:

- Sign in with Google; sign out and verify the cart is empty and hidden. Sign in with another account and verify there is no previous account's cart or order history.
- Add a selected color/size; use Buy It Now to open checkout with the chosen product and any items already in your cart.
- Pay using Stripe test mode; verify the order is persisted, visible from another device and confirmed after Stripe verification.
- Cancel payment and simulate a declined card; verify that no success message appears and the cart remains.
- Replay the signed webhook; verify the same order is confirmed once. Try an unsigned webhook and confirm rejection.
- Disconnect the database and verify order creation fails without redirecting to payment.

Live Google sign-in, database writes and Stripe payments require your account configuration and are not established by passing mocked tests.
