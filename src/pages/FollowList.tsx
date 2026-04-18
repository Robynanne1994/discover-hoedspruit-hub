import BackButton from "@/components/BackButton";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useFollowersList, useFollowingList } from "@/hooks/useFollows";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, ArrowLeft } from "lucide-react";
import UserCard from "@/components/social/UserCard";

const FollowList = () => {
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const isFollowers = type === "followers";

  const { data: followers, isLoading: loadingFollowers } = useFollowersList(isFollowers ? id : undefined);
  const { data: following, isLoading: loadingFollowing } = useFollowingList(!isFollowers ? id : undefined);

  const users = isFollowers ? followers : following;
  const isLoading = isFollowers ? loadingFollowers : loadingFollowing;

  return (
    <div className="min-h-screen pb-20" style={{ background: "#ebebeb" }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 20, paddingRight: 20, marginBottom: 12 }}>
        <BackButton />
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 12 }}>
        <h1
          style={{
            fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
            fontWeight: 400,
            fontSize: 40,
            lineHeight: 0.95,
            letterSpacing: "-0.01em",
            color: "#020202",
            textTransform: "capitalize",
            margin: 0,
          }}
        >
          {isFollowers ? "Followers" : "Following"}
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 28 }}>
        <p
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontStyle: "italic",
            fontSize: 14,
            color: "rgba(18,18,20,0.4)",
            letterSpacing: "0.2px",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {isFollowers ? "People who follow you" : "People you follow"}
        </p>
      </div>

      {/* Content */}
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 40 }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center"
                style={{
                  gap: 14,
                  padding: 16,
                  borderRadius: 16,
                  background: "rgba(18,18,20,0.03)",
                  border: "1px solid rgba(18,18,20,0.06)",
                }}
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 mb-2 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : !users?.length ? (
          <div className="text-center" style={{ paddingTop: 80 }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(18,18,20,0.04)" }}
            >
              <Users size={28} style={{ color: "rgba(18,18,20,0.2)" }} />
            </div>

            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 400,
                fontSize: 24,
                color: "#020202",
                marginBottom: 10,
                letterSpacing: "0.01em",
                textTransform: "uppercase",
              }}
            >
              {isFollowers ? "No followers yet" : "Not following anyone"}
            </p>

            <p
              style={{
                fontSize: 13,
                color: "rgba(18,18,20,0.4)",
                lineHeight: 1.5,
                maxWidth: 240,
                margin: "0 auto 24px",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              {isFollowers ? "Share your profile to get followers" : "Discover people in the community"}
            </p>

            <Link to="/people">
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#715a3d",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 9999,
                  padding: "12px 28px",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  cursor: "pointer",
                }}
              >
                <UserPlus size={16} strokeWidth={2} />
                Find Friends
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.map((u) => <UserCard key={u.id} user={u} />)}
            </div>
            <div className="text-center" style={{ paddingTop: 28, paddingBottom: 16 }}>
              <Link to="/people">
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "transparent",
                    color: "#715a3d",
                    border: "1px solid rgba(18,18,20,0.12)",
                    borderRadius: 9999,
                    padding: "12px 28px",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    cursor: "pointer",
                  }}
                >
                  <UserPlus size={16} strokeWidth={2} />
                  Find Friends
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FollowList;
