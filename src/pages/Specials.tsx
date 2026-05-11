import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SlidersHorizontal, Calendar, Heart } from "lucide-react";
import GlobalMenu, { GlobalMenuTrigger } from "@/components/GlobalMenu";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLOR = {
  olive: "#5C6446",
  cream: "#EEE8DA",
  softCream: "#F4EFE3",
  ink: "#2A2A24",
  mutedInk: "#6B6A5E",
  line: "#D9D2C0",
};

const TYPE_OPTIONS = ["Daily Special", "Weekly Special", "Monthly Special", "Seasonal", "Happy Hour", "Promotion"];

type SortKey = "default" | "ending" | "newest" | "best";

const SORT_LABELS: Record<SortKey, string> = {
  default: "Default",
  ending: "Ending Soon",
  newest: "Newest",
  best: "Best Value",
};

const formatValidity = (s: any): string => {
  if (s.valid_from && s.valid_until) {
    return `Valid ${format(new Date(s.valid_from), "d MMM")} to ${format(new Date(s.valid_until), "d MMM yyyy")}`;
  }
  if (s.valid_until) return `Valid until ${format(new Date(s.valid_until), "d MMM yyyy")}`;
  if (s.day_of_week && s.day_of_week.length > 0) return `${s.day_of_week.join(", ")}`;
  return "Ongoing";
};

const SaveHeart = ({ id }: { id: string }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: saved } = useQuery({
    queryKey: ["favourite", "special", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favourites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", id)
        .eq("item_type", "special")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });
  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Please sign in to save");
        return;
      }
      if (saved) {
        await supabase.from("favourites").delete().eq("user_id", user.id).eq("item_id", id).eq("item_type", "special");
      } else {
        await supabase.from("favourites").insert({ user_id: user.id, item_id: id, item_type: "special" });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favourite", "special", id] }),
  });
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle.mutate();
      }}
      aria-label={saved ? "Unsave" : "Save"}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(238, 232, 218, 0.4)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <Heart
        size={16}
        strokeWidth={2}
        color={COLOR.cream}
        fill={saved ? COLOR.cream : "none"}
      />
    </button>
  );
};

