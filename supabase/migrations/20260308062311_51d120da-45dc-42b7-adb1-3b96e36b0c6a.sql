-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Create catalog_items table
CREATE TABLE public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'na_lista',
  image_url TEXT,
  video_url TEXT,
  redirect_url TEXT,
  year TEXT,
  duration TEXT,
  genres TEXT[],
  synopsis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view catalog items" ON public.catalog_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert catalog items" ON public.catalog_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own items" ON public.catalog_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own items" ON public.catalog_items FOR DELETE USING (auth.uid() = user_id);

-- Create sections table
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'Todos',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sections" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Admins can insert sections" ON public.sections FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update sections" ON public.sections FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sections" ON public.sections FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Create section_items table
CREATE TABLE public.section_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0
);
ALTER TABLE public.section_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view section items" ON public.section_items FOR SELECT USING (true);
CREATE POLICY "Admins can insert section items" ON public.section_items FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update section items" ON public.section_items FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete section items" ON public.section_items FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profiles" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profiles" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profiles" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profiles" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- Create seasons table
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  season_number INT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage seasons" ON public.seasons FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update seasons" ON public.seasons FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete seasons" ON public.seasons FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create episodes table
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  episode_number INT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  duration TEXT,
  redirect_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view episodes" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage episodes" ON public.episodes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update episodes" ON public.episodes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete episodes" ON public.episodes FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create feedback_requests table
CREATE TABLE public.feedback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Filme',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feedback requests" ON public.feedback_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert feedback requests" ON public.feedback_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete feedback requests" ON public.feedback_requests FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
CREATE POLICY "Anyone can view videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Authenticated users can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_catalog_items_updated_at
  BEFORE UPDATE ON public.catalog_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();