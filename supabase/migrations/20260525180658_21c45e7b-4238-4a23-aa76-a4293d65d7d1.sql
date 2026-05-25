UPDATE public.listings
SET
  foods = ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(foods, '{}'::text[]) ||
      ARRAY(
        SELECT c FROM unnest(cuisine) c
        WHERE lower(trim(c)) = ANY (ARRAY['gelato','wraps','salads','chicken','sandwiches','sandwhiches'])
      )
    )
  ),
  cuisine = ARRAY(
    SELECT c FROM unnest(cuisine) c
    WHERE lower(trim(c)) <> ALL (ARRAY['gelato','wraps','salads','chicken','sandwiches','sandwhiches'])
  )
WHERE cuisine IS NOT NULL AND array_length(cuisine, 1) > 0;