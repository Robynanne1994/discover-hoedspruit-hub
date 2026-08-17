import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Search as SearchIcon,
  X,
  Folder,
  Calendar,
  Tag,
  User as UserIcon,
  Radio,
  ArrowUpRight,
  UserCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { formatEventDateRange } from "@/lib/eventDates";
import { mergeFeaturedFirst } from "@/lib/featuredFirst";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useIsFollowing, useFollowMutation } from "@/hooks/useFollows";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import Seo from "@/components/Seo";
import PageHeader from "@/components/PageHeader";
import {
  channelImage,
  eventImage,
  listingImage,
  specialSurfaceImage,
  CHANNEL_IMAGE_COLUMNS,
  EVENT_IMAGE_COLUMNS,
  LISTING_IMAGE_COLUMNS,
  SPECIAL_IMAGE_COLUMNS,
} from "@/lib/imageFallback";
import { MUTED as TOKEN_MUTED, type } from "@/lib/type";



const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const PAGE_BG = "#E6E0CC";
const WHITE = "#FFFFFF";
const DARK = "#423324";
const DARK_FG = "hsl(40 25% 98%)";
const MUTED = TOKEN_MUTED;
const ROW_DIVIDER = "hsl(37 20% 93%)";
const CHEVRON = "hsl(35 15% 72%)";
const AVATAR_BG = "hsl(37 39% 92%)";
const AVATAR_FG = "hsl(27 30% 34%)";

const pressScale = (s = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${s})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});


type Scope = "listings" | "events" | "specials" | "people" | "channels";

const SCOPES: { id: Scope; label: string; icon: React.ComponentType<any> }[] = [
  { id: "listings", label: "Listings", icon: Folder },
  { id: "events", label: "Events", icon: Calendar },
  { id: "specials", label: "Specials", icon: Tag },
  { id: "people", label: "People", icon: UserIcon },
  { id: "channels", label: "Local Channels", icon: Radio },
];

const isScope = (v: string | null): v is Scope =>
  v === "listings" || v === "events" || v === "specials" || v === "people" || v === "channels";

const initialsOf = (displayName?: string | null, username?: string | null): string => {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/).filter((w) => /^[a-z0-9]/i.test(w));
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return `${first}${second}`.toUpperCase();
  }
  if (username?.trim()) return username.trim().replace(/^@/, "")[0]?.toUpperCase() ?? "";
  return "";
};

const untilLabel = (date?: string | null): string | null => {
  if (!date) return null;
  try {
    return `Until ${format(new Date(`${date}T00:00:00`), "d MMM")}`;
  } catch {
    return null;
  }
};

/**
 * Always renders event dates as "22 Aug 2026" / "29 – 30 Aug 2026", never as
 * raw ISO. Falls back to the legacy free-text `date` field, but if that text is
 * itself ISO (one date or a range) it gets reformatted too.
 */
const eventDateLabel = (e: { date?: string | null; start_date?: string | null; end_date?: string | null }): string | null => {
  if (e.start_date) return formatEventDateRange(e) || null;
  const text = (e.date || "").replace(/<[^>]*>/g, "").trim();
  if (!text) return null;
  const isos = text.match(/\d{4}-\d{2}-\d{2}/g);
  if (isos?.length) {
    return formatEventDateRange({ start_date: isos[0], end_date: isos[1] ?? isos[0] }) || null;
  }
  return text;
};



