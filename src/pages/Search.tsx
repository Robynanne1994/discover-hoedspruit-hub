import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search as SearchIcon, UserPlus, UserCheck, Heart, UserCircle, Clock, ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import { useIsFollowing, useFollowMutation } from "@/hooks/useFollows";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { toast } from "sonner";
import Seo from "@/components/Seo";

const DISPLAY = "'Helvetica World', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";

const C = {
  bg: "#EBEBEB",
  card: "#FFFFFF",
  soft: "#F2EFEC",
  ink: "#0A0A0A",
  muted: "#8A8480",
  border: "#E8E4DF",
} as const;

const PAGE_MARGIN = 24;

type TopTab = "users" | "businesses";
type UserSub = "suggested" | "followers" | "following";
type BizSub = "listings" | "events" | "specials";

const Search = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fromProfileState = (location.state as { fromProfile?: boolean; profileId?: string } | null) ?? null;
  const fromProfile = !!fromProfileState?.fromProfile;
  const profileId = fromProfileState?.profileId;
  const [topTab, setTopTab] = useState<TopTab>(fromProfile ? "users" : "businesses");
  const [userSub, setUserSub] = useState<UserSub>("suggested");
  const [bizSub, setBizSub] = useState<BizSub>("listings");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const placeholder = useMemo(() => {
    if (topTab === "users") return "Search Hello Hoedspruit users";
    return "Search listings, events & specials";
  }, [topTab]);

  const handleBack = () => {
    if (fromProfile && profileId) navigate("/my-profile");
    else navigate(-1);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 100, fontFamily: BODY, color: C.ink }}>
      <Seo
        title="Search — Hello Hoedspruit"
        description="Search Hello Hoedspruit users, listings, events and specials across the Lowveld."
        path="/search"
        noIndex
      />

      {/* Header */}
      <div style={{ padding: `calc(env(safe-area-inset-top) + 20px) ${PAGE_MARGIN}px 0` }}>
        <button
          type="button"
          aria-label="Back"
          onClick={handleBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: C.card,
            border: "none",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <ArrowLeft size={18} color={C.ink} strokeWidth={1.8} />
        </button>
        <h1
          style={{
            margin: "24px 0 0",
            fontFamily: DISPLAY,
            fontWeight: 500,
            fontSize: 40,
            lineHeight: "40px",
            letterSpacing: "-1.2px",
            color: C.ink,
          }}
        >
          Search
        </h1>
      </div>

      {/* Top tabs */}
      <div style={{ display: "flex", gap: 8, padding: `20px ${PAGE_MARGIN}px 0` }}>
        {(["businesses", "users"] as TopTab[]).map((t) => (
          <PillChip
            key={t}
            active={topTab === t}
            onClick={() => setTopTab(t)}
            label={t === "businesses" ? "Businesses" : "Users"}
          />
        ))}
      </div>

      {/* Search bar */}
      <div style={{ padding: `16px ${PAGE_MARGIN}px 0` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 48,
            borderRadius: 999,
            background: searchFocused ? C.card : C.soft,
            padding: "0 18px",
            transition: "background 150ms ease-out",
          }}
        >
          <SearchIcon size={20} color={C.ink} strokeWidth={1.5} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={placeholder}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: BODY,
              fontWeight: 400,
              fontSize: 16,
              color: C.ink,
            }}
          />
        </div>
      </div>

      {/* Sub filters */}
      <div style={{ display: "flex", gap: 8, padding: `16px ${PAGE_MARGIN}px 0`, flexWrap: "wrap" }}>
        {topTab === "users"
          ? (["suggested", "followers", "following"] as UserSub[]).map((s) => (
              <PillChip
                key={s}
                active={userSub === s}
                onClick={() => setUserSub(s)}
                label={s === "suggested" ? "Suggested" : s === "followers" ? "Followers" : "Following"}
              />
            ))
          : (["listings", "events", "specials"] as BizSub[]).map((s) => (
              <PillChip
                key={s}
                active={bizSub === s}
                onClick={() => setBizSub(s)}
                label={s === "listings" ? "Listings" : s === "events" ? "Events" : "Specials"}
              />
            ))}
      </div>

      {/* Results */}
      <div style={{ padding: "24px 0 0" }}>
        {topTab === "users" && <UsersResults sub={userSub} query={query} currentUserId={user?.id} />}
        {topTab === "businesses" && bizSub === "listings" && <ListingsResults query={query} />}
        {topTab === "businesses" && bizSub === "events" && <EventsResults query={query} />}
        {topTab === "businesses" && bizSub === "specials" && <SpecialsResults query={query} />}
      </div>
    </div>
  );
};

