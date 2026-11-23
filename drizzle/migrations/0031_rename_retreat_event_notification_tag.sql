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
    WHEN lower(tag) = 'retreat' THEN 'Retreats'
    ELSE tag
  END;
$$;

UPDATE public.notification_preferences AS np
SET events_new_categories = rewritten.tags
FROM (
  SELECT p.user_id,
         array_agg(DISTINCT public.merge_event_notification_tag(btrim(tag)) ORDER BY public.merge_event_notification_tag(btrim(tag))) AS tags
  FROM public.notification_preferences AS p
  CROSS JOIN LATERAL unnest(p.events_new_categories) AS tag
  WHERE p.events_new_categories IS NOT NULL
  GROUP BY p.user_id
) AS rewritten
WHERE np.user_id = rewritten.user_id
  AND np.events_new_categories IS DISTINCT FROM rewritten.tags;