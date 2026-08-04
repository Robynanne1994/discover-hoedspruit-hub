import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal, X, Clock, ArrowLeft, MapPin, Tag, UtensilsCrossed, Bed, ShoppingBag, Wrench, Percent, Star } from "lucide-react";
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
  badgeAlt: "#4F4A38",
  badgeFg: "#FFFFFF",
  price: "#B4522E",
  pricePill: "#6B7C5C",
  urgent: "#C0392B",
  priceStrike: "#9C9387",
};

// Horizontal gap between featured slides, and how much of the next slide peeks in.
const SLIDE_GAP = 12;
const SLIDE_PEEK = 22;
const PAGE_PAD = 20;

// Deals ending within this many days are "ending soon" (and get the urgent treatment).
const ENDING_SOON_DAYS = 7;

const ENDING_SOON_TAB = "__ending_soon__";
const ALL_TAB = "All Specials";

type SortKey = "default" | "alphabetical" | "alphabetical_desc" | "ending_soon" | "biggest_saving" | "newest";

const tabIcon = (tab: string) => {
  const t = tab.toLowerCase();
  if (t.includes("restaurant") || t.includes("food") || t.includes("café") || t.includes("cafe")) return <UtensilsCrossed size={13} strokeWidth={1.8} />;
  if (t.includes("accommodation") || t.includes("stay") || t.includes("lodge") || t.includes("hotel")) return <Bed size={13} strokeWidth={1.8} />;
  if (t.includes("activity") || t.includes("adventure") || t.includes("tour") || t.includes("experience")) return <MapPin size={13} strokeWidth={1.8} />;
  if (t.includes("shop") || t.includes("retail") || t.includes("shopping")) return <ShoppingBag size={13} strokeWidth={1.8} />;
  if (t.includes("service") || t.includes("trade") || t.includes("business")) return <Wrench size={13} strokeWidth={1.8} />;
  if (tab === ALL_TAB) return <Percent size={13} strokeWidth={1.8} />;
  return <Tag size={13} strokeWidth={1.8} />;
};

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