/* -------------------- Pill chip -------------------- */

const PillChip = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const down = () => {
    if (ref.current) ref.current.style.transform = "scale(0.98)";
  };
  const up = () => {
    if (ref.current) ref.current.style.transform = "scale(1)";
  };
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      style={{
        border: "none",
        cursor: "pointer",
        borderRadius: 999,
        padding: "8px 14px",
        fontFamily: BODY,
        fontWeight: 400,
        fontSize: 14,
        lineHeight: 1.2,
        background: active ? C.ink : C.card,
        color: active ? C.card : C.ink,
        boxShadow: active ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
        transition: "transform 150ms ease-out, background 150ms ease-out, color 150ms ease-out",
      }}
    >
      {label}
    </button>
  );
};

/* -------------------- Section header (eyebrow) -------------------- */

const SectionHeader = ({ label }: { label: string }) => (
  <div style={{ padding: `0 ${PAGE_MARGIN}px 10px` }}>
    <span
      style={{
        fontFamily: BODY,
        fontWeight: 400,
        fontSize: 12,
        lineHeight: "14.4px",
        letterSpacing: "0.24px",
        color: C.muted,
      }}
    >
      {label}
    </span>
  </div>
);

const EmptyRow = ({ text }: { text: string }) => (
  <div
    style={{
      padding: "40px 24px",
      textAlign: "center",
      fontFamily: BODY,
      fontWeight: 400,
      fontSize: 14,
      color: C.muted,
    }}
  >
    {text}
  </div>
);

/* -------------------- Results card + row -------------------- */

const ResultsCard = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      margin: `0 ${PAGE_MARGIN}px`,
      background: C.card,
      borderRadius: 24,
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

interface RowProps {
  to: string;
  image?: string | null;
  title: string;
  titleOverride?: string | null;
  subtitle?: string | null;
  subtitle2?: string | null;
  thumb?: "round" | "square";
  action?: React.ReactNode;
  isLast?: boolean;
}
const ResultRow = ({
  to,
  image,
  title,
  titleOverride,
  subtitle,
  subtitle2,
  thumb = "square",
  action,
  isLast,
}: RowProps) => {
  const hasOverride = !!(titleOverride && titleOverride.trim());
  const display = hasOverride ? titleOverride!.trim() : title;
  const thumbSize = thumb === "round" ? 48 : 56;
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: 16,
        textDecoration: "none",
        position: "relative",
      }}
    >
      <div
        style={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: thumb === "round" ? 999 : 12,
          background: C.soft,
          overflow: "hidden",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {image ? (
          <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <UserCircle size={26} color={C.muted} strokeWidth={1.5} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          {...(hasOverride ? { "data-no-title-case": "true" } : {})}
          style={{
            margin: 0,
            fontFamily: BODY,
            fontWeight: 400,
            fontSize: 16,
            lineHeight: 1.25,
            color: C.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {display}
        </p>
        {subtitle && (
          <p
            style={{
              margin: "2px 0 0",
              fontFamily: BODY,
              fontWeight: 400,
              fontSize: 12,
              lineHeight: 1.3,
              color: C.muted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </p>
        )}
        {subtitle2 && (
          <p
            style={{
              margin: "1px 0 0",
              fontFamily: BODY,
              fontWeight: 400,
              fontSize: 12,
              lineHeight: 1.3,
              color: C.muted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle2}
          </p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      {!isLast && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 16 + thumbSize + 14,
            right: 16,
            bottom: 0,
            height: 1,
            background: C.border,
          }}
        />
      )}
    </Link>
  );
};

/* -------------------- Follow button -------------------- */

const InlineFollowButton = ({ targetUserId }: { targetUserId: string }) => {
  const { user } = useAuth();
  const { data: followStatus } = useIsFollowing(targetUserId);
  const { follow, unfollow } = useFollowMutation(targetUserId);
  const { data: blocks } = useBlockedUsers();
  const queryClient = useQueryClient();
  const isBlocked = blocks?.iBlocked.has(targetUserId) ?? false;
  if (!user || user.id === targetUserId) return null;

  const isAccepted = followStatus === "accepted";
  const isPending = followStatus === "pending";
  const filled = isBlocked || isAccepted || isPending;

  const handleUnblock = async () => {
    const { error } = await supabase
      .from("user_blocks" as any)
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", targetUserId);
    if (error) {
      toast.error("Could not unblock user. Please try again.");
      return;
    }
    queryClient.setQueryData(["user-blocked", user.id, targetUserId], false);
    queryClient.invalidateQueries({ queryKey: ["blocked-users", user.id] });
    queryClient.invalidateQueries({ queryKey: ["search-users"] });
    toast.success("User unblocked");
  };

  const label = isBlocked ? "Unblock" : isAccepted ? "Following" : isPending ? "Requested" : "Follow";
  const Icon = isBlocked ? null : isAccepted ? UserCheck : isPending ? Clock : UserPlus;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isBlocked) return handleUnblock();
        if (isAccepted || isPending) unfollow.mutate();
        else follow.mutate();
      }}
      style={{
        background: filled ? C.ink : C.card,
        color: filled ? C.card : C.ink,
        border: filled ? "none" : `1px solid ${C.border}`,
        borderRadius: 999,
        padding: "8px 16px",
        fontFamily: BODY,
        fontWeight: 400,
        fontSize: 13,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        lineHeight: 1.2,
      }}
    >
      {Icon && <Icon size={14} strokeWidth={1.5} color={filled ? C.card : C.ink} />}
      {label}
    </button>
  );
};

const InlineSaveButton = ({ itemId, itemType }: { itemId: string; itemType: "listing" | "event" | "special" }) => {
  const { user } = useAuth();
  const isFav = useIsFavourited(itemId, itemType);
  const toggle = useToggleFavourite();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
          toast.error("Please sign in to save");
          return;
        }
        toggle.mutate({ itemId, itemType, currentlyFavourited: isFav });
      }}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: "50%",
        width: 32,
        height: 32,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label={isFav ? "Remove from saved" : "Save"}
    >
      <Heart size={14} color={C.ink} fill={isFav ? C.ink : "none"} strokeWidth={1.5} />
    </button>
  );
};

/* -------------------- Discover more button -------------------- */

const DiscoverMore = ({ to, label }: { to: string; label: string }) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const down = () => ref.current && (ref.current.style.transform = "scale(0.98)");
  const up = () => ref.current && (ref.current.style.transform = "scale(1)");
  return (
    <div style={{ padding: `24px ${PAGE_MARGIN}px 8px`, display: "flex", justifyContent: "center" }}>
      <Link
        ref={ref}
        to={to}
        state={{ fromSearch: true }}
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: 48,
          padding: "0 24px",
          borderRadius: 999,
          background: C.ink,
          color: C.card,
          fontFamily: BODY,
          fontWeight: 400,
          fontSize: 15,
          textDecoration: "none",
          transition: "transform 150ms ease-out",
        }}
      >
        {label}
      </Link>
    </div>
  );
};

/* -------------------- Results: Users -------------------- */

const UsersResults = ({
  sub,
  query,
  currentUserId,
}: {
  sub: UserSub;
  query: string;
  currentUserId?: string;
}) => {
  const term = query.trim();

  const { data: blocks } = useBlockedUsers();
  const iBlocked = blocks?.iBlocked;
  const blockedMe = blocks?.blockedMe;

  const { data: rows, isLoading } = useQuery({
    queryKey: [
      "search-users",
      sub,
      term,
      currentUserId,
      Array.from(iBlocked ?? []).sort().join(","),
      Array.from(blockedMe ?? []).sort().join(","),
    ],
    queryFn: async () => {
      const applyBlocks = (list: any[], { allowIBlockedOnTermMatch }: { allowIBlockedOnTermMatch: boolean }) => {
        const t = term.toLowerCase();
        return list.filter((p: any) => {
          if (blockedMe?.has(p.id)) return false;
          if (iBlocked?.has(p.id)) {
            if (!allowIBlockedOnTermMatch || !t) return false;
            const name = (p.display_name || "").toLowerCase();
            const handle = (p.username || "").toLowerCase();
            return name.includes(t) || handle.includes(t);
          }
          return true;
        });
      };

      if (sub === "suggested") {
        let followingIds: string[] = [];
        if (currentUserId) {
          const { data: f } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", currentUserId);
          followingIds = (f || []).map((r: any) => r.following_id);
        }
        const { data } = await supabase.rpc("search_public_profiles", {
          _term: term || "",
          _limit: 50,
        });
        const excluded = new Set<string>(followingIds);
        if (currentUserId) excluded.add(currentUserId);
        const base = (data || []).filter((p: any) => !excluded.has(p.id));
        return applyBlocks(base, { allowIBlockedOnTermMatch: true });
      }
      if (!currentUserId) return [];
      const col = sub === "followers" ? "follower_id" : "following_id";
      const matchCol = sub === "followers" ? "following_id" : "follower_id";
      const { data: links } = await supabase.from("follows").select(col).eq(matchCol, currentUserId);
      const ids = (links || []).map((d: any) => d[col]);
      if (!ids.length) return [];
      const { data } = await supabase.rpc("get_public_profiles", { _ids: ids });
      const filtered = term
        ? (data || []).filter((p: any) =>
            (p.display_name || "").toLowerCase().includes(term.toLowerCase()) ||
            (p.username || "").toLowerCase().includes(term.toLowerCase()),
          )
        : data || [];
      return applyBlocks(filtered, { allowIBlockedOnTermMatch: false });
    },
    enabled: (!!currentUserId || sub === "suggested") && blocks !== undefined,
  });

  const headerLabel = sub === "suggested" ? "Discover" : sub === "followers" ? "Followers" : "Following";

  if (isLoading) return <EmptyRow text="Loading…" />;
  if (!rows || rows.length === 0) {
    const emptyText = term
      ? "No people found"
      : sub === "suggested"
      ? "No new users — you're following everyone!"
      : "No results";
    return <EmptyRow text={emptyText} />;
  }

  return (
    <>
      <SectionHeader label={headerLabel} />
      <ResultsCard>
        {rows.map((u: any, i: number) => (
          <ResultRow
            key={u.id}
            to={`/profile/${u.id}`}
            image={u.avatar_url}
            title={u.display_name || u.username || "User"}
            subtitle={u.username ? `@${u.username}` : null}
            thumb="round"
            isLast={i === rows.length - 1}
            action={<InlineFollowButton targetUserId={u.id} />}
          />
        ))}
      </ResultsCard>
    </>
  );
};

/* -------------------- Results: Listings -------------------- */

const ListingsResults = ({ query }: { query: string }) => {
  const term = query.trim();
  const { data, isLoading } = useQuery({
    queryKey: ["search-listings", term],
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select("id, title, title_override, location, image_url, is_featured")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(term ? 50 : 15);
      if (term) q = q.ilike("title", `%${term}%`);
      const { data } = await q;
      return data || [];
    },
  });
  if (isLoading) return <EmptyRow text="Loading…" />;
  if (!data || data.length === 0) return <EmptyRow text={term ? "No listings found" : "No listings"} />;
  return (
    <>
      <SectionHeader label={term ? "Listings" : "Discover"} />
      <ResultsCard>
        {data.map((l, i) => (
          <ResultRow
            key={l.id}
            to={`/listing/${l.id}`}
            image={l.image_url}
            title={l.title}
            titleOverride={(l as any).title_override}
            subtitle={l.location || null}
            isLast={i === data.length - 1}
            action={<InlineSaveButton itemId={l.id} itemType="listing" />}
          />
        ))}
      </ResultsCard>
      {!term && <DiscoverMore to="/categories" label="Discover More" />}
    </>
  );
};

/* -------------------- Results: Events -------------------- */

const EventsResults = ({ query }: { query: string }) => {
  const term = query.trim();
  const { data, isLoading } = useQuery({
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
      const { data } = await q;
      return data || [];
    },
  });
  if (isLoading) return <EmptyRow text="Loading…" />;
  if (!data || data.length === 0) return <EmptyRow text={term ? "No events found" : "No upcoming events"} />;
  return (
    <>
      <SectionHeader label={term ? "Events" : "Upcoming Events"} />
      <ResultsCard>
        {data.map((e, i) => (
          <ResultRow
            key={e.id}
            to={`/events/${e.id}`}
            image={e.image_url}
            title={e.title}
            titleOverride={(e as any).title_override}
            subtitle={e.date || null}
            subtitle2={e.location || null}
            isLast={i === data.length - 1}
            action={<InlineSaveButton itemId={e.id} itemType="event" />}
          />
        ))}
      </ResultsCard>
      {!term && <DiscoverMore to="/events" label="Discover More Events" />}
    </>
  );
};

/* -------------------- Results: Specials -------------------- */

const SpecialsResults = ({ query }: { query: string }) => {
  const term = query.trim();
  const { data, isLoading } = useQuery({
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
      const { data } = await q;
      return data || [];
    },
  });
  if (isLoading) return <EmptyRow text="Loading…" />;
  if (!data || data.length === 0) return <EmptyRow text={term ? "No specials found" : "No active specials"} />;
  return (
    <>
      <SectionHeader label={term ? "Specials" : "Active Specials"} />
      <ResultsCard>
        {data.map((s, i) => (
          <ResultRow
            key={s.id}
            to={`/specials/${s.id}`}
            image={s.image_url}
            title={s.title}
            titleOverride={(s as any).title_override}
            subtitle={s.deal_label || null}
            subtitle2={s.business_name || null}
            isLast={i === data.length - 1}
            action={<InlineSaveButton itemId={s.id} itemType="special" />}
          />
        ))}
      </ResultsCard>
      {!term && <DiscoverMore to="/specials" label="Discover More Deals" />}
    </>
  );
};

export default Search;
