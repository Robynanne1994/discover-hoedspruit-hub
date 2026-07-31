import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Search, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useFollowersList,
  useFollowingList,
  useFollowMutation,
  useMyFollowingIds,
  useFollowCounts,
  useIsFollowing,
  type FollowStatus,
} from "@/hooks/useFollows";
import { useAuth } from "@/hooks/useAuth";
import { useShare } from "@/hooks/useShare";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const COLOR = {
  page: "#E6E0CC",
  card: "#FFFFFF",
  cream: "#F5F0E4",
  ink: "#1A1A1A",
  muted: "#8A8275",
  subtle: "rgba(26,26,26,0.55)",
  line: "rgba(26,26,26,0.10)",
  pillBorder: "#E8E4DF",
  brown: "#423324",
  soft: "#F2EFE5",
  // Track behind the Followers / Following segmented control.
  track: "#EFEAD9",
};

const SERIF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const initialsOf = (name?: string | null) => {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};

type RowUser = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  username?: string | null;
  location?: string | null;
  is_private?: boolean | null;
};

const handleOf = (user: RowUser) =>
  user.username
    ? `@${user.username.toLowerCase()}`
    : `@${(user.display_name || "user").toLowerCase().replace(/\s+/g, "")}`;

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
  const isSolid = variant === "solid";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 34,
        padding: "0 18px",
        borderRadius: 999,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.02em",
        cursor: disabled ? "default" : "pointer",
        flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
        transition: "transform 120ms ease",
        background: isSolid ? COLOR.brown : COLOR.soft,
        border: "none",
        color: isSolid ? "#FFFFFF" : "#1A1A1A",
        minWidth: 92,
      }}
    >
      {label}
    </button>
  );
};

const UserRow = ({
  user,
  index,
  label,
  isSolid,
  onToggle,
  pending,
  isSelf,
}: {
  user: RowUser;
  index: number;
  label: string;
  isSolid: boolean;
  onToggle: () => void;
  pending: boolean;
  isSelf?: boolean;
}) => {
  const navigate = useNavigate();
  const handle = handleOf(user);
  const initials = initialsOf(user.display_name);

  return (
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
          background: user.avatar_url ? "#000" : "#FFFFFF",
          border: user.avatar_url ? "none" : `1px solid ${COLOR.pillBorder}`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 16,
          color: COLOR.ink,
        }}
      >
        {!user.avatar_url && initials}
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
            fontFamily: SANS,
            fontStyle: "normal",
            fontWeight: 400,
            fontSize: 13,
            color: COLOR.muted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {handle}
        </p>
      </div>

      {!isSelf && (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionButton
            variant={isSolid ? "solid" : "outlined"}
            label={label}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            disabled={pending}
          />
        </div>
      )}
    </div>
  );
};

