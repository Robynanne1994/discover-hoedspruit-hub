import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useHomepageSection = (
  sectionKey: string,
  categorySearch: string | string[]
) => {
  return useQuery({
    queryKey: [`homepage-${sectionKey}`],
    queryFn: async () => {
      const TARGET = 8;

      // 1. Get curated picks (if any)
      const { data: siteContent } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", `homepage-${sectionKey}`)
        .maybeSingle();

      const curatedIds: string[] =
        siteContent?.content && Array.isArray(siteContent.content)
          ? (siteContent.content as string[])
          : [];

      let curatedListings: any[] = [];
      if (curatedIds.length > 0) {
        const { data } = await supabase
          .from("listings")
          .select("id, title, title_override, image_url, google_rating, google_reviews_count, location")
          .in("id", curatedIds);
        const map = new Map((data || []).map((l) => [l.id, l]));
        curatedListings = curatedIds.map((id) => map.get(id)).filter(Boolean);
      }

      if (curatedListings.length >= TARGET) return curatedListings.slice(0, TARGET);

      // 2. Fill remaining slots from category auto-picks
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
      if (!categories?.length) return curatedListings;

      const categoryId = categories[0].id;

      const { data: linkedIds } = await supabase
        .from("listing_categories")
        .select("listing_id")
        .eq("category_id", categoryId);

      const ids = linkedIds?.map((l) => l.listing_id) || [];

      const { data: autoPicks } = await supabase
        .from("listings")
        .select("id, title, title_override, image_url, google_rating, google_reviews_count, location")
        .or(`category_id.eq.${categoryId}${ids.length ? `,id.in.(${ids.join(",")})` : ""}`)
        .limit(TARGET + curatedIds.length);

      const curatedIdSet = new Set(curatedListings.map((l) => l.id));
      const fillers = (autoPicks || []).filter((l) => !curatedIdSet.has(l.id));

      return [...curatedListings, ...fillers].slice(0, TARGET);
    },

  });
};

export const useHomepageSectionTitle = (sectionKey: string, defaultTitle: string) => {
  return useQuery({
    queryKey: [`homepage-${sectionKey}-title`],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", `homepage-${sectionKey}-title`)
        .maybeSingle();

      if (data?.content && typeof data.content === "string" && data.content.trim()) {
        return data.content;
      }
      // Handle case where content is stored as JSON string
      if (data?.content && typeof data.content === "object") {
        const val = (data.content as any);
        if (typeof val === "string" && val.trim()) return val;
      }
      return defaultTitle;
    },
  });
};
