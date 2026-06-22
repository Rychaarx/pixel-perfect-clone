
CREATE TABLE public.user_addons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  logo_url text,
  manifest_url text NOT NULL,
  transport_url text NOT NULL,
  types text[] NOT NULL DEFAULT '{}',
  resources text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, manifest_url)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_addons TO authenticated;
GRANT ALL ON public.user_addons TO service_role;

ALTER TABLE public.user_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own addons" ON public.user_addons
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addons" ON public.user_addons
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addons" ON public.user_addons
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addons" ON public.user_addons
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_addons_updated_at
  BEFORE UPDATE ON public.user_addons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS imdb_id text;
CREATE INDEX IF NOT EXISTS idx_catalog_items_imdb_id ON public.catalog_items(imdb_id);
