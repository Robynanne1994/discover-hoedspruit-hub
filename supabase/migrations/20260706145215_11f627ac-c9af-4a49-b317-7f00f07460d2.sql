-- Add WITH CHECK clauses to prevent privilege escalation on owner-updated pending rows

DROP POLICY IF EXISTS "Owners update own notifications" ON public.business_notifications;
CREATE POLICY "Owners update own notifications"
ON public.business_notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners update own pending events" ON public.events_pending;
CREATE POLICY "Owners update own pending events"
ON public.events_pending
FOR UPDATE
USING (auth.uid() = owner_id AND status = 'pending')
WITH CHECK (auth.uid() = owner_id AND status = 'pending');

DROP POLICY IF EXISTS "Owners update own pending listing edits" ON public.listing_edits_pending;
CREATE POLICY "Owners update own pending listing edits"
ON public.listing_edits_pending
FOR UPDATE
USING (auth.uid() = owner_id AND status = 'pending')
WITH CHECK (auth.uid() = owner_id AND status = 'pending');

DROP POLICY IF EXISTS "Owners update own pending specials" ON public.specials_pending;
CREATE POLICY "Owners update own pending specials"
ON public.specials_pending
FOR UPDATE
USING (auth.uid() = owner_id AND status = 'pending')
WITH CHECK (auth.uid() = owner_id AND status = 'pending');