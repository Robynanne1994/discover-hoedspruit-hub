import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, ArrowLeft, Store, ChevronRight } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import PageHeader from "@/components/PageHeader";
import { RefineDrawer, RefineSection, RefineOption, RefineRectOption } from "@/components/RefineDrawer";
import { AppliedFilterBar } from "@/components/AppliedFilterBar";
import { Button } from "@/components/ui/button";
import { pillCategories, tagKey } from "@/lib/specialTags";
import { specialPillIcon } from "@/lib/specialPillIcons";
import { countSpecialFacets, specialMatchesFacets, type SpecialValidity } from "@/lib/specialFacets";
import { Skeleton } from "@/components/ui/skeleton";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import Seo from "@/components/Seo";
import SpecialValueBar from "@/components/specials/SpecialValueBar";
import SpecialBadgePill from "@/components/specials/SpecialBadgePill";
import SpecialCountdownTag from "@/components/specials/SpecialCountdownTag";
import { SPECIAL_CARD_CHROME } from "@/lib/cardChrome";
import { SPECIALS_CARD_GRID, SPECIALS_SLIDE_GAP, SPECIALS_SLIDE_PEEK } from "@/lib/appLayout";
import { dealCountLabel, savingValue } from "@/lib/specialValue";
import { specialImage } from "@/lib/specialCard";
import { FEATURED_PHOTO_FRACTION } from "@/lib/specialImageSlots";
import { isUpcomingSpecial, isVisibleSpecial, specialToday } from "@/lib/specialVisibility";
import { SPECIAL_BOOKING_OPTIONS, SPECIAL_TYPE_OPTIONS, specialMatchesBooking, specialMatchesType, type SpecialBookingFilter, type SpecialTypeFilter } from "@/lib/specialFilters";
import { allPillActive, pillToggle } from "@/lib/filterPill";
import { useFilterBarReset } from "@/hooks/useFilterBarReset";
import { compareSpecialDefault } from "@/lib/specialOrder";
import { specialMatchesKind } from "@/lib/specialKind";
import { MUTED, type } from "@/lib/type";


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
const SLIDE_GAP = SPECIALS_SLIDE_GAP;
const SLIDE_PEEK = SPECIALS_SLIDE_PEEK;
const PAGE_PAD = SPECIALS_CARD_GRID.pageInset;

const ENDING_SOON_TAB = "__ending_soon__";
const UPCOMING_TAB = "__upcoming__";
const ONGOING_TAB = "__ongoing__";
const ALL_TAB = "All Specials";

// The top pill row and the drawer's Validity section are one axis: picking a
// validity lights the matching top pill, and picking one there lights it here.
const VALIDITY_TABS = new Set([ENDING_SOON_TAB, UPCOMING_TAB, ONGOING_TAB]);
const VALIDITY_OPTIONS = [
  { key: ALL_TAB, label: "All" },
  { key: UPCOMING_TAB, label: "Upcoming" },
  { key: ENDING_SOON_TAB, label: "Ending Soon" },
  { key: ONGOING_TAB, label: "Ongoing" },
] as const;

