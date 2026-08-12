import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollowCounts, useFollowRequestCount } from "@/hooks/useFollows";
import { ChevronDown, ChevronRight, Pencil, Search, Settings, User, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import SavedCard from "@/components/profile/SavedCard";
import Seo from "@/components/Seo";
import { toast } from "sonner";
import { residencyBadge } from "@/lib/residencyBadge";
import { MUTED, tab as tabStyle, type } from "@/lib/type";


const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INNER = "#EFE7D3";
const INK = "#1A1A1A";
const SUBTLE = MUTED;
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

// Anything dated within this window counts as "happening soon" and is pulled to
// the top of the All grid ahead of the plain recently-saved run.
const SOON_WINDOW = 7 * 24 * 60 * 60 * 1000;

// A saved item of any kind, flattened into the single shape the grid, the
// search box and the ordering all read from.
type SavedItem = {
  id: string;
  type: "listing" | "event" | "special" | "resource";
  raw: any;
  href: string;
  subtitle: React.ReactNode;
  title: string;
  savedAt: number;
  /**
   * When this item happens or stops being valid — an event's start, a deal's
   * expiry. Null for listings and resources, which never go out of date.
   */
  dueAt: number | null;
  /** Event already over, deal already expired. */
  isPast: boolean;
  /** Lower-cased haystack for the search box. */
  search: string;
  /** Category chips this item answers to (listing category, resource platform). */
  tags: string[];
};

// Upcoming/active: soonest first, undated items after them, then newest saved.
// Past/expired: most recently finished first.
const byDate = (past: boolean) => (a: SavedItem, b: SavedItem) => {
  if (a.dueAt == null || b.dueAt == null) {
    if (a.dueAt !== b.dueAt) return a.dueAt == null ? 1 : -1;
    return b.savedAt - a.savedAt;
  }
  return past ? b.dueAt - a.dueAt : a.dueAt - b.dueAt;
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
  // One sub-filter per tab, each on a single axis the tab actually has. The old
  // Filter & Sort sheet stacked category, item type and time state into one chip
  // row and offered a Rating sort that only listings could answer, so three of
  // the four tabs had controls that quietly did nothing.
  const [category, setCategory] = useState<string | null>(null);
  const [eventsSub, setEventsSub] = useState<"upcoming" | "past">("upcoming");
  const [dealsSub, setDealsSub] = useState<"active" | "expired">("active");
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    // Personal profile is for signed-in users. Guests are sent to the
    // browsable guest profile (which offers sign-in), never a full-screen wall.
    if (!user) navigate("/my-profile-guest", { replace: true });
  }, [authLoading, user, navigate]);

  // Sub-filters are derived per tab, so a choice made on one tab can't survive
  // onto the next and silently empty the grid.
  useEffect(() => {
    setCategory(null);
    setEventsSub("upcoming");
    setDealsSub("active");
    setShowPast(false);
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
    toast("Removed from saved");
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
  // Follow requests used to be reachable only from Account Settings → Account
  // Privacy, three taps in and only while the account is private, so people
  // waiting for approval were easy to miss entirely. Surface them where the
  // account itself lives.
  const { data: pendingRequests } = useFollowRequestCount();

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
        .select("id, title, title_override, image_url, saved_image_url, location, google_rating, google_reviews_count, category_id, opening_hours, categories(title)")
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
        .select("id, title, title_override, image_url, saved_image_url, location, start_date, end_date, start_time, date, tag")
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
        .select("id, title, title_override, image_url, saved_image_url, business_name, valid_until, badge_override, day_of_week, discount_type, discount_value, freebie_text, card_deal_text, redemption_note, tag, card_footer_text, price, price_label, original_price, savings")
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
      dueAt: null,
      isPast: false,
      search: `${it.title ?? ""} ${it.location ?? ""} ${it.categories?.title ?? ""}`.toLowerCase(),
      tags: it.categories?.title ? [chipLabel(it.categories.title)] : [],
    }));

    const specials: SavedItem[] = (savedSpecials ?? []).map((it: any) => {
      const endsAt = it.valid_until ? at(it.valid_until) : null;
      return {
        id: it.id,
        type: "special" as const,
        raw: it,
        href: `/specials/${it.id}`,
        subtitle: it.business_name ? titleCase(it.business_name) : null,
        title: titleCase(it.title),
        savedAt: at(it.created_at),
        dueAt: endsAt,
        isPast: endsAt != null && endsAt < now,
        search: `${it.title ?? ""} ${it.business_name ?? ""} ${it.tag ?? ""}`.toLowerCase(),
        tags: [],
      };
    });

    const events: SavedItem[] = (savedEvents ?? []).map((it: any) => {
      // Runs until the end date, but the date that matters for ordering is when
      // it starts — that's what you'd be counting down to.
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
        dueAt: it.start_date ? at(it.start_date) : ref ? at(ref) : null,
        isPast: past,
        search: `${it.title ?? ""} ${it.location ?? ""} ${it.tag ?? ""}`.toLowerCase(),
        tags: [],
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
        dueAt: null,
        isPast: false,
        search: `${displayTitle ?? ""} ${metaParts.join(" ")} ${it.platform ?? ""}`.toLowerCase(),
        tags: it.platform ? [chipLabel(it.platform)] : [],
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

  // Category chips, and only on the two tabs that have a real category to
  // offer: a listing's category and a resource's platform. Deals and events are
  // filtered by time instead, which is the axis that actually matters there.
  const categories = useMemo(() => {
    if (tab !== "listings" && tab !== "resources") return [];
    const counts = new Map<string, number>();
    tabItems.forEach((it) => it.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([t]) => t);
  }, [tabItems, tab]);

  // The sub-filter row for the current tab. Time state where the content
  // expires, categories where it doesn't, nothing at all on All.
  const subFilter = useMemo(() => {
    if (tab === "events")
      return {
        value: eventsSub,
        onChange: (v: string) => setEventsSub(v as "upcoming" | "past"),
        options: [
          { id: "upcoming", label: "Upcoming" },
          { id: "past", label: "Past" },
        ],
      };
    if (tab === "deals")
      return {
        value: dealsSub,
        onChange: (v: string) => setDealsSub(v as "active" | "expired"),
        options: [
          { id: "active", label: "Active" },
          { id: "expired", label: "Expired" },
        ],
      };
    // A lone category chip filters nothing — every item on the tab carries it.
    if (categories.length > 1)
      return {
        value: category ?? "all",
        onChange: (v: string) => setCategory(v === "all" ? null : v),
        options: [{ id: "all", label: "All" }, ...categories.map((c) => ({ id: c, label: c }))],
      };
    return null;
  }, [tab, eventsSub, dealsSub, categories, category]);

  // The grid, split into what is still ahead of you and what has already been
  // and gone. Past events and expired deals are real clutter in a saved list,
  // so on All they sit behind a toggle underneath rather than in the grid.
  const { current, past } = useMemo(() => {
    const now = Date.now();
    const q = search.trim().toLowerCase();
    let list = tabItems.filter((it) => !q || it.search.includes(q));

    if (tab === "events") list = list.filter((it) => (eventsSub === "past" ? it.isPast : !it.isPast));
    else if (tab === "deals") list = list.filter((it) => (dealsSub === "expired" ? it.isPast : !it.isPast));
    else if (category) list = list.filter((it) => it.tags.includes(category));

    // On a single-type tab the pill row already says which half you asked for,
    // so nothing is held back below the grid.
    if (tab !== "all") {
      const over = (tab === "events" && eventsSub === "past") || (tab === "deals" && dealsSub === "expired");
      const sorted = [...list];
      if (tab === "events" || tab === "deals") sorted.sort(byDate(over));
      else sorted.sort((a, b) => b.savedAt - a.savedAt);
      return { current: sorted, past: [] as SavedItem[] };
    }

    // Anything happening in the next week leads, soonest first, then the rest
    // by most recently saved. No sort control: this is what you'd have picked.
    const soon = (it: SavedItem) => it.dueAt != null && it.dueAt - now <= SOON_WINDOW;
    const upcoming = list
      .filter((it) => !it.isPast)
      .sort((a, b) => {
        const [sa, sb] = [soon(a), soon(b)];
        if (sa !== sb) return sa ? -1 : 1;
        if (sa && sb) return (a.dueAt ?? 0) - (b.dueAt ?? 0);
        return b.savedAt - a.savedAt;
      });
    return { current: upcoming, past: list.filter((it) => it.isPast).sort(byDate(true)) };
  }, [tabItems, search, category, tab, eventsSub, dealsSub]);

  // Searching is deliberate, so a match that happens to be over still shows.
  const pastOpen = showPast || !!search.trim();

  const badge = residencyBadge(profile?.location);

  // Initials fallback avatar: first letter of the first and last name parts.
  const nameParts = (profile?.display_name || "").trim().split(/\s+/).filter(Boolean);
  const initials = nameParts.length
    ? (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase()
    : "";


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
        <section
          style={{
            position: "relative",
            background: CARD,
            borderRadius: 18,
            border: "none",
            boxShadow: "0 1px 4px -1px rgba(0,0,0,0.04)",
            padding: "26px 20px 20px",
          }}
        >
          <button
            onClick={() => navigate("/account-settings/info")}
            aria-label="Edit profile"
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#F5F0E8",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 120ms ease-out",
            }}
          >
            <Pencil size={18} strokeWidth={1.5} color={DARK_BROWN} />
          </button>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div
              style={{
                width: 88,
                height: 88,
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
                <span
                  style={{
                    fontFamily: HEAD,
                    fontWeight: 550,
                    fontSize: 30,
                    letterSpacing: "-0.02em",
                    color: DARK_BROWN,
                  }}
                >
                  {initials}
                </span>
              )}
            </div>

            {isLoading ? (
              <Skeleton className="h-7 w-40" style={{ marginTop: 16 }} />
            ) : (
              <>
                <h2
                  style={{
                    fontFamily: HEAD,
                    fontWeight: 550,
                    fontSize: 23,
                    lineHeight: 1.15,
                    letterSpacing: "-0.02em",
                    color: INK,
                    margin: 0,
                    marginTop: 16,
                  }}
                >
                  {titleCase(profile?.display_name) || "You"}
                </h2>
                {profile?.username && (
                  <div
                    style={{
                      fontFamily: SANS,
                      fontWeight: 400,
                      fontSize: 13,
                      color: "#6B6A5E",
                      marginTop: 4,
                    }}
                  >
                    @{profile.username.toLowerCase()}
                  </div>
                )}
                {badge && (
                  <div
                    style={{
                      display: "inline-block",
                      marginTop: 12,
                      background: INNER,
                      borderRadius: 999,
                      padding: "5px 11px",
                      fontFamily: SANS,
                      fontWeight: 600,
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: DARK_BROWN,
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                    }}
                  >
                    {badge}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Stats inner card */}
          <div
            style={{
              marginTop: 20,
              background: "#F2EFE5",
              borderRadius: 14,
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
                  <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 20, lineHeight: 1, color: INK }}>
                    {fmtCount(s.value)}
                  </span>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontWeight: 600,
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#6B6A5E",
                      marginTop: 6,
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
                borderLeft: i === 0 ? "none" : "1px solid rgba(26,26,26,0.1)",
              };
              return s.clickable ? (
                <Link key={s.label} to={s.to} style={sharedStyle}>{inner}</Link>
              ) : (
                <div key={s.label} style={sharedStyle}>{inner}</div>
              );
            })}
          </div>


          {/* Waiting follow requests. Only shown when there is something to
              act on, so a public account never sees a row it can't use. */}
          {!!pendingRequests && (
            <Link
              to="/follow-requests"
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: INNER,
                borderRadius: 14,
                padding: "12px 14px",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: DARK_BROWN,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <UserPlus size={15} strokeWidth={2} color="#FFFFFF" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={type.cardTitleM}>
                  Follow requests
                </div>
                <div style={{ ...type.meta, marginTop: 2 }}>
                  {pendingRequests} {pendingRequests === 1 ? "person is" : "people are"} waiting for your approval
                </div>
              </div>
              <ChevronRight size={18} strokeWidth={1.8} color={INK} style={{ flexShrink: 0 }} />
            </Link>
          )}
        </section>
      </div>

      {/* Search */}
      <div style={{ padding: "18px 20px 0" }}>
        <label
          style={{
            width: "100%",
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
              onClick={() => setTab(t.id === tab ? "all" : t.id)}
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

      {/* Sub-filter for the current tab. One axis, always one the tab has. */}
      {subFilter && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            padding: "0 20px",
          }}
          className="hide-scrollbar"
        >
          {subFilter.options.map((o) => {
            const active = subFilter.value === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => subFilter.onChange(o.id)}
                aria-pressed={active}
                style={{
                  flex: "0 0 auto",
                  whiteSpace: "nowrap",
                  // Reads as secondary to the type pills above: no card fill
                  // when it's off, so the two rows never compete.
                  background: active ? DARK_BROWN : "transparent",
                  color: active ? WHITE : INK,
                  border: `1px solid ${active ? DARK_BROWN : "rgba(26,26,26,0.14)"}`,
                  borderRadius: 999,
                  padding: "6px 14px",
                  cursor: "pointer",
                  ...tabStyle(active),
                  lineHeight: 1.2,
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Result count */}
      <div style={{ padding: "16px 20px 0" }}>
        <span style={type.meta}>
          {current.length === 1 ? "1 Item" : `${current.length} Items`}
        </span>
      </div>

      {/* Saved grid */}
      <div style={{ padding: "14px 20px 0" }}>
        {current.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {current.map((it) => (
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
                : past.length
                  ? "Nothing coming up. Everything you've saved has already been and gone."
                  : "Nothing saved in this tab yet."}
          </div>
        )}

        {/* Been and gone. Kept out of the grid above so a saved list doesn't
            fill up with events that already happened, but still reachable. */}
        {past.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowPast((v) => !v)}
              aria-expanded={pastOpen}
              style={{
                width: "100%",
                marginTop: current.length ? 20 : 0,
                background: "none",
                border: "none",
                borderTop: `1px solid rgba(26,26,26,0.10)`,
                padding: "16px 0 0",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                color: INK,
              }}
            >
              {pastOpen ? "Hide" : "Show"} Past ({past.length})
              <ChevronDown
                size={15}
                strokeWidth={2}
                color={INK}
                style={{
                  transform: pastOpen ? "rotate(180deg)" : "none",
                  transition: "transform 200ms ease",
                }}
              />
            </button>

            {pastOpen && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginTop: 14,
                  // Dimmed so the two groups stay legible as separate things
                  // even once you've scrolled past the divider.
                  opacity: 0.62,
                }}
              >
                {past.map((it) => (
                  <SavedCard
                    key={`past-${it.type}-${it.id}`}
                    it={it.raw}
                    type={it.type}
                    href={it.href}
                    subtitle={it.subtitle}
                    onUnsave={(e) => handleUnsave(e, it.id, it.type)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