// Whole days between today and the deal's last valid day. Null = ongoing.
const daysRemaining = (s: any): number | null => {
  if (!s.valid_until) return null;
  const end = new Date(s.valid_until);
  if (isNaN(end.getTime())) return null;
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

const isEndingSoon = (s: any): boolean => {
  const d = daysRemaining(s);
  return d != null && d >= 0 && d <= ENDING_SOON_DAYS;
};

// Short countdown shown on the card footer — "3 days left", "Ongoing", "Ends 12 Aug".
const countdownLabel = (s: any): string => {
  const d = daysRemaining(s);
  if (d == null) return "Ongoing";
  if (d < 0) return "Ended";
  if (d === 0) return "Last day";
  if (d === 1) return "1 day left";
  if (d <= ENDING_SOON_DAYS) return `${d} days left`;
  return `Ends ${format(new Date(s.valid_until), "d MMM")}`;
};

interface ValidityLines {
  primary: string;
  secondary: string;
}

const formatValidTill = (s: any): ValidityLines => {
  const from = s.valid_from ? new Date(s.valid_from) : null;
  const until = s.valid_until ? new Date(s.valid_until) : null;
  if (from && until) {
    const sameDay =
      from.getFullYear() === until.getFullYear() &&
      from.getMonth() === until.getMonth() &&
      from.getDate() === until.getDate();
    if (sameDay) return { primary: "Valid for", secondary: format(until, "d MMMM yyyy") };
  }
  if (until) return { primary: "Valid until", secondary: format(until, "d MMMM yyyy") };
  return { primary: "Ongoing", secondary: "No expiry" };
};

// One-line schedule for the featured card footer — the business's own wording wins.
const scheduleLine = (s: any): string => {
  const own = (s.card_footer_text || "").toString().trim();
  if (own) return own;
  const { primary, secondary } = formatValidTill(s);
  return primary === "Ongoing" ? "Ongoing" : `${primary} ${secondary}`;
};

// Percentage/discount style labels read louder in red; loyalty and package deals sit back in olive.
const DISCOUNT_LABEL = /(%|\boff\b|\bsave\b|\bsavings?\b|\bhalf\b|\d\s*for\s*\d|\bbuy\s*\d|\bbogof\b)/i;
const badgeColor = (label?: string | null) => (DISCOUNT_LABEL.test((label || "").toString()) ? COLOR.badge : COLOR.badgeAlt);

const formatKm = (raw: any): string | null => {
  if (raw == null || String(raw).trim() === "") return null;
  const n = parseFloat(String(raw).replace(",", ".").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return null;
  return `${Math.round(n * 10) / 10}km`;
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
  const [activeTab, setActiveTab] = useState<string>(persisted?.activeTab ?? ALL_TAB);
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

  // Distance from town comes off the linked listing, not the special itself.
  const businessIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of (specials as any[]) || []) if (s.business_id) ids.add(s.business_id);
    return Array.from(ids).sort();
  }, [specials]);

  const { data: kmByBusiness } = useQuery({
    queryKey: ["specials-listing-km", businessIds],
    enabled: businessIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("id, km_from_town").in("id", businessIds);
      const map: Record<string, string> = {};
      for (const l of (data as any[]) || []) {
        const km = formatKm(l.km_from_town);
        if (km) map[l.id] = km;
      }
      return map;
    },
  });

  const kmFor = useCallback(
    (s: any): string | null => (s.business_id ? kmByBusiness?.[s.business_id] ?? null : null),
    [kmByBusiness]
  );

  const collectTags = (s: any): string[] => {
    const tags: string[] = [];
    if (s.tag) tags.push(String(s.tag));
    if (s.sub_tag_1) tags.push(String(s.sub_tag_1));
    if (s.sub_tag_2) tags.push(String(s.sub_tag_2));
    return tags.map((t) => t.trim()).filter(Boolean);
  };

  const categoryTabs = useMemo(() => {
    if (!specials) return [ALL_TAB];
    const set = new Set<string>();
    for (const s of specials as any[]) {
      // Only main tag drives the top-level pills (sub-tags are filters within)
      if (s.tag && typeof s.tag === "string") set.add(s.tag.trim());
    }
    return [ALL_TAB, ...Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b))];
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

  // Totals for the "All" and "Ending Soon" pills — search-aware, category-agnostic.
  const { totalCount, endingSoonCount } = useMemo(() => {
    if (!specials) return { totalCount: 0, endingSoonCount: 0 };
    const q = search.trim().toLowerCase();
    let total = 0;
    let soon = 0;
    for (const s of specials as any[]) {
      if (q) {
        const hit =
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.business_name && s.business_name.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q));
        if (!hit) continue;
      }
      total += 1;
      if (isEndingSoon(s)) soon += 1;
    }
    return { totalCount: total, endingSoonCount: soon };
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
    if (activeTab === ENDING_SOON_TAB) {
      result = result.filter((s: any) => isEndingSoon(s));
    } else if (activeTab !== ALL_TAB) {
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

  // Featured deals headline the page; everything else falls into the grid below.
  const featured = useMemo(() => filteredSpecials.filter((s: any) => s.is_featured), [filteredSpecials]);
  const rest = useMemo(() => filteredSpecials.filter((s: any) => !s.is_featured), [filteredSpecials]);


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
                background:
                  activeTab !== ALL_TAB || filterType.length > 0 || sortBy !== "default"
                    ? "#423324"
                    : "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color:
                  activeTab !== ALL_TAB || filterType.length > 0 || sortBy !== "default"
                    ? "#FFFFFF"
                    : "#1A1A1A",
              }}
            >
              <SlidersHorizontal size={18} strokeWidth={1.8} />
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
          marginTop: 16,
          paddingLeft: PAGE_PAD,
          paddingRight: PAGE_PAD,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
        className="scrollbar-hide"
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <FilterPill
            label={`All (${totalCount})`}
            active={activeTab === ALL_TAB}
            onClick={() => setActiveTab(ALL_TAB)}
          />
          {endingSoonCount > 0 && (
            <FilterPill
              label={`Ending Soon (${endingSoonCount})`}
              icon={<Clock size={12} strokeWidth={2} />}
              accent
              active={activeTab === ENDING_SOON_TAB}
              onClick={() =>
                setActiveTab(activeTab === ENDING_SOON_TAB ? ALL_TAB : ENDING_SOON_TAB)
              }
            />
          )}
          {categoryTabs
            .filter((tab) => tab !== ALL_TAB)
            .map((tab) => (
              <FilterPill
                key={tab}
                label={`${tab} (${categoryCounts.get(tab) || 0})`}
                icon={tabIcon(tab)}
                active={activeTab === tab}
                onClick={() => setActiveTab(activeTab === tab ? ALL_TAB : tab)}
              />
            ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 20px 0 20px" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Skeleton className="w-full" style={{ height: 280, borderRadius: 18, background: "rgba(0,0,0,0.06)" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-full" style={{ height: 250, borderRadius: 14, background: "rgba(0,0,0,0.06)" }} />
              ))}
            </div>
          </div>
        ) : filteredSpecials.length > 0 ? (
          <>
            {featured.length > 0 && (
              <FeaturedSection
                items={featured}
                kmFor={kmFor}
                onSelect={(s) => navigate(`/specials/${s.id}`)}
              />
            )}

            {rest.length > 0 && (
              <>
                <SectionHead
                  label={featured.length > 0 ? "Everything else" : "All deals"}
                  right={`${rest.length} ${rest.length === 1 ? "Deal" : "Deals"}`}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {rest.map((s: any) => (
                    <DealCard key={s.id} special={s} km={kmFor(s)} onClick={() => navigate(`/specials/${s.id}`)} />
                  ))}
                </div>
              </>
            )}
          </>
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
          setActiveTab(ALL_TAB);
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
            activeTab === ENDING_SOON_TAB
              ? "Ending Soon"
              : activeTab !== ALL_TAB
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
              .filter((c) => c !== ALL_TAB)
              .filter((c) => (categoryCounts.get(c) || 0) > 0);
            const total = Array.from(categoryCounts.values()).reduce((a, b) => a + b, 0);
            if (visible.length === 0) {
              return <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", margin: 0 }}>No categories available.</p>;
            }
            return (
              <div>
                <RefineRectOption
                  label={`All (${total})`}
                  active={activeTab === ALL_TAB && filterType.length === 0}
                  onClick={() => {
                    setActiveTab(ALL_TAB);
                    setFilterType([]);
                  }}
                />
                {endingSoonCount > 0 && (
                  <RefineRectOption
                    label={`Ending Soon (${endingSoonCount})`}
                    active={activeTab === ENDING_SOON_TAB}
                    onClick={() => {
                      setActiveTab(ENDING_SOON_TAB);
                      setFilterType([]);
                    }}
                  />
                )}
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

/* ------------------------------------------------------------------ */
/* Pills + section heads                                               */
/* ------------------------------------------------------------------ */

const FilterPill = ({
  label,
  icon,
  active,
  accent,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  accent?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      background: active ? COLOR.pillActiveBg : COLOR.pillInactiveBg,
      border: `1px solid ${active ? COLOR.pillActiveBg : accent ? "rgba(192,57,43,0.28)" : "rgba(26,26,26,0.08)"}`,
      borderRadius: 999,
      padding: "7px 14px",
      cursor: "pointer",
      fontFamily: SANS,
      fontSize: 12.5,
      fontWeight: active ? 700 : 500,
      letterSpacing: "0.01em",
      lineHeight: 1,
      color: active ? COLOR.pillActiveFg : accent ? COLOR.urgent : COLOR.ink,
      whiteSpace: "nowrap",
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
    }}
  >
    {icon}
    {label}
  </button>
);

const SectionHead = ({
  label,
  icon,
  right,
}: {
  label: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 10,
    }}
  >
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
      {icon}
      <span
        style={{
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "1.6px",
          textTransform: "uppercase",
          color: COLOR.mutedInk,
        }}
      >
        {label}
      </span>
    </span>
    {right ? (
      <span style={{ fontFamily: SANS, fontSize: 11.5, color: COLOR.mutedInk, flexShrink: 0 }}>{right}</span>
    ) : null}
  </div>
);

