import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal, X, Store, Clock, Tag, ArrowLeft } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import { RefineDrawer, RefineSection, RefineChip } from "@/components/RefineDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLOR = {
  pageBg: "#E6E0CC",
  cardBg: "#FFFFFF",
  ink: "#1A1A1A",
  mutedInk: "#7A6E5C",
  divider: "#EAE4D5",
  pillBorder: "#E2DAC6",
  pillInactiveBg: "#FFFFFF",
  pillActiveBg: "#2E2418",
  pillActiveFg: "#FFFFFF",
  badge: "#C0392B",
  badgeFg: "#FFFFFF",
  priceStrike: "#9C9387",
};

const formatValidTill = (s: any): string => {
  if (s.valid_until) return `Valid until ${format(new Date(s.valid_until), "d MMM")}`;
  return "Ongoing";
};

const useSaved = (id: string) => {
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
  return { saved, toggle };
};

const Specials = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSearch = !!(location.state as { fromSearch?: boolean } | null)?.fromSearch;
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All Specials");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const { data: specials, isLoading } = useQuery({
    queryKey: ["all-specials"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("specials")
        .select("*")
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const collectTags = (s: any): string[] => {
    const tags: string[] = [];
    if (s.tag) tags.push(String(s.tag));
    if (s.sub_tag_1) tags.push(String(s.sub_tag_1));
    if (s.sub_tag_2) tags.push(String(s.sub_tag_2));
    return tags.map((t) => t.trim()).filter(Boolean);
  };

  const categoryTabs = useMemo(() => {
    if (!specials) return ["All Specials"];
    const set = new Set<string>();
    for (const s of specials as any[]) {
      // Only main tag drives the top-level pills (sub-tags are filters within)
      if (s.tag && typeof s.tag === "string") set.add(s.tag.trim());
    }
    return ["All Specials", ...Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b))];
  }, [specials]);

  const filteredSpecials = useMemo(() => {
    if (!specials) return [];
    let result = [...specials];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s: any) =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.business_name && s.business_name.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }
    if (activeTab !== "All Specials") {
      const t = activeTab.toLowerCase();
      result = result.filter((s: any) => (s.tag || "").toString().toLowerCase() === t);
    }
    if (filterType.length > 0) {
      const lc = filterType.map((t) => t.toLowerCase());
      result = result.filter((s: any) => {
        const lcCats = collectTags(s).map((c) => c.toLowerCase());
        return lc.some((t) => lcCats.includes(t));
      });
    }
    return result;
  }, [specials, activeTab, filterType, search]);


  const toggleFilter = (val: string) => {
    setFilterType((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: 60,
        paddingBottom: 120,
        background: COLOR.pageBg,
        fontFamily: SANS,
        color: COLOR.ink,
      }}
    >
      {/* Header — centered title, icons inline on right */}
      <div
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div>
          {fromSearch && (
            <button
              onClick={() => navigate("/search")}
              aria-label="Back to search"
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#020202",
              }}
            >
              <ArrowLeft size={18} strokeWidth={1.8} />
            </button>
          )}
        </div>
        <h1
          style={{
            fontFamily: SANS,
            fontSize: 22,
            fontWeight: 700,
            color: COLOR.ink,
            margin: 0,
            letterSpacing: "-0.3px",
            textAlign: "center",
          }}
        >
          Specials
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
          <button
            aria-label={searchOpen ? "Close search" : "Search"}
            onClick={() => {
              if (searchOpen) {
                setSearch("");
                setSearchOpen(false);
              } else {
                setSearchOpen(true);
              }
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#020202",
            }}
          >
            {searchOpen ? <X size={18} strokeWidth={1.8} /> : <Search size={18} strokeWidth={1.8} />}
          </button>
          <button
            aria-label="Filters"
            onClick={() => setShowFilters(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: filterType.length > 0 ? COLOR.ink : "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: filterType.length > 0 ? COLOR.cardBg : "#020202",
            }}
          >
            <SlidersHorizontal size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Divider under title */}
      <div style={{ height: 1, background: "rgba(2,2,2,0.10)", marginTop: 18, marginLeft: 20, marginRight: 20 }} />


      {/* Inline search input */}
      {searchOpen && (
        <div style={{ padding: "16px 20px 0 20px" }}>
          <SearchBar
            variant="light"
            inputRef={searchInputRef}
            value={search}
            onChange={setSearch}
            placeholder="Search any local deals"
          />
        </div>
      )}

      {/* Category pills */}
      <div
        style={{
          marginTop: 18,
          paddingLeft: 20,
          paddingRight: 20,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
        className="scrollbar-hide"
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {categoryTabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: isActive ? COLOR.pillActiveBg : COLOR.pillInactiveBg,
                  border: `1px solid ${isActive ? COLOR.pillActiveBg : COLOR.pillBorder}`,
                  borderRadius: 999,
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  color: isActive ? COLOR.pillActiveFg : COLOR.ink,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card stack */}
      <div style={{ padding: "20px 20px 0 20px" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-full" style={{ height: 380, borderRadius: 18, background: "rgba(0,0,0,0.06)" }} />
            ))}
          </div>
        ) : filteredSpecials.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredSpecials.map((s) => (
              <SpecialCard key={s.id} special={s} onClick={() => navigate(`/specials/${s.id}`)} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 12,
                letterSpacing: "2.4px",
                textTransform: "uppercase",
                color: COLOR.mutedInk,
                margin: 0,
                marginBottom: 8,
              }}
            >
              No deals match
            </p>
            <p style={{ fontFamily: SANS, fontSize: 14, color: COLOR.ink, opacity: 0.7, margin: 0, maxWidth: 280, marginInline: "auto" }}>
              Try a different category. New deals are added all the time.
            </p>
          </div>
        )}
      </div>

      <RefineDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        onClear={() => setFilterType([])}
        resultsCount={filteredSpecials.length}
        resultsLabel="specials"
      >
        <RefineSection isFirst label="Category" summary={filterType.length > 0 ? `${filterType.length} selected` : undefined} open onToggle={() => {}}>
          {categoryTabs.filter((c) => c !== "All Specials").length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {categoryTabs.filter((c) => c !== "All Specials").map((t) => (
                <RefineChip key={t} label={t} active={filterType.includes(t)} onClick={() => toggleFilter(t)} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", margin: 0 }}>No categories available.</p>
          )}
        </RefineSection>
      </RefineDrawer>
    </div>
  );
};

