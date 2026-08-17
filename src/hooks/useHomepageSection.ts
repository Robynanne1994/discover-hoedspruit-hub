import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mergeFeaturedFirst } from "@/lib/featuredFirst";
import { LISTING_IMAGE_COLUMNS } from "@/lib/imageFallback";

const COLUMNS =
  `id, title, title_override, google_rating, google_reviews_count, location, is_featured, ${LISTING_IMAGE_COLUMNS}`;

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
          .select(COLUMNS)
          .in("id", curatedIds);
        const map = new Map((data || []).map((l) => [l.id, l]));
        curatedListings = curatedIds.map((id) => map.get(id)).filter(Boolean);
      }

      // 2. Resolve the section's category — needed both for the featured pins
      //    and for the auto-picks that fill any leftover slots.
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
      if (!categories?.length) return mergeFeaturedFirst([curatedListings], TARGET);

      const categoryId = categories[0].id;

      const { data: linkedIds } = await supabase
        .from("listing_categories")
        .select("listing_id")
        .eq("category_id", categoryId);

      const ids = linkedIds?.map((l) => l.listing_id) || [];
      const inCategory = `category_id.eq.${categoryId}${ids.length ? `,id.in.(${ids.join(",")})` : ""}`;

      // 3. Featured listings in this category outrank the curated picks: they
      //    take the top slots even when the admin has filled the row by hand.
      const { data: featured } = await supabase
        .from("listings")
        .select(COLUMNS)
        .or(inCategory)
        .eq("is_featured", true)
        .limit(TARGET);

      const pinned = mergeFeaturedFirst([featured, curatedListings], TARGET);
      if (pinned.length >= TARGET) return pinned;

      // 4. Anything still empty falls back to automatic category picks.
      const { data: autoPicks } = await supabase
        .from("listings")
        .select(COLUMNS)
        .or(inCategory)
        .order("is_featured", { ascending: false })
        .limit(TARGET + curatedIds.length);

      return mergeFeaturedFirst([featured, curatedListings, autoPicks], TARGET);

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
