import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import UserCard from "@/components/social/UserCard";
import BackButton from "@/components/BackButton";

const People = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["people-search", search],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, display_name, avatar_url, location")
        .order("display_name");

      if (search.trim()) {
        query = query.ilike("display_name", `%${search.trim()}%`);
      }

      // Exclude self
      if (user) {
        query = query.neq("id", user.id);
      }

      const { data } = await query.limit(30);
      return data || [];
    },
    enabled: true,
  });

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <BackButton />
          <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            People
          </h1>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-full bg-card border-border"
            />
          </div>
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
            <p className="text-muted-foreground text-sm font-medium">
              {search ? "No people found" : "No users yet"}
            </p>
            {search && (
              <p className="text-muted-foreground/60 text-xs mt-1">Try another name</p>
            )}
          </div>
        ) : (
          users.map((u) => <UserCard key={u.id} user={u} />)
        )}
      </div>
    </div>
  );
};

export default People;