const SpecialCard = ({ special, onClick }: { special: any; onClick: () => void }) => {
  const validText = (special.card_footer_text && String(special.card_footer_text).trim()) || formatValidTill(special);
  return (
    <article
      onClick={onClick}
      style={{
        background: COLOR.cardBg,
        borderRadius: 18,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#EEE8DA" }}>
        {special.image_url && (
          <img
            src={special.image_url}
            alt={special.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        {special.deal_label && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: COLOR.badge,
              color: COLOR.badgeFg,
              padding: "5px 10px",
              borderRadius: 999,
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {special.deal_label}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px 18px 18px" }}>
        {special.business_name && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: SANS,
              fontSize: 13,
              color: COLOR.mutedInk,
              marginBottom: 8,
            }}
          >
            <Store size={13} strokeWidth={1.6} color={COLOR.mutedInk} style={{ flexShrink: 0 }} />
            <span>{special.business_name}</span>
          </div>
        )}
        <h3
          {...noTitleCaseProps(special)}
          style={{
            fontFamily: SANS,
            fontSize: 19,
            fontWeight: 700,
            lineHeight: 1.25,
            color: COLOR.ink,
            margin: 0,
            marginBottom: 8,
            letterSpacing: "-0.2px",
          }}
        >
          {getDisplayTitle(special)}
        </h3>

        {/* Divider */}
        <div style={{ height: 1, background: COLOR.divider, margin: "16px 0 14px 0" }} />

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: SANS,
              fontSize: 13,
              color: COLOR.mutedInk,
              fontWeight: 500,
            }}
          >
            <Tag size={14} strokeWidth={2} />
            {validText}
          </div>
          {(special.price || special.original_price) ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              {special.original_price && (
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 14,
                    color: COLOR.priceStrike,
                    textDecoration: "line-through",
                    fontWeight: 500,
                  }}
                >
                  {special.original_price}
                </span>
              )}
              {special.price && (
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 20,
                    fontWeight: 800,
                    color: COLOR.ink,
                    letterSpacing: "-0.3px",
                  }}
                >
                  {special.price}
                </span>
              )}
            </div>
          ) : (special as any).savings ? (
            <span
              style={{
                fontFamily: SANS,
                fontSize: 18,
                fontWeight: 800,
                color: COLOR.ink,
                letterSpacing: "-0.3px",
              }}
            >
              {(special as any).savings}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default Specials;
