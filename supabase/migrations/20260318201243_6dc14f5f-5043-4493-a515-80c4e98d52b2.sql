
-- Role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Folder',
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_quick_category BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  location TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listings are viewable by everyone" ON public.listings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage listings" ON public.listings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  location TEXT,
  tag TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Site content (key-value for editable sections)
CREATE TABLE public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site content is viewable by everyone" ON public.site_content
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site content" ON public.site_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default site content
INSERT INTO public.site_content (section, content) VALUES
  ('advertise', '{"title": "Advertise Your Business", "description": "Get your restaurant, lodge, or activity in front of tourists and locals exploring Hoedspruit. Affordable packages for every business size.", "benefits": ["Reach thousands of visitors monthly", "Track your listing performance", "Featured placement in search results"]}');

-- Seed default categories
INSERT INTO public.categories (title, description, icon, sort_order, is_quick_category) VALUES
  ('Restaurants & Cafés', 'From bushveld braais to fine dining under the stars', 'Utensils', 1, false),
  ('Lodges & Safari', 'Luxury lodges and unforgettable Big Five encounters', 'Tent', 2, false),
  ('Activities & Adventures', 'Hot air balloons, river rafting and bush walks', 'TreePine', 3, false),
  ('Hotels', '', 'Hotel', 10, true),
  ('Shopping', '', 'ShoppingBag', 11, true),
  ('Wellness', '', 'Heart', 12, true);

-- Seed default events
INSERT INTO public.events (title, date, location, tag) VALUES
  ('Hoedspruit Craft Market', 'Every Saturday', 'Kamogelo Centre', 'Market'),
  ('Full Moon Bush Dinner', '22 March 2026', 'Kapama Private Reserve', 'Dining'),
  ('Lowveld Trail Run', '5 April 2026', 'Blyde River Canyon', 'Sport'),
  ('Wildlife Photography Workshop', '12 April 2026', 'Hoedspruit Wildlife Centre', 'Workshop');
