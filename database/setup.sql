-- Review before running in Supabase SQL Editor. Back up an existing database first.
-- For a NEW database, these tables match src/db/schema.ts exactly.
-- No existing table is dropped; an unrelated orders table may require a separate migration.
BEGIN;
CREATE TABLE IF NOT EXISTS public.users (
  id serial PRIMARY KEY, uid text UNIQUE NOT NULL, email text NOT NULL, name text,
  role text NOT NULL DEFAULT 'customer', created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY, customer_name text NOT NULL, email text NOT NULL,
  phone text NOT NULL, address text NOT NULL, city text NOT NULL,
  postal_code text DEFAULT '', country text DEFAULT '', currency text NOT NULL DEFAULT 'USD',
  subtotal double precision NOT NULL, discount double precision NOT NULL DEFAULT 0,
  shipping double precision NOT NULL DEFAULT 0, total double precision NOT NULL,
  status text NOT NULL DEFAULT 'confirmed', payment_method text NOT NULL DEFAULT 'cash_on_delivery',
  shipping_method text NOT NULL DEFAULT 'standard', tracking_carrier text, tracking_number text,
  notes text, created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.order_items (
  id serial PRIMARY KEY, order_id text NOT NULL REFERENCES public.orders(id),
  product_id text NOT NULL, name text NOT NULL, color text NOT NULL, size text NOT NULL,
  quantity integer NOT NULL, price double precision NOT NULL, image text
);
-- Upgrade the exact original ZIP schema: retain original amounts, add missing fields.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS postal_code text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS country text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE public.orders ALTER COLUMN subtotal TYPE double precision;
ALTER TABLE public.orders ALTER COLUMN discount TYPE double precision;
ALTER TABLE public.orders ALTER COLUMN shipping TYPE double precision;
ALTER TABLE public.orders ALTER COLUMN total TYPE double precision;
ALTER TABLE public.order_items ALTER COLUMN price TYPE double precision;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- No public policies: this application accesses the DB through its trusted Express server.
-- Previously rounded decimals or missing legacy currency cannot be recovered automatically.
COMMIT;
