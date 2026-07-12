import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal, X, Store, Clock, Tag, ArrowLeft } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import PageHeader from "@/components/PageHeader";
import { RefineDrawer, RefineSection, RefineChip, RefineOption, RefineRectOption } from "@/components/RefineDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import Seo from "@/components/Seo";


const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLOR = {
  pageBg: "#E6E0CC",
  cardBg: "#FFFFFF",
  ink: "#1A1A1A",
  mutedInk: "#6B6A5E",
  divider: "#EAE4D5",
  pillBorder: "#E2DAC6",
  pillInactiveBg: "#FFFFFF",
  pillActiveBg: "#423324",
  pillActiveFg: "#FFFFFF",
  badge: "#C0392B",
  badgeFg: "#FFFFFF",
  priceStrike: "#9C9387",
};

type SortKey = "default" | "alphabetical" | "alphabetical_desc" | "ending_soon" | "biggest_saving" | "newest";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "alphabetical", label: "Alphabetically (A-Z)" },
  { key: "alphabetical_desc", label: "Alphabetically (Z-A)" },
  { key: "ending_soon", label: "Ending Soon" },
  { key: "biggest_saving", label: "Biggest Savings" },
  { key: "newest", label: "Newest (Added)" },
];

// Extract the first numeric value from a price/savings string (e.g. "Save R200" -> 200)
const parseNum = (v: any): number | null => {
  if (v == null) return null;
  const m = String(v).replace(/[, ]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};

// Best-effort saving amount: explicit savings, else original − discounted price
const savingValue = (s: any): number => {
  const sv = parseNum(s.savings);
  if (sv != null) return sv;
  const orig = parseNum(s.original_price);
  const price = parseNum(s.price);
  if (orig != null && price != null) return orig - price;
  return -Infinity;
};

const formatValidTill = (s: any): string => {
  const from = s.valid_from ? new Date(s.valid_from) : null;
  const until = s.valid_until ? new Date(s.valid_until) : null;
  if (from && until) {
    const sameDay =
      from.getFullYear() === until.getFullYear() &&
      from.getMonth() === until.getMonth() &&
      from.getDate() === until.getDate();
    if (sameDay) return `Valid for ${format(until, "d MMMM yyyy")}`;
  }
  if (until) return `Valid until ${format(until, "d MMMM yyyy")}`;
  return "Ongoing";
};

const Specials = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSearch = !!(location.state as { fromSearch?: boolean } | null)?.fromSearch;
  const persisted = (location.state as { filters?: any } | null)?.filters ?? null;
  const [search, setSearch] = useState<string>(persisted?.search ?? "");
  const [searchOpen, setSearchOpen] = useState<boolean>(!!persisted?.search);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string[]>(persisted?.filterType ?? []);
  const [sortBy, setSortBy] = useState<SortKey>(persisted?.sortBy ?? "default");
  const [openSection, setOpenSection] = useState<"sort" | "category" | null>("sort");
  const [activeTab, setActiveTab] = useState<string>(persisted?.activeTab ?? "All Specials");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        ...(location.state as object | null),
        filters: { search, filterType, sortBy, activeTab },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterType, sortBy, activeTab]);


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

  // Counts per category tag, respecting search but not active category/filterType
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    if (!specials) return map;
    const q = search.trim().toLowerCase();
    for (const s of specials as any[]) {
      if (q) {
        const hit =
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.business_name && s.business_name.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q));
        if (!hit) continue;
      }
      const t = (s.tag || "").toString().trim();
      if (t) map.set(t, (map.get(t) || 0) + 1);
    }
    return map;
  }, [specials, search]);


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

    // Sort
    if (sortBy === "alphabetical") {
      result.sort((a: any, b: any) =>
        getDisplayTitle(a).localeCompare(getDisplayTitle(b), undefined, { sensitivity: "base" })
      );
    } else if (sortBy === "alphabetical_desc") {
      result.sort((a: any, b: any) =>
        getDisplayTitle(b).localeCompare(getDisplayTitle(a), undefined, { sensitivity: "base" })
      );
    } else if (sortBy === "ending_soon") {
      // Soonest expiry first; ongoing specials (no end date) sort to the bottom
      result.sort((a: any, b: any) => {
        const ta = a.valid_until ? new Date(a.valid_until).getTime() : Infinity;
        const tb = b.valid_until ? new Date(b.valid_until).getTime() : Infinity;
        return ta - tb;
      });
    } else if (sortBy === "biggest_saving") {
      result.sort((a: any, b: any) => savingValue(b) - savingValue(a));
    } else if (sortBy === "newest") {
      // Most recently added first
      result.sort((a: any, b: any) => {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        return tb - ta;
      });
    }
    // "default" keeps the query order (created_at desc)

    return result;
  }, [specials, activeTab, filterType, search, sortBy]);


  const toggleFilter = (val: string) => {
    setFilterType((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingBottom: 120,
        background: COLOR.pageBg,
        fontFamily: SANS,
        color: COLOR.ink,
      }}
    >
      <Seo
        title="Specials & Deals in Hoedspruit"
        description="Save with the latest specials, promotions and discounts from restaurants, lodges, shops and services around Hoedspruit."
        path="/specials"
      />
      {/* Header — centered title, icons inline on right */}
      <PageHeader
        title="Specials"
        left={
          fromSearch ? (
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
                color: "#1A1A1A",
              }}
            >
              <ArrowLeft size={18} strokeWidth={1.8} />
            </button>
          ) : null
        }
        right={
          <>
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
                color: "#1A1A1A",
              }}
            >
              {searchOpen ? <X size={18} strokeWidth={1.8} /> : <Search size={18} strokeWidth={1.8} />}
            </button>
            <button
              aria-label="FILTER & SORT"
              onClick={() => setShowFilters(true)}
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
                color: "#1A1A1A",
                position: "relative",
              }}
            >
              <SlidersHorizontal size={18} strokeWidth={1.8} />
              {(() => {
                const activeRefineCount =
                  (activeTab !== "All Specials" || filterType.length > 0 ? 1 : 0) +
                  (sortBy !== "default" ? 1 : 0);
                return activeRefineCount > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -3,
                      right: -3,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 999,
                      background: COLOR.badge,
                      color: COLOR.badgeFg,
                      fontFamily: SANS,
                      fontSize: 9,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 3px",
                    }}
                  >
                    {activeRefineCount}
                  </span>
                ) : null;
              })()}
            </button>
          </>
        }
      />


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
        onClear={() => {
          setFilterType([]);
          setActiveTab("All Specials");
          setSortBy("default");
          setSearch("");
          setOpenSection(null);
        }}
        resultsCount={filteredSpecials.length}
        resultsLabel="specials"
      >
        <RefineSection
          isFirst
          label="Sort By"
          summary={SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
          open={openSection === "sort"}
          onToggle={() => setOpenSection(openSection === "sort" ? null : "sort")}
        >
          {SORT_OPTIONS.map((o) => (
            <RefineOption
              key={o.key}
              label={o.label}
              active={sortBy === o.key}
              onClick={() => setSortBy(o.key)}
            />
          ))}
        </RefineSection>

        <RefineSection
          label="Category"
          summary={
            activeTab !== "All Specials"
              ? activeTab
              : filterType.length > 0
              ? `${filterType.length} selected`
              : undefined
          }
          open={openSection === "category"}
          onToggle={() => setOpenSection(openSection === "category" ? null : "category")}
        >
          {(() => {
            const visible = categoryTabs
              .filter((c) => c !== "All Specials")
              .filter((c) => (categoryCounts.get(c) || 0) > 0);
            const total = Array.from(categoryCounts.values()).reduce((a, b) => a + b, 0);
            if (visible.length === 0) {
              return <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", margin: 0 }}>No categories available.</p>;
            }
            return (
              <div>
                <RefineRectOption
                  label={`All (${total})`}
                  active={activeTab === "All Specials" && filterType.length === 0}
                  onClick={() => {
                    setActiveTab("All Specials");
                    setFilterType([]);
                  }}
                />
                {visible.map((t) => (
                  <RefineRectOption
                    key={t}
                    label={`${t} (${categoryCounts.get(t)})`}
                    active={activeTab === t || filterType.includes(t)}
                    onClick={() => {
                      setActiveTab(t);
                      setFilterType([]);
                    }}
                  />
                ))}
              </div>
            );
          })()}

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
      <div style={{ padding: "14px 18px 18px 18px" }}>
        <h3
          {...noTitleCaseProps(special)}
          style={{
            fontFamily: SANS,
            fontSize: 19,
            fontWeight: 700,
            lineHeight: 1.25,
            color: COLOR.ink,
            margin: 0,
            marginBottom: 4,
            letterSpacing: "-0.2px",
          }}
        >
          {getDisplayTitle(special)}
        </h3>
        {special.business_name && (
          <div
            style={{
              fontFamily: SANS,
              fontSize: 13,
              color: COLOR.mutedInk,
              marginTop: 2,
            }}
          >
            {special.business_name}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: COLOR.divider, margin: "8px 0 14px 0" }} />

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
              flex: 1,
              minWidth: 0,
            }}
          >
            <Clock size={13} strokeWidth={1.6} color={COLOR.mutedInk} style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{validText}</span>
          </div>
          {(special.price || (special as any).savings || special.original_price) ? (
            <span
              style={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                border: "1.5px solid #BFE5C8",
                color: "#2E7D4F",
                background: "#F1FAF3",
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "6px 14px",
                borderRadius: 9999,
              }}
            >
              {special.price || (special as any).savings || special.original_price}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default Specials;
