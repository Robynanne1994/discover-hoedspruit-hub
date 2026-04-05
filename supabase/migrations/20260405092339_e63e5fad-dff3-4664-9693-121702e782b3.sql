
-- Create FAQs table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  section TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "FAQs are viewable by everyone"
  ON public.faqs FOR SELECT
  TO public
  USING (true);

-- Admin write access
CREATE POLICY "Admins can manage FAQs"
  ON public.faqs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Timestamp trigger
CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing FAQ data
INSERT INTO public.faqs (question, answer, section, sort_order) VALUES
-- About Hello Hoedspruit
('What is Hello Hoedspruit?', 'Hello Hoedspruit is a local town guide app for Hoedspruit, South Africa. It brings together restaurants, accommodation, activities, shopping, events and community info all in one place. It''s built by a local, for locals and visitors alike.', 'About Hello Hoedspruit', 0),
('Who is behind Hello Hoedspruit?', 'Hello Hoedspruit was created by Robyn Dawes, a lifelong Hoedspruit resident. She built the app because there was no single place where people could find everything our town has to offer.', 'About Hello Hoedspruit', 1),
('Is the app free to use?', 'Yes. Hello Hoedspruit is completely free to download and use.', 'About Hello Hoedspruit', 2),
-- Using the App
('How do I find a specific business?', 'You can use the search bar on the Home or Explore pages, or browse by category to find what you''re looking for.', 'Using the App', 0),
('Can I save listings to view later?', 'Yes. Tap the Save button on any listing to add it to your Saved Listings. You can find all your saved places from your Profile.', 'Using the App', 1),
('What does "Visited" mean?', 'Visited lets you keep track of places you''ve actually been to. It''s separate from Saved, so you can save a place you want to try and mark it as visited once you''ve been.', 'Using the App', 2),
('How do I find events in Hoedspruit?', 'Head to the Events tab at the bottom of the app. You can filter by Today, This Week, Upcoming or Past to find what''s on.', 'Using the App', 3),
-- Listings & Information
('How are businesses chosen for listing?', 'We aim to include as many Hoedspruit businesses and services as possible. Listings are researched and added by the Hello Hoedspruit team, and business owners can also get in touch to be listed.', 'Listings & Information', 0),
('Is the information accurate?', 'We do our best to keep everything up to date, but details like opening hours, prices and contact info can change. If you spot something that needs updating, please let us know through the Contact page.', 'Listings & Information', 1),
('Why are some listings missing details?', 'Not all businesses have a website, email or full set of details available online. We''d rather leave a field blank than guess. If you''re a business owner and want to add or update your info, get in touch.', 'Listings & Information', 2),
-- For Business Owners
('How do I get my business listed?', 'Visit the Advertise page in the app or contact us directly. We''ll get your listing set up with the details you provide.', 'For Business Owners', 0),
('Can I update my listing details?', 'Absolutely. Just reach out to us via the Contact page with your updated info and we''ll make the changes.', 'For Business Owners', 1),
('Can I be featured or advertise?', 'Yes. We offer featured listing and advertising options. Visit the Advertise page for more details or get in touch to discuss what would work best for your business.', 'For Business Owners', 2),
-- Account & Privacy
('Do I need an account to use the app?', 'You can browse listings and events without an account. Creating an account lets you save listings, mark places as visited, save events and follow other users.', 'Account & Privacy', 0),
('How is my data handled?', 'We take your privacy seriously. You can read our full Privacy Policy from the Terms and Policies section in your Profile settings.', 'Account & Privacy', 1),
('How do I delete my account?', 'You can manage your account from the Account Settings page, or contact us for help.', 'Account & Privacy', 2),
-- General
('First time in Hoedspruit. Where do I start?', 'Start with the Explore page to browse categories like Restaurants, Activities and Accommodation. Check the Events page to see what''s on during your visit. And save anything that catches your eye so you can find it again easily.', 'General', 0),
('How do I report a problem or give feedback?', 'We''d love to hear from you. Use the Contact page in the app to get in touch, whether it''s a bug, a suggestion or just a hello.', 'General', 1);
