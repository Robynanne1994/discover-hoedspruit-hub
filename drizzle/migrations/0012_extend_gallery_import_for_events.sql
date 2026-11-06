ALTER TABLE public.gallery_import_log ADD COLUMN IF NOT EXISTS event_id uuid;
ALTER TABLE public.gallery_import_log ADD COLUMN IF NOT EXISTS target text DEFAULT 'listing';
ALTER TABLE public.gallery_import_log ALTER COLUMN listing_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.request_event_gallery_import(p_event_id uuid, p_image_urls text[], p_mode text DEFAULT 'append')
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_key text;
  v_id bigint;
BEGIN
  SELECT value INTO v_key FROM public.internal_secrets WHERE key = 'gallery_import_key';
  IF v_key IS NULL THEN RAISE EXCEPTION 'gallery_import_key missing'; END IF;
  SELECT net.http_post(
    url := 'https://dgkfsavtyclwkramearr.supabase.co/functions/v1/import-gallery-images',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-import-key', v_key),
    body := jsonb_build_object('target', 'event', 'event_id', p_event_id, 'image_urls', to_jsonb(p_image_urls), 'mode', COALESCE(p_mode, 'append')),
    timeout_milliseconds := 120000
  ) INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.request_event_gallery_import(uuid, text[], text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_event_gallery_import(uuid, text[], text) TO service_role;