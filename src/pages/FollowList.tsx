import { useParams, Link } from "react-router-dom";
import { useFollowersList, useFollowingList } from "@/hooks/useFollows";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="px-4 pt-3">
          <BackButton className="mb-0" />
        </div>
        <div className="px-4 pt-2 pb-3">
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            {isFollowers ? "Followers" : "Following"}
          </h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          ))
        ) : !users?.length ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm font-medium mb-1">
              {isFollowers ? "No followers yet" : "Not following anyone yet"}
            </p>
            <p className="text-muted-foreground/60 text-xs mb-5">
              {isFollowers ? "Share your profile to get followers" : "Discover people in the community"}
            </p>
            <Link to="/people">
              <Button className="rounded-full gap-2">
                <UserPlus className="h-4 w-4" />
                Find Friends
              </Button>
            </Link>
          </div>
        ) : (
          users.map((u) => <UserCard key={u.id} user={u} />)
        )}
      </div>
    </div>
  );
};

export default FollowList;
