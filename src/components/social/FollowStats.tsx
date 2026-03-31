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
      <div className="flex items-center gap-6">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <Link
        to={`/profile/${userId}/followers`}
        className="flex items-center gap-1.5 text-sm active:scale-95 transition-transform"
      >
        <span className="font-bold text-foreground">{counts?.followers ?? 0}</span>
        <span className="text-muted-foreground">Followers</span>
      </Link>
      <Link
        to={`/profile/${userId}/following`}
        className="flex items-center gap-1.5 text-sm active:scale-95 transition-transform"
      >
        <span className="font-bold text-foreground">{counts?.following ?? 0}</span>
        <span className="text-muted-foreground">Following</span>
      </Link>
    </div>
  );
};

export default FollowStats;
