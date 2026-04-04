import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserCircle,
  Pencil,
  User,
  Bell,
  ShieldCheck,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

const settingsRows = [
  { icon: User, label: "Account Info", desc: "Manage email, phone & password" },
  { icon: Bell, label: "Notification Preferences", desc: "Customize notification settings" },
  { icon: ShieldCheck, label: "Privacy & Security", desc: "Manage visibility, data & protection", href: "/privacy-security" },
  { icon: HelpCircle, label: "Help & Support", desc: "FAQ & contact us", href: "/faqs" },
  { icon: FileText, label: "Terms & Policies", desc: "Our terms, privacy policy & more", href: "/terms" },
];

const AccountSettings = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff" }}>
        <div style={{ paddingTop: 52, paddingLeft: 24, paddingRight: 24 }}>
          <Skeleton className="h-4 w-20" />
          <div style={{ marginTop: 28 }}>
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>
    );
  }

  const renderRow = (item: typeof settingsRows[0], idx: number) => {
    const Icon = item.icon;
    const isLast = idx === settingsRows.length - 1;
    const inner = (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          paddingTop: 16,
          paddingBottom: 16,
          borderBottom: isLast ? "none" : "1px solid rgba(18,18,20,0.06)",
        }}
      >
        <Icon style={{ width: 22, height: 22, flexShrink: 0 }} strokeWidth={1.5} color="rgba(18,18,20,0.3)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#121214", lineHeight: 1.3 }}>{item.label}</span>
          <span style={{ display: "block", fontSize: 12, color: "rgba(18,18,20,0.35)", marginTop: 2, lineHeight: 1.3 }}>{item.desc}</span>
        </div>
        <ChevronRight style={{ width: 16, height: 16, flexShrink: 0 }} strokeWidth={2} color="rgba(18,18,20,0.2)" />
      </div>
    );

    if (item.href) {
      return <Link key={item.label} to={item.href}>{inner}</Link>;
    }
    return <button key={item.label} className="w-full text-left">{inner}</button>;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: 100 }}>
      {/* Back button */}
      <div style={{ paddingTop: 52, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft style={{ width: 18, height: 18 }} strokeWidth={2} color="rgba(18,18,20,0.4)" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2 }}>Back</span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 28 }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 0.95, letterSpacing: -0.5, color: "#121214", textTransform: "uppercase", margin: 0, fontFamily: "var(--font-heading, 'Sora', sans-serif)" }}>
          ACCOUNT<br />SETTINGS
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 12 }}>
        <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2, lineHeight: 1.4, fontStyle: "italic", fontFamily: "Georgia, 'Times New Roman', serif", margin: 0 }}>
          Manage your account and preferences
        </p>
      </div>

      {/* Profile card */}
      <div style={{ padding: "0 24px", marginTop: 28 }}>
        <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(18,18,20,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {profileLoading ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" style={{ width: 48, height: 48, objectFit: "cover" }} />
            ) : (
              <UserCircle style={{ width: 28, height: 28 }} color="rgba(18,18,20,0.2)" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#121214", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profileLoading ? <Skeleton className="h-5 w-28" /> : (profile?.display_name || user.email?.split("@")[0])}
            </div>
            <div style={{ fontSize: 13, color: "rgba(18,18,20,0.4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profileLoading ? <Skeleton className="h-3 w-36" /> : user.email}
            </div>
          </div>
          <Link
            to="/my-account"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid rgba(18,18,20,0.15)", borderRadius: 10, background: "transparent", flexShrink: 0, textDecoration: "none" }}
          >
            <Pencil style={{ width: 14, height: 14 }} color="#121214" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#121214" }}>Edit</span>
          </Link>
        </div>
      </div>

      {/* Settings rows */}
      <div style={{ padding: "0 24px", marginTop: 32 }}>
        {settingsRows.map((item, idx) => renderRow(item, idx))}
      </div>

      {/* Log Out */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 36 }}>
        <button
          onClick={() => { signOut(); navigate("/"); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 32px", border: "1px solid rgba(18,18,20,0.12)", borderRadius: 12, background: "transparent", cursor: "pointer" }}
        >
          <LogOut style={{ width: 16, height: 16 }} strokeWidth={1.5} color="rgba(18,18,20,0.4)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(18,18,20,0.4)" }}>Log out</span>
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;
