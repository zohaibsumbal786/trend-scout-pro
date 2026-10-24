ALTER TABLE public.saved_products REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_products;