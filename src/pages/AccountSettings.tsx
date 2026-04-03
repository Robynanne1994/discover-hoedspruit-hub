import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from "@/components/BackButton";
import {
  UserCircle,
  Pencil,
  User,
  Bell,
  ShieldCheck,
  Lock,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react";

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
      <div className="min-h-screen pb-20 bg-background">
        <div className="pt-14 pb-1 px-5">
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
        <div className="px-5 pt-6">
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const settingsRows = [
    {
      icon: User,
      label: "Account Info",
      sub: "Manage email, phone & password",
    },
    {
      icon: Bell,
      label: "Notification Preferences",
      sub: "Customize notification settings",
    },
    {
      icon: ShieldCheck,
      label: "Privacy & Security",
      sub: "Manage visibility, data & protection",
      href: "/privacy-security",
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      sub: "FAQ & contact us",
      href: "/faqs",
    },
    {
      icon: FileText,
      label: "Terms & Policies",
      sub: "Our terms, privacy policy & more",
      href: "/terms",
    },
  ];

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Top bar */}
      <div className="pt-14 pb-1 px-5 relative">
        <div className="absolute left-5 top-14">
          <BackButton className="text-primary mb-0" />
        </div>
        <h1 className="text-center text-[13px] font-medium text-muted-foreground uppercase tracking-[0.08em]">
          Account Settings
        </h1>
      </div>

      {/* Profile summary card */}
      <div className="px-5 pt-6 mb-6">
        <div className="bg-card border border-border/40 rounded-2xl px-5 py-5">
          <div className="flex items-center gap-3.5">
            <div className="h-[56px] w-[56px] rounded-full bg-muted border border-border/30 overflow-hidden flex items-center justify-center shrink-0">
              {profileLoading ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle className="h-8 w-8 text-muted-foreground/25" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {profileLoading ? (
                <>
                  <Skeleton className="h-5 w-28 mb-1.5" />
                  <Skeleton className="h-3 w-36" />
                </>
              ) : (
                <>
                  <h2
                    className="text-[18px] font-semibold text-foreground tracking-tight truncate leading-tight"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {profile?.display_name || user.email?.split("@")[0]}
                  </h2>
                  <p className="text-muted-foreground text-[12px] truncate mt-0.5">
                    {user.email}
                  </p>
                </>
              )}
            </div>
            <Link
              to="/my-account"
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/40 text-foreground text-[12px] font-medium active:scale-95 transition-transform hover:bg-muted/30"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Settings list */}
      <div className="px-5 mb-6">
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          {settingsRows.map((item, i) => {
            const Icon = item.icon;
            const inner = (
              <div
                className={`flex items-center gap-3.5 px-4 py-3.5 ${
                  i < settingsRows.length - 1 ? "border-b border-border/20" : ""
                }`}
              >
                <Icon
                  className="h-[16px] w-[16px] text-primary/70 shrink-0"
                  strokeWidth={1.5}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-foreground block leading-tight">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {item.sub}
                  </span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 shrink-0" />
              </div>
            );

            if (item.href) {
              return (
                <Link key={item.label} to={item.href}>
                  {inner}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                className="w-full text-left hover:bg-muted/20 transition-colors"
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      {/* Log Out */}
      <div className="px-5 mt-1 mb-8">
        <button
          onClick={() => {
            signOut();
            navigate("/");
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-destructive/80 font-medium text-[13px] active:scale-[0.97] transition-transform hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;
