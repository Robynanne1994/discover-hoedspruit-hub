-- A "-" in the master CSV means "there isn't one". Imports before the
-- placeholder fix wrote those cells through as literal text, so some listings
-- still store "-" / "N/A" / "none" in their link columns. The app already
-- refuses to render them, but they are not values — clear them so the admin
-- editor and CSV export agree that the field is empty.

UPDATE public.listings
SET
  website       = CASE WHEN lower(btrim(website))       = ANY (ARRAY['', '-', '--', '---', '–', '—', 'n/a', 'none', 'null']) THEN NULL ELSE website       END,
  website_label = CASE WHEN lower(btrim(website_label)) = ANY (ARRAY['', '-', '--', '---', '–', '—', 'n/a', 'none', 'null']) THEN NULL ELSE website_label END,
  facebook      = CASE WHEN lower(btrim(facebook))      = ANY (ARRAY['', '-', '--', '---', '–', '—', 'n/a', 'none', 'null']) THEN NULL ELSE facebook      END,
  instagram     = CASE WHEN lower(btrim(instagram))     = ANY (ARRAY['', '-', '--', '---', '–', '—', 'n/a', 'none', 'null']) THEN NULL ELSE instagram     END
WHERE lower(btrim(website))       = ANY (ARRAY['', '-', '--', '---', '–', '—', 'n/a', 'none', 'null'])
   OR lower(btrim(website_label)) = ANY (ARRAY['', '-', '--', '---', '–', '—', 'n/a', 'none', 'null'])
   OR lower(btrim(facebook))      = ANY (ARRAY['', '-', '--', '---', '–', '—', 'n/a', 'none', 'null'])
   OR lower(btrim(instagram))     = ANY (ARRAY['', '-', '--', '---', '–', '—', 'n/a', 'none', 'null']);