const Specials = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("default");
  const [filterType, setFilterType] = useState<string[]>([]);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSortMenu) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSortMenu]);

  const { data: specials, isLoading } = useQuery({
    queryKey: ["all-specials"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("specials")
        .select("*")
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const filteredSpecials = useMemo(() => {
    if (!specials) return [];
    let result = [...specials];
    if (filterType.length > 0) {
      result = result.filter((s) => filterType.some((t) => (s.special_type || "").toLowerCase() === t.toLowerCase()));
    }
    if (sortBy === "ending") {
      const now = Date.now();
      const withDate = result.filter((s) => s.valid_until && new Date(s.valid_until).getTime() >= now);
      const without = result.filter((s) => !s.valid_until || new Date(s.valid_until).getTime() < now);
      withDate.sort((a, b) => new Date(a.valid_until!).getTime() - new Date(b.valid_until!).getTime());
      return [...withDate, ...without];
    }
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }, [specials, filterType, sortBy]);

  const totalCount = specials?.length || 0;
  const subline = totalCount > 0
    ? `${totalCount} active deals, refreshed daily.`
    : "Refreshed daily.";

  const toggleFilter = (val: string) => {
    setFilterType((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };

  const iconBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: COLOR.cream,
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingBottom: 120,
        background: COLOR.olive,
        fontFamily: SANS,
        color: COLOR.cream,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "32px 24px 0 24px",
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <GlobalMenuTrigger open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        <GlobalMenu open={menuOpen} onOpenChange={setMenuOpen} />
      </div>

      {/* Hero */}
      <div style={{ padding: "24px 24px 0 24px" }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: "rgba(238, 232, 218, 0.7)",
            marginBottom: 14,
          }}
        >
          SAVE IN THE 'HOED
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 72,
            lineHeight: 0.92,
            letterSpacing: "-2.5px",
            color: COLOR.cream,
            margin: 0,
            marginBottom: 14,
            textTransform: "none",
          }}
        >
          specials.
        </h1>
        <p
          style={{
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 15,
            lineHeight: 1.65,
            color: "rgba(238, 232, 218, 0.9)",
            margin: 0,
            marginBottom: 24,
          }}
        >
          {subline}
        </p>
      </div>

      {/* Filter + Sort row */}
      <div
        style={{
          padding: "0 24px",
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => setShowFilters((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: COLOR.cream,
            border: "none",
            height: 38,
            padding: "0 18px",
            borderRadius: 999,
            cursor: "pointer",
          }}
        >
          <SlidersHorizontal size={14} strokeWidth={1.8} color={COLOR.ink} />
          <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 400, color: COLOR.ink }}>Filter</span>
          {filterType.length > 0 && (
            <span
              style={{
                background: COLOR.ink,
                color: COLOR.cream,
                borderRadius: 999,
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                marginLeft: 2,
              }}
            >
              {filterType.length}
            </span>
          )}
        </button>

        <div ref={sortRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowSortMenu((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              background: "transparent",
              border: "none",
              padding: "6px 0",
              cursor: "pointer",
            }}
          >
            <span style={{ fontFamily: SANS, fontSize: 13, color: "rgba(238,232,218,0.7)" }}>Sort by</span>
            <span style={{ fontFamily: SANS, fontSize: 13, color: COLOR.cream, marginLeft: 6 }}>
              {SORT_LABELS[sortBy]}
            </span>
            <span style={{ fontSize: 11, color: "rgba(238,232,218,0.85)", marginLeft: 4 }}>▾</span>
          </button>

          {showSortMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                background: COLOR.cream,
                borderRadius: 16,
                padding: 6,
                zIndex: 20,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                minWidth: 180,
              }}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
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
                    background: sortBy === key ? COLOR.softCream : "transparent",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    color: COLOR.ink,
                    fontFamily: SANS,
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
        <div style={{ padding: "0 24px 24px 24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TYPE_OPTIONS.map((t) => {
              const active = filterType.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleFilter(t)}
                  style={{
                    background: active ? COLOR.ink : COLOR.cream,
                    color: active ? COLOR.cream : COLOR.ink,
                    border: "none",
                    borderRadius: 9999,
                    padding: "9px 16px",
                    fontSize: 13,
                    fontFamily: SANS,
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Card stack */}
      {isLoading ? (
        <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full" style={{ height: 420, borderRadius: 24, background: "rgba(238,232,218,0.15)" }} />
          ))}
        </div>
      ) : filteredSpecials.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 24px" }}>
          {filteredSpecials.map((s) => {
            const validText = formatValidity(s);
            return (
              <article
                key={s.id}
                onClick={() => navigate(`/specials/${s.id}`)}
                style={{
                  background: COLOR.cream,
                  borderRadius: 24,
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <div style={{ position: "relative", width: "100%", height: 220, background: COLOR.softCream }}>
                  {s.image_url && (
                    <img
                      src={s.image_url}
                      alt={s.title}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )}
                  <div style={{ position: "absolute", left: 12, top: 12 }}>
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: 12,
                        letterSpacing: "0.1px",
                        color: COLOR.ink,
                        background: COLOR.cream,
                        borderRadius: 999,
                        padding: "8px 16px",
                        display: "inline-block",
                      }}
                    >
                      {s.deal_label}
                    </span>
                  </div>
                  <SaveHeart id={s.id} />
                </div>
                <div style={{ padding: "22px 24px 24px 24px" }}>
                  <h3
                    style={{
                      fontFamily: SANS,
                      fontSize: 18,
                      fontWeight: 400,
                      lineHeight: 1.2,
                      letterSpacing: "-0.25px",
                      color: COLOR.ink,
                      textTransform: "capitalize",
                      margin: 0,
                      marginBottom: 8,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: 13.5,
                      color: COLOR.mutedInk,
                      margin: 0,
                      marginBottom: 4,
                    }}
                  >
                    {s.business_name}
                  </p>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 14,
                      opacity: 0.85,
                    }}
                  >
                    <Calendar size={11} strokeWidth={1.8} color={COLOR.mutedInk} />
                    <span style={{ fontFamily: SANS, fontSize: 12.5, color: COLOR.mutedInk }}>{validText}</span>
                  </div>
                  {s.description && (
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: COLOR.ink,
                        opacity: 0.92,
                        margin: 0,
                      }}
                    >
                      {s.description}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 12,
              letterSpacing: "2.4px",
              textTransform: "uppercase",
              color: "rgba(238,232,218,0.7)",
              margin: 0,
              marginBottom: 8,
            }}
          >
            No deals match
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 16,
              color: "rgba(238,232,218,0.85)",
              margin: 0,
              maxWidth: 280,
              marginInline: "auto",
            }}
          >
            Try clearing a filter. New deals are added all the time.
          </p>
        </div>
      )}
    </div>
  );
};

export default Specials;
