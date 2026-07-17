import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import Seo from "@/components/Seo";

const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const MUTED = "#6B6A5E";
const CARD_BG = "#FFFFFF";

// Tours & Safaris + Activities & Adventures
const TOURS_ID = "3af5aabe-3184-494a-adc8-cce3bd7c9c8d";
const ACTIVITIES_ID = "4dc26115-569e-4af7-868a-9f783f8a38eb";
const CATEGORY_IDS = [TOURS_ID, ACTIVITIES_ID];

const ExploreListings = () => {
  const navigate = useNavigate();

  const { data: listings, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["explore-listings-combined"],
    queryFn: async () => {
      const [legacy, junction] = await Promise.all([
        supabase
          .from("listings")
          .select("id, title, display_title, no_title_case, image_url, location, google_rating, google_reviews_count")
          .in("category_id", CATEGORY_IDS),
        supabase
          .from("listing_categories")
          .select("listing_id")
          .in("category_id", CATEGORY_IDS),
      ]);

      const ids = new Set<string>();
      (legacy.data || []).forEach((l: any) => ids.add(l.id));
      (junction.data || []).forEach((r: any) => ids.add(r.listing_id));
      if (ids.size === 0) return [];

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, display_title, no_title_case, image_url, location, google_rating, google_reviews_count")
        .in("id", Array.from(ids))
        .order("title", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const items = useMemo(() => listings || [], [listings]);

  return (
    <>
      <Seo
        title="Explore Hoedspruit – Tours, Safaris and Activities"
        description="Discover tours, safaris, activities and adventures in and around Hoedspruit."
        path="/explore-listings"
      />
      <div style={{ minHeight: "100vh", background: "#E6E0CC", paddingBottom: 100 }}>
        <PageHeader title="Explore" />

        <div style={{ height: 20 }} />

        {isLoading ? (
          <div style={{ paddingLeft: 20, paddingRight: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full" style={{ height: 340, borderRadius: 20, background: "rgba(0,0,0,0.06)" }} />
            ))}
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "60px 24px 80px" }}>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 22, fontWeight: 700, color: INK, margin: "0 0 10px" }}>
              Something went wrong
            </h2>
            <p style={{ fontFamily: sans, fontSize: 14, color: MUTED, margin: "0 0 24px", lineHeight: 1.5 }}>
              We couldn't load these listings. Please check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              style={{ background: "#423324", color: "#fff", border: "none", borderRadius: 999, height: 48, padding: "0 28px", fontFamily: sans, fontSize: 14, fontWeight: 500, cursor: isFetching ? "default" : "pointer", opacity: isFetching ? 0.6 : 1 }}
            >
              {isFetching ? "Trying…" : "Try again"}
            </button>
          </div>
        ) : items.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingLeft: 20, paddingRight: 20 }}>
            {items.map((l: any) => (
              <article
                key={l.id}
                onClick={() => navigate(`/listing/${l.id}?from=${encodeURIComponent("Explore")}`, { state: { fromCategory: "Explore" } })}
                style={{
                  background: CARD_BG,
                  borderRadius: 20,
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <div style={{ position: "relative", width: "100%", height: 200, background: "#F4EFE3" }}>
                  {l.image_url ? (
                    <img
                      src={l.image_url}
                      alt={l.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      loading="lazy"
                    />
                  ) : null}
                  {l.google_rating ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "rgba(255,255,255,0.92)",
                        borderRadius: 9999,
                        padding: "5px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: sans,
                        fontSize: 12,
                        fontWeight: 600,
                        color: INK,
                      }}
                    >
                      <span>★</span>
                      {Number(l.google_rating).toFixed(1).replace(/\.0$/, "")}
                      {l.google_reviews_count ? (
                        <span style={{ fontWeight: 400, color: MUTED }}>({l.google_reviews_count})</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div style={{ padding: "16px 18px 18px" }}>
                  <h3
                    {...noTitleCaseProps(l)}
                    style={{
                      fontFamily: sans,
                      fontSize: 20,
                      fontWeight: 700,
                      color: INK,
                      lineHeight: 1.2,
                      margin: "0 0 6px 0",
                      wordBreak: "break-word",
                    }}
                  >
                    {getDisplayTitle(l)}
                  </h3>

                  {l.location && (
                    <>
                      <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "14px 0 12px" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 13, color: MUTED, lineHeight: 1.35 }}>
                        <MapPin size={13} strokeWidth={1.6} color={MUTED} style={{ flexShrink: 0, transform: "translateY(-1px)" }} />
                        <span style={{ wordBreak: "break-word" }}>{l.location}</span>
                      </div>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ fontFamily: sans, fontSize: 14, color: MUTED }}>Nothing to explore just yet.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ExploreListings;