const RowWithMutation = ({
  user,
  index,
  isFollowedInitially,
  isOwnFollowingPage,
  isFollowersOfSelf,
  isSelf,
}: {
  user: RowUser;
  index: number;
  isFollowedInitially: boolean;
  isOwnFollowingPage: boolean;
  isFollowersOfSelf: boolean;
  isSelf?: boolean;
}) => {
  const { follow, unfollow } = useFollowMutation(user.id);
  const { data: followStatus, isFetched } = useIsFollowing(user.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Both list RPCs only return accepted follows, so the page the row is on
  // already tells us the answer. Use that until the per-row status query has
  // resolved, otherwise every row flashes "Follow" on first paint — then hand
  // over to the live status so the button keeps up with the actual relationship.
  const assumedStatus: FollowStatus =
    isOwnFollowingPage || isFollowedInitially ? "accepted" : null;
  const status = isFetched ? followStatus ?? null : assumedStatus;

  const isAccepted = status === "accepted";
  const isPending = status === "pending";

  // "Follow Back" only makes sense for someone following me that I don't follow;
  // once it's mutual (or I already followed them) the action becomes "Unfollow".
  const label = isAccepted
    ? "Unfollow"
    : isPending
    ? "Requested"
    : isFollowersOfSelf
    ? "Follow Back"
    : "Follow";
  const isSolid = label === "Follow" || label === "Follow Back";

  const handleToggle = () => {
    if (isAccepted) {
      setConfirmOpen(true);
    } else if (isPending) {
      unfollow.mutate();
    } else {
      follow.mutate();
    }
  };

  const name = user.display_name?.trim() || handleOf(user);
  const isPrivate = !!user.is_private;

  return (
    <>
      <UserRow
        user={user}
        index={index}
        label={label}
        isSolid={isSolid}
        onToggle={handleToggle}
        pending={follow.isPending || unfollow.isPending}
        isSelf={isSelf}
      />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent style={{ fontFamily: SANS }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: SANS, color: COLOR.ink }}>
              Unfollow {name}?
            </AlertDialogTitle>
            <AlertDialogDescription
              style={{ fontFamily: SANS, color: COLOR.muted, fontSize: 14, lineHeight: 1.5 }}
            >
              {isPrivate
                ? `Their profile is private, so you'll have to request to follow ${name} again and wait for them to approve it.`
                : `You can follow ${name} again at any time.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: SANS }}>No, keep following</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unfollow.mutate()}
              style={{ fontFamily: SANS, background: COLOR.brown, color: "#FFFFFF" }}
            >
              Yes, unfollow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const ShareIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const FollowList = () => {
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const isFollowers = type === "followers";
  const isOwnPage = !!authUser && authUser.id === id;

  const { data: followers, isLoading: loadingFollowers } = useFollowersList(
    isFollowers ? id : undefined,
  );
  const { data: following, isLoading: loadingFollowing } = useFollowingList(
    !isFollowers ? id : undefined,
  );
  const { data: myFollowingIds } = useMyFollowingIds();
  const { data: counts } = useFollowCounts(id);
  const share = useShare();

  // Fetch viewed user's display name/username so empty states can address them by name
  const { data: viewedProfile } = useQuery({
    queryKey: ["follow-list-profile", id],
    enabled: !!id && !isOwnPage,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", id!)
        .maybeSingle();
      return data as { display_name: string | null; username: string | null } | null;
    },
  });
  const viewedName =
    viewedProfile?.display_name?.trim() ||
    (viewedProfile?.username ? `@${viewedProfile.username}` : "This user");

  const users = (isFollowers ? followers : following) as RowUser[] | undefined;
  const isLoading = isFollowers ? loadingFollowers : loadingFollowing;

  // Client-side search over the loaded list — matches on both the display name
  // and the handle so "@robyn" and "Robyn" both land.
  const [search, setSearch] = useState("");
  useEffect(() => setSearch(""), [type, id]);

  const query = search.trim().toLowerCase();
  const visibleUsers = useMemo(() => {
    if (!users) return users;
    if (!query) return users;
    return users.filter((u) =>
      `${u.display_name ?? ""} ${u.username ?? ""}`.toLowerCase().includes(query),
    );
  }, [users, query]);

  const count = visibleUsers?.length ?? 0;
  const hasAny = (users?.length ?? 0) > 0;
  const isSearchEmpty = hasAny && count === 0;

  const title = isFollowers ? "followers." : "following.";
  const lede = isFollowers
    ? "People who follow your finds."
    : "People whose taste you trust.";

  const sisterPath = `/profile/${id}/${isFollowers ? "following" : "followers"}`;
  const sisterLabel = isFollowers ? "see who you follow ↗" : "see your followers ↗";

  const handlePrimaryCta = () => {
    if (!isFollowers) {
      // Search reads this state and opens straight on the People tab, which
      // shows suggested users when the query is empty.
      navigate("/search?tab=people", { state: { fromProfile: true, profileId: id } });
      return;
    }
    // "Share Profile" opens the phone's own share sheet — copy link plus the
    // user's messaging apps — falling back to the in-app sheet on desktop.
    share({
      title: "My profile on Hello Hoedspruit",
      text: "Follow my finds around Hoedspruit.",
      url: `/profile/${id}`,
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: COLOR.page, paddingBottom: 100 }}>
      {/* Top bar */}
      <PageHeader
        title="Connections"
        right={
          isOwnPage ? (
            <button
              type="button"
              aria-label="Find people to follow"
              onClick={() =>
                navigate("/search?tab=people", {
                  state: { fromProfile: true, profileId: id },
                })
              }
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: COLOR.card,
                border: "none",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <UserPlus size={18} strokeWidth={1.8} color={COLOR.ink} />
            </button>
          ) : undefined
        }
      />

      {/* Segmented tabs */}
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 18 }}>
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 5,
            borderRadius: 999,
            background: COLOR.track,
          }}
        >
          {[
            { key: "followers", label: "Followers", count: counts?.followers ?? 0 },
            { key: "following", label: "Following", count: counts?.following ?? 0 },
          ].map((tab) => {
            const active = (tab.key === "followers") === isFollowers;
            return (
              <Link
                key={tab.key}
                to={`/profile/${id}/${tab.key}`}
                replace
                aria-current={active ? "page" : undefined}
                style={{
                  flex: 1,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  fontFamily: HEAD,
                  fontWeight: 600,
                  fontSize: 15,
                  letterSpacing: "-0.1px",
                  color: active ? "#FFFFFF" : COLOR.ink,
                  background: active ? COLOR.brown : "transparent",
                  textDecoration: "none",
                  transition: "background 160ms ease, color 160ms ease",
                }}
              >
                {tab.label} ({tab.count})
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 18 }}>
        <label
          style={{
            height: 48,
            background: COLOR.card,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 18px",
          }}
        >
          <Search size={17} strokeWidth={1.8} color={COLOR.muted} style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connections"
            aria-label="Search connections"
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: SANS,
              fontSize: 16,
              color: COLOR.ink,
            }}
          />
        </label>
      </div>

      {/* List card */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 24 }}>
        {isLoading ? (
          <div
            style={{
              background: COLOR.card,
              borderRadius: 18,
              padding: "6px 18px",
              overflow: "hidden",
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
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
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : isSearchEmpty ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p
              style={{
                margin: 0,
                fontFamily: SANS,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 15,
                color: COLOR.ink,
              }}
            >
              No connections match “{search.trim()}”.
            </p>
          </div>
        ) : count === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p
              style={{
                margin: 0,
                marginBottom: 12,
                fontFamily: SANS,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 15,
                color: COLOR.ink,
              }}
            >
              {isOwnPage
                ? isFollowers
                  ? "No followers yet."
                  : "You're not following anyone yet."
                : isFollowers
                ? `${viewedName} does not have any followers yet.`
                : `${viewedName} is not following anyone yet.`}
            </p>
            {isOwnPage && (
              <p
                style={{
                  margin: "0 auto",
                  fontFamily: SANS,
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: COLOR.muted,
                  maxWidth: 260,
                }}
              >
                {isFollowers
                  ? "Share your profile to grow your circle."
                  : "Find people whose taste you trust."}
              </p>
            )}
          </div>
        ) : (
          <div
            style={{
              background: COLOR.card,
              borderRadius: 18,
              padding: "6px 18px",
              overflow: "hidden",
            }}
          >
            {visibleUsers!.map((u, i) => (
              <RowWithMutation
                key={u.id}
                user={u}
                index={i}
                isFollowedInitially={myFollowingIds?.has(u.id) ?? false}
                isOwnFollowingPage={!isFollowers && isOwnPage}
                isFollowersOfSelf={isFollowers && isOwnPage}
                isSelf={!!authUser && authUser.id === u.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Primary CTA — only on your own profile */}
      {isOwnPage && (
        <div style={{ textAlign: "center", marginTop: 8, marginBottom: 24 }}>
          <button
            onClick={handlePrimaryCta}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#423324",
              color: "#ffffff",
              border: "none",
              borderRadius: 999,
              padding: "14px 24px",
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {isFollowers ? (
              <>
                <ShareIcon size={14} />
                Share Profile
              </>
            ) : (
              <>
                <Plus size={14} strokeWidth={1.8} />
                Find People
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};

export default FollowList;
