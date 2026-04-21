import { useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronDown, SlidersHorizontal, Phone, Tag } from "lucide-react";
import FavouriteButton from "@/components/FavouriteButton";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const TYPE_OPTIONS = ["Daily Special", "Weekly Special", "Monthly Special", "Seasonal", "Happy Hour", "Promotion"];

const FONT = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";

const COLOR = {
  bg: "#EBEBEB",
  surface: "#FFFFFF",
  warm: "#F2EFEC",
  text: "#0A0A0A",
  muted: "#8A8480",
  divider: "#E8E4DF",
};

type SortKey = "default" | "saved" | "name" | "business" | "expiring";

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? COLOR.text : COLOR.warm,
      border: "none",
      borderRadius: 9999,
      padding: "9px 16px",
      fontSize: 13,
      fontWeight: 400,
      lineHeight: "15.6px",
      letterSpacing: 0,
      fontFamily: FONT,
      color: active ? "#FFFFFF" : COLOR.text,
      cursor: "pointer",
    }}
  >
    {label}
  </button>
);

const Specials = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("default");
  const [filterType, setFilterType] = useState<string[]>([]);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSortMenu) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSortMenu]);

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

  const { data: savedIds } = useQuery({
    queryKey: ["saved-special-ids", user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase
        .from("favourites")
        .select("item_id")
        .eq("user_id", user.id)
        .eq("item_type", "special");
      return new Set((data || []).map((f: any) => f.item_id as string));
    },
    enabled: !!user,
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
      result = result.filter((s) => filterType.some((t) => (s.special_type || "").toLowerCase() === t.toLowerCase()));
    }
    if (sortBy === "saved") {
      const ids = savedIds || new Set<string>();
      return [...result].filter((s) => ids.has(s.id));
    }
    if (sortBy === "name") return [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "business") return [...result].sort((a, b) => a.business_name.localeCompare(b.business_name));
    if (sortBy === "expiring") {
      const now = Date.now();
      const withDate = result.filter((s) => s.valid_until && new Date(s.valid_until).getTime() >= now);
      const without = result.filter((s) => !s.valid_until || new Date(s.valid_until).getTime() < now);
      withDate.sort((a, b) => new Date(a.valid_until!).getTime() - new Date(b.valid_until!).getTime());
      return [...withDate, ...without];
    }
    return result;
  }, [specials, filterType, sortBy, savedIds]);

  const press = {
    onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.98)"),
    onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
    onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  };

  const SORT_LABELS: Record<SortKey, string> = {
    default: "Default",
    saved: "Saved",
    name: "Alphabetically",
    business: "Business Name",
    expiring: "Expiring Soon",
  };
  const sortLabel = SORT_LABELS[sortBy];
  const count = filteredSpecials.length;

  // Buttons
  const primaryBtn: React.CSSProperties = {
    background: COLOR.text,
    color: "#FFFFFF",
    border: "none",
    height: 44,
    padding: "0 22px",
    borderRadius: 999,
    fontFamily: FONT,
    fontSize: 15,
    lineHeight: "18px",
    letterSpacing: 0,
    fontWeight: 400,
    textTransform: "capitalize" as const,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform 150ms ease-out",
    whiteSpace: "nowrap" as const,
  };
  const secondaryBtn: React.CSSProperties = {
    background: COLOR.surface,
    color: COLOR.text,
    border: `1px solid ${COLOR.divider}`,
    height: 44,
    padding: "0 18px",
    borderRadius: 999,
    fontFamily: FONT,
    fontSize: 14,
    lineHeight: "18px",
    letterSpacing: 0,
    fontWeight: 400,
    textTransform: "capitalize" as const,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
    transition: "transform 150ms ease-out",
    whiteSpace: "nowrap" as const,
  };

  const dealPill: React.CSSProperties = {
    fontFamily: FONT,
    fontSize: 11,
    lineHeight: "13px",
    letterSpacing: "0.22px",
    textTransform: "uppercase" as const,
    color: COLOR.text,
    fontWeight: 400,
    padding: "7px 12px",
    borderRadius: 999,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    display: "inline-block",
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 120, background: COLOR.bg, fontFamily: FONT }}>
      {/* Top bar */}
      <div
        style={{
          height: 56,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: COLOR.surface,
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={20} strokeWidth={1.5} color={COLOR.text} />
        </button>

        {!isLoading && (
          <span
            style={{
              fontFamily: FONT,
              fontSize: 13,
              lineHeight: "18.2px",
              letterSpacing: "0.13px",
              fontWeight: 400,
              color: COLOR.muted,
            }}
          >
            <span style={{ color: COLOR.text }}>{count}</span> Deals
          </span>
        )}
      </div>

      {/* Page header */}
      <div style={{ padding: "16px 24px 24px 24px" }}>
        <h1
          style={{
            fontFamily: FONT,
            fontSize: 52,
            lineHeight: "52px",
            letterSpacing: "-1.56px",
            fontWeight: 700,
            color: COLOR.text,
            margin: 0,
            marginBottom: 12,
            textTransform: "none",
          }}
        >
          Specials
        </h1>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 16,
            lineHeight: "23.2px",
            letterSpacing: 0,
            fontWeight: 400,
            color: COLOR.muted,
            margin: 0,
          }}
        >
          The hottest deals in Hoedspruit.
        </p>
      </div>

      {/* Controls row */}
      <div
        style={{
          padding: "0 24px 24px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <button
          onClick={() => setShowFilters((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: COLOR.surface,
            border: "none",
            height: 40,
            padding: "0 18px",
            borderRadius: 999,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "transform 150ms ease-out",
          }}
          {...press}
        >
          <SlidersHorizontal size={16} strokeWidth={1.5} color={COLOR.text} />
          <span
            style={{
              fontFamily: FONT,
              fontSize: 14,
              lineHeight: "16.8px",
              letterSpacing: 0,
              fontWeight: 400,
              color: COLOR.text,
              textTransform: "capitalize",
            }}
          >
            Filter
          </span>
          {activeFilterCount > 0 && (
            <span
              style={{
                background: COLOR.text,
                color: "#fff",
                borderRadius: 999,
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 400,
                marginLeft: 2,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <div ref={sortRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowSortMenu((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              padding: "8px 0",
              cursor: "pointer",
            }}
          >
            <span style={{ fontFamily: FONT, fontSize: 14, lineHeight: "16.8px", color: COLOR.muted, fontWeight: 400 }}>
              Sort:{" "}
              <span style={{ color: COLOR.text }}>{sortLabel}</span>
            </span>
            <ChevronDown size={14} strokeWidth={1.75} color={COLOR.text} />
          </button>

          {showSortMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% - 4px)",
                right: 0,
                background: COLOR.surface,
                borderRadius: 16,
                padding: 6,
                zIndex: 20,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                minWidth: 200,
              }}
            >
              {(["default", "saved", "name", "business", "expiring"] as SortKey[]).map((key) => (
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
                    background: sortBy === key ? COLOR.warm : "transparent",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 400,
                    color: COLOR.text,
                    fontFamily: FONT,
                    cursor: "pointer",
                  }}
                >
                  {SORT_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{ padding: "0 24px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: COLOR.muted,
                textDecoration: "underline",
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              Clear All Filters
            </button>
          )}
          <div>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 12,
                lineHeight: "14.4px",
                letterSpacing: "0.24px",
                fontWeight: 400,
                color: COLOR.muted,
                textTransform: "uppercase",
                margin: 0,
                marginBottom: 10,
              }}
            >
              Type
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TYPE_OPTIONS.map((t) => (
                <FilterChip key={t} label={t} active={filterType.includes(t)} onClick={() => toggleFilter(t)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Listings */}
      {isLoading ? (
        <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full" style={{ height: 380, borderRadius: 24, background: "#DEDEDE" }} />
          ))}
        </div>
      ) : filteredSpecials.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 24px" }}>
          {filteredSpecials.map((s) => {
            const whatsappRaw = s.contact_whatsapp;
            const validText = s.valid_until
              ? `Valid until ${format(new Date(s.valid_until), "d MMM yyyy")}`
              : "Ongoing";
            const hasImage = !!s.image_url;

            const Title = (
              <h3
                style={{
                  fontFamily: FONT,
                  fontSize: 28,
                  lineHeight: "32px",
                  letterSpacing: "-0.56px",
                  fontWeight: 700,
                  color: COLOR.text,
                  textTransform: "none",
                  margin: 0,
                  marginBottom: 12,
                }}
              >
                {s.title}
              </h3>
            );

            const Vendor = (
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 11,
                  lineHeight: "13px",
                  letterSpacing: "0.22px",
                  fontWeight: 400,
                  color: COLOR.muted,
                  textTransform: "uppercase",
                  margin: 0,
                  marginBottom: 4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.business_name}
              </p>
            );

            const Validity = (
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 12,
                  lineHeight: "15.6px",
                  letterSpacing: "0.12px",
                  fontWeight: 400,
                  color: COLOR.muted,
                  margin: 0,
                  marginBottom: 14,
                }}
              >
                {validText}
              </p>
            );

            const Description = s.description ? (
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 14,
                  lineHeight: "20.3px",
                  letterSpacing: 0,
                  fontWeight: 400,
                  color: "rgb(138, 132, 128)",
                  margin: 0,
                  marginBottom: 20,
                }}
              >
                {s.description}
              </p>
            ) : null;

            const Actions = (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <Link to={`/specials/${s.id}`} onClick={(e) => e.stopPropagation()} style={primaryBtn} {...press}>
                  View Deal
                </Link>
                {s.contact_phone && (
                  <a href={`tel:${s.contact_phone}`} onClick={(e) => e.stopPropagation()} style={secondaryBtn} {...press}>
                    Call
                  </a>
                )}
                {whatsappRaw && (
                  <a
                    href={`https://wa.me/${whatsappRaw.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={secondaryBtn}
                    {...press}
                  >
                    Whatsapp
                  </a>
                )}
              </div>
            );

            return (
              <article
                key={s.id}
                onClick={() => navigate(`/specials/${s.id}`)}
                style={{
                  background: COLOR.surface,
                  borderRadius: 24,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform 150ms ease-out",
                }}
              >
                {hasImage ? (
                  <>
                    {/* Variant A: image */}
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", background: COLOR.warm }}>
                      <img
                        src={s.image_url!}
                        alt={s.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        loading="lazy"
                      />
                      <div style={{ position: "absolute", left: 14, top: 12 }}>
                        <span
                          style={{
                            ...dealPill,
                            background: "rgba(255,255,255,0.92)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                          }}
                        >
                          {s.deal_label}
                        </span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <FavouriteButton itemId={s.id} itemType="special" />
                      </div>
                    </div>
                    <div style={{ padding: 20 }}>
                      {Title}
                      {Vendor}
                      {Validity}
                      {Description}
                      {Actions}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Variant B: text-only */}
                    <div
                      style={{
                        padding: "20px 20px 0 20px",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <span style={dealPill}>{s.deal_label}</span>
                      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: 36, height: 36 }}>
                        <FavouriteButton itemId={s.id} itemType="special" />
                      </div>
                    </div>
                    <div style={{ padding: "16px 20px 20px 20px" }}>
                      {Title}
                      {Vendor}
                      {Validity}
                      {Description}
                      {Actions}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 12,
              lineHeight: "14.4px",
              letterSpacing: "0.24px",
              textTransform: "uppercase",
              color: COLOR.muted,
              margin: 0,
              marginBottom: 8,
            }}
          >
            No Deals Match
          </p>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 14,
              lineHeight: "20.3px",
              color: COLOR.text,
              margin: 0,
              maxWidth: 280,
              marginInline: "auto",
            }}
          >
            Try clearing a filter or two. New deals are added all the time.
          </p>
        </div>
      )}

      {/* Tag import kept to satisfy bundler if previously referenced */}
      <span style={{ display: "none" }}><Tag size={1} /></span>
    </div>
  );
};

export default Specials;
