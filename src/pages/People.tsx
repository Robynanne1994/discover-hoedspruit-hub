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
    queryKey: ["people-search", search, user?.id],
    queryFn: async () => {
      let query = supabase.from("profiles").select("id, display_name, avatar_url, location").order("display_name");

      if (search.trim()) {
        query = query.ilike("display_name", `%${search.trim()}%`);
      }

      if (user) {
        query = query.neq("id", user.id);
      }

      const { data, error } = await query.limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen pb-20" style={{ background: "#ffffff" }}>
      {/* Back button */}
      <div style={{ paddingTop: 44, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
          <ArrowLeft size={18} strokeWidth={2} style={{ color: "rgba(18,18,20,0.4)" }} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "rgba(18,18,20,0.4)",
              letterSpacing: "0.2px",
            }}
          >
            Back
          </span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 900,
            fontSize: 40,
            lineHeight: 0.95,
            letterSpacing: "-0.5px",
            color: "#2b2420",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          FIND
          <br />
          PEOPLE
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: 14,
            color: "rgba(18,18,20,0.4)",
            letterSpacing: "0.2px",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          Connect with people exploring Hoedspruit
        </p>
      </div>

      {/* Search bar */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <div
          className="flex items-center"
          style={{
            background: "rgba(18,18,20,0.04)",
            border: "1px solid rgba(18,18,20,0.08)",
            borderRadius: 9999,
            padding: "14px 16px",
            gap: 10,
          }}
        >
          <Search size={18} strokeWidth={2} style={{ color: "rgba(18,18,20,0.3)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{
              fontSize: 14,
              color: "#2b2420",
              letterSpacing: "0.2px",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 40 }}>
        {isLoading ? (
          <div className="space-y-3">
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
                fontWeight: 900,
                fontSize: 24,
                color: "#2b2420",
                marginBottom: 10,
                letterSpacing: "-0.5px",
              }}
            >
              {search ? "No matching people" : "No people yet"}
            </p>

            <p
              style={{
                fontSize: 13,
                color: "rgba(18,18,20,0.4)",
                lineHeight: 1.5,
                maxWidth: 240,
                margin: "0 auto",
              }}
            >
              {search ? "Try another search term" : "People you can follow will appear here"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
