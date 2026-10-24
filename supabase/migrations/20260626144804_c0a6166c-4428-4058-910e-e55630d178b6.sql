CREATE TABLE public.saved_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  product_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC,
  currency TEXT,
  description TEXT,
  thumbnail TEXT,
  query TEXT NOT NULL DEFAULT '',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_url)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_products TO authenticated;
GRANT ALL ON public.saved_products TO service_role;
ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own saved products" ON public.saved_products
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX saved_products_user_created_idx ON public.saved_products (user_id, created_at DESC);