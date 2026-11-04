import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STORE_LINKS_SECTION, type StoreReviewLinks } from "@/lib/storeReview";

export const STORE_LINKS_QUERY_KEY = ["site-content", STORE_LINKS_SECTION];

/** Admin-saved app store rating links (empty object when none saved). */
export const useStoreReviewLinks = () =>
  useQuery({
    queryKey: STORE_LINKS_QUERY_KEY,
    queryFn: async (): Promise<StoreReviewLinks> => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", STORE_LINKS_SECTION)
        .maybeSingle();
      const c = data?.content as StoreReviewLinks | null;
      return c && typeof c === "object" ? c : {};
    },
  });
