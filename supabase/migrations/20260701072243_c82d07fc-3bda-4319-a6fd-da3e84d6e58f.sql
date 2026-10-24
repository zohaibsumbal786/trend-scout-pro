
CREATE TABLE public.user_pricing_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  home_currency text NOT NULL DEFAULT 'USD',
  tax_rate_pct numeric NOT NULL DEFAULT 0,
  include_shipping boolean NOT NULL DEFAULT true,
  default_shipping_usd numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_pricing_prefs TO authenticated;
GRANT ALL ON public.user_pricing_prefs TO service_role;
ALTER TABLE public.user_pricing_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own pricing prefs" ON public.user_pricing_prefs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_pricing_prefs_updated_at
BEFORE UPDATE ON public.user_pricing_prefs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.saved_products
  ADD COLUMN IF NOT EXISTS source_currency text,
  ADD COLUMN IF NOT EXISTS last_known_currency text,
  ADD COLUMN IF NOT EXISTS last_known_raw_price numeric,
  ADD COLUMN IF NOT EXISTS last_known_shipping_usd numeric,
  ADD COLUMN IF NOT EXISTS last_known_tax_usd numeric;

ALTER TABLE public.price_alerts
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS raw_new_price numeric,
  ADD COLUMN IF NOT EXISTS shipping_usd numeric,
  ADD COLUMN IF NOT EXISTS tax_usd numeric;
