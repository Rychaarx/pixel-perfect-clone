
-- Restrict SELECT on content metadata tables to authenticated users
DROP POLICY IF EXISTS "Anyone can view seasons" ON public.seasons;
CREATE POLICY "Authenticated users can view seasons" ON public.seasons
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view episodes" ON public.episodes;
CREATE POLICY "Authenticated users can view episodes" ON public.episodes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view sections" ON public.sections;
CREATE POLICY "Authenticated users can view sections" ON public.sections
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view section items" ON public.section_items;
CREATE POLICY "Authenticated users can view section items" ON public.section_items
  FOR SELECT TO authenticated USING (true);

-- Add missing UPDATE policy on watched_movies
CREATE POLICY "Users can update their own watched movies" ON public.watched_movies
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Restrict videos bucket SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
CREATE POLICY "Authenticated users can view videos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'videos');

-- Restrict has_role EXECUTE to authenticated only (used by RLS policies internally)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
