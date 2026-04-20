import { useFollowCounts } from "@/hooks/useFollows";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface FollowStatsProps {
  userId: string;
}

const FollowStats = ({ userId }: FollowStatsProps) => {
  const { data: counts, isLoading } = useFollowCounts(userId);

  if (isLoading) {
    return (
      <div className="flex items-center" style={{ gap: 24 }}>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>
    );
  }

  const followersCount = counts?.followers ?? 0;
  const followingCount = counts?.following ?? 0;

  return (
    <div className="flex items-center" style={{ gap: 24 }}>
      <Link
        to={`/profile/${userId}/followers`}
        className="flex items-center active:scale-95 transition-transform"
        style={{ gap: 4 }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#020202" }}>{followersCount}</span>
        <span style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)" }}>{followersCount === 1 ? "Follower" : "Followers"}</span>
      </Link>
      <Link
        to={`/profile/${userId}/following`}
        className="flex items-center active:scale-95 transition-transform"
        style={{ gap: 4 }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#020202" }}>{followingCount}</span>
        <span style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)" }}>Following</span>
      </Link>
    </div>
  );
};

export default FollowStats;
