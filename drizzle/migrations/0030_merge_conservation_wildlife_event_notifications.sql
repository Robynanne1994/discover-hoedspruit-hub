CREATE OR REPLACE FUNCTION public.merge_event_notification_tag(tag text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = public
AS $$
  SELECT CASE
    WHEN tag ~* '\m(dance|music)\M' THEN 'Dance & Music'
    WHEN tag ~* '\m(health|wellness)\M' THEN 'Health & Wellness'
    WHEN tag ~* '\m(business|networking)\M' THEN 'Business & Networking'
    WHEN tag ~* '\m(party|parties|festival|festivals)\M' THEN 'Parties & Festivals'
    WHEN tag ~* '\m(conservation|tourism)\M' THEN 'Conservation & Tourism'
    WHEN tag ~* '\m(wildlife|nature)\M' THEN 'Wildlife & Nature'
    ELSE tag
  END;
$$;

CREATE OR REPLACE FUNCTION public.event_notification_tags(raw_tag text, sub_tag_1 text DEFAULT NULL, sub_tag_2 text DEFAULT NULL)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT merged ORDER BY merged), '{}'::text[])
  FROM (
    SELECT public.merge_event_notification_tag(btrim(x)) AS merged
    FROM unnest(string_to_array(COALESCE(raw_tag, ''), '|') || ARRAY[sub_tag_1, sub_tag_2]) AS x
    WHERE x IS NOT NULL
      AND btrim(x) NOT IN ('', '-')
      AND lower(btrim(x)) <> 'theatre'
  ) AS tags;
$$;