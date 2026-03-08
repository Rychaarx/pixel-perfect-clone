
CREATE TABLE public.watch_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  episode_id uuid NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  watched boolean NOT NULL DEFAULT false,
  last_watched_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, episode_id)
);

ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch progress"
  ON public.watch_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch progress"
  ON public.watch_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch progress"
  ON public.watch_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch progress"
  ON public.watch_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
