CREATE TABLE public.internal_secrets (key text PRIMARY KEY, value text NOT NULL);
GRANT ALL ON public.internal_secrets TO service_role;
REVOKE ALL ON public.internal_secrets FROM anon, authenticated;
ALTER TABLE public.internal_secrets ENABLE ROW LEVEL SECURITY;
INSERT INTO public.internal_secrets (key, value)
VALUES ('gallery_import_key', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

CREATE TABLE public.gallery_import_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  listing_id uuid,
  mode text,
  requested_count integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  new_urls text[] NOT NULL DEFAULT '{}',
  errors jsonb NOT NULL DEFAULT '[]'::jsonb
);
GRANT ALL ON public.gallery_import_log TO service_role;
REVOKE ALL ON public.gallery_import_log FROM anon, authenticated;
ALTER TABLE public.gallery_import_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.request_gallery_import(p_listing_id uuid, p_image_urls text[], p_mode text DEFAULT 'append')
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
    body := jsonb_build_object('listing_id', p_listing_id, 'image_urls', to_jsonb(p_image_urls), 'mode', COALESCE(p_mode, 'append')),
    timeout_milliseconds := 120000
  ) INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.request_gallery_import(uuid, text[], text) FROM PUBLIC, anon, authenticated;