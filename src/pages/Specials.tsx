import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Tag, MapPin, Phone, MessageCircle, Globe, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
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

  return (
    <div className="min-h-screen pb-[100px]" style={{ background: "#ebebeb" }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
          <ArrowLeft size={18} strokeWidth={2} style={{ color: "rgba(18,18,20,0.5)" }} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "rgba(18,18,20,0.5)",
              letterSpacing: "0.2px",
            }}
          >
            Back
          </span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            textTransform: "uppercase",
            fontWeight: 400,
            fontSize: "clamp(28px, 8vw, 40px)",
            lineHeight: 1,
            letterSpacing: "-0.5px",
            color: "#2b2420",
            margin: 0,
          }}
        >
          Specials
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p
          style={{
            fontFamily: "var(--font-editorial)",
            fontStyle: "italic",
            fontSize: 14,
            color: "rgba(18,18,20,0.45)",
            letterSpacing: "0.2px",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          The hottest deals and promotions in Hoedspruit
        </p>
      </div>

      {/* Filter dropdown */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center"
          style={{ gap: 8 }}
        >
          <SlidersHorizontal size={16} strokeWidth={2} style={{ color: "rgba(18,18,20,0.5)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.4)", textTransform: "uppercase", letterSpacing: "1.5px" }}>
            Filter
          </span>
          {activeFilterCount > 0 && (
            <span style={{ background: "#121214", color: "#fff", borderRadius: 999, width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp size={16} strokeWidth={2} style={{ color: "rgba(18,18,20,0.35)" }} /> : <ChevronDown size={16} strokeWidth={2} style={{ color: "rgba(18,18,20,0.35)" }} />}
        </button>

        {showFilters && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} style={{ fontSize: 12, fontWeight: 600, color: "rgba(18,18,20,0.5)", textDecoration: "underline", alignSelf: "flex-start" }}>
                Clear all filters
              </button>
            )}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 8 }}>Type</p>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleFilter(t)}
                    style={{
                      background: filterType.includes(t) ? "#121214" : "rgba(18,18,20,0.04)",
                      border: filterType.includes(t) ? "1px solid #121214" : "1px solid rgba(18,18,20,0.08)",
                      borderRadius: 9999,
                      padding: "8px 16px",
                      fontSize: 12,
                      fontWeight: filterType.includes(t) ? 600 : 500,
                      color: filterType.includes(t) ? "#ffffff" : "rgba(18,18,20,0.5)",
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
      <div style={{ paddingLeft: 24, paddingRight: 24 }}>
        {isLoading ? (
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full" style={{ height: 280, borderRadius: 16, background: "#f0f0f0" }} />
            ))}
          </div>
        ) : filteredSpecials.length > 0 ? (
          <div>
            <p
              style={{
                textTransform: "uppercase",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(18,18,20,0.35)",
                letterSpacing: 3,
                marginBottom: 6,
              }}
            >
              DON'T MISS
            </p>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 400,
                fontSize: 22,
                color: "#2b2420",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 18,
              }}
            >
              ALL DEALS
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filteredSpecials.map((s) => (
                <Link
                  key={s.id}
                  to={`/specials/${s.id}`}
                  className="active:scale-[0.99] transition-transform duration-150"
                  style={{
                    textDecoration: "none",
                    background: "rgba(18,18,20,0.04)",
                    border: "1px solid rgba(18,18,20,0.06)",
                    borderRadius: 16,
                    overflow: "hidden",
                    display: "block",
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 190,
                      background: "#f0f0f0",
                    }}
                  >
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "#f0f0f0" }}>
                        <Tag size={32} style={{ color: "rgba(18,18,20,0.15)" }} />
                      </div>
                    )}

                    {/* Heart */}
                    <FavouriteButton itemId={s.id} itemType="special" />

                    {/* Deal label pill */}
                    <div style={{ position: "absolute", left: 8, top: 8 }}>
                      <span
                        className="inline-flex items-center"
                        style={{
                          gap: 5,
                          background: "rgba(255,255,255,0.92)",
                          borderRadius: 8,
                          padding: "7px 12px",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#2b2420",
                          textTransform: "uppercase",
                          letterSpacing: "0.6px",
                        }}
                      >
                        {s.deal_label}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ padding: 16 }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 400,
                        fontSize: 28,
                        lineHeight: 0.98,
                        letterSpacing: "-0.4px",
                        color: "#2b2420",
                        margin: 0,
                        marginBottom: 10,
                      }}
                    >
                      {s.title}
                    </h3>

                    {s.description && (
                      <p
                        className="line-clamp-2"
                        style={{
                          fontSize: 14,
                          color: "rgba(18,18,20,0.5)",
                          lineHeight: 1.5,
                          margin: 0,
                          marginBottom: 14,
                        }}
                      >
                        {s.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {/* Business name as location-like row */}
                      <p
                        className="flex items-center"
                        style={{
                          fontSize: 14,
                          color: "rgba(18,18,20,0.45)",
                          margin: 0,
                          gap: 8,
                        }}
                      >
                        <MapPin size={15} strokeWidth={2} style={{ flexShrink: 0, color: "#000000" }} />
                        <span className="truncate">{s.business_name}</span>
                      </p>

                      {/* Valid until */}
                      <p
                        className="flex items-center"
                        style={{
                          fontSize: 14,
                          color: "rgba(18,18,20,0.45)",
                          margin: 0,
                          gap: 8,
                        }}
                      >
                        <Globe size={15} strokeWidth={2} style={{ flexShrink: 0, color: "#000000" }} />
                        <span>
                          {s.valid_until
                            ? `Valid until ${format(new Date(s.valid_until), "d MMM yyyy")}`
                            : "Ongoing"}
                        </span>
                      </p>

                      {s.contact_phone && (
                        <a
                          href={`tel:${s.contact_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center"
                          style={{
                            fontSize: 14,
                            color: "rgba(18,18,20,0.45)",
                            gap: 8,
                            width: "fit-content",
                          }}
                        >
                          <Phone size={15} strokeWidth={2} style={{ flexShrink: 0, color: "#000000" }} />
                          <span>{s.contact_phone}</span>
                        </a>
                      )}

                      {s.contact_whatsapp && (
                        <a
                          href={`https://wa.me/${s.contact_whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center"
                          style={{
                            fontSize: 14,
                            color: "rgba(18,18,20,0.45)",
                            gap: 8,
                            width: "fit-content",
                          }}
                        >
                          <MessageCircle size={15} strokeWidth={2} style={{ flexShrink: 0, color: "#000000" }} />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center" style={{ paddingTop: 80 }}>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: 18,
                color: "#2b2420",
                marginBottom: 4,
              }}
            >
              No specials found
            </p>
            <p style={{ fontSize: 13, color: "rgba(18,18,20,0.45)" }}>Check back soon for the latest deals in Hoedspruit</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Specials;
