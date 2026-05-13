import { useState } from "react";
import { Link } from "react-router-dom";
import { User as UserIcon, Search, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SearchDialog from "@/components/SearchDialog";

const HomeMasthead = () => {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["home-masthead-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const titleCase = (s?: string | null) =>
    (s || "").split(" ").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  const greetingName =
    titleCase(profile?.display_name) ||
    titleCase(profile?.username) ||
    titleCase(user?.user_metadata?.first_name as string | undefined) ||
    "there";

  const iconBtn: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 999,
    background: "#EEE8DA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    padding: 0,
  };

  return (
    <div style={{ paddingTop: 24 }}>
      {/* Top icon row */}
      <div
        style={{
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            to="/my-profile"
            aria-label="My profile"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "#EEE8DA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <UserIcon size={20} color="#715a3d" strokeWidth={1.6} />
            )}
          </Link>
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            style={iconBtn}
          >
            <Search size={20} color="#715a3d" strokeWidth={1.8} />
          </button>
        </div>
        <Link to="/my-notifications" aria-label="Notifications" style={iconBtn}>
          <Bell size={20} color="#715a3d" strokeWidth={1.8} />
        </Link>
      </div>

      {/* Greeting */}
      <div style={{ padding: "28px 20px 0" }}>
        <p
          style={{
            margin: 0,
            marginBottom: 6,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 400,
            fontSize: 22,
            lineHeight: 1.15,
            letterSpacing: "-0.2px",
            color: "#EEE8DA",
          }}
        >
          Hi {greetingName},
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: 34,
            lineHeight: 1.05,
            letterSpacing: "-0.8px",
            color: "#EEE8DA",
          }}
        >
          Welcome Back
        </h1>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default HomeMasthead;
