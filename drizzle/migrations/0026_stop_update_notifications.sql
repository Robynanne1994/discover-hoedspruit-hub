DROP TRIGGER IF EXISTS trg_notify_special_update ON public.specials;
DROP TRIGGER IF EXISTS trg_notify_event_update ON public.events;
DROP TRIGGER IF EXISTS trg_notify_listing_update ON public.listings;
COMMENT ON FUNCTION public.notify_special_update() IS 'DEPRECATED: update notifications retired';
COMMENT ON FUNCTION public.notify_event_update() IS 'DEPRECATED: update notifications retired';