INSERT INTO public.site_content (section, content)
SELECT 'header', '{"logo_url": ""}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_content WHERE section = 'header');