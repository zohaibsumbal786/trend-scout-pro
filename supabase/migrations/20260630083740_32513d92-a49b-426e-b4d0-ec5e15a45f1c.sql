-- Add target price for saved products
ALTER TABLE public.saved_products
  ADD COLUMN IF NOT EXISTS target_price numeric,
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_known_price numeric;

-- Price alerts table
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  saved_product_id uuid NOT NULL REFERENCES public.saved_products(id) ON DELETE CASCADE,
  product_url text NOT NULL,
  title text NOT NULL,
  platform text NOT NULL,
  old_price numeric,
  new_price numeric NOT NULL,
  target_price numeric NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_alerts TO authenticated;
GRANT ALL ON public.price_alerts TO service_role;

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own price alerts"
  ON public.price_alerts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS price_alerts_user_created_idx
  ON public.price_alerts (user_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.price_alerts;
