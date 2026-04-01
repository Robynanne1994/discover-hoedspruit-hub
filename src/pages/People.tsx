import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Search, Users, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import UserCard from "@/components/social/UserCard";
import { useNavigate } from "react-router-dom";

const People = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

      if (user) {
        query = query.neq("id", user.id);
      }

      const { data } = await query.limit(30);
      return data || [];
    },
    enabled: true,
  });

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border/60">
        <div className="px-5 pt-14 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>

          <h1
            className="text-2xl font-semibold text-foreground tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Find People
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Connect with people exploring Hoedspruit
          </p>
        </div>

        {/* Search */}
        <div className="px-5 pb-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-card border border-border/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 bg-card border border-border/60 rounded-xl p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : !users?.length ? (
          <div className="flex flex-col items-center justify-center py-24 px-6">
            <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center mb-5">
              <Users className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p
              className="text-base font-semibold text-foreground mb-1.5"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {search ? "No matching profiles" : "No people yet"}
            </p>
            <p className="text-sm text-muted-foreground/70 text-center max-w-[240px]">
              {search
                ? "Try searching with a different name"
                : "People you can follow will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default People;
