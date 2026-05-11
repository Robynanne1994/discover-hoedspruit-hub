import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollowMutation, useMyFollowingIds } from "@/hooks/useFollows";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const COLOR = {
  olive: "#5C6446",
  cream: "#EEE8DA",
  ink: "#2A2A24",
  muted: "#6B6A5E",
  line: "#D9D2C0",
};
const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #8a6f4d, #c4a374)",
  "linear-gradient(135deg, #6b7a5a, #a8b58c)",
  "linear-gradient(135deg, #a86b52, #d4a087)",
  "linear-gradient(135deg, #5d6b7a, #8fa3b3)",
  "linear-gradient(135deg, #8a5d6b, #c08a96)",
  "linear-gradient(135deg, #7a6b4a, #b8a473)",
];

const initialsOf = (name?: string | null) => {
  if (!name) return "·";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  location: string | null;
  created_at?: string;
};

type RowUser = Profile & { why?: string };

const ShareIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const ActionButton = ({
  variant,
  label,
  onClick,
  disabled,
}: {
  variant: "outlined" | "solid";
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) => {
  const base: React.CSSProperties = {
    height: 34,
    padding: "0 18px",
    borderRadius: 999,
    fontFamily: SANS,
    fontWeight: 400,
    fontSize: 13,
    letterSpacing: "0.1px",
    cursor: disabled ? "default" : "pointer",
    flexShrink: 0,
    opacity: disabled ? 0.6 : 1,
  };
  if (variant === "outlined") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          ...base,
          background: "transparent",
          border: `1px solid ${COLOR.line}`,
          color: COLOR.ink,
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, background: COLOR.ink, border: "none", color: COLOR.cream }}
    >
      {label}
    </button>
  );
};

const UserRow = ({
  user,
  index,
  isFollowed,
}: {
  user: RowUser;
  index: number;
  isFollowed: boolean;
}) => {
  const navigate = useNavigate();
  const { follow, unfollow } = useFollowMutation(user.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handle = user.username
    ? `@${user.username.toLowerCase()}`
    : `@${(user.display_name || "user").toLowerCase().replace(/\s+/g, "")}`;
  const grad = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

  const onToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowed) setConfirmOpen(true);
    else follow.mutate();
  };

  return (
    <>
      <div
        onClick={() => navigate(`/profile/${user.id}`)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 0",
          borderTop: index === 0 ? "none" : `1px solid ${COLOR.line}`,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            flexShrink: 0,
            overflow: "hidden",
            background: grad,
            backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : grad,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 18,
            color: COLOR.cream,
          }}
        >
          {!user.avatar_url && initialsOf(user.display_name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 16,
              lineHeight: 1.2,
              letterSpacing: "-0.1px",
              color: COLOR.ink,
              marginBottom: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.display_name || "User"}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 13,
              color: COLOR.muted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {handle}
          </p>
          {user.why && (
            <p
              style={{
                margin: 0,
                marginTop: 3,
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 12,
                color: COLOR.muted,
                opacity: 0.85,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.why}
            </p>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <ActionButton
            variant={isFollowed ? "outlined" : "solid"}
            label={isFollowed ? "Following" : "Follow"}
            onClick={onToggle}
            disabled={follow.isPending || unfollow.isPending}
          />
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unfollow {user.display_name || "this user"}?</DialogTitle>
            <DialogDescription>You can follow them again at any time.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirmOpen(false)}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: `1px solid ${COLOR.line}`,
                background: "transparent",
                color: COLOR.ink,
                fontFamily: SANS,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                unfollow.mutate();
                setConfirmOpen(false);
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: "none",
                background: COLOR.ink,
                color: COLOR.cream,
                fontFamily: SANS,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Unfollow
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ListCard = ({
  users,
  followingIds,
  startIndex = 0,
}: {
  users: RowUser[];
  followingIds: Set<string>;
  startIndex?: number;
}) => (
  <div
    style={{
      background: COLOR.cream,
      borderRadius: 20,
      padding: "6px 18px",
      overflow: "hidden",
    }}
  >
    {users.map((u, i) => (
      <UserRow key={u.id} user={u} index={i + startIndex} isFollowed={followingIds.has(u.id)} />
    ))}
  </div>
);

const SectionHeading = ({ title, counter }: { title: string; counter: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      padding: "0 24px",
      marginBottom: 14,
    }}
  >
    <h2
      style={{
        margin: 0,
        fontFamily: SERIF,
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: 30,
        lineHeight: 1,
        letterSpacing: "-0.5px",
        color: COLOR.cream,
      }}
    >
      {title}
    </h2>
    <span
      style={{
        fontFamily: SANS,
        fontWeight: 400,
        fontSize: 11,
        letterSpacing: "1.8px",
        textTransform: "uppercase",
        color: "rgba(238,232,218,0.75)",
      }}
    >
      {counter}
    </span>
  </div>
);

const InviteCta = () => {
  const onClick = async () => {
    const url = `${window.location.origin}/`;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: "Hello Hoedspruit",
          text: "Come find local places worth knowing.",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* no-op */
    }
  };
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, padding: "0 24px" }}>
      <button
        onClick={onClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 24px",
          borderRadius: 999,
          background: "transparent",
          border: "1px solid rgba(238,232,218,0.35)",
          color: COLOR.cream,
          fontFamily: SANS,
          fontWeight: 400,
          fontSize: 14,
          letterSpacing: "0.1px",
          cursor: "pointer",
        }}
      >
        <ShareIcon size={14} />
        <span style={{ textTransform: "none" }}>Invite a Friend</span>
      </button>
    </div>
  );
};

