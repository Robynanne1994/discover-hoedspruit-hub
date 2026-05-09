import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Search, ArrowLeft } from "lucide-react";
import { format, parseISO, isFuture, isPast, differenceInDays } from "date-fns";

type PrimaryTab = "all" | "listings" | "events" | "specials";
const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const CREAM_92 = "rgba(238, 232, 218, 0.92)";
const CREAM_70 = "rgba(238, 232, 218, 0.70)";
const CREAM_75 = "rgba(238, 232, 218, 0.75)";
const CREAM_80 = "rgba(238, 232, 218, 0.80)";
const CREAM_50 = "rgba(238, 232, 218, 0.50)";
const CREAM_BORDER = "rgba(238, 232, 218, 0.35)";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const STORAGE_KEY = "saved-page-state-v2";

type Persisted = {
  tab: PrimaryTab;
  listingFilter: string;
  eventFilter: string;
  specialFilter: string;
};

const loadPersisted = (): Partial<Persisted> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const SavedListings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const persisted = loadPersisted();

  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>(() => {
    const tab = searchParams.get("tab");
    if (tab === "all" || tab === "events" || tab === "specials" || tab === "listings") return tab;
    if (persisted.tab) return persisted.tab;
    return "all";
  });
  const [listingFilter, setListingFilter] = useState(persisted.listingFilter ?? "All");
  const [eventFilter, setEventFilter] = useState(persisted.eventFilter ?? "All");
  const [specialFilter, setSpecialFilter] = useState(persisted.specialFilter ?? "All");
  const [search, setSearch] = useState("");

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ tab: primaryTab, listingFilter, eventFilter, specialFilter }),
      );
    } catch {}
  }, [primaryTab, listingFilter, eventFilter, specialFilter]);

  // Saved listings
  const { data: favourites, isLoading } = useQuery({
    queryKey: ["saved-listings-page", user?.id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("*")
        .eq("user_id", user!.id)
        .eq("item_type", "listing")
        .order("created_at", { ascending: false });
      if (!favs || favs.length === 0) return [];

      const ids = favs.map((f) => f.item_id);
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, location, google_rating, category_id, categories(title)")
        .in("id", ids);
      const { data: junctions } = await supabase
        .from("listing_categories")
        .select("listing_id, categories(id, title)")
        .in("listing_id", ids);

      const jmap: Record<string, string[]> = {};
      (junctions || []).forEach((j: any) => {
        if (!jmap[j.listing_id]) jmap[j.listing_id] = [];
        if (j.categories?.title) jmap[j.listing_id].push(j.categories.title);
      });

      const lmap = Object.fromEntries(
        (listings || []).map((l: any) => [
          l.id,
          {
            ...l,
            categoryNames: [
              ...(l.categories?.title ? [l.categories.title] : []),
              ...(jmap[l.id] || []),
            ].filter((v, i, a) => a.indexOf(v) === i),
          },
        ]),
      );
      return favs.map((f) => ({ ...f, details: lmap[f.item_id] })).filter((f) => f.details);
    },
    enabled: !!user,
  });

  // Saved events
  const { data: savedEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["saved-events-page", user?.id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("*")
        .eq("user_id", user!.id)
        .eq("item_type", "event")
        .order("created_at", { ascending: false });
      if (!favs || favs.length === 0) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: events } = await supabase.from("events").select("*").in("id", ids);
      const map = Object.fromEntries((events || []).map((e: any) => [e.id, e]));
      return favs.map((f) => ({ ...f, details: map[f.item_id] })).filter((f) => f.details);
    },
    enabled: !!user,
  });

  // Saved specials
  const { data: savedSpecials, isLoading: specialsLoading } = useQuery({
    queryKey: ["saved-specials-page", user?.id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("*")
        .eq("user_id", user!.id)
        .eq("item_type", "special")
        .order("created_at", { ascending: false });
      if (!favs || favs.length === 0) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: specials } = await supabase.from("specials").select("*").in("id", ids);
      const map = Object.fromEntries((specials || []).map((s: any) => [s.id, s]));
      return favs.map((f) => ({ ...f, details: map[f.item_id] })).filter((f) => f.details);
    },
    enabled: !!user,
  });

  const removeFavourite = useMutation({
    mutationFn: async (fav: { item_id: string; item_type: string }) => {
      await supabase
        .from("favourites")
        .delete()
        .eq("user_id", user!.id)
        .eq("item_id", fav.item_id)
        .eq("item_type", fav.item_type);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-listings-page"] });
      queryClient.invalidateQueries({ queryKey: ["saved-events-page"] });
      queryClient.invalidateQueries({ queryKey: ["saved-specials-page"] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      queryClient.invalidateQueries({ queryKey: ["favourite"] });
    },
  });

  // Sub-filter pools
  const listingCategories = (() => {
    const set = new Set<string>();
    (favourites || []).forEach((f: any) =>
      (f.details?.categoryNames || []).forEach((c: string) => set.add(c)),
    );
    return Array.from(set).sort();
  })();

  const eventTags = (() => {
    const set = new Set<string>();
    (savedEvents || []).forEach((f: any) => {
      if (f.details?.tag) set.add(f.details.tag);
    });
    return Array.from(set).sort();
  })();

  const specialTypes = (() => {
    const set = new Set<string>();
    (savedSpecials || []).forEach((f: any) => {
      if (f.details?.special_type) set.add(f.details.special_type);
    });
    return Array.from(set).sort();
  })();

  // Filtered lists
  const filteredListings = (favourites || []).filter((f: any) => {
    if (listingFilter !== "All") {
      if (
        !(f.details?.categoryNames || []).some(
          (c: string) => c.toLowerCase() === listingFilter.toLowerCase(),
        )
      )
        return false;
    }
    if (search.trim() && !f.details?.title?.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const filteredEvents = (savedEvents || []).filter((f: any) => {
    const d = f.details;
    if (!d) return false;
    if (eventFilter === "Upcoming") {
      try {
        if (!isFuture(parseISO(d.start_date || d.date))) return false;
      } catch {
        return false;
      }
    } else if (eventFilter === "Past") {
      try {
        if (!isPast(parseISO(d.end_date || d.start_date || d.date))) return false;
      } catch {
        return false;
      }
    } else if (eventFilter !== "All") {
      if (d.tag !== eventFilter) return false;
    }
    if (search.trim() && !d.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredSpecials = (savedSpecials || []).filter((f: any) => {
    const d = f.details;
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (specialFilter === "Active") {
      if (!d.is_active) return false;
      if (d.valid_until && new Date(d.valid_until) < today) return false;
    } else if (specialFilter === "Expiring Soon") {
      if (!d.valid_until) return false;
      const days = differenceInDays(new Date(d.valid_until), today);
      if (days < 0 || days > 7) return false;
    } else if (specialFilter !== "All") {
      if (d.special_type !== specialFilter) return false;
    }
    if (search.trim() && !d.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Counts (total saved per tab, not filtered)
  const listingsCount = (favourites || []).length;
  const eventsCount = (savedEvents || []).length;
  const specialsCount = (savedSpecials || []).length;
  const totalCount = listingsCount + eventsCount + specialsCount;

  const activeCount =
    primaryTab === "all"
      ? totalCount
      : primaryTab === "listings"
        ? listingsCount
        : primaryTab === "events"
          ? eventsCount
          : specialsCount;

  // Lede
  const lede = (() => {
    if (primaryTab === "all") {
      return activeCount === 1
        ? "1 thing, kept close."
        : `${activeCount} things, kept close.`;
    }
    if (primaryTab === "listings") {
      return activeCount === 1
        ? "1 place, kept for when you need it."
        : `${activeCount} places, kept for when you need them.`;
    }
    if (primaryTab === "events") {
      return activeCount === 1
        ? "1 event, saved for the diary."
        : `${activeCount} events, saved for the diary.`;
    }
    return activeCount === 1
      ? "1 special, before it goes."
      : `${activeCount} specials, before they go.`;
  })();

  const searchPlaceholder =
    primaryTab === "all"
      ? "Search everything saved"
      : primaryTab === "listings"
        ? "Search saved places"
        : primaryTab === "events"
          ? "Search saved events"
          : "Search saved specials";

  const subFilters: string[] =
    primaryTab === "all"
      ? ["All"]
      : primaryTab === "listings"
        ? ["All", ...listingCategories]
        : primaryTab === "events"
          ? ["All", "Upcoming", "Past", ...eventTags]
          : ["All", "Active", "Expiring Soon", ...specialTypes];

  const activeSubFilter =
    primaryTab === "all"
      ? "All"
      : primaryTab === "listings"
        ? listingFilter
        : primaryTab === "events"
          ? eventFilter
          : specialFilter;

  const setActiveSubFilter = (v: string) => {
    if (primaryTab === "listings") setListingFilter(v);
    else if (primaryTab === "events") setEventFilter(v);
    else if (primaryTab === "specials") setSpecialFilter(v);
  };

  // ------- shells -------
  const PageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      className="min-h-screen"
      style={{ background: OLIVE, paddingBottom: 100, fontFamily: SANS }}
    >
      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24, marginBottom: 0 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: CREAM,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
          }}
        >
          <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 1.6, color: INK }} />
        </button>
      </div>
      {children}
    </div>
  );

  if (!loading && !user) {
    return (
      <PageShell>
        <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24 }}>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: "2.4px",
              textTransform: "uppercase",
              color: CREAM_70,
              marginBottom: 14,
            }}
          >
            My Hoedspruit
          </p>
          <h1
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 72,
              lineHeight: 0.92,
              letterSpacing: "-2.5px",
              color: CREAM,
              margin: 0,
            }}
          >
            saved.
          </h1>
        </div>
        <div style={{ textAlign: "center", paddingTop: 80, paddingLeft: 24, paddingRight: 24 }}>
          <Heart
            style={{
              width: 48,
              height: 48,
              strokeWidth: 1.5,
              color: CREAM_50,
              margin: "0 auto",
            }}
          />
          <h3
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 22,
              color: CREAM_80,
              marginTop: 16,
            }}
          >
            Sign in to see your saved.
          </h3>
          <Link to="/auth">
            <Button
              className="rounded-full px-8 mt-6"
              style={{ background: INK, color: CREAM, fontFamily: SANS }}
            >
              Sign In
            </Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  if (loading || isLoading || eventsLoading || specialsLoading) {
    return (
      <PageShell>
        <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24 }}>
          <Skeleton className="h-3 w-28 mb-3" style={{ background: CREAM_BORDER }} />
          <Skeleton className="h-16 w-40 mb-4" style={{ background: CREAM_BORDER }} />
          <Skeleton className="h-5 w-64 mb-6" style={{ background: CREAM_BORDER }} />
          <Skeleton
            className="h-[52px] w-full rounded-full mb-5"
            style={{ background: CREAM_BORDER }}
          />
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-10 flex-1 rounded-full"
                style={{ background: CREAM_BORDER }}
              />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-[260px] w-full"
                style={{ background: CREAM_BORDER, borderRadius: 24 }}
              />
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  // ------- Empty states -------
  const renderEmpty = () => {
    const headline =
      primaryTab === "all"
        ? "Nothing saved yet."
        : primaryTab === "listings"
          ? "Nothing saved yet."
          : primaryTab === "events"
            ? "No events saved yet."
            : "No specials saved yet.";
    const sub =
      primaryTab === "all"
        ? "Tap the heart on any listing, event or special to save it here."
        : primaryTab === "listings"
          ? "Tap the heart on any listing to save it here."
          : primaryTab === "events"
            ? "Tap the heart on any event to save it here."
            : "Tap the heart on any special to save it here.";
    return (
      <div style={{ textAlign: "center", paddingTop: 60, paddingLeft: 24, paddingRight: 24 }}>
        <Heart
          style={{
            width: 48,
            height: 48,
            strokeWidth: 1.5,
            color: CREAM_50,
            margin: "0 auto 16px",
          }}
        />
        <h3
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 22,
            color: CREAM_80,
            margin: 0,
            marginBottom: 12,
          }}
        >
          {headline}
        </h3>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.55,
            color: CREAM_70,
            maxWidth: 260,
            margin: "0 auto",
          }}
        >
          {sub}
        </p>
      </div>
    );
  };

  // ------- Listing card -------
  const renderListings = () => {
    if (filteredListings.length === 0) return renderEmpty();
    return (
      <div className="flex flex-col">
        {filteredListings.map((fav: any) => {
          const d = fav.details;
          const rating = d.google_rating ? Number(d.google_rating) : null;
          return (
            <Link
              key={fav.id}
              to={`/listing/${fav.item_id}`}
              className="block"
              style={{
                background: CREAM,
                borderRadius: 24,
                overflow: "hidden",
                marginLeft: 24,
                marginRight: 24,
                marginBottom: 14,
                transition: "opacity 200ms ease",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 200,
                  background: "#e6dfcf",
                }}
              >
                {d.image_url && (
                  <img
                    src={d.image_url}
                    alt={d.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    loading="lazy"
                  />
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFavourite.mutate({
                      item_id: fav.item_id,
                      item_type: fav.item_type,
                    });
                  }}
                  aria-label="Remove from saved"
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
                    style={{
                      width: 16,
                      height: 16,
                      strokeWidth: 2,
                      color: RUST,
                      fill: RUST,
                    }}
                  />
                </button>
              </div>
              <div style={{ padding: "18px 22px 22px" }}>
                <h3
                  style={{
                    fontFamily: SANS,
                    fontSize: 18,
                    fontWeight: 400,
                    lineHeight: 1.2,
                    letterSpacing: "-0.2px",
                    color: INK,
                    margin: 0,
                    marginBottom: 8,
                  }}
                >
                  {d.title}
                </h3>
                <div className="flex items-center" style={{ gap: 8 }}>
                  {rating && (
                    <span style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>
                      ★ {rating.toFixed(1)}
                    </span>
                  )}
                  {rating && d.location && (
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: MUTED,
                        opacity: 0.6,
                        display: "inline-block",
                      }}
                    />
                  )}
                  {d.location && (
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: 13,
                        color: MUTED,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.location}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  // ------- Event/Special row card -------
  const formatEventDate = (e: any) => {
    if (e.recurrence) {
      const base = String(e.recurrence).toUpperCase();
      return e.start_time ? `${base} · ${e.start_time.toUpperCase()}` : base;
    }
    try {
      const d = parseISO(e.start_date || e.date);
      const dateStr = format(d, "d MMM").toUpperCase();
      return e.start_time ? `${dateStr} · ${e.start_time.toUpperCase()}` : dateStr;
    } catch {
      return (e.date || "").toUpperCase();
    }
  };

  const renderEvents = () => {
    if (filteredEvents.length === 0) return renderEmpty();
    return (
      <div
        style={{
          background: CREAM,
          borderRadius: 24,
          marginLeft: 24,
          marginRight: 24,
          padding: "6px 20px",
          overflow: "hidden",
        }}
      >
        {filteredEvents.map((fav: any, idx: number) => {
          const e = fav.details;
          return (
            <Link
              key={fav.id}
              to={`/event/${fav.item_id}`}
              className="flex items-center"
              style={{
                gap: 14,
                paddingTop: 16,
                paddingBottom: 16,
                borderTop: idx === 0 ? "none" : `1px solid ${LINE}`,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "#e6dfcf",
                  flexShrink: 0,
                }}
              >
                {e.image_url && (
                  <img
                    src={e.image_url}
                    alt={e.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 11.5,
                    color: MUTED,
                    letterSpacing: "1.6px",
                    textTransform: "uppercase",
                    margin: 0,
                    marginBottom: 3,
                  }}
                >
                  {formatEventDate(e)}
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 15,
                    color: INK,
                    lineHeight: 1.25,
                    letterSpacing: "-0.1px",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {e.title}
                </p>
                {e.location && (
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: 12.5,
                      color: MUTED,
                      margin: 0,
                      marginTop: 2,
                    }}
                  >
                    {e.location}
                  </p>
                )}
              </div>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  color: INK,
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              >
                ↗
              </span>
            </Link>
          );
        })}
      </div>
    );
  };

  const formatValidity = (sp: any) => {
    if (!sp.valid_until) return "ongoing";
    try {
      const end = new Date(sp.valid_until);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const days = differenceInDays(end, today);
      if (days < 0) return "expired";
      if (days === 0) return "ends today";
      if (days <= 7) return `ends in ${days} ${days === 1 ? "day" : "days"}`;
      return `valid until ${format(end, "d MMM yyyy")}`;
    } catch {
      return "ongoing";
    }
  };

  const renderSpecials = () => {
    if (filteredSpecials.length === 0) return renderEmpty();
    return (
      <div
        style={{
          background: CREAM,
          borderRadius: 24,
          marginLeft: 24,
          marginRight: 24,
          padding: "6px 20px",
          overflow: "hidden",
        }}
      >
        {filteredSpecials.map((fav: any, idx: number) => {
          const s = fav.details;
          return (
            <Link
              key={fav.id}
              to={`/specials/${fav.item_id}`}
              className="flex items-center"
              style={{
                gap: 14,
                paddingTop: 16,
                paddingBottom: 16,
                borderTop: idx === 0 ? "none" : `1px solid ${LINE}`,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#e6dfcf",
                  flexShrink: 0,
                }}
              >
                {s.image_url && (
                  <img
                    src={s.image_url}
                    alt={s.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 11.5,
                    color: MUTED,
                    letterSpacing: "1.6px",
                    textTransform: "uppercase",
                    margin: 0,
                    marginBottom: 3,
                  }}
                >
                  {s.deal_label || s.special_type || "Special"}
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 15,
                    color: INK,
                    lineHeight: 1.25,
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.title}
                </p>
                <p
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 12.5,
                    color: MUTED,
                    margin: 0,
                    marginTop: 2,
                  }}
                >
                  {formatValidity(s)}
                </p>
              </div>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  color: INK,
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              >
                ↗
              </span>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <PageShell>
      {/* Hero */}
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: CREAM_70,
            margin: 0,
            marginBottom: 14,
          }}
        >
          My Hoedspruit
        </p>
        <h1
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 72,
            lineHeight: 0.92,
            letterSpacing: "-2.5px",
            color: CREAM,
            margin: 0,
            marginBottom: 14,
          }}
        >
          saved.
        </h1>
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            lineHeight: 1.4,
            color: CREAM_75,
            margin: 0,
            maxWidth: 300,
          }}
        >
          {lede}
        </p>
      </div>

      {/* Search */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 22 }}>
        <div
          className="flex items-center"
          style={{
            background: CREAM_92,
            borderRadius: 999,
            height: 52,
            padding: "0 22px",
            gap: 12,
          }}
        >
          <Search
            style={{ width: 18, height: 18, strokeWidth: 1.6, color: MUTED, flexShrink: 0 }}
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 400,
              color: INK,
            }}
          />
        </div>
      </div>

      {/* Master tabs */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 14 }}>
        <div className="flex" style={{ gap: 8 }}>
          {(
            [
              { key: "all" as const, label: "All", count: totalCount },
              { key: "listings" as const, label: "Listings", count: listingsCount },
              { key: "events" as const, label: "Events", count: eventsCount },
              { key: "specials" as const, label: "Specials", count: specialsCount },
            ] as const
          ).map((t) => {
            const active = primaryTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setPrimaryTab(t.key);
                  setSearch("");
                }}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 999,
                  background: active ? INK : CREAM,
                  color: active ? CREAM : INK,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: 400,
                  letterSpacing: "0.1px",
                }}
              >
                <span>{t.label}</span>
                <span
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: 12,
                    opacity: active ? 0.85 : 0.7,
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-filter pills */}
      {primaryTab !== "all" && (
      <div
        style={{
          paddingLeft: 24,
          paddingRight: 24,
          marginBottom: 24,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        <div className="flex" style={{ gap: 8 }}>
          {subFilters.map((f) => {
            const active = activeSubFilter === f;
            return (
              <button
                key={f}
                onClick={() => setActiveSubFilter(f)}
                className="whitespace-nowrap"
                style={{
                  height: 32,
                  padding: "0 16px",
                  borderRadius: 999,
                  background: active ? CREAM : "transparent",
                  border: active ? "none" : `1px solid ${CREAM_BORDER}`,
                  color: active ? INK : CREAM,
                  fontFamily: SANS,
                  fontSize: 12.5,
                  fontWeight: 400,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {primaryTab === "listings" && renderListings()}
      {primaryTab === "events" && renderEvents()}
      {primaryTab === "specials" && renderSpecials()}
    </PageShell>
  );
};

export default SavedListings;
