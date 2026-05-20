import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal, X, Store, Clock } from "lucide-react";
import { RefineDrawer, RefineSection, RefineChip } from "@/components/RefineDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLOR = {
  pageBg: "#ECE3CF",
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
  if (s.day_of_week && s.day_of_week.length > 0) return s.day_of_week.join(", ");
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
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const categoryTabs = useMemo(() => {
    if (!specials) return ["All Specials"];
    const set = new Set<string>();
    for (const s of specials as any[]) {
      if (s.category && typeof s.category === "string") set.add(s.category.trim());
      if (Array.isArray(s.eyebrow_categories)) {
        for (const c of s.eyebrow_categories) if (c && typeof c === "string") set.add(c.trim());
      }
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
      result = result.filter((s: any) => {
        const cats: string[] = [];
        if (s.category) cats.push(String(s.category));
        if (Array.isArray(s.eyebrow_categories)) cats.push(...s.eyebrow_categories.map((c: any) => String(c)));
        return cats.map((c) => c.toLowerCase()).includes(t);
      });
    }
    if (filterType.length > 0) {
      const lc = filterType.map((t) => t.toLowerCase());
      result = result.filter((s: any) => {
        const cats: string[] = [];
        if (s.category) cats.push(String(s.category));
        if (Array.isArray(s.eyebrow_categories)) cats.push(...s.eyebrow_categories.map((c: any) => String(c)));
        const lcCats = cats.map((c) => c.toLowerCase());
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
        <div />
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
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: COLOR.cardBg,
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: COLOR.ink,
            }}
          >
            {searchOpen ? <X size={22} strokeWidth={2} /> : <Search size={22} strokeWidth={2} />}
          </button>
          <button
            aria-label="Filters"
            onClick={() => setShowFilters(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: filterType.length > 0 ? COLOR.ink : COLOR.cardBg,
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: filterType.length > 0 ? COLOR.cardBg : COLOR.ink,
            }}
          >
            <SlidersHorizontal size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Divider under title */}
      <div style={{ height: 1, background: "rgba(2,2,2,0.10)", marginTop: 18, marginLeft: 20, marginRight: 20 }} />


      {/* Inline search input */}
      {searchOpen && (
        <div style={{ padding: "16px 20px 0 20px" }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search any local deals"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 999,
              border: `1px solid ${COLOR.pillBorder}`,
              padding: "0 18px",
              fontFamily: SANS,
              fontSize: 14,
              color: COLOR.ink,
              background: COLOR.cardBg,
              outline: "none",
            }}
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
                  padding: "10px 18px",
                  cursor: "pointer",
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
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
  const validText = formatValidTill(special);
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
              top: 14,
              left: 14,
              background: COLOR.badge,
              color: COLOR.badgeFg,
              padding: "7px 14px",
              borderRadius: 999,
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
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
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: COLOR.mutedInk,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            <Store size={13} strokeWidth={2} />
            {special.business_name}
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
        {special.description && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: 14,
              lineHeight: 1.45,
              color: COLOR.mutedInk,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {special.description}
          </p>
        )}

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
            <Clock size={14} strokeWidth={2} />
            {validText}
          </div>
          {(special.price || special.original_price) && (
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
          )}
        </div>
      </div>
    </article>
  );
};

export default Specials;
