ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS foods text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_franchise boolean;

-- Backfill: move known food items from cuisine to foods
UPDATE public.listings
SET
  foods = ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(foods, '{}'::text[]) ||
      ARRAY(
        SELECT c FROM unnest(cuisine) c
        WHERE lower(trim(c)) = ANY (ARRAY['burgers','pizzas','seafood','sushi','grill','ribs','steaks','tapas','pasta','baked goods','desserts','fast food'])
      )
    )
  ),
  cuisine = ARRAY(
    SELECT c FROM unnest(cuisine) c
    WHERE lower(trim(c)) <> ALL (ARRAY['burgers','pizzas','seafood','sushi','grill','ribs','steaks','tapas','pasta','baked goods','desserts','fast food'])
  )
WHERE cuisine IS NOT NULL AND array_length(cuisine, 1) > 0;