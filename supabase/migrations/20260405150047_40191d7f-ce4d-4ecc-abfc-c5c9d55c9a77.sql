
-- Fix 1: Restrict seasons write policies to admin only
DROP POLICY IF EXISTS "Authenticated users can manage seasons" ON public.seasons;
DROP POLICY IF EXISTS "Authenticated users can update seasons" ON public.seasons;
DROP POLICY IF EXISTS "Authenticated users can delete seasons" ON public.seasons;

CREATE POLICY "Admins can insert seasons" ON public.seasons
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update seasons" ON public.seasons
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete seasons" ON public.seasons
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict episodes write policies to admin only
DROP POLICY IF EXISTS "Authenticated users can manage episodes" ON public.episodes;
DROP POLICY IF EXISTS "Authenticated users can update episodes" ON public.episodes;
DROP POLICY IF EXISTS "Authenticated users can delete episodes" ON public.episodes;

CREATE POLICY "Admins can insert episodes" ON public.episodes
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update episodes" ON public.episodes
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete episodes" ON public.episodes
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: Restrict suggestions SELECT to owner + admin
DROP POLICY IF EXISTS "Anyone can view suggestions" ON public.suggestions;

CREATE POLICY "Users can view own suggestions" ON public.suggestions
FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Fix 4: Restrict catalog_items INSERT to admin only
DROP POLICY IF EXISTS "Authenticated users can insert catalog items" ON public.catalog_items;

CREATE POLICY "Admins can insert catalog items" ON public.catalog_items
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 5: Restrict video upload to admin only
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;

CREATE POLICY "Admins can upload videos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos' AND has_role(auth.uid(), 'admin'::app_role));
