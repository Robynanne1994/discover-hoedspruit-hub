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
    <div className="min-h-screen" style={{ background: "#ebebeb", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center"
          style={{ gap: 6, background: "none", border: "none", padding: 0, marginBottom: 20 }}
        >
          <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "#2b2420" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#2b2420", fontFamily: "var(--font-body)" }}>Back</span>
        </button>

        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 400,
          fontSize: 40,
          lineHeight: 0.95,
          letterSpacing: "0.01em",
          color: "#2b2420",
          textTransform: "uppercase",
        }}>
          {isFollowers ? "FOLLOWERS" : "FOLLOWING"}
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 12, marginBottom: 28 }}>
        <p style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontStyle: "italic",
          fontSize: 14,
          color: "#827b75",
          letterSpacing: "0.2px",
          lineHeight: 1.4,
        }}>
          {isFollowers ? "People who follow you" : "People you follow"}
        </p>
      </div>

      {/* Content */}
      <div style={{ paddingLeft: 24, paddingRight: 24 }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center"
                style={{
                  gap: 14,
                  background: "#f5f0e8",
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: "var(--card-shadow)",
                }}
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : !users?.length ? (
          <div className="text-center" style={{ paddingTop: 60, paddingBottom: 40 }}>
            <Users style={{ width: 48, height: 48, color: "rgba(18,18,20,0.12)", margin: "0 auto", marginBottom: 20 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "#2b2420", fontFamily: "var(--font-heading)", marginBottom: 8 }}>
              {isFollowers ? "No followers yet" : "Not following anyone yet"}
            </p>
            <p style={{ fontSize: 13, color: "#827b75", maxWidth: 240, margin: "0 auto 24px", fontFamily: "var(--font-body)" }}>
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
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                }}
              >
                <UserPlus style={{ width: 16, height: 16, strokeWidth: 2 }} />
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
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                  }}
                >
                  <UserPlus style={{ width: 16, height: 16, strokeWidth: 2 }} />
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
