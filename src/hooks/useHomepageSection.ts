import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useHomepageSection = (
  sectionKey: string,
  categorySearch: string | string[]
) => {
  return useQuery({
    queryKey: [`homepage-${sectionKey}`],
    queryFn: async () => {
      // 1. Check for curated picks in site_content
      const { data: siteContent } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", `homepage-${sectionKey}`)
        .maybeSingle();

      if (siteContent?.content && Array.isArray(siteContent.content) && siteContent.content.length > 0) {
        const ids = siteContent.content as string[];
        const { data } = await supabase
          .from("listings")
          .select("id, title, image_url, google_rating, location")
          .in("id", ids);

        // Preserve curated order
        const map = new Map((data || []).map((l) => [l.id, l]));
        return ids.map((id) => map.get(id)).filter(Boolean) as typeof data;
      }

      // 2. Fallback: auto-pick from category
      let categoryQuery;
      if (Array.isArray(categorySearch)) {
        categoryQuery = supabase
          .from("categories")
          .select("id")
          .or(categorySearch.map((s) => `title.ilike.${s}`).join(","))
          .limit(1);
      } else {
        categoryQuery = supabase
          .from("categories")
          .select("id")
          .ilike("title", categorySearch)
          .limit(1);
      }

      const { data: categories } = await categoryQuery;
      if (!categories?.length) return [];

      const categoryId = categories[0].id;

      const { data: linkedIds } = await supabase
        .from("listing_categories")
        .select("listing_id")
        .eq("category_id", categoryId);

      const ids = linkedIds?.map((l) => l.listing_id) || [];

      const { data } = await supabase
        .from("listings")
        .select("id, title, image_url, google_rating, location")
        .or(`category_id.eq.${categoryId}${ids.length ? `,id.in.(${ids.join(",")})` : ""}`)
        .limit(4);

      return data || [];
    },
  });
};
