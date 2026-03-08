-- Fix the permissive INSERT policy on feedback_requests to require authentication
DROP POLICY "Anyone can insert feedback requests" ON public.feedback_requests;
CREATE POLICY "Authenticated users can insert feedback requests" ON public.feedback_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);