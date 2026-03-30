
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS air_conditioned boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_methods text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS delivery_available boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS click_and_collect boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS order_online boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS parking_available boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS local_products boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shop_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS curio_or_gifts boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS product_categories text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS price_range text DEFAULT NULL;
