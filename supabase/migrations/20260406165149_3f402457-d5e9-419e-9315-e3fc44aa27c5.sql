
-- 1. user_roles: Add INSERT/UPDATE/DELETE policies restricted to admins only
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. feedback_requests: Replace public SELECT with admin-only SELECT
DROP POLICY IF EXISTS "Anyone can view feedback requests" ON public.feedback_requests;
CREATE POLICY "Only admins can view feedback requests"
ON public.feedback_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. catalog_items: Replace owner-based UPDATE/DELETE with admin-only
DROP POLICY IF EXISTS "Users can update their own items" ON public.catalog_items;
CREATE POLICY "Admins can update catalog items"
ON public.catalog_items
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can delete their own items" ON public.catalog_items;
CREATE POLICY "Admins can delete catalog items"
ON public.catalog_items
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Revoke direct RPC access to has_role function
REVOKE EXECUTE ON FUNCTION public.has_role FROM anon, authenticated;

-- 5. videos storage bucket: Add UPDATE and DELETE policies for admins
CREATE POLICY "Admins can update videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'videos' AND has_role(auth.uid(), 'admin'::app_role));
