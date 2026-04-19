import { useNavigate, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronDown, SlidersHorizontal, Tag } from "lucide-react";
import FavouriteButton from "@/components/FavouriteButton";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const TYPE_OPTIONS = ["Daily Special", "Weekly Special", "Monthly Special", "Seasonal", "Happy Hour", "Promotion"];

const font = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "#020202" : "rgba(18,18,20,0.06)",
      border: "none",
      borderRadius: 9999,
      padding: "8px 16px",
      fontSize: 13,
      fontWeight: 500,
      fontFamily: font,
      color: active ? "#ffffff" : "#2B2420",
      cursor: "pointer",
      transition: "transform 0.12s ease",
    }}
    onPointerDown={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.97)")}
    onPointerUp={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
    onPointerLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
  >
    {label}
  </button>
);

type SortKey = "favourites" | "name" | "expiring";

const Specials = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("favourites");
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

  const activeFilterCount = filterType.length > 0 ? 1 : 0;

  const clearAllFilters = () => setFilterType([]);

  const toggleFilter = (val: string) => {
    setFilterType((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };

  const filteredSpecials = useMemo(() => {
    if (!specials) return [];
    let result = specials;
    if (filterType.length > 0) {
      result = result.filter((s) =>
        filterType.some((t) => (s.special_type || "").toLowerCase() === t.toLowerCase())
      );
    }
    if (sortBy === "name") {
      return [...result].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === "expiring") {
      return [...result].sort((a, b) => {
        if (!a.valid_until) return 1;
        if (!b.valid_until) return -1;
        return new Date(a.valid_until).getTime() - new Date(b.valid_until).getTime();
      });
    }
    return result;
  }, [specials, filterType, sortBy]);

  const press = {
    onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.98)"),
    onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
    onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  };

  const sortLabel = sortBy === "favourites" ? "Favourites" : sortBy === "name" ? "Name" : "Expiring";
  const count = filteredSpecials.length;

  const subtlePill: React.CSSProperties = {
    background: "rgba(18,18,20,0.06)",
    color: "#2B2420",
    border: "none",
    borderRadius: 20,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: font,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
    lineHeight: 1,
  };
  const darkPill: React.CSSProperties = {
    ...subtlePill,
    background: "#020202",
    color: "#FFFFFF",
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 100, background: "#EBEBEB", fontFamily: font }}>
      <div style={{ paddingTop: 16 }} />

      {/* Top row: Back + count */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 24,
          paddingRight: 24,
          marginBottom: 18,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={18} strokeWidth={1.8} style={{ color: "#020202" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#020202", fontFamily: font }}>Back</span>
        </button>

        {!isLoading && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "rgba(18,18,20,0.4)",
              fontFamily: font,
            }}
          >
            {count} {count === 1 ? "deal" : "deals"}
          </span>
        )}
      </div>

      {/* H1 */}
      <h1
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: 52,
          fontWeight: 700,
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
          color: "#0A0A0A",
          paddingLeft: 24,
          paddingRight: 24,
          margin: 0,
          marginBottom: 16,
          textTransform: "capitalize",
        }}
      >
        Specials
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: font,
          fontSize: 15,
          fontWeight: 400,
          lineHeight: 1.35,
          color: "rgba(18,18,20,0.55)",
          paddingLeft: 24,
          paddingRight: 24,
          margin: 0,
          marginBottom: 24,
          maxWidth: 280,
        }}
      >
        The hottest deals and promotions in Hoedspruit.
      </p>

      {/* Toolbar: Filter + Sort */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 24,
          paddingRight: 24,
          marginBottom: 18,
          position: "relative",
        }}
      >
        <button
          onClick={() => setShowFilters((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#FFFFFF",
            border: "1px solid rgba(18,18,20,0.1)",
            borderRadius: 14,
            padding: "10px 16px",
            cursor: "pointer",
            transition: "transform 0.12s ease",
          }}
          {...press}
        >
          <SlidersHorizontal size={14} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.35)" }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#2B2420", fontFamily: font }}>Filter</span>
          {activeFilterCount > 0 && (
            <span
              style={{
                background: "#020202",
                color: "#fff",
                borderRadius: 999,
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setShowSortMenu((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            padding: "10px 4px",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(18,18,20,0.55)", fontFamily: font }}>
            Sort: {sortLabel}
          </span>
          <ChevronDown size={14} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.55)" }} />
        </button>

        {showSortMenu && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 24,
              background: "#FFFFFF",
              border: "1px solid rgba(18,18,20,0.08)",
              borderRadius: 12,
              padding: 6,
              zIndex: 20,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              minWidth: 160,
            }}
          >
            {(["favourites", "name", "expiring"] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setSortBy(key);
                  setShowSortMenu(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: sortBy === key ? "rgba(18,18,20,0.06)" : "transparent",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#2B2420",
                  fontFamily: font,
                  cursor: "pointer",
                }}
              >
                {key === "favourites" ? "Favourites" : key === "name" ? "Name" : "Expiring"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(18,18,20,0.5)",
                textDecoration: "underline",
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              Clear all filters
            </button>
          )}

          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: font }}>Type</p>
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {TYPE_OPTIONS.map((t) => (
                <FilterChip key={t} label={t} active={filterType.includes(t)} onClick={() => toggleFilter(t)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Listings */}
      {isLoading ? (
        <div style={{ paddingLeft: 24, paddingRight: 24 }}>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full" style={{ height: 360, borderRadius: 16, background: "rgba(18,18,20,0.06)" }} />
            ))}
          </div>
        </div>
      ) : filteredSpecials.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingLeft: 24, paddingRight: 24 }}>
          {filteredSpecials.map((s) => {
            const whatsappRaw = s.contact_whatsapp;
            const validText = s.valid_until
              ? `Valid until ${format(new Date(s.valid_until), "d MMM yyyy")}`
              : "Ongoing";

            return (
              <article
                key={s.id}
                onClick={() => navigate(`/specials/${s.id}`)}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(18,18,20,0.06)",
                  borderRadius: 16,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                }}
                {...press}
              >
                {/* 4:3 cover */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "rgba(18,18,20,0.04)" }}>
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(18,18,20,0.04)" }}>
                      <Tag size={32} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.15)" }} />
                    </div>
                  )}

                  {/* Deal label pill top-left */}
                  <div style={{ position: "absolute", left: 12, top: 12 }}>
                    <span
                      style={{
                        background: "#FFFFFF",
                        borderRadius: 20,
                        padding: "6px 12px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#2B2420",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        fontFamily: font,
                      }}
                    >
                      {s.deal_label}
                    </span>
                  </div>

                  {/* Save button top-right */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <FavouriteButton itemId={s.id} itemType="special" />
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: 20 }}>
                  <h3
                    style={{
                      fontFamily: "'Pragmatica', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontSize: 22,
                      fontWeight: 400,
                      color: "#0A0A0A",
                      textTransform: "capitalize",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.15,
                      margin: 0,
                    }}
                  >
                    {s.title}
                  </h3>

                  <p
                    style={{
                      fontFamily: font,
                      fontSize: 12,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "rgba(18,18,20,0.4)",
                      margin: 0,
                      marginTop: 8,
                    }}
                  >
                    {s.business_name} · {validText}
                  </p>

                  {s.description && (
                    <p
                      style={{
                        fontFamily: font,
                        fontSize: 14,
                        fontWeight: 400,
                        lineHeight: 1.4,
                        color: "rgba(18,18,20,0.55)",
                        margin: 0,
                        marginTop: 10,
                      }}
                    >
                      {s.description}
                    </p>
                  )}

                  {/* Action pills */}
                  {(s.contact_phone || whatsappRaw || s.booking_link) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                      <Link
                        to={`/specials/${s.id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={darkPill}
                      >
                        View Deal
                      </Link>
                      {s.contact_phone && (
                        <a
                          href={`tel:${s.contact_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          style={subtlePill}
                        >
                          Call
                        </a>
                      )}
                      {whatsappRaw && (
                        <a
                          href={`https://wa.me/${whatsappRaw.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={subtlePill}
                        >
                          WhatsApp
                        </a>
                      )}
                      {s.booking_link && (
                        <a
                          href={s.booking_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={subtlePill}
                        >
                          Book
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", paddingTop: 80 }}>
          <p style={{ fontFamily: font, fontWeight: 500, fontSize: 18, color: "#020202", marginBottom: 4 }}>
            No specials found
          </p>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.45)", fontFamily: font }}>
            Check back soon for the latest deals in Hoedspruit
          </p>
        </div>
      )}
    </div>
  );
};

export default Specials;
