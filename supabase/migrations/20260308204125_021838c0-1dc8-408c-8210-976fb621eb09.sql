
CREATE TABLE public.watched_movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, catalog_item_id)
);

ALTER TABLE public.watched_movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watched movies" ON public.watched_movies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own watched movies" ON public.watched_movies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own watched movies" ON public.watched_movies FOR DELETE USING (auth.uid() = user_id);