/* ------------------------------------------------------------------ */
/* Featured — single hero card, or a swipeable carousel when there's    */
/* more than one featured deal.                                        */
/* ------------------------------------------------------------------ */

const FeaturedSection = ({
  items,
  kmFor,
  onSelect,
}: {
  items: any[];
  kmFor: (s: any) => string | null;
  onSelect: (s: any) => void;
}) => {
  const isCarousel = items.length > 1;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slideKeys = items.map((s) => s.id).join("|");

  // Snap position -> active dot. Read the real slide width so the maths holds
  // on any screen size.
  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.firstElementChild as HTMLElement | null;
    if (!slide) return;
    const step = slide.offsetWidth + SLIDE_GAP;
    const next = Math.round(el.scrollLeft / step);
    setIndex(Math.max(0, Math.min(items.length - 1, next)));
  };

  const scrollTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.firstElementChild as HTMLElement | null;
    if (!slide) return;
    el.scrollTo({ left: i * (slide.offsetWidth + SLIDE_GAP), behavior: "smooth" });
  };

  // Reset to the first slide whenever the featured set changes (filters, search).
  useEffect(() => {
    setIndex(0);
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [slideKeys]);

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionHead
        icon={<Star size={13} strokeWidth={1.8} color={COLOR.mutedInk} />}
        label={isCarousel ? "Top deals this week" : "Deal of the week"}
        right={isCarousel ? `${index + 1} / ${items.length}` : undefined}
      />

      {isCarousel ? (
        <>
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="scrollbar-hide"
            style={{
              display: "flex",
              gap: SLIDE_GAP,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              scrollPaddingLeft: PAGE_PAD,
              scrollbarWidth: "none",
              // Full-bleed so the next card peeks past the page gutter.
              marginLeft: -PAGE_PAD,
              marginRight: -PAGE_PAD,
              paddingLeft: PAGE_PAD,
              paddingRight: PAGE_PAD,
            }}
          >
            {items.map((s) => (
              <div
                key={s.id}
                style={{
                  flex: `0 0 calc(100% - ${SLIDE_GAP + SLIDE_PEEK}px)`,
                  scrollSnapAlign: "start",
                }}
              >
                <FeaturedCard special={s} km={kmFor(s)} onClick={() => onSelect(s)} />
              </div>
            ))}
          </div>

          {/* Dots — the second, unmissable cue that this thing swipes */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12 }}>
            {items.map((s, i) => (
              <button
                key={s.id}
                aria-label={`Go to featured deal ${i + 1}`}
                onClick={() => scrollTo(i)}
                style={{
                  width: i === index ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  background: i === index ? COLOR.pillActiveBg : "rgba(26,26,26,0.18)",
                  transition: "width 180ms ease-out, background 180ms ease-out",
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <FeaturedCard special={items[0]} km={kmFor(items[0])} onClick={() => onSelect(items[0])} />
      )}
    </section>
  );
};

const FeaturedCard = ({ special, km, onClick }: { special: any; km: string | null; onClick: () => void }) => {
  const priceValue = special.price || special.savings || special.original_price;
  const image = special.image_url || special.detail_image_url || special.homepage_image_url;
  const meta = special.business_name || "";

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
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Image with the headline sitting on the gradient */}
      {/* minHeight:0 keeps the flex item from growing past the aspect ratio */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "5 / 3", minHeight: 0, flexShrink: 0, background: "#EEE8DA" }}>
        {image && (
          <img
            src={image}
            alt={special.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.42) 38%, rgba(0,0,0,0.06) 68%, rgba(0,0,0,0) 100%)",
          }}
        />
        {special.deal_label && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: badgeColor(special.deal_label),
              color: COLOR.badgeFg,
              padding: "6px 12px",
              borderRadius: 999,
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {special.deal_label}
          </div>
        )}
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
          <h3
            {...noTitleCaseProps(special)}
            style={{
              fontFamily: SANS,
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.3px",
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            {getDisplayTitle(special)}
          </h3>
          {meta && (
            <div
              style={{
                fontFamily: SANS,
                fontSize: 12.5,
                color: "rgba(255,255,255,0.80)",
                marginTop: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {meta}
            </div>
          )}
        </div>
      </div>

      {/* Footer strip — schedule left, price right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Clock size={14} strokeWidth={1.7} color={COLOR.mutedInk} style={{ flexShrink: 0 }} />
          <span
            style={{
              fontFamily: SANS,
              fontSize: 13,
              color: COLOR.ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {scheduleLine(special)}
          </span>
        </div>
        {priceValue ? (
          <span
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 30,
              padding: "0 14px",
              borderRadius: 999,
              background: COLOR.pricePill,
              color: "#FFFFFF",
              fontFamily: SANS,
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {priceValue}
          </span>
        ) : null}
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Grid card                                                           */
/* ------------------------------------------------------------------ */

const DealCard = ({ special, km, onClick }: { special: any; km: string | null; onClick: () => void }) => {
  const priceValue = special.price || special.savings || special.original_price;
  const image = special.image_url || special.detail_image_url || special.homepage_image_url;
  const meta = special.business_name || "";
  const countdown = countdownLabel(special);
  const urgent = isEndingSoon(special);

  return (
    <article
      onClick={onClick}
      style={{
        background: COLOR.cardBg,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", minHeight: 0, flexShrink: 0, background: "#EEE8DA" }}>
        {image && (
          <img
            src={image}
            alt={special.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        {special.deal_label && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              maxWidth: "calc(100% - 16px)",
              background: badgeColor(special.deal_label),
              color: COLOR.badgeFg,
              padding: "4px 9px",
              borderRadius: 999,
              fontFamily: SANS,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {special.deal_label}
          </div>
        )}
      </div>

      <div style={{ padding: "10px 11px 12px 11px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3
          {...noTitleCaseProps(special)}
          className="line-clamp-2"
          style={{
            fontFamily: SANS,
            fontSize: 14.5,
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: "-0.15px",
            color: COLOR.ink,
            margin: 0,
          }}
        >
          {getDisplayTitle(special)}
        </h3>
        {meta && (
          <div
            style={{
              fontFamily: SANS,
              fontSize: 11.5,
              color: COLOR.mutedInk,
              marginTop: 3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {meta}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
            marginTop: "auto",
            paddingTop: 10,
          }}
        >
          {priceValue ? (
            <span
              style={{
                fontFamily: SANS,
                fontSize: 12.5,
                fontWeight: 700,
                color: COLOR.price,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
              }}
            >
              {priceValue}
            </span>
          ) : (
            <span />
          )}
          <span
            style={{
              fontFamily: SANS,
              fontSize: 11.5,
              fontWeight: urgent ? 700 : 400,
              color: urgent ? COLOR.urgent : COLOR.mutedInk,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {countdown}
          </span>
        </div>
      </div>
    </article>
  );
};

export default Specials;
