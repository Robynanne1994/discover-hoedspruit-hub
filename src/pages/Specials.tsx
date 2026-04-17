import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Tag, MapPin, Phone, MessageCircle, Calendar, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import FavouriteButton from "@/components/FavouriteButton";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const TYPE_OPTIONS = ["Daily Special", "Weekly Special", "Monthly Special", "Seasonal", "Happy Hour", "Promotion"];

const Specials = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string[]>([]);

  const { data: specials, isLoading } = useQuery({
    queryKey: ["all-specials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("specials")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const activeFilterCount = filterType.length;

  const clearAllFilters = () => {
    setFilterType([]);
  };

  const toggleFilter = (val: string) => {
    setFilterType((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const filteredSpecials = useMemo(() => {
    if (!specials) return [];
    let filtered = specials;
    if (filterType.length > 0) {
      filtered = filtered.filter((s) =>
        filterType.some((t) => (s.special_type || "").toLowerCase() === t.toLowerCase())
      );
    }
    return filtered;
  }, [specials, filterType]);

  const font = "'Helvetica Neue', Helvetica, Arial, sans-serif";

  return (
    <div style={{ background: "#EBEBEB", minHeight: "100dvh", display: "flex", flexDirection: "column", overflow: "auto", paddingBottom: 84, fontFamily: font }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 8 }}>
        <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: font }}>Back</span>
        </button>
      </div>

      {/* Title */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 4 }}>
        <h1 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", textTransform: "capitalize", fontWeight: 400, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.01em", color: "#020202", margin: 0 }}>
          Specials
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p style={{ fontFamily: font, fontStyle: "italic", fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)", lineHeight: 1.35, margin: 0 }}>
          The hottest deals and promotions in Hoedspruit
        </p>
      </div>

      {/* Filter button */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center active:scale-[0.97]"
          style={{ gap: 6, background: "rgba(18,18,20,0.06)", border: "none", borderRadius: 20, padding: "10px 16px", cursor: "pointer", transition: "transform 0.12s ease" }}
        >
          <SlidersHorizontal size={18} strokeWidth={1.8} style={{ color: "#2B2420" }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#2B2420", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: font }}>Filter</span>
          {activeFilterCount > 0 && (
            <span style={{ background: "#020202", color: "#fff", borderRadius: 999, width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
              {activeFilterCount}
            </span>
          )}
          {showFilters
            ? <ChevronUp size={14} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.4)" }} />
            : <ChevronDown size={14} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.4)" }} />
          }
        </button>

        {showFilters && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} style={{ fontSize: 12, fontWeight: 600, color: "rgba(18,18,20,0.5)", textDecoration: "underline", alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: font }}>
                Clear all filters
              </button>
            )}
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: font }}>Type</p>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleFilter(t)}
                    style={{
                      background: filterType.includes(t) ? "#020202" : "rgba(18,18,20,0.06)",
                      border: "none",
                      borderRadius: 20,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: filterType.includes(t) ? "#FFFFFF" : "#2B2420",
                      cursor: "pointer",
                      fontFamily: font,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        {isLoading ? (
          <div style={{ paddingLeft: 24, paddingRight: 24 }} className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full" style={{ height: 280, borderRadius: 16, background: "#f0f0f0" }} />
            ))}
          </div>
        ) : filteredSpecials.length > 0 ? (
          <div>
            {/* Section overline */}
            <div style={{ paddingLeft: 24, paddingRight: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(18,18,20,0.4)", lineHeight: 1.3, margin: 0, marginBottom: 4, fontFamily: font }}>
                Don't Miss
              </p>
              <h2 style={{ fontFamily: font, fontWeight: 400, fontSize: 34, lineHeight: 1.1, letterSpacing: "0.01em", color: "#020202", textTransform: "none", margin: 0, marginBottom: 16 }}>
                All Deals
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {filteredSpecials.map((s) => (
                <Link
                  key={s.id}
                  to={`/specials/${s.id}`}
                  className="active:scale-[0.98]"
                  style={{
                    textDecoration: "none",
                    background: "#FFFFFF",
                    border: "1px solid rgba(18,18,20,0.06)",
                    borderRadius: 16,
                    overflow: "hidden",
                    display: "block",
                    marginLeft: 24,
                    marginRight: 24,
                    marginBottom: 16,
                    transition: "transform 0.15s ease",
                  }}
                >
                  {/* Image */}
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", background: "#f0f0f0" }}>
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "#f0f0f0" }}>
                        <Tag size={32} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.15)" }} />
                      </div>
                    )}

                    {/* Heart */}
                    <FavouriteButton itemId={s.id} itemType="special" />

                    {/* Deal label pill */}
                    <div style={{ position: "absolute", left: 12, top: 12 }}>
                      <span style={{ background: "#FFFFFF", borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "#2B2420", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: font }}>
                        {s.deal_label}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ padding: "16px 20px 20px 20px" }}>
                    <h3 style={{ fontFamily: font, fontWeight: 500, fontSize: 20, lineHeight: 1.2, letterSpacing: "0.01em", color: "#020202", textTransform: "uppercase", margin: 0, marginBottom: 6 }}>
                      {s.title}
                    </h3>

                    {s.description && (
                      <p className="line-clamp-2" style={{ fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)", lineHeight: 1.4, margin: 0, marginBottom: 14, fontFamily: font }}>
                        {s.description}
                      </p>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {/* Business / location */}
                      <div className="flex items-center" style={{ gap: 12, padding: "5px 0" }}>
                        <MapPin size={18} strokeWidth={1.8} style={{ flexShrink: 0, color: "rgba(18,18,20,0.3)" }} />
                        <span className="truncate" style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, fontFamily: font }}>{s.business_name}</span>
                      </div>

                      {/* Valid until */}
                      {(s.valid_until || !s.valid_until) && (
                        <div className="flex items-center" style={{ gap: 12, padding: "5px 0" }}>
                          <Calendar size={18} strokeWidth={1.8} style={{ flexShrink: 0, color: "rgba(18,18,20,0.3)" }} />
                          <span style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, fontFamily: font }}>
                            {s.valid_until ? `Valid until ${format(new Date(s.valid_until), "d MMM yyyy")}` : "Ongoing"}
                          </span>
                        </div>
                      )}

                      {s.contact_phone && (
                        <a
                          href={`tel:${s.contact_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center active:opacity-60"
                          style={{ gap: 12, padding: "5px 0", textDecoration: "none", width: "fit-content", transition: "opacity 0.12s ease" }}
                        >
                          <Phone size={18} strokeWidth={1.8} style={{ flexShrink: 0, color: "rgba(18,18,20,0.3)" }} />
                          <span style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, fontFamily: font }}>{s.contact_phone}</span>
                        </a>
                      )}

                      {s.contact_whatsapp && (
                        <a
                          href={`https://wa.me/${s.contact_whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center active:opacity-60"
                          style={{ gap: 12, padding: "5px 0", textDecoration: "none", width: "fit-content", transition: "opacity 0.12s ease" }}
                        >
                          <MessageCircle size={18} strokeWidth={1.8} style={{ flexShrink: 0, color: "rgba(18,18,20,0.3)" }} />
                          <span style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, fontFamily: font }}>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center" style={{ paddingTop: 80, paddingLeft: 24, paddingRight: 24 }}>
            <Tag size={48} strokeWidth={1.5} style={{ color: "rgba(18,18,20,0.2)", margin: "0 auto" }} />
            <p style={{ fontFamily: font, fontWeight: 400, fontSize: 20, color: "#020202", textTransform: "uppercase", marginTop: 16, marginBottom: 4 }}>
              No specials found
            </p>
            <p style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.45)", fontFamily: font }}>
              Check back soon for the latest deals in Hoedspruit
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Specials;
