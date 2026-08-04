import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Lock, Plus } from "lucide-react";
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
};

const SERIF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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

  const { data: myFollowingIds } = useMyFollowingIds();
  const { data: counts } = useFollowCounts(id);
  const share = useShare();

  // Who this page is about. It used to read `profiles` directly, which RLS
  // only ever answers for your own row — so every other user's name came back
  // null and the empty state said "This user". get_public_profiles is the
  // supported way to resolve someone else, and it also carries the is_private
  // flag this page needs.
  const { data: viewedProfile } = useQuery({
    queryKey: ["follow-list-profile", id],
    enabled: !!id && !isOwnPage,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_profiles", { _ids: [id!] });
      return ((data && data[0]) || null) as
        | { display_name: string | null; username: string | null; is_private: boolean | null }
        | null;
    },
  });
  const viewedName =
    viewedProfile?.display_name?.trim() ||
    (viewedProfile?.username ? `@${viewedProfile.username}` : "This user");

  // A private account's connections are for its approved followers only.
  // The RPCs behind this page now refuse a locked profile outright, so without
  // this the page would just render a permanently empty list with no
  // explanation — someone typing the URL in deserves to be told why.
  const { data: viewerFollowStatus } = useIsFollowing(isOwnPage ? undefined : id);
  const isLocked =
    !isOwnPage && !!viewedProfile?.is_private && viewerFollowStatus !== "accepted";

  const { data: followers, isLoading: loadingFollowers } = useFollowersList(
    isFollowers && !isLocked ? id : undefined,
  );
  const { data: following, isLoading: loadingFollowing } = useFollowingList(
    !isFollowers && !isLocked ? id : undefined,
  );

  const users = (isFollowers ? followers : following) as RowUser[] | undefined;
  const isLoading = isFollowers ? loadingFollowers : loadingFollowing;
  const count = users?.length ?? 0;

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
      <PageHeader title="Connections" />

      {/* Tabs */}
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 18, paddingBottom: 18 }}>
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${COLOR.line}`,
          }}
        >
          {/* The counts come back null for a profile we are not allowed to
              see, so the tab shows the plain label rather than a made-up 0. */}
          {[
            { key: "followers", label: "Followers", count: counts?.followers ?? null },
            { key: "following", label: "Following", count: counts?.following ?? null },
          ].map((tab) => {
            const active = (tab.key === "followers") === isFollowers;
            return (
              <Link
                key={tab.key}
                to={`/profile/${id}/${tab.key}`}
                replace

                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px 0",
                  fontFamily: SANS,
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: active ? COLOR.ink : COLOR.subtle,
                  textDecoration: "none",
                  borderBottom: active ? `2px solid ${COLOR.ink}` : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {tab.count === null ? tab.label : `${tab.label} (${tab.count})`}
              </Link>
            );
          })}
        </div>
      </div>

      {/* List card */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 24 }}>
        {isLocked ? (
          <div
            style={{
              background: COLOR.card,
              borderRadius: 18,
              padding: "36px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: COLOR.soft,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Lock size={18} strokeWidth={1.8} color={COLOR.ink} />
            </div>
            <p
              style={{
                margin: "0 0 8px",
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 15,
                color: COLOR.ink,
              }}
            >
              This account is private
            </p>
            <p
              style={{
                margin: "0 auto 18px",
                maxWidth: 280,
                fontFamily: SANS,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: COLOR.muted,
              }}
            >
              {viewerFollowStatus === "pending"
                ? `${viewedName} still has to approve your follow request before you can see who they follow.`
                : `Follow ${viewedName} to see their followers and who they follow.`}
            </p>
            <Link
              to={`/profile/${id}`}
              style={{
                display: "inline-block",
                background: COLOR.brown,
                color: "#FFFFFF",
                textDecoration: "none",
                borderRadius: 999,
                padding: "11px 22px",
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              View profile
            </Link>
          </div>
        ) : isLoading ? (
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
            {users!.map((u, i) => (
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
