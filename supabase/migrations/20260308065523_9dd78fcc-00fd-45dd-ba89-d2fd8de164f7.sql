
CREATE TABLE public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'Filme',
  message text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view suggestions" ON public.suggestions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert suggestions" ON public.suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update suggestions" ON public.suggestions FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete suggestions" ON public.suggestions FOR DELETE USING (has_role(auth.uid(), 'admin'));
