-- 1. Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'business_owner';

-- 2. Link listings to an owner (nullable; only set after claim approval)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS business_owner_id uuid;

CREATE INDEX IF NOT EXISTS idx_listings_business_owner_id
  ON public.listings(business_owner_id);

-- 3. business_accounts
CREATE TABLE IF NOT EXISTS public.business_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text,
  contact_name text,
  contact_phone text,
  contact_email text,
  subscription_status text NOT NULL DEFAULT 'inactive',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own account"
  ON public.business_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners insert own account"
  ON public.business_accounts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update own account"
  ON public.business_accounts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage business accounts"
  ON public.business_accounts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_business_accounts_updated_at
  BEFORE UPDATE ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. claim_requests
CREATE TABLE IF NOT EXISTS public.claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  proof_contact text,
  note text,
  status text NOT NULL DEFAULT 'pending', -- pending|approved|rejected|changes_requested
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own claims"
  ON public.claim_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners create own claims"
  ON public.claim_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage claims"
  ON public.claim_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON public.claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_claim_requests_user_id ON public.claim_requests(user_id);

-- 5. listing_edits_pending
CREATE TABLE IF NOT EXISTS public.listing_edits_pending (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.listing_edits_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own listing edits"
  ON public.listing_edits_pending FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners create own listing edits"
  ON public.listing_edits_pending FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update own pending listing edits"
  ON public.listing_edits_pending FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id AND status = 'pending');

CREATE POLICY "Admins manage listing edits"
  ON public.listing_edits_pending FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_lep_status ON public.listing_edits_pending(status);
CREATE INDEX IF NOT EXISTS idx_lep_listing ON public.listing_edits_pending(listing_id);

-- 6. specials_pending
CREATE TABLE IF NOT EXISTS public.specials_pending (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  listing_id uuid,
  special_id uuid, -- null for new submissions
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  feature_requested boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.specials_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own specials pending"
  ON public.specials_pending FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners create own specials pending"
  ON public.specials_pending FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update own pending specials"
  ON public.specials_pending FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id AND status = 'pending');

CREATE POLICY "Admins manage specials pending"
  ON public.specials_pending FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_sp_status ON public.specials_pending(status);

-- 7. events_pending
CREATE TABLE IF NOT EXISTS public.events_pending (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  listing_id uuid,
  event_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  feature_requested boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.events_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own events pending"
  ON public.events_pending FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners create own events pending"
  ON public.events_pending FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update own pending events"
  ON public.events_pending FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id AND status = 'pending');

CREATE POLICY "Admins manage events pending"
  ON public.events_pending FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_ep_status ON public.events_pending(status);

-- 8. feature_requests (payment fields stubbed for future)
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  item_type text NOT NULL, -- 'special' | 'event'
  item_id uuid, -- live id once approved; may be pending id before
  pending_id uuid, -- optional ref to specials_pending / events_pending
  feature_start date,
  feature_end date,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  payment_intent_id text,
  payment_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own feature requests"
  ON public.feature_requests FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners create own feature requests"
  ON public.feature_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins manage feature requests"
  ON public.feature_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_fr_status ON public.feature_requests(status);