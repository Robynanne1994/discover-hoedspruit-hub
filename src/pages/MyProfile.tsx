import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollowCounts } from "@/hooks/useFollows";
import { ChevronDown, Pencil, Search, Settings, SlidersHorizontal, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import SavedCard from "@/components/profile/SavedCard";
import SavedFilterSheet, { SavedSort, sortLabel } from "@/components/profile/SavedFilterSheet";
import Seo from "@/components/Seo";
import { residencyBadge } from "@/lib/residencyBadge";


const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INNER = "#EFE7D3";
const INK = "#1A1A1A";
const SUBTLE = "rgba(26,26,26,0.55)";
const WHITE = "#FFFFFF";
const PILL_BORDER = "#E8E4DF";
const DARK_BROWN = "#423324";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const titleCase = (s?: string | null) => {
  if (!s) return "";
  // Use Unicode letter class so accented chars (é, à, ñ...) are treated as
  // part of the word and the character right after them isn't re-uppercased.
  return s.toLowerCase().replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
};

// Category chips read back the value stored on the listing/deal/resource, so
// anything already cased deliberately (WhatsApp, B&B) is left alone and only
// all-lower-case values get title-cased.
const chipLabel = (s: string) => (/[A-Z]/.test(s) ? s.trim() : titleCase(s));

const fmtCount = (n: number) => n.toLocaleString("en-US");

type Tab = "all" | "listings" | "deals" | "events" | "resources";

// A saved item of any kind, flattened into the single shape the grid, the
// search box, the category chips and the sort all read from.
type SavedItem = {
  id: string;
  type: "listing" | "event" | "special" | "resource";
  raw: any;
  href: string;
  subtitle: React.ReactNode;
  title: string;
  savedAt: number;
  rating: number | null;
  /** Lower-cased haystack for the search box. */
  search: string;
  /** Every category chip this item answers to. */
  tags: string[];
};

// Maps a favourite's item_type to the query key of the saved list that renders it.
const SAVED_LIST_KEY: Record<string, string> = {
  listing: "my-saved-listings",
  event: "my-saved-events",
  special: "my-saved-specials",
  resource: "my-saved-resources",
};

const TAB_FOR_TYPE: Record<SavedItem["type"], Tab> = {
  listing: "listings",
  special: "deals",
  event: "events",
  resource: "resources",
};

const MyProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SavedSort>("recent");
  const [category, setCategory] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Draft state so a half-made choice in the sheet never reflows the grid
  // behind it — only Apply commits.
  const [draftSort, setDraftSort] = useState<SavedSort>("recent");
  const [draftCategory, setDraftCategory] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    // Personal profile is for signed-in users. Guests are sent to the
    // browsable guest profile (which offers sign-in), never a full-screen wall.
    if (!user) navigate("/my-profile-guest", { replace: true });
  }, [authLoading, user, navigate]);

  // Category chips are derived per tab, so a chip picked on one tab can't
  // survive onto the next and silently empty the grid.
  useEffect(() => {
    setCategory(null);
  }, [tab]);

  const id = user?.id;
  const queryClient = useQueryClient();

  const removeFavourite = useMutation({
    mutationFn: async ({ item_id, item_type }: { item_id: string; item_type: string }) => {
      if (!id) return;
      await supabase
        .from("favourites")
        .delete()
        .eq("user_id", id)
        .eq("item_id", item_id)
        .eq("item_type", item_type);
    },
    // Optimistically drop just the unsaved item from the relevant saved list,
    // the total count, and the shared favourites cache. This makes the card
    // disappear instantly without a list-wide refetch — the cascading
    // invalidations were what made the whole grid flash/reflow on every unsave.
    onMutate: async ({ item_id, item_type }) => {
      const listKey = [SAVED_LIST_KEY[item_type] ?? "my-saved-listings", id];
      const countKey = ["my-saved-count", id];
      const setKey = ["favourites-set", id];
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: countKey }),
        queryClient.cancelQueries({ queryKey: setKey }),
      ]);
      const prevList = queryClient.getQueryData<any[]>(listKey);
      const prevCount = queryClient.getQueryData<number>(countKey);
      const prevSet = queryClient.getQueryData<Set<string>>(setKey);
      if (prevList) queryClient.setQueryData(listKey, prevList.filter((it) => it.id !== item_id));
      if (typeof prevCount === "number") queryClient.setQueryData(countKey, Math.max(0, prevCount - 1));
      if (prevSet) {
        const next = new Set(prevSet);
        next.delete(`${item_type}:${item_id}`);
        queryClient.setQueryData(setKey, next);
      }
      return { listKey, countKey, setKey, prevList, prevCount, prevSet };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      if (ctx.prevList !== undefined) queryClient.setQueryData(ctx.listKey, ctx.prevList);
      if (ctx.prevCount !== undefined) queryClient.setQueryData(ctx.countKey, ctx.prevCount);
      if (ctx.prevSet !== undefined) queryClient.setQueryData(ctx.setKey, ctx.prevSet);
    },
  });

  const handleUnsave = (e: React.MouseEvent, item_id: string, item_type: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavourite.mutate({ item_id, item_type });
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile", id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: counts } = useFollowCounts(id);

  const { data: saved } = useQuery({
    queryKey: ["my-saved-listings", id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "listing")
        .order("created_at", { ascending: false })
        ;
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, saved_image_url, location, google_rating, google_reviews_count, category_id, categories(title)")
        .in("id", ids);
      const map = Object.fromEntries((listings || []).map((l: any) => [l.id, l]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((l) => l.id);
    },
    enabled: !!id,
  });


  const { data: savedEvents } = useQuery({
    queryKey: ["my-saved-events", id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "event")
        .order("created_at", { ascending: false })
        ;
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: events } = await supabase
        .from("events")
        .select("id, title, image_url, saved_image_url, location, start_date, end_date, tag")
        .in("id", ids);
      const map = Object.fromEntries((events || []).map((e: any) => [e.id, e]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((e) => e.id);
    },
    enabled: !!id,
  });

  const { data: savedSpecials } = useQuery({
    queryKey: ["my-saved-specials", id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "special")
        .order("created_at", { ascending: false })
        ;
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: specials } = await supabase
        .from("specials")
        .select("id, title, image_url, saved_image_url, business_name, valid_until, tag")
        .in("id", ids);
      const map = Object.fromEntries((specials || []).map((s: any) => [s.id, s]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((s) => s.id);
    },
    enabled: !!id,
  });

  const { data: savedResources } = useQuery({
    queryKey: ["my-saved-resources", id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("item_id, created_at")
        .eq("user_id", id!)
        .eq("item_type", "resource")
        .order("created_at", { ascending: false })
        ;
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.item_id);
      const { data: resources } = await supabase
        .from("bush_telegraph_resources")
        .select("id, title, title_override, image_url, saved_image_url, platform, meta, meta_2, slug")
        .in("id", ids);
      const map = Object.fromEntries((resources || []).map((r: any) => [r.id, r]));
      return favs.map((f) => ({ ...map[f.item_id], created_at: f.created_at })).filter((r) => r.id);
    },
    enabled: !!id,
  });

  const { data: savedCount } = useQuery({
    queryKey: ["my-saved-count", id],
    queryFn: async () => {
      const { count } = await supabase
        .from("favourites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id!);
      return count ?? 0;
    },
    enabled: !!id,
  });

  // Everything saved, flattened into one list so the "All" tab, the search box
  // and the sort can work across types without four parallel code paths.
  const items = useMemo<SavedItem[]>(() => {
    const now = Date.now();
    const at = (v?: string | null) => (v ? new Date(v).getTime() : 0);

    const listings: SavedItem[] = (saved ?? []).map((it: any) => ({
      id: it.id,
      type: "listing",
      raw: it,
      href: `/listing/${it.id}`,
      subtitle: null,
      title: titleCase(it.title),
      savedAt: at(it.created_at),
      rating: it.google_rating ? Number(it.google_rating) : null,
      search: `${it.title ?? ""} ${it.location ?? ""} ${it.categories?.title ?? ""}`.toLowerCase(),
      tags: it.categories?.title ? [chipLabel(it.categories.title)] : [],
    }));

    const specials: SavedItem[] = (savedSpecials ?? []).map((it: any) => {
      const expired = !!it.valid_until && at(it.valid_until) < now;
      return {
        id: it.id,
        type: "special" as const,
        raw: it,
        href: `/specials/${it.id}`,
        subtitle: it.business_name ? titleCase(it.business_name) : null,
        title: titleCase(it.title),
        savedAt: at(it.created_at),
        rating: null,
        search: `${it.title ?? ""} ${it.business_name ?? ""} ${it.tag ?? ""}`.toLowerCase(),
        tags: ["Deals", expired ? "Expired" : "Active", ...(it.tag ? [chipLabel(it.tag)] : [])],
      };
    });

    const events: SavedItem[] = (savedEvents ?? []).map((it: any) => {
      const ref = it.end_date || it.start_date;
      const past = ref ? at(ref) < now : false;
      return {
        id: it.id,
        type: "event" as const,
        raw: it,
        href: `/events/${it.id}`,
        subtitle: (
          <>
            {it.start_date && (
              <div>
                {new Date(it.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </div>
            )}
            {it.location && <div>{it.location}</div>}
          </>
        ),
        title: titleCase(it.title),
        savedAt: at(it.created_at),
        rating: null,
        search: `${it.title ?? ""} ${it.location ?? ""} ${it.tag ?? ""}`.toLowerCase(),
        tags: ["Events", past ? "Past" : "Upcoming"],
      };
    });

    const resources: SavedItem[] = (savedResources ?? []).map((it: any) => {
      const displayTitle = (it.title_override?.trim() as string) || it.title;
      const metaParts = [it.meta, it.meta_2].filter((m: string | null) => m && m.trim());
      return {
        id: it.id,
        type: "resource" as const,
        raw: { ...it, title: displayTitle },
        href: it.slug ? `/local-channels/${it.slug}` : `/local-channels`,
        subtitle: metaParts.length ? <span>{metaParts.join(" · ")}</span> : null,
        title: titleCase(displayTitle),
        savedAt: at(it.created_at),
        rating: null,
        search: `${displayTitle ?? ""} ${metaParts.join(" ")} ${it.platform ?? ""}`.toLowerCase(),
        tags: ["Resources", ...(it.platform ? [chipLabel(it.platform)] : [])],
      };
    });

    return [...listings, ...specials, ...events, ...resources];
  }, [saved, savedSpecials, savedEvents, savedResources]);

  const tabItems = useMemo(
    () => (tab === "all" ? items : items.filter((it) => TAB_FOR_TYPE[it.type] === tab)),
    [items, tab],
  );

  const tabs = useMemo(() => {
    const count = (t: Tab) => (t === "all" ? items.length : items.filter((it) => TAB_FOR_TYPE[it.type] === t).length);
    return ([
      { id: "all" as Tab, label: "All" },
      { id: "listings" as Tab, label: "Listings" },
      { id: "deals" as Tab, label: "Deals" },
      { id: "events" as Tab, label: "Events" },
      { id: "resources" as Tab, label: "Resources" },
      // The active tab always stays visible, even once its last item is unsaved.
    ]).map((t) => ({ ...t, count: count(t.id) })).filter((t) => t.id === "all" || t.count > 0 || t.id === tab);
  }, [items, tab]);

  // Chips offered by the sheet: on "All" the item types plus the listing
  // categories (as in the design), on a single tab that tab's own categories.
  const categories = useMemo(() => {
    const TYPES = ["Deals", "Events", "Resources"];
    const STATES = ["Active", "Expired", "Upcoming", "Past"];
    const counts = new Map<string, number>();
    tabItems.forEach((it) => it.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    // Time states lead the list on the tabs that actually have one. On "All"
    // they'd sit among the categories and read as if they were categories too,
    // so they're dropped there.
    const states = tab === "deals" || tab === "events" ? STATES.filter((s) => counts.has(s)) : [];
    STATES.forEach((s) => counts.delete(s));
    // Type chips only earn a place on "All", where the grid is mixed; on a
    // single tab every item shares the type already.
    const types = tab === "all" ? TYPES.filter((t) => counts.has(t)) : [];
    TYPES.forEach((t) => counts.delete(t));
    const rest = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([t]) => t);
    return [...states, ...rest, ...types];
  }, [tabItems, tab]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = tabItems.filter((it) => {
      if (q && !it.search.includes(q)) return false;
      if (category && !it.tags.includes(category)) return false;
      return true;
    });
    const sorted = [...filtered];
    if (sort === "az") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "rating")
      // Unrated items (events, deals, resources) sink below the rated ones
      // rather than scattering through the grid.
      sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.savedAt - a.savedAt);
    else sorted.sort((a, b) => b.savedAt - a.savedAt);
    return sorted;
  }, [tabItems, search, category, sort]);

  // What Apply would show, so the sheet's button can preview the result count.
  const draftCount = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabItems.filter((it) => {
      if (q && !it.search.includes(q)) return false;
      if (draftCategory && !it.tags.includes(draftCategory)) return false;
      return true;
    }).length;
  }, [tabItems, search, draftCategory]);

  const openSheet = () => {
    setDraftSort(sort);
    setDraftCategory(category);
    setSheetOpen(true);
  };

  const applySheet = () => {
    setSort(draftSort);
    setCategory(draftCategory);
    setSheetOpen(false);
  };

  const badge = residencyBadge(profile?.location);

  // Guests (and signed-out users) never see the profile card with its
  // saved / followers / following stats. The effect above redirects them —
  // guests to the account settings page, everyone else to Welcome — so we
  // render nothing here to avoid flashing the card during that transition.
  if (!user) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAGE_BG,
        paddingBottom: 100,
        fontFamily: SANS,
        color: INK,
      }}
    >
      <Seo
        title="My Profile — Hello Hoedspruit"
        description="View your Hello Hoedspruit profile, saved listings, events, specials and resources."
        path="/my-profile"
        noIndex
      />

      <PageHeader
        title="Profile"
        showBack={false}
        right={
          <Link
            to="/my-account"
            aria-label="Settings"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: CARD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={18} strokeWidth={1.8} color={INK} />
          </Link>
        }
      />

      {/* Profile card */}
      <div style={{ padding: "16px 20px 0" }}>
        <section style={{ background: CARD, borderRadius: 20, padding: "18px 18px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: INNER,
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <User size={26} strokeWidth={1.5} color="rgba(26,26,26,0.5)" />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              {isLoading ? (
                <Skeleton className="h-7 w-40" />
              ) : (
                <>
                  <h2
                    style={{
                      fontFamily: HEAD,
                      fontWeight: 550,
                      fontSize: 22,
                      lineHeight: 1.15,
                      letterSpacing: "-0.4px",
                      color: INK,
                      margin: 0,
                    }}
                  >
                    {titleCase(profile?.display_name) || "You"}
                  </h2>
                  {profile?.username && (
                    <div
                      style={{
                        fontFamily: SANS,
                        fontWeight: 300,
                        fontSize: 13,
                        color: "rgba(26,26,26,0.6)",
                        marginTop: 3,
                      }}
                    >
                      @{profile.username.toLowerCase()}
                    </div>
                  )}
                  {badge && (
                    <div
                      style={{
                        display: "inline-block",
                        marginTop: 10,
                        background: INNER,
                        borderRadius: 999,
                        padding: "5px 11px",
                        fontFamily: SANS,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "rgba(26,26,26,0.7)",
                        lineHeight: 1,
                      }}
                    >
                      {badge}
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => navigate("/account-settings/info")}
              aria-label="Edit profile"
              style={{
                flexShrink: 0,
                height: 34,
                padding: "0 15px",
                borderRadius: 9999,
                background: "transparent",
                color: INK,
                border: `1px solid ${PILL_BORDER}`,
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: "0.02em",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Pencil size={12} strokeWidth={2} color={INK} />
              Edit
            </button>
          </div>

          {/* Stats inner card */}
          <div
            style={{
              marginTop: 16,
              background: "#F2EFE5",
              borderRadius: 16,
              padding: "14px 6px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
            }}
          >
            {[
              { label: "SAVED", value: savedCount ?? 0, to: "#", clickable: false },
              { label: "FOLLOWING", value: counts?.following ?? 0, to: id ? `/profile/${id}/following` : "#", clickable: true },
              { label: counts?.followers === 1 ? "FOLLOWER" : "FOLLOWERS", value: counts?.followers ?? 0, to: id ? `/profile/${id}/followers` : "#", clickable: true },
            ].map((s, i) => {
              const inner = (
                <>
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, color: INK, lineHeight: 1 }}>
                    {fmtCount(s.value)}
                  </span>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      color: "rgba(26,26,26,0.6)",
                      marginTop: 7,
                    }}
                  >
                    {s.label}
                  </span>
                </>
              );
              const sharedStyle: React.CSSProperties = {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textDecoration: "none",
                borderLeft: i === 0 ? "none" : "1px solid rgba(26,26,26,0.12)",
              };
              return s.clickable ? (
                <Link key={s.label} to={s.to} style={sharedStyle}>{inner}</Link>
              ) : (
                <div key={s.label} style={sharedStyle}>{inner}</div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px 0" }}>
        <label
          style={{
            flex: 1,
            minWidth: 0,
            height: 48,
            background: CARD,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 18px",
          }}
        >
          <Search size={17} strokeWidth={1.8} color={SUBTLE} style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your saved"
            aria-label="Search your saved items"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: SANS,
              fontSize: 16,
              color: INK,
            }}
          />
        </label>
        <button
          type="button"
          onClick={openSheet}
          aria-label="Filter and sort"
          style={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: "50%",
            background: CARD,
            border: category ? `1.5px solid ${DARK_BROWN}` : "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <SlidersHorizontal size={18} strokeWidth={1.8} color={INK} />
        </button>
      </div>

      {/* Type pills */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 16,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: "0 20px",
        }}
        className="hide-scrollbar"
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={active}
              style={{
                flex: "0 0 auto",
                whiteSpace: "nowrap",
                background: active ? DARK_BROWN : CARD,
                color: active ? WHITE : INK,
                border: `1px solid ${active ? DARK_BROWN : PILL_BORDER}`,
                borderRadius: 999,
                padding: "9px 16px",
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.01em",
                lineHeight: 1.2,
              }}
            >
              {t.label} ({t.count})
            </button>
          );
        })}
      </div>

      {/* Result count + sort */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 20px 0",
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: 13, color: SUBTLE }}>
          {visible.length === 1 ? "1 Item" : `${visible.length} Items`}
        </span>
        <button
          type="button"
          onClick={openSheet}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 600,
            color: INK,
          }}
        >
          {category ? `${category} · ${sortLabel(sort)}` : sortLabel(sort)}
          <ChevronDown size={15} strokeWidth={2} color={INK} />
        </button>
      </div>

      {/* Saved grid */}
      <div style={{ padding: "14px 20px 0" }}>
        {visible.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {visible.map((it) => (
              <SavedCard
                key={`${it.type}-${it.id}`}
                it={it.raw}
                type={it.type}
                href={it.href}
                subtitle={it.subtitle}
                onUnsave={(e) => handleUnsave(e, it.id, it.type)}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              fontFamily: SANS,
              fontSize: 14,
              color: SUBTLE,
              letterSpacing: "0.01em",
            }}
          >
            {items.length === 0
              ? "Nothing saved yet. Tap the heart on anything you'd like to save and you can find it here later."
              : search.trim() || category
                ? "Nothing here matches that. Try clearing your search or filters."
                : "Nothing saved in this tab yet."}
          </div>
        )}
      </div>

      <SavedFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        sort={draftSort}
        onSortChange={setDraftSort}
        categories={categories}
        category={draftCategory}
        onCategoryChange={setDraftCategory}
        onReset={() => {
          setDraftSort("recent");
          setDraftCategory(null);
        }}
        onApply={applySheet}
        resultsCount={draftCount}
      />
    </div>
  );
};

export default MyProfile;