const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fromProfileState = (location.state as { fromProfile?: boolean; profileId?: string } | null) ?? null;
  const fromProfile = !!fromProfileState?.fromProfile;
  const profileId = fromProfileState?.profileId;

  // The active tab lives in the URL (?tab=…) so it survives back-navigation:
  // tapping a result, opening its detail page and hitting back restores the
  // same tab instead of resetting to the first pill.
  const tabParam = searchParams.get("tab");
  const scope: Scope = isScope(tabParam) ? tabParam : fromProfile ? "people" : "listings";
  const setScope = (next: Scope) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("tab", next);
        return params;
      },
      { replace: true },
    );
  };

  const [query, setQuery] = useState("");
  const hasQuery = query.trim().length > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAGE_BG,
        paddingBottom: "calc(env(safe-area-inset-bottom) + 110px)",
      }}
    >
      <style>{`
        .hh-search-input::placeholder { color: hsl(25 8% 55%); }
        .hh-search-scopes { scrollbar-width: none; }
        .hh-search-scopes::-webkit-scrollbar { display: none; }
        .hh-search-row:hover { background: hsl(37 39% 97%); }
        .hh-search-row:last-child { border-bottom: none !important; }
      `}</style>
      <Seo
        title="Search — Hello Hoedspruit"
        description="Search Hello Hoedspruit listings, events, specials, people and local channels across the Lowveld."
        path="/search"
        noIndex
      />

      <PageHeader
        title="Search"
        onBack={() => {
          if (fromProfile && profileId) navigate("/my-profile");
          else navigate(-1);
        }}
      />

      {/* Search input */}
      <div style={{ padding: "16px 20px 12px" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <SearchIcon
            size={16}
            strokeWidth={1.8}
            color={MUTED}
            style={{ position: "absolute", left: 16, pointerEvents: "none" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings, events & specials"
            aria-label="Search"
            className="hh-search-input"
            style={{
              width: "100%",
              boxSizing: "border-box",
              height: 48,
              border: "none",
              borderRadius: 24,
              background: WHITE,
              padding: "0 42px",
              ...type.cardTitleM,
              fontWeight: 400,
              color: INK,
              outline: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          />
          {hasQuery && (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => setQuery("")}
              style={{
                position: "absolute",
                right: 6,
                width: 36,
                height: 36,
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "hsl(35 15% 88%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={11} strokeWidth={2.5} color={INK} />
              </span>
            </button>
          )}
        </div>
      </div>


      {/* Scope chips */}
      <div
        className="hh-search-scopes"
        style={{ padding: "2px 16px 14px", display: "flex", gap: 8, overflowX: "auto" }}
      >
        {SCOPES.map((s) => {
          const active = scope === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setScope(s.id)}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 15px",
                border: "none",
                borderRadius: 20,
                background: active ? DARK : WHITE,
                ...type.meta,
                color: active ? DARK_FG : INK,
                whiteSpace: "nowrap",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                transition: "transform 150ms ease-out",
              }}
              {...pressScale()}
            >
              <Icon size={14} strokeWidth={1.8} color={active ? DARK_FG : INK} style={{ flexShrink: 0 }} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <p
          style={{
            margin: "6px 2px 2px",
            ...type.eyebrow,
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          {hasQuery ? "Results" : "Suggested"}
        </p>
        <div
          style={{
            background: WHITE,
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(61,51,41,0.07)",
          }}
        >
          {scope === "listings" && <ListingsResults query={query} />}
          {scope === "events" && <EventsResults query={query} />}
          {scope === "specials" && <SpecialsResults query={query} />}
          {scope === "people" && <PeopleResults query={query} />}
          {scope === "channels" && <ChannelsResults query={query} />}
        </div>
        {!hasQuery && scope !== "people" && (
          <DiscoverMore
            to={
              scope === "listings"
                ? "/categories"
                : scope === "events"
                  ? "/events"
                  : scope === "channels"
                    ? "/local-channels"
                    : "/specials"
            }
            label="Discover More"
          />
        )}

      </div>
    </div>
  );
};

/* -------------------- Card states -------------------- */

const LoadingRow = () => (
  <div style={{ ...type.meta, padding: "32px 20px", textAlign: "center" }}>
    Loading…
  </div>
);

const EmptyState = ({ query, fallback }: { query: string; fallback: string }) => {
  const term = query.trim();
  return (
    <div style={{ padding: "32px 20px", textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={type.cardTitleM}>
        {term ? <>No results for &ldquo;{term}&rdquo;</> : fallback}
      </span>
      <span style={type.meta}>
        Try a different word, or switch to another tab above.
      </span>
    </div>
  );
};

const ErrorRow = ({ onRetry, isFetching }: { onRetry: () => void; isFetching?: boolean }) => (
  <div style={{ padding: "28px 20px", textAlign: "center" }}>
    <p style={{ ...type.body, margin: "0 0 14px" }}>
      Something went wrong. Please check your connection and try again.
    </p>
    <button
      onClick={onRetry}
      disabled={isFetching}
      style={{ background: DARK, color: "#fff", border: "none", borderRadius: 999, height: 40, padding: "0 22px", ...type.button, cursor: isFetching ? "default" : "pointer", opacity: isFetching ? 0.6 : 1 }}
    >
      {isFetching ? "Trying…" : "Try again"}
    </button>
  </div>
);

/* -------------------- Follow action -------------------- */

const RowFollowButton = ({ targetUserId }: { targetUserId: string }) => {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const { data: status, isLoading } = useIsFollowing(targetUserId);
  const { follow, unfollow } = useFollowMutation(targetUserId);

  const { data: followsMe } = useQuery({
    queryKey: ["follows-me", user?.id, targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("status")
        .eq("follower_id", targetUserId)
        .eq("following_id", user!.id)
        .eq("status", "accepted")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });

  if (user && user.id === targetUserId) return null;

  const isAccepted = status === "accepted";
  const isPending = status === "pending";
  const busy = follow.isPending || unfollow.isPending;
  const label = isAccepted ? "Unfollow" : isPending ? "Requested" : followsMe ? "Follow Back" : "Follow";
  const outlined = isAccepted || isPending;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!requireAuth("follow people")) return;
        if (isAccepted || isPending) unfollow.mutate();
        else follow.mutate();
      }}
      disabled={isLoading || busy}
      {...pressScale()}
      style={{
        flexShrink: 0,
        height: 32,
        padding: "0 14px",
        borderRadius: 999,
        ...type.meta,
        cursor: "pointer",
        transition: "transform 0.12s ease",
        background: outlined ? "transparent" : DARK,
        color: outlined ? "#715A3D" : "#FFFFFF",
        border: outlined ? "1.5px solid #715A3D" : "none",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
};

/* -------------------- Row -------------------- */

interface RowProps {
  /** An in-app path, or an `http…` address for a channel with no page of its own. */
  to: string;
  image?: string | null;
  title: string;
  titleOverride?: string | null;
  subtitle?: string | null;
  initials?: string;
  /** People rows use the dark avatar treatment from the design. */
  dark?: boolean;
  /** Replaces the trailing arrow (used for follow buttons). */
  action?: React.ReactNode;
}
const ResultRow = ({ to, image, title, titleOverride, subtitle, initials, dark, action }: RowProps) => {
  const hasOverride = !!(titleOverride && titleOverride.trim());
  const display = hasOverride ? titleOverride!.trim() : title;
  // A Local Channel with no page of its own opens straight at its platform,
  // the same as tapping its card on the Local Channels list.
  const external = /^https?:\/\//i.test(to);
  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderBottom: `1px solid ${ROW_DIVIDER}`,
    textDecoration: "none",
  };
  const Row = external
    ? ({ children }: { children: React.ReactNode }) => (
        <a href={to} target="_blank" rel="noopener noreferrer" className="hh-search-row" style={rowStyle}>
          {children}
        </a>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <Link to={to} className="hh-search-row" style={rowStyle}>
          {children}
        </Link>
      );
  return (
    <Row>
      <div
        style={{
          width: 42,
          height: 42,
          flexShrink: 0,
          borderRadius: "50%",
          background: dark ? DARK : AVATAR_BG,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {image ? (
          <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : initials ? (
          <span
            style={{
              ...type.cardTitleS,
              color: dark ? DARK_FG : AVATAR_FG,
              textTransform: "uppercase",
            }}
          >
            {initials}
          </span>
        ) : (
          <UserCircle size={26} color={dark ? DARK_FG : AVATAR_FG} strokeWidth={1.6} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          {...(hasOverride ? { "data-no-title-case": "true" } : {})}
          style={{
            ...type.cardTitleM,
            color: INK,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {display}
        </span>
        {subtitle && (
          <span
            style={{
              ...type.meta,
              color: MUTED,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
      {action ?? (
        <ArrowUpRight size={18} strokeWidth={2} color="#715A3D" style={{ flexShrink: 0 }} />
      )}
    </Row>
  );
};

/* -------------------- Discover more -------------------- */

const DiscoverMore = ({ to, label }: { to: string; label: string }) => (
  <Link
    to={to}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 48,
      margin: "4px 0 0",
      borderRadius: 9999,
      background: DARK,
      ...type.cardTitleM,
      color: "#FFFFFF",

      textDecoration: "none",
      transition: "transform 0.12s ease, opacity 0.12s ease",
    }}
    {...pressScale()}
  >
    {label}
    <ArrowUpRight size={18} strokeWidth={2} color="#FFFFFF" />
  </Link>
);


/* -------------------- Results: Listings -------------------- */

const SEARCH_COLUMNS = `id, title, title_override, location, is_featured, ${LISTING_IMAGE_COLUMNS}`;
const SUGGESTED_LIMIT = 15;

const ListingsResults = ({ query }: { query: string }) => {
  const term = query.trim();
  const { data, isError, refetch, isFetching } = useQuery({
    queryKey: ["search-listings", term],
    queryFn: async () => {
      // When there's no query, prefer admin-curated suggestions if any —
      // but featured listings still take the top slots ahead of them.
      if (!term) {
        const { data: curated } = await supabase
          .from("site_content")
          .select("content")
          .eq("section", "search-suggested-listings")
          .maybeSingle();
        const ids = Array.isArray(curated?.content) ? (curated!.content as string[]) : [];
        if (ids.length) {
          const [{ data, error }, { data: featured }] = await Promise.all([
            supabase
              .from("listings")
              .select(SEARCH_COLUMNS)
              .in("id", ids),
            supabase
              .from("listings")
              .select(SEARCH_COLUMNS)
              .eq("is_featured", true)
              .order("created_at", { ascending: false })
              .limit(SUGGESTED_LIMIT),
          ]);
          if (error) throw error;
          const map = new Map((data || []).map((l) => [l.id, l]));
          const curatedListings = ids.map((id) => map.get(id)).filter(Boolean) as any[];
          return mergeFeaturedFirst([featured, curatedListings], SUGGESTED_LIMIT);
        }
      }
      let q = supabase
        .from("listings")
        .select(SEARCH_COLUMNS)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(term ? 50 : SUGGESTED_LIMIT);
      if (term) q = q.ilike("title", `%${term}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
  if (isError) return <ErrorRow onRetry={() => refetch()} isFetching={isFetching} />;
  if (!data) return <LoadingRow />;
  if (data.length === 0) return <EmptyState query={query} fallback="No listings yet" />;
  return (
    <>
      {data.map((l) => (
        <ResultRow
          key={l.id}
          to={`/listing/${l.id}`}
          image={listingImage(l, "search")}
          title={l.title}
          titleOverride={(l as any).title_override}
          subtitle={l.location || null}
          initials={initialsOf((l as any).title_override || l.title)}
        />
      ))}
    </>
  );
};

/* -------------------- Results: Events -------------------- */

const EventsResults = ({ query }: { query: string }) => {
  const term = query.trim();
  const { data, isError, refetch, isFetching } = useQuery({
    queryKey: ["search-events", term],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      let q = supabase
        .from("events")
        .select(`id, title, title_override, location, date, start_date, end_date, is_featured, ${EVENT_IMAGE_COLUMNS}`)
        .or(`start_date.is.null,start_date.gte.${today}`)
        // Featured events pin to the top, then the soonest first
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true, nullsFirst: false })
        .limit(term ? 50 : 10);
      if (term) q = q.ilike("title", `%${term}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
  if (isError) return <ErrorRow onRetry={() => refetch()} isFetching={isFetching} />;
  if (!data) return <LoadingRow />;
  if (data.length === 0) return <EmptyState query={query} fallback="No upcoming events" />;
  return (
    <>
      {data.map((e) => (
        <ResultRow
          key={e.id}
          to={`/events/${e.id}`}
          image={eventImage(e, "search")}
          title={e.title}
          titleOverride={(e as any).title_override}
          subtitle={[eventDateLabel(e as any), e.location].filter(Boolean).join(" · ") || null}
          initials={initialsOf((e as any).title_override || e.title)}
        />
      ))}
    </>
  );
};

/* -------------------- Results: Specials -------------------- */

const SpecialsResults = ({ query }: { query: string }) => {
  const term = query.trim();
  const { data, isError, refetch, isFetching } = useQuery({
    queryKey: ["search-specials", term],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      let q = supabase
        .from("specials")
        .select(`id, title, title_override, business_name, valid_until, is_featured, ${SPECIAL_IMAGE_COLUMNS}`)
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        // Featured deals pin to the top, then the most recently added
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(term ? 50 : 10);
      if (term) q = q.ilike("title", `%${term}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
  if (isError) return <ErrorRow onRetry={() => refetch()} isFetching={isFetching} />;
  if (!data) return <LoadingRow />;
  if (data.length === 0) return <EmptyState query={query} fallback="No active specials" />;
  return (
    <>
      {data.map((s) => (
        <ResultRow
          key={s.id}
          to={`/specials/${s.id}`}
          image={specialSurfaceImage(s, "search")}
          title={s.title}
          titleOverride={(s as any).title_override}
          subtitle={[s.business_name, untilLabel(s.valid_until)].filter(Boolean).join(" · ") || null}
          initials={initialsOf((s as any).title_override || s.title)}
        />
      ))}
    </>
  );
};

/* -------------------- Results: Local Channels -------------------- */

const ChannelsResults = ({ query }: { query: string }) => {
  const term = query.trim();
  const { data, isError, refetch, isFetching } = useQuery({
    queryKey: ["search-channels", term],
    queryFn: async () => {
      let q = supabase
        .from("bush_telegraph_resources")
        .select(`id, title, title_override, slug, url, platform, meta, is_featured, sort_order, ${CHANNEL_IMAGE_COLUMNS}`)
        // Same order as the Local Channels page: featured first, then the
        // admin's own arrangement.
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(term ? 50 : SUGGESTED_LIMIT);
      if (term) q = q.ilike("title", `%${term}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
  if (isError) return <ErrorRow onRetry={() => refetch()} isFetching={isFetching} />;
  if (!data) return <LoadingRow />;
  if (data.length === 0) return <EmptyState query={query} fallback="No local channels yet" />;
  return (
    <>
      {data.map((c: any) => (
        <ResultRow
          key={c.id}
          // A channel without a page of its own opens at its platform, exactly
          // as its card does on the Local Channels list.
          to={c.slug ? `/local-channels/${c.slug}` : c.url || "/local-channels"}
          image={channelImage(c, "search")}
          title={c.title}
          titleOverride={c.title_override}
          subtitle={[c.platform, c.meta].filter(Boolean).join(" · ") || null}
          initials={initialsOf(c.title_override || c.title)}
        />
      ))}
    </>
  );
};

/* -------------------- Results: People -------------------- */

const PeopleResults = ({ query }: { query: string }) => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const term = query.trim();

  const { data: blocks } = useBlockedUsers();
  const iBlocked = blocks?.iBlocked;
  const blockedMe = blocks?.blockedMe;

  const { data: rows, isError, refetch, isFetching } = useQuery({
    queryKey: [
      "search-people",
      term,
      currentUserId,
      Array.from(iBlocked ?? []).sort().join(","),
      Array.from(blockedMe ?? []).sort().join(","),
    ],
    queryFn: async () => {
      // Keep a profile if (a) they did not block me, and (b) for passive
      // discovery, I did not block them. When the user types a search term
      // we still hide users who blocked me, but we allow users I blocked
      // through so I can still look them up by name/username.
      const applyBlocks = (list: any[]) => {
        const t = term.toLowerCase();
        return list.filter((p: any) => {
          if (blockedMe?.has(p.id)) return false;
          if (iBlocked?.has(p.id)) {
            if (!t) return false;
            const name = (p.display_name || "").toLowerCase();
            const handle = (p.username || "").toLowerCase();
            return name.includes(t) || handle.includes(t);
          }
          return true;
        });
      };

      let followingIds: string[] = [];
      let followerIds: string[] = [];
      if (currentUserId) {
        const [outRes, inRes] = await Promise.all([
          supabase.from("follows").select("following_id").eq("follower_id", currentUserId),
          supabase
            .from("follows")
            .select("follower_id")
            .eq("following_id", currentUserId)
            .eq("status", "accepted"),
        ]);
        followingIds = (outRes.data || []).map((r: any) => r.following_id);
        followerIds = (inRes.data || []).map((r: any) => r.follower_id);
      }
      const { data: discover, error: discoverErr } = await supabase.rpc("search_public_profiles", {
        _term: term || "",
        _limit: 50,
      });
      if (discoverErr) throw discoverErr;
      // Merge in followers (people who follow me) that I don't follow back,
      // so they surface as suggested.
      const notFollowedBackIds = followerIds.filter((id) => !followingIds.includes(id));
      let followerProfiles: any[] = [];
      if (notFollowedBackIds.length) {
        const { data, error } = await supabase.rpc("get_public_profiles", { _ids: notFollowedBackIds });
        if (error) throw error;
        followerProfiles = data || [];
      }
      // Without a search term this is passive discovery: skip people I
      // already follow. With a term, let anyone match so I can look up
      // people I follow too.
      const excluded = new Set<string>(term ? [] : followingIds);
      if (currentUserId) excluded.add(currentUserId);
      const merged: any[] = [];
      const seen = new Set<string>();
      for (const p of [...followerProfiles, ...(discover || [])]) {
        if (excluded.has(p.id) || seen.has(p.id)) continue;
        if (term) {
          const t = term.toLowerCase();
          const name = (p.display_name || "").toLowerCase();
          const handle = (p.username || "").toLowerCase();
          if (!name.includes(t) && !handle.includes(t)) continue;
        }
        seen.add(p.id);
        merged.push(p);
      }
      return applyBlocks(merged);
    },
    enabled: !currentUserId || blocks !== undefined,
    // Who is discoverable changes as blocks, unblocks and follows happen, and
    // the global cache would otherwise hand back a list built while a block was
    // still in place (see App.tsx defaults).
    staleTime: 0,
    refetchOnMount: "always",
  });

  if (isError) return <ErrorRow onRetry={() => refetch()} isFetching={isFetching} />;
  if (!rows) return <LoadingRow />;
  if (rows.length === 0) return <EmptyState query={query} fallback="No people to suggest" />;
  return (
    <>
      {rows.map((u: any) => (
        <ResultRow
          key={u.id}
          to={`/profile/${u.id}`}
          image={u.avatar_url}
          title={u.display_name || u.username || "User"}
          titleOverride={u.display_name || u.username}
          subtitle={u.username ? `@${u.username}` : null}
          initials={initialsOf(u.display_name, u.username)}
          dark
          action={<RowFollowButton targetUserId={u.id} />}
        />

      ))}
    </>
  );
};

export default Search;