const People = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const trimmed = search.trim();

  const { data: followingIds } = useMyFollowingIds();

  // ---- My saves & follows context ----
  const { data: mySaves } = useQuery({
    queryKey: ["my-saved-listing-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favourites")
        .select("item_id")
        .eq("user_id", user!.id)
        .eq("item_type", "listing");
      return new Set((data || []).map((d) => d.item_id as string));
    },
    enabled: !!user,
  });

  // ---- Suggested: friends-of-friends + shared-saves ----
  const { data: suggestionData, isLoading: loadingSuggested } = useQuery({
    queryKey: ["people-suggested", user?.id],
    enabled: !!user && !!followingIds && !!mySaves,
    queryFn: async () => {
      const myFollowing = Array.from(followingIds!);
      const mySaveIds = Array.from(mySaves!);

      const scores = new Map<string, { mutuals: number; sharedSaves: number; followers: Set<string> }>();
      const bump = (uid: string, key: "mutuals" | "sharedSaves", from?: string) => {
        if (!scores.has(uid))
          scores.set(uid, { mutuals: 0, sharedSaves: 0, followers: new Set() });
        const s = scores.get(uid)!;
        s[key] += 1;
        if (from) s.followers.add(from);
      };

      // Friends-of-friends
      if (myFollowing.length) {
        const { data: fof } = await supabase
          .from("follows")
          .select("follower_id, following_id")
          .in("follower_id", myFollowing);
        (fof || []).forEach((r: any) => {
          if (r.following_id === user!.id) return;
          if (followingIds!.has(r.following_id)) return;
          bump(r.following_id, "mutuals", r.follower_id);
        });
      }

      // Shared saves
      if (mySaveIds.length) {
        const { data: overlap } = await supabase
          .from("favourites")
          .select("user_id, item_id")
          .eq("item_type", "listing")
          .in("item_id", mySaveIds)
          .neq("user_id", user!.id);
        (overlap || []).forEach((r: any) => {
          if (followingIds!.has(r.user_id)) return;
          bump(r.user_id, "sharedSaves");
        });
      }

      const ids = Array.from(scores.keys()).slice(0, 60);
      if (!ids.length) return { rows: [] as RowUser[], counter: "Picked For You" };

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, location, created_at")
        .in("id", ids);

      // Followed-by-name lookup for "Followed by X" copy
      const followerNameById = new Map<string, string>();
      const allFollowerIds = new Set<string>();
      scores.forEach((s) => s.followers.forEach((f) => allFollowerIds.add(f)));
      if (allFollowerIds.size) {
        const { data: fnames } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", Array.from(allFollowerIds));
        (fnames || []).forEach((p: any) => followerNameById.set(p.id, p.display_name || "a friend"));
      }

      const rows: RowUser[] = (profiles || [])
        .map((p: any) => {
          const s = scores.get(p.id)!;
          let why: string | undefined;
          if (s.mutuals > 0 && s.sharedSaves > 0) {
            why = `${s.mutuals} mutual${s.mutuals === 1 ? "" : "s"} · saves places you save`;
          } else if (s.mutuals >= 2) {
            why = `${s.mutuals} mutuals`;
          } else if (s.mutuals === 1) {
            const fid = Array.from(s.followers)[0];
            const fname = (fid && followerNameById.get(fid)) || "a friend";
            why = `Followed by ${fname}`;
          } else if (s.sharedSaves >= 2) {
            why = `Saves ${s.sharedSaves} of the same places`;
          } else if (s.sharedSaves === 1) {
            why = "Loves the same coffee spots";
          }
          const score = s.mutuals * 3 + s.sharedSaves * 2;
          return { ...p, why, _score: score } as RowUser & { _score: number };
        })
        .sort((a, b) => b._score - a._score)
        .slice(0, 8);

      const totalMutuals = rows.reduce((acc, r: any) => acc + (scores.get(r.id)?.mutuals || 0), 0);
      const totalSaves = rows.reduce((acc, r: any) => acc + (scores.get(r.id)?.sharedSaves || 0), 0);
      const counter = totalMutuals > totalSaves ? "From Your Network" : "Based On Your Saves";

      return { rows, counter };
    },
  });

  // ---- From The 'Hoed: newcomers + locals ----
  const { data: hoedData, isLoading: loadingHoed } = useQuery({
    queryKey: ["people-from-hoed", user?.id],
    enabled: !!user && !!followingIds,
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [newcomersRes, localsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url, location, created_at")
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url, location, created_at")
          .lt("created_at", sevenDaysAgo)
          .order("created_at", { ascending: true })
          .limit(20),
      ]);

      const newcomers = (newcomersRes.data || []).filter((p: any) => p.id !== user!.id);
      const locals = (localsRes.data || []).filter((p: any) => p.id !== user!.id);

      // Get follower counts for the candidate pool to enrich locals
      const candidateIds = [...newcomers.map((p: any) => p.id), ...locals.map((p: any) => p.id)];
      const followerCounts = new Map<string, number>();
      if (candidateIds.length) {
        const { data: fc } = await supabase
          .from("follows")
          .select("following_id")
          .in("following_id", candidateIds);
        (fc || []).forEach((r: any) => {
          followerCounts.set(r.following_id, (followerCounts.get(r.following_id) || 0) + 1);
        });
      }

      const taken = new Set<string>();
      const out: RowUser[] = [];

      // 2 newcomers first
      for (const p of newcomers) {
        if (out.length >= 2) break;
        out.push({ ...p, why: "Newcomer · joined this week" });
        taken.add(p.id);
      }

      // Fill with locals, sorted by follower count desc
      const localsRanked = locals
        .filter((p: any) => !taken.has(p.id))
        .map((p: any) => ({ ...p, _fc: followerCounts.get(p.id) || 0 }))
        .sort((a: any, b: any) => b._fc - a._fc);

      for (const p of localsRanked) {
        if (out.length >= 6) break;
        const fc = p._fc;
        let why: string;
        if (fc >= 10) why = `Lifelong local · ${fc} followers`;
        else if (p.location) why = `Local voice · ${p.location}`;
        else why = "Lifelong local";
        out.push({ ...p, why });
        taken.add(p.id);
      }

      // If still room, top up with any newcomers left
      for (const p of newcomers) {
        if (out.length >= 6) break;
        if (taken.has(p.id)) continue;
        out.push({ ...p, why: "Newcomer · joined this week" });
      }

      return { rows: out, counter: "Local Voices" };
    },
  });

  // ---- Search ----
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["people-search", trimmed, user?.id],
    enabled: !!user && trimmed.length > 0,
    queryFn: async () => {
      const q = trimmed.replace(/^@+/, "");
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, location, created_at")
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
        .neq("id", user!.id)
        .limit(30);
      return (data || []) as RowUser[];
    },
  });

  const isSearching = trimmed.length > 0;
  const followingIdSet = useMemo(() => followingIds ?? new Set<string>(), [followingIds]);

  const suggested = suggestionData?.rows ?? [];
  const hoed = hoedData?.rows ?? [];
  const showSuggested = !isSearching && suggested.length > 0;
  const showHoed = !isSearching && hoed.length > 0;
  const isInitialLoading = !isSearching && (loadingSuggested || loadingHoed);
  const bothEmpty = !isSearching && !loadingSuggested && !loadingHoed && suggested.length === 0 && hoed.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: COLOR.olive, paddingBottom: 100 }}>
      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: COLOR.cream,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={18} strokeWidth={1.6} color={COLOR.ink} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24 }}>
        <p
          style={{
            margin: 0,
            marginBottom: 14,
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 12,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: "rgba(238,232,218,0.7)",
          }}
        >
          Grow Your Circle
        </p>
        <h1
          style={{
            margin: 0,
            marginBottom: 14,
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 64,
            lineHeight: 0.92,
            letterSpacing: "-2.2px",
            color: COLOR.cream,
          }}
        >
          find people.
        </h1>
        <p
          style={{
            margin: 0,
            marginBottom: 24,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 400,
            fontSize: 15,
            lineHeight: 1.65,
            color: "rgba(238,232,218,0.9)",
            maxWidth: 300,
          }}
        >
          Locals worth following, all in one place.
        </p>
      </div>

      {/* Search */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 52,
            borderRadius: 999,
            background: "rgba(238,232,218,0.92)",
            padding: "0 22px",
          }}
        >
          <Search size={18} strokeWidth={1.6} color={COLOR.muted} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or @handle"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 15,
              color: COLOR.ink,
            }}
          />
        </div>
      </div>

      {/* Search results mode */}
      {isSearching && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
          {searching ? (
            <SkeletonCard rows={4} />
          ) : !searchResults?.length ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p
                style={{
                  margin: 0,
                  marginBottom: 8,
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 22,
                  color: "rgba(238,232,218,0.8)",
                }}
              >
                No matches for "{trimmed}".
              </p>
              <p
                style={{
                  margin: "0 auto",
                  fontFamily: SANS,
                  fontWeight: 400,
                  fontSize: 14,
                  color: "rgba(238,232,218,0.7)",
                  maxWidth: 280,
                }}
              >
                Try a different name or handle.
              </p>
            </div>
          ) : (
            <ListCard users={searchResults} followingIds={followingIdSet} />
          )}
        </div>
      )}

      {/* Curated sections */}
      {!isSearching && (
        <>
          {isInitialLoading && (
            <div style={{ padding: "0 24px 28px" }}>
              <SkeletonCard rows={4} />
            </div>
          )}

          {showSuggested && (
            <>
              <SectionHeading title="suggested for you" counter={suggestionData!.counter} />
              <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
                <ListCard users={suggested} followingIds={followingIdSet} />
              </div>
            </>
          )}

          {showHoed && (
            <>
              <SectionHeading title="from the 'hoed" counter={hoedData!.counter} />
              <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
                <ListCard users={hoed} followingIds={followingIdSet} startIndex={suggested.length} />
              </div>
            </>
          )}

          {bothEmpty && (
            <div style={{ textAlign: "center", padding: "24px 24px 32px" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(238,232,218,0.08)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                }}
              >
                <Users size={28} strokeWidth={1.5} color="rgba(238,232,218,0.5)" />
              </div>
              <p
                style={{
                  margin: 0,
                  marginBottom: 10,
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 22,
                  color: "rgba(238,232,218,0.8)",
                }}
              >
                Nothing to suggest yet.
              </p>
              <p
                style={{
                  margin: "0 auto 24px",
                  fontFamily: SANS,
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "rgba(238,232,218,0.7)",
                  maxWidth: 280,
                }}
              >
                Save a few places and check back. We'll match you with people who like what you like.
              </p>
            </div>
          )}
        </>
      )}

      {/* Invite */}
      <InviteCta />
    </div>
  );
};

const SkeletonCard = ({ rows = 4 }: { rows?: number }) => (
  <div
    style={{
      background: COLOR.cream,
      borderRadius: 20,
      padding: "6px 18px",
      overflow: "hidden",
    }}
  >
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 0",
          borderTop: i === 0 ? "none" : `1px solid ${COLOR.line}`,
        }}
      >
        <Skeleton className="h-12 w-12 rounded-full" />
        <div style={{ flex: 1 }}>
          <Skeleton className="h-4 w-28 mb-2 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    ))}
  </div>
);

export default People;