type SortKey = "default" | "alphabetical" | "alphabetical_desc" | "ending_soon" | "biggest_saving" | "newest";


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
  const [openSection, setOpenSection] = useState<"sort" | "category" | "validity" | "booking" | "special-type" | "special-kind" | null>(null);
  const [bookingFilter, setBookingFilter] = useState<SpecialBookingFilter>(persisted?.bookingFilter ?? "any");
  const [specialTypeFilter, setSpecialTypeFilter] = useState<SpecialTypeFilter>(persisted?.specialTypeFilter ?? "any");
  const [kindFilter, setKindFilter] = useState<string>(persisted?.kindFilter ?? "");
  const [activeTab, setActiveTab] = useState<string>(persisted?.activeTab ?? ALL_TAB);
  const [validityFilter, setValidityFilter] = useState<SpecialValidity>(
    persisted?.validityFilter ?? (activeTab === UPCOMING_TAB ? "upcoming" : activeTab === ENDING_SOON_TAB ? "ending-soon" : activeTab === ONGOING_TAB ? "ongoing" : "all")
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        ...(location.state as object | null),
        filters: { search, filterType, sortBy, activeTab, bookingFilter, specialTypeFilter, kindFilter, validityFilter },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterType, sortBy, activeTab, bookingFilter, specialTypeFilter, kindFilter, validityFilter]);


  const { data: specials, isLoading } = useQuery({
    queryKey: ["all-specials"],
    queryFn: async () => {
      const today = specialToday();
      const { data } = await supabase
        .from("specials")
        .select("*")
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("created_at", { ascending: false });
      return (data || []).filter((s) => isVisibleSpecial(s, today));
    },
  });

  // Category and validity are independent drawer sections.
  const selectedCategories = activeTab !== ALL_TAB && !VALIDITY_TABS.has(activeTab)
    ? [activeTab, ...filterType] : filterType;
  const facetState = { search, categories: selectedCategories, validity: validityFilter, booking: bookingFilter, savings: specialTypeFilter, kind: kindFilter };
  const facets = useMemo(() => countSpecialFacets(specials ?? [], facetState),
    [specials, search, activeTab, filterType, validityFilter, bookingFilter, specialTypeFilter, kindFilter]);
  const drawerCategoryTabs = [ALL_TAB, ...facets.tags];
  const categoryCounts = facets.category;
  const topCategoryCount = (category: string) =>
    [...categoryCounts].find(([label]) => tagKey(label) === tagKey(category))?.[1] ?? 0;
  const topCategories = pillCategories(specials ?? []).filter((category) =>
    topCategoryCount(category) > 0 || selectedCategories.some((selected) => tagKey(selected) === tagKey(category))
  );
  const filterCounts = { booking: facets.booking, type: facets.savings };
  const kindCounts = facets.kinds;
  const validityCounts: Record<string, number> = {
    [ALL_TAB]: facets.validity.all,
    [UPCOMING_TAB]: facets.validity.upcoming,
    [ENDING_SOON_TAB]: facets.validity["ending-soon"],
    [ONGOING_TAB]: facets.validity.ongoing,
  };
  const validityTab = validityFilter === "upcoming" ? UPCOMING_TAB : validityFilter === "ending-soon" ? ENDING_SOON_TAB : validityFilter === "ongoing" ? ONGOING_TAB : ALL_TAB;
  const setValidityTab = (tab: string) => setValidityFilter(tab === UPCOMING_TAB ? "upcoming" : tab === ENDING_SOON_TAB ? "ending-soon" : tab === ONGOING_TAB ? "ongoing" : "all");
  const categorySpecials = useMemo(() => (specials ?? []).filter((s) => specialMatchesFacets(s, facetState)),
    [specials, search, activeTab, filterType, validityFilter, bookingFilter, specialTypeFilter, kindFilter]);

  const filteredSpecials = useMemo(() => {
    const result = categorySpecials.filter((s) =>
      specialMatchesBooking(s, bookingFilter) && specialMatchesType(s, specialTypeFilter) && specialMatchesKind(s as any, kindFilter)
    );

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
    if (sortBy === "default" && validityFilter === "upcoming") {
      result.sort((a, b) => (a.valid_from || "").localeCompare(b.valid_from || ""));
    } else if (sortBy === "default") {
      result.sort(compareSpecialDefault);
    }

    return result;

  }, [categorySpecials, bookingFilter, specialTypeFilter, kindFilter, validityFilter, sortBy]);

  // Featured deals headline the page; everything else falls into the grid below.
  const featured = useMemo(() => filteredSpecials.filter((s) => s.is_featured && !isUpcomingSpecial(s)), [filteredSpecials]);
  const rest = useMemo(() => filteredSpecials.filter((s) => !s.is_featured || isUpcomingSpecial(s)), [filteredSpecials]);


  // Active filters, one removable chip each; sort only reorders so never counts.
  const tabLabel = (tab: string) =>
    tab === ENDING_SOON_TAB ? "Ending Soon" : tab === UPCOMING_TAB ? "Upcoming" : tab === ONGOING_TAB ? "Ongoing" : tab;
  const appliedChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (activeTab !== ALL_TAB && !VALIDITY_TABS.has(activeTab)) appliedChips.push({ key: "tab", label: tabLabel(activeTab), onRemove: () => setActiveTab(ALL_TAB) });
  if (validityFilter !== "all") appliedChips.push({ key: "validity", label: tabLabel(validityTab), onRemove: () => setValidityFilter("all") });
  filterType.forEach((t) => appliedChips.push({ key: `cat-${t}`, label: t, onRemove: () => setFilterType((prev) => prev.filter((v) => v !== t)) }));
  if (bookingFilter !== "any")
    appliedChips.push({ key: "booking", label: SPECIAL_BOOKING_OPTIONS.find((o) => o.key === bookingFilter)?.label ?? String(bookingFilter), onRemove: () => setBookingFilter("any") });
  if (specialTypeFilter !== "any")
    appliedChips.push({ key: "type", label: SPECIAL_TYPE_OPTIONS.find((o) => o.key === specialTypeFilter)?.label ?? String(specialTypeFilter), onRemove: () => setSpecialTypeFilter("any") });
  if (kindFilter) appliedChips.push({ key: "kind", label: kindFilter, onRemove: () => setKindFilter("") });
  const activeFilterCount = appliedChips.length;
  const filtersOn = activeFilterCount > 0;
  // One filter names the results; more than one reads plain "Specials".
  const listHeading = !filtersOn
    ? featured.length > 0 ? "Everything Else" : "All Deals"
    : activeFilterCount === 1 && !search.trim()
      ? /(specials|deals)$/i.test(appliedChips[0].label) ? appliedChips[0].label : `${appliedChips[0].label} Specials`
      : "Specials";
  const listItems = filtersOn ? filteredSpecials : rest;

  const clearAllFilters = () => {
    setFilterType([]);
    setActiveTab(ALL_TAB);
    setValidityFilter("all");
    setSortBy("default");
    setBookingFilter("any");
    setSpecialTypeFilter("any");
    setKindFilter("");
    setOpenSection(null);
  };

  useFilterBarReset(filterBarRef, filtersOn || !!search.trim());

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingBottom: "var(--nav-clearance)",
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

      <AppliedFilterBar
        ref={filterBarRef}
        chips={appliedChips}
        clearAllMinimum={2}
        onOpen={() => { setOpenSection(null); setShowFilters(true); }}
        onClear={clearAllFilters}
      >
        {allPillActive(filtersOn, !!search.trim()) && <>
        <Button
          variant="ghost"
          className={allPillActive(filtersOn, !!search.trim()) ? "applied-filter-button event-timeframe-active" : "applied-filter-button"}
          aria-pressed={allPillActive(filtersOn, !!search.trim())}
          onClick={clearAllFilters}
        >All ({specials?.length ?? 0})</Button>
        {topCategories.map((category) => {
          const active = selectedCategories.some((selected) => tagKey(selected) === tagKey(category));
          return <Button
            key={category}
            variant="ghost"
            className={active ? "applied-filter-button event-timeframe-active" : "applied-filter-button"}
            aria-pressed={active}
            onClick={() => {
              setActiveTab(active ? ALL_TAB : category);
              setFilterType([]);
            }}
          >{specialPillIcon(category)}{category} ({topCategoryCount(category)})</Button>;
        })}
        </>}
      </AppliedFilterBar>

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
            {!filtersOn && featured.length > 0 && (
              <FeaturedSection items={featured} onSelect={(s) => navigate(`/specials/${s.id}`)} />
            )}

            {listItems.length > 0 && (
              <>
                <SectionHead
                  label={listHeading}
                  right={dealCountLabel(listItems.length)}
                  hairline={!filtersOn}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {listItems.map((s: any) => (
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
        onClear={clearAllFilters}
        resultsCount={filteredSpecials.length}
        resultsLabel="specials"
      >
        <RefineSection
          isFirst
          label="Sort By"
          onClear={sortBy !== "default" ? () => setSortBy("default") : undefined}
          summary={SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
          open={openSection === "sort"}
          onToggle={() => setOpenSection(openSection === "sort" ? null : "sort")}
        >
          {SORT_OPTIONS.map((o) => (
            <RefineOption
              key={o.key}
              label={o.label}
              active={sortBy === o.key}
              onClick={() => setSortBy(pillToggle(sortBy, o.key, "default"))}
            />
          ))}
        </RefineSection>

        <RefineSection
          label="Category"
          onClear={(activeTab !== ALL_TAB && !VALIDITY_TABS.has(activeTab)) || filterType.length > 0 ? () => {
            if (!VALIDITY_TABS.has(activeTab)) setActiveTab(ALL_TAB);
            setFilterType([]);
          } : undefined}
          summary={
            activeTab !== ALL_TAB && !VALIDITY_TABS.has(activeTab)
              ? activeTab
              : filterType.length > 0
              ? `${filterType.length} selected`
              : undefined
          }
          open={openSection === "category"}
          onToggle={() => setOpenSection(openSection === "category" ? null : "category")}
        >
          {(() => {
            const visible = drawerCategoryTabs
              .filter((c) => c !== ALL_TAB)
              .filter((c) => (categoryCounts.get(c) || 0) > 0 || selectedCategories.includes(c));
            const total = facets.categoryTotal;
            if (visible.length === 0) {
              return <p style={{ ...type.meta, margin: 0 }}>No categories available.</p>;
            }
            return (
              <div>
                <RefineRectOption
                  label={`All (${total})`}
                  active={selectedCategories.length === 0}
                  onClick={() => {
                    setActiveTab(ALL_TAB);
                    setFilterType([]);
                  }}
                />
                {visible.map((t) => (
                  <RefineRectOption
                    key={t}
                    label={`${t} (${categoryCounts.get(t) ?? 0})`}
                    active={activeTab === t || filterType.includes(t)}
                    onClick={() => {
                      const clear = activeTab === t || filterType.includes(t);
                      setActiveTab(clear ? ALL_TAB : t);
                      setFilterType([]);
                    }}
                  />
                ))}
              </div>
            );
          })()}

        </RefineSection>

        <RefineSection
          label="Validity"
          onClear={validityFilter !== "all" ? () => setValidityFilter("all") : undefined}
          summary={
            validityFilter === "all" ? undefined : VALIDITY_OPTIONS.find((o) => o.key === validityTab)?.label
          }
          open={openSection === "validity"}
          onToggle={() => setOpenSection(openSection === "validity" ? null : "validity")}
        >
          {VALIDITY_OPTIONS.filter((o) => o.key === ALL_TAB || validityCounts[o.key] > 0 || validityTab === o.key).map((o) => (
            <RefineRectOption
              key={o.key}
              label={`${o.label} (${validityCounts[o.key]})`}
              active={validityTab === o.key}
              onClick={() => setValidityTab(pillToggle(validityTab, o.key, ALL_TAB))}
            />
          ))}
        </RefineSection>

        <RefineSection
          label="Booking"
          onClear={bookingFilter !== "any" ? () => setBookingFilter("any") : undefined}
          summary={bookingFilter === "any" ? undefined : SPECIAL_BOOKING_OPTIONS.find((o) => o.key === bookingFilter)?.label}
          open={openSection === "booking"}
          onToggle={() => setOpenSection(openSection === "booking" ? null : "booking")}
        >
          {SPECIAL_BOOKING_OPTIONS.filter((o) => o.key === "any" || filterCounts.booking[o.key] > 0 || bookingFilter === o.key).map((o) => (
            <RefineRectOption
              key={o.key}
              label={`${o.label} (${filterCounts.booking[o.key]})`}
              active={bookingFilter === o.key}
              onClick={() => setBookingFilter(pillToggle(bookingFilter, o.key, "any"))}
            />
          ))}
        </RefineSection>

        <RefineSection
          label="Savings Type"
          onClear={specialTypeFilter !== "any" ? () => setSpecialTypeFilter("any") : undefined}
          summary={specialTypeFilter === "any" ? undefined : SPECIAL_TYPE_OPTIONS.find((o) => o.key === specialTypeFilter)?.label}
          open={openSection === "special-type"}
          onToggle={() => setOpenSection(openSection === "special-type" ? null : "special-type")}
        >
          {SPECIAL_TYPE_OPTIONS.filter((o) => o.key === "any" || filterCounts.type[o.key] > 0 || specialTypeFilter === o.key).map((o) => (
            <RefineRectOption
              key={o.key}
              label={`${o.label} (${filterCounts.type[o.key]})`}
              active={specialTypeFilter === o.key}
              onClick={() => setSpecialTypeFilter(pillToggle(specialTypeFilter, o.key, "any"))}
            />
          ))}
        </RefineSection>

        {kindCounts.options.length > 0 && (
          <RefineSection
            label="Special Type"
            onClear={kindFilter ? () => setKindFilter("") : undefined}
            summary={kindFilter || undefined}
            open={openSection === "special-kind"}
            onToggle={() => setOpenSection(openSection === "special-kind" ? null : "special-kind")}
          >
            <RefineRectOption label={`Any (${kindCounts.any})`} active={!kindFilter} onClick={() => setKindFilter("")} />
            {kindCounts.options.map((o) => (
              <RefineRectOption
                key={o.label}
                label={`${o.label} (${o.count})`}
                active={kindFilter.toLowerCase() === o.label.toLowerCase()}
                onClick={() => setKindFilter(pillToggle(kindFilter, o.label, ""))}
              />
            ))}
          </RefineSection>
        )}
      </RefineDrawer>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Pills + section heads                                               */
/* ------------------------------------------------------------------ */

const SectionHead = ({
  label,
  right,
  hairline = true,
}: {
  label: string;
  right?: React.ReactNode;
  hairline?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 10,
    }}
  >
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0, maxWidth: "100%" }}>
      <span
        style={{
          ...type.sectionTitle,
          overflowWrap: "anywhere",
        }}
      >
        {label}
      </span>
    </span>
    {right ? (
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 400,
          fontSize: 16,
          color: COLOR.mutedInk,
          flexShrink: 0,
        }}
      >
        ({right})
      </span>
    ) : null}
    {hairline ? <span style={{ flex: 1, height: 1, background: COLOR.pillActiveBg }} /> : null}
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
    // Matches the gap between the two carousels on the events page.
    <section style={{ marginBottom: 42 }}>
      <SectionHead
        hairline={false}
        label="Top Active Deals"
        right={dealCountLabel(items.length)}
      />

      {isCarousel ? (
        <>
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="scrollbar-hide"
            style={{
              display: "flex",
              // Stretch, not flex-start: every slide takes the rail's height so
              // the cards line up and each offer reads from the same foot line.
              alignItems: "stretch",
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
                  // A flex item defaults to min-width:auto, i.e. it refuses to
                  // shrink below its content's min-content width — which for a
                  // card whose value bar reads "R 195,00 per burger + beer
                  // combo · Tuesday Burger Special" is wider than the slide.
                  // That silently overrode the basis above: one slide came out
                  // 365px against the intended 328px, so it ran past the page
                  // gutter, and its taller 3:2 image set the rail height and
                  // left a 25px white band under the shorter card. The value
                  // bar already knows how to ellipsize; this lets it.
                  minWidth: 0,
                  scrollSnapAlign: "start",
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
        alignItems: "stretch",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        height: "100%",
        width: "100%",
      }}
    >
      {/* Photo — the card's left column, as tall as the card itself. The picture
          is out of flow on purpose: as an in-flow child it would fall back to
          the file's own ratio and set the rail's height on its own. */}
      <div
        style={{
          position: "relative",
          flex: `0 0 ${FEATURED_PHOTO_FRACTION * 100}%`,
          background: "#EEE8DA",
        }}
      >
        {image && (
          <img
            src={image}
            alt={special.title}
            loading="lazy"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}
        <SpecialCountdownTag special={special} />
      </div>

      {/* Details — badge, headline and business, then the offer pinned to the
          foot of the column so every card in the rail reads from the same line. */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          padding: "12px 14px 12px 16px",
        }}
      >
        <SpecialBadgePill
          special={special}
          size="sm"
          style={{ alignSelf: "flex-start", maxWidth: "100%" }}
        />
        <h3
          {...noTitleCaseProps(special)}
          style={{
            fontFamily: SANS,
            ...type.cardTitleM,
            lineHeight: 1.2,
            letterSpacing: "-0.15px",
            color: COLOR.ink,
            margin: "12px 0 0 0",
            overflowWrap: "break-word",
          }}
        >
          <span
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
              alignItems: "baseline",
              gap: 5,
              fontFamily: SANS,
              ...type.meta,
              lineHeight: 1.3,
              color: COLOR.mutedInk,
              // Air between the headline and the two rows beneath it; the offer
              // chip's own top padding (below) keeps the same breathing room.
              marginTop: 12,
              minWidth: 0,
            }}
          >
            <Store
              size={META_ICON_SIZE}
              strokeWidth={1.8}
              color={COLOR.mutedInk}
              style={{ flexShrink: 0, transform: `translateY(${META_ICON_NUDGE})` }}
            />
            <span
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                overflowWrap: "break-word",
              }}
            >
              {meta}
            </span>
          </div>
        )}
        {/* The deal's own line, worn as a chip at the foot of the column, with a
            chevron at the rail's edge: the chip is the offer, the chevron says the
            card opens. `marginTop: auto` keeps every card in the rail reading from
            the same foot line; `paddingTop` holds the gap even on the tallest card,
            where there is no slack for the auto margin to distribute. */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              minWidth: 0,
              background: OFFER_CHIP_BG,
              borderRadius: 999,
              padding: "1px 10px",
            }}
          >
            <SpecialValueBar
              special={special}
              detail="compact"
              padding="0"
              surface="plain"
            />
          </div>
          <ChevronRight
            size={16}
            strokeWidth={2}
            style={{ flexShrink: 0, color: MUTED, opacity: 0.55 }}
          />
        </div>
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Grid card                                                           */
/* ------------------------------------------------------------------ */

