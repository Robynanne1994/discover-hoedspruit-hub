import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

interface Special {
  id: string;
  title: string;
  title_override?: string | null;
  business_name: string;
  image_url: string | null;
  detail_image_url: string | null;
  homepage_image_url: string | null;
  deal_label: string;
  valid_until: string | null;
}

const HomeSpecials = () => {
  const { data: specials } = useQuery({
    queryKey: ["home-specials"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("specials")
        .select("id, title, title_override, business_name, image_url, detail_image_url, homepage_image_url, deal_label, valid_until")
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("created_at", { ascending: false });
      return (data || []) as Special[];
    },
  });

  if (!specials || specials.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary="Active specials" actionHref="/specials" />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20 }}>
        <div style={{ display: "flex", gap: 4, paddingRight: 20 }}>
          {specials.map((s) => (
            <Link
              key={s.id}
              to={`/specials/${s.id}`}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                width: 290,
                flexShrink: 0,
                background: "#ffffff",
                borderRadius: 16,
                display: "flex",
                alignItems: "stretch",
                gap: 12,
                textDecoration: "none",
                transition: "transform 150ms ease-out",
                overflow: "hidden",
                paddingRight: 10,
              }}
            >
              <div style={{ position: "relative", width: 100, height: 100, background: "#F4EFE3", flexShrink: 0 }}>
                {(s.homepage_image_url || s.image_url || s.detail_image_url) && (
                  <img src={s.homepage_image_url || s.image_url || s.detail_image_url || ""} alt={s.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, alignSelf: "center", paddingTop: 10, paddingBottom: 10 }}>
                <div
                  {...noTitleCaseProps(s)}
                  style={{
                    fontFamily: HN,
                    fontSize: 15,
                    color: "#020202",
                    lineHeight: 1.25,
                    marginBottom: 6,
                    wordBreak: "break-word",
                  }}
                >
                  {getDisplayTitle(s)}
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4, fontFamily: HN, fontSize: 12, color: "#6B6A5E" }}>
                  <MapPin size={12} strokeWidth={1.6} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>{s.business_name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeSpecials;
