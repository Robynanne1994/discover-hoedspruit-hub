import { useParams, Link } from "react-router-dom";
import { useFollowersList, useFollowingList } from "@/hooks/useFollows";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus } from "lucide-react";
import UserCard from "@/components/social/UserCard";
import BackButton from "@/components/BackButton";

const FollowList = () => {
  const { id, type } = useParams<{ id: string; type: string }>();
  const isFollowers = type === "followers";

  const { data: followers, isLoading: loadingFollowers } = useFollowersList(isFollowers ? id : undefined);
  const { data: following, isLoading: loadingFollowing } = useFollowingList(!isFollowers ? id : undefined);

  const users = isFollowers ? followers : following;
  const isLoading = isFollowers ? loadingFollowers : loadingFollowing;

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div style={{ padding: "12px 24px 0" }}>
          <BackButton className="mb-0" />
        </div>
        <div style={{ padding: "8px 24px 14px" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 28,
              fontWeight: 800,
              color: "#2b2420",
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            {isFollowers ? "Followers" : "Following"}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px 0" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 16,
                  borderRadius: 16,
                  background: "#f5f0e8",
                }}
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 mb-1.5" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : !users?.length ? (
          <div style={{ textAlign: "center", paddingTop: 64, paddingBottom: 32 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                background: "#f5f0e8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Users style={{ width: 32, height: 32, color: "#B8916A" }} />
            </div>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 16,
                fontWeight: 700,
                color: "#2b2420",
                margin: "0 0 6px",
              }}
            >
              {isFollowers ? "No followers yet" : "Not following anyone yet"}
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "#827b75",
                margin: "0 0 24px",
                lineHeight: 1.5,
              }}
            >
              {isFollowers ? "Share your profile to get followers" : "Discover people in the community"}
            </p>
            <Link to="/people">
              <button
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  background: "#715a3d",
                  border: "none",
                  borderRadius: 9999,
                  padding: "10px 24px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <UserPlus style={{ width: 16, height: 16 }} />
                Find Friends
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {users.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
            <div style={{ textAlign: "center", paddingTop: 24, paddingBottom: 16 }}>
              <Link to="/people">
                <button
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#715a3d",
                    background: "transparent",
                    border: "1.5px solid #715a3d",
                    borderRadius: 9999,
                    padding: "10px 24px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <UserPlus style={{ width: 16, height: 16 }} />
                  Find Friends
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowList;
