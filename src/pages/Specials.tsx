import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal, X, Clock, ArrowLeft, MapPin, Store, Tag, UtensilsCrossed, Bed, ShoppingBag, Wrench, Percent, Star } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import PageHeader from "@/components/PageHeader";
import { RefineDrawer, RefineSection, RefineChip, RefineOption, RefineRectOption } from "@/components/RefineDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import Seo from "@/components/Seo";
import SpecialValueBar from "@/components/specials/SpecialValueBar";
import SpecialBadgePill from "@/components/specials/SpecialBadgePill";
import { SPECIAL_CARD_CHROME } from "@/lib/cardChrome";
import { SPECIALS_CARD_GRID } from "@/lib/appLayout";
import { isEndingSoon, savingValue } from "@/lib/specialValue";
import { specialImage } from "@/lib/specialCard";
import { MUTED, tab as tabStyle, type } from "@/lib/type";


const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLOR = {
  pageBg: "#E6E0CC",
  cardBg: "#FFFFFF",
  ink: "#1A1A1A",
  mutedInk: MUTED,
  divider: "#EAE4D5",
  pillBorder: "#E2DAC6",
  pillInactiveBg: "#FFFFFF",
  pillActiveBg: "#423324",
  pillActiveFg: "#FFFFFF",
  urgent: "#C0392B",
};

// Horizontal gap between featured slides, and how much of the next slide peeks in.
const SLIDE_GAP = 12;
const SLIDE_PEEK = 22;
const PAGE_PAD = SPECIALS_CARD_GRID.pageInset;

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
              <FeaturedSection items={featured} onSelect={(s) => navigate(`/specials/${s.id}`)} />
            )}

            {rest.length > 0 && (
              <>
                <SectionHead
                  label={featured.length > 0 ? "Everything else" : "All deals"}
                  right={`${rest.length} ${rest.length === 1 ? "Deal" : "Deals"}`}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {rest.map((s: any) => (
                    <DealCard key={s.id} special={s} onClick={() => navigate(`/specials/${s.id}`)} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p
              style={{
                ...type.eyebrow,
                textTransform: "uppercase",
                color: COLOR.mutedInk,
                margin: 0,
                marginBottom: 8,
              }}
            >
              No deals match
            </p>
            <p style={{ ...type.body, margin: 0, maxWidth: 280, marginInline: "auto" }}>
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
              return <p style={{ ...type.meta, margin: 0 }}>No categories available.</p>;
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
      ...tabStyle(active),
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
          ...type.label,
          textTransform: "uppercase",
          color: COLOR.pillActiveBg,
        }}
      >
        {label}
      </span>
    </span>
    {right ? (
      <span style={{ ...type.meta, flexShrink: 0 }}>{right}</span>
    ) : null}
  </div>
);

/* ------------------------------------------------------------------ */
/* Featured — single hero card, or a swipeable carousel when there's    */
/* more than one featured deal.                                        */
/* ------------------------------------------------------------------ */

const FeaturedSection = ({
  items,
  onSelect,
}: {
  items: any[];
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
        icon={<Star size={13} strokeWidth={1.8} color={COLOR.pillActiveBg} />}
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
                  // display:flex lets the card stretch to the tallest slide, so
                  // every featured card in the rail is the same height.
                  display: "flex",
                }}
              >
                <FeaturedCard special={s} onClick={() => onSelect(s)} />
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
        <FeaturedCard special={items[0]} onClick={() => onSelect(items[0])} />
      )}
    </section>
  );
};

const FeaturedCard = ({ special, onClick }: { special: any; onClick: () => void }) => {
  const image = specialImage(special, "featured");
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
        // Fill the slide so a card sitting next to a taller neighbour matches it
        // instead of leaving a ragged edge along the rail.
        width: "100%",
        height: "100%",
      }}
    >
      {/* Image with the headline sitting on the gradient. The aspect ratio sets
          the natural height; flex:1 lets the image absorb any extra height when
          a neighbouring card's value bar runs taller. */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 2", flex: "0 0 auto", background: "#EEE8DA" }}>
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
        <SpecialBadgePill
          special={special}
          size="md"
          style={{ position: "absolute", top: 12, left: 12, maxWidth: "calc(100% - 24px)" }}
        />
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
          <h3
            {...noTitleCaseProps(special)}
            style={{
              fontFamily: SANS,
              ...type.sectionTitle,
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
                ...type.meta,
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

      {/* Value bar — money left, time right */}
      <SpecialValueBar special={special} detail="full" padding="12px 16px" />
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Grid card                                                           */
/* ------------------------------------------------------------------ */

// Title line-height 1.25 on a 15px face, so two lines of title reserve this much.
const DEAL_TITLE_LINES_2 = 38;

const DealCard = ({ special, onClick }: { special: any; onClick: () => void }) => {
  const image = specialImage(special, "list");
  const meta = special.business_name || "";
  const titleRef = useRef<HTMLSpanElement | null>(null);
  const metaRef = useRef<HTMLSpanElement | null>(null);
  const [titleLines, setTitleLines] = useState(1);
  const [metaLines, setMetaLines] = useState(1);

  // Measure what the title and the business name actually render on. A one-line
  // title lends its spare line to the business name; a two-line title keeps it.
  useEffect(() => {
    const els: Array<[HTMLElement | null, (n: number) => void]> = [
      [titleRef.current, setTitleLines],
      [metaRef.current, setMetaLines],
    ];
    const measure = () => {
      els.forEach(([el, set]) => {
        if (!el) return;
        const lh = parseFloat(getComputedStyle(el).lineHeight) || 1;
        set(Math.max(1, Math.round(el.scrollHeight / lh)));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    els.forEach(([el]) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [special.id, meta]);

  // Two lines of business name only get room by giving up the title's reserved
  // second line — so the card keeps its height. When both fit on one line the
  // reserved line stays, holding the business name at the bottom of the block.
  const metaClamp = titleLines > 1 ? 1 : 2;
  const shiftUp = titleLines === 1 && metaLines > 1;

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
        <SpecialBadgePill
          special={special}
          style={{
            position: "absolute",
            top: SPECIAL_CARD_CHROME.badge.top,
            left: SPECIAL_CARD_CHROME.badge.left,
            maxWidth: "calc(100% - 16px)",
          }}
        />
      </div>

      <div style={{ padding: "10px 11px 11px 11px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3
          {...noTitleCaseProps(special)}
          style={{
            fontFamily: SANS,
            ...type.cardTitleM,
            lineHeight: 1.25,
            letterSpacing: "-0.15px",
            color: COLOR.ink,
            margin: 0,
            minHeight: shiftUp ? undefined : DEAL_TITLE_LINES_2,
            overflowWrap: "break-word",
          }}
        >
          <span
            ref={titleRef}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {getDisplayTitle(special)}
          </span>
        </h3>
        {meta && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: SANS,
              ...type.meta,
              lineHeight: 1.3,
              color: COLOR.mutedInk,
              marginTop: 3,
              minWidth: 0,
            }}
          >
            <Store size={12} strokeWidth={1.8} color={COLOR.mutedInk} style={{ flexShrink: 0 }} />
            <span
              ref={metaRef}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: metaClamp,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                overflowWrap: metaClamp === 1 ? "normal" : "break-word",
                wordBreak: metaClamp === 1 ? "normal" : undefined,
              }}
            >
              {meta}
            </span>
          </div>
        )}
      </div>

      {/* Value bar — full-bleed so a column of cards reads as one column of offers */}
      <SpecialValueBar special={special} />
    </article>
  );
};

export default Specials;
