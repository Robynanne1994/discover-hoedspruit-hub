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

  return (
    <div className="flex items-center" style={{ gap: 24 }}>
      <Link
        to={`/profile/${userId}/followers`}
        className="flex items-center active:scale-95 transition-transform"
        style={{ gap: 4 }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#020202" }}>{counts?.followers ?? 0}</span>
        <span style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)" }}>Followers</span>
      </Link>
      <Link
        to={`/profile/${userId}/following`}
        className="flex items-center active:scale-95 transition-transform"
        style={{ gap: 4 }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#020202" }}>{counts?.following ?? 0}</span>
        <span style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)" }}>Following</span>
      </Link>
    </div>
  );
};

export default FollowStats;
