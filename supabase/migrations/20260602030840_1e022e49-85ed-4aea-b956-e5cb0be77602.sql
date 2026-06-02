DROP POLICY IF EXISTS "Anyone can view catalog items" ON public.catalog_items;

CREATE POLICY "Authenticated users can view catalog items"
ON public.catalog_items
FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.catalog_items FROM anon;
GRANT SELECT ON public.catalog_items TO authenticated;