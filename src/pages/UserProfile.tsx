import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import FollowStats from "@/components/social/FollowStats";
import FollowButton from "@/components/social/FollowButton";
import BackButton from "@/components/BackButton";
import heroBg from "@/assets/hero-homepage.jpg";

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  // If viewing own profile, redirect could be added, but we show it anyway
  const isOwnProfile = user?.id === id;

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[160px] overflow-hidden">
          <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
          <div className="absolute top-4 left-4 z-10">
            <BackButton />
          </div>
        </div>
      </section>

      {/* Profile info */}
      <div className="px-4 -mt-12 relative z-10 flex flex-col items-center">
        <div className="h-24 w-24 rounded-full bg-card border-4 border-card overflow-hidden flex items-center justify-center shadow-card mb-3">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-full" />
          ) : profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <UserCircle className="h-16 w-16 text-muted-foreground/40" />
          )}
        </div>

        {isLoading ? (
          <>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-4 w-28 mb-3" />
            <Skeleton className="h-5 w-40 mb-4" />
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              {profile?.display_name || "User"}
            </h2>
            {profile?.location && (
              <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5 mb-2">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </p>
            )}
            {(profile as any)?.bio && (
              <p className="text-sm text-muted-foreground text-center mt-2 mb-1 px-6 leading-relaxed">
                {(profile as any).bio}
              </p>
            )}
            {!profile?.location && !(profile as any)?.bio && <div className="mb-2" />}

            <FollowStats userId={id!} />

            {!isOwnProfile && (
              <div className="mt-3">
                <FollowButton targetUserId={id!} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
