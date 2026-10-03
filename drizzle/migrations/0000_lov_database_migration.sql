CREATE TABLE public.user_manual_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tmdb_id text,
  title text NOT NULL,
  media_type text NOT NULL DEFAULT 'movie',
  url text NOT NULL,
  source_type text NOT NULL DEFAULT 'direct',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_manual_sources TO authenticated;
GRANT ALL ON public.user_manual_sources TO service_role;

ALTER TABLE public.user_manual_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own manual sources"
ON public.user_manual_sources FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own manual sources"
ON public.user_manual_sources FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manual sources"
ON public.user_manual_sources FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manual sources"
ON public.user_manual_sources FOR DELETE TO authenticated
USING (auth.uid() = user_id);