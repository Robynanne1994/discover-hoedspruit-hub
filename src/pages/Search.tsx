import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Search as SearchIcon,
  X,
  Folder,
  Calendar,
  Tag,
  User as UserIcon,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import Seo from "@/components/Seo";
import PageHeader from "@/components/PageHeader";


const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const PAGE_BG = "#E6E0CC";
const WHITE = "#FFFFFF";
const DARK = "#423324";
const DARK_FG = "hsl(40 25% 98%)";
const MUTED = "hsl(25 8% 48%)";
const ROW_DIVIDER = "hsl(37 20% 93%)";
const CHEVRON = "hsl(35 15% 72%)";
const AVATAR_BG = "hsl(37 39% 92%)";
const AVATAR_FG = "hsl(27 30% 34%)";

const pressScale = (s = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${s})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});


type Scope = "listings" | "events" | "specials" | "people";

const SCOPES: { id: Scope; label: string; icon: React.ComponentType<any> }[] = [
  { id: "listings", label: "Listings", icon: Folder },
  { id: "events", label: "Events", icon: Calendar },
  { id: "specials", label: "Specials", icon: Tag },
  { id: "people", label: "People", icon: UserIcon },
];

const isScope = (v: string | null): v is Scope =>
  v === "listings" || v === "events" || v === "specials" || v === "people";

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
        description="Search Hello Hoedspruit listings, events, specials and people across the Lowveld."
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
              fontFamily: FONT,
              fontSize: 15,
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
                color: active ? DARK_FG : INK,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 600,
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
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
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
        </div>
      </div>
    </div>
  );
};

/* -------------------- Card states -------------------- */

const LoadingRow = () => (
  <div style={{ padding: "32px 20px", textAlign: "center", fontFamily: FONT, fontSize: 13, color: MUTED }}>
    Loading…
  </div>
);

const EmptyState = ({ query, fallback }: { query: string; fallback: string }) => {
  const term = query.trim();
  return (
    <div style={{ padding: "32px 20px", textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK }}>
        {term ? <>No results for &ldquo;{term}&rdquo;</> : fallback}
      </span>
      <span style={{ fontFamily: FONT, fontSize: 13, color: MUTED }}>
        Try a different word, or switch to another tab above.
      </span>
    </div>
  );
};

const ErrorRow = ({ onRetry, isFetching }: { onRetry: () => void; isFetching?: boolean }) => (
  <div style={{ padding: "28px 20px", textAlign: "center" }}>
    <p style={{ fontFamily: FONT, fontSize: 14, color: "rgba(18,18,20,0.7)", margin: "0 0 14px", lineHeight: 1.5 }}>
      Something went wrong. Please check your connection and try again.
    </p>
    <button
      onClick={onRetry}
      disabled={isFetching}
      style={{ background: DARK, color: "#fff", border: "none", borderRadius: 999, height: 40, padding: "0 22px", fontFamily: FONT, fontSize: 13, fontWeight: 500, cursor: isFetching ? "default" : "pointer", opacity: isFetching ? 0.6 : 1 }}
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
        fontFamily: FONT,
        fontSize: 12,
        fontWeight: 600,
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
  return (
    <Link
      to={to}
      className="hh-search-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderBottom: `1px solid ${ROW_DIVIDER}`,
        textDecoration: "none",
      }}
    >
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
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 700,
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
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 700,
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
              fontFamily: FONT,
              fontSize: 12,
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
    </Link>
  );
};


/* -------------------- Results: Listings -------------------- */

const ListingsResults = ({ query }: { query: string }) => {
  const term = query.trim();
  const { data, isError, refetch, isFetching } = useQuery({
    queryKey: ["search-listings", term],
    queryFn: async () => {
      // When there's no query, prefer admin-curated suggestions if any.
      if (!term) {
        const { data: curated } = await supabase
          .from("site_content")
          .select("content")
          .eq("section", "search-suggested-listings")
          .maybeSingle();
        const ids = Array.isArray(curated?.content) ? (curated!.content as string[]) : [];
        if (ids.length) {
          const { data, error } = await supabase
            .from("listings")
            .select("id, title, title_override, location, image_url, is_featured")
            .in("id", ids);
          if (error) throw error;
          const map = new Map((data || []).map((l) => [l.id, l]));
          return ids.map((id) => map.get(id)).filter(Boolean) as any[];
        }
      }
      let q = supabase
        .from("listings")
        .select("id, title, title_override, location, image_url, is_featured")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(term ? 50 : 15);
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
          image={l.image_url}
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
        .select("id, title, title_override, location, image_url, date, start_date")
        .or(`start_date.is.null,start_date.gte.${today}`)
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
          image={e.image_url}
          title={e.title}
          titleOverride={(e as any).title_override}
          subtitle={[e.date, e.location].filter(Boolean).join(" · ") || null}
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
        .select("id, title, title_override, business_name, image_url, deal_label, valid_until")
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
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
          image={s.image_url}
          title={s.title}
          titleOverride={(s as any).title_override}
          subtitle={[s.business_name, untilLabel(s.valid_until)].filter(Boolean).join(" · ") || null}
          initials={initialsOf((s as any).title_override || s.title)}
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
        />
      ))}
    </>
  );
};

export default Search;