// Title line-height 1.25 on a 15px face, so two lines of title reserve this much.
// The mark beside a deal card's business name. Sized so its drawn ink spans
// exactly the capital letters it sits against (measured on screen, not guessed),
// and the row is aligned on the text baseline so a name that wraps to two lines
// keeps the mark level with the first line.
const META_ICON_SIZE = 9.1;
// Baseline alignment lands the mark a touch high against the capital letters,
// so it comes back down by the measured half-pixel.
const META_ICON_NUDGE = "0.5px";

// The featured card wears its deal line as a chip: the offer's red-brown ink on
// a wash of the same colour, so the chip reads as one object rather than a new
// hue. It is the accent at low alpha over the card's white, not a separate colour.
const OFFER_CHIP_BG = "rgba(180, 82, 46, 0.09)";



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
        <SpecialCountdownTag special={special} />
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
              alignItems: "baseline",
              gap: 5,
              fontFamily: SANS,
              ...type.meta,
              lineHeight: 1.3,
              color: COLOR.mutedInk,
              marginTop: 3,
              minWidth: 0,
            }}
          >
            <Store size={META_ICON_SIZE} strokeWidth={1.8} color={COLOR.mutedInk} style={{ flexShrink: 0, transform: `translateY(${META_ICON_NUDGE})` }} />
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
