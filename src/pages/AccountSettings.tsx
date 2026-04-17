import { useEffect, useState } from "react";
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
  Trash2,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const settingsRows = [
  { icon: User, label: "Account Info", desc: "Manage email, phone & password", href: "/account-settings/info" },
  { icon: Bell, label: "Notification Preferences", desc: "Customize notification settings" },
  { icon: ShieldCheck, label: "Privacy & Security", desc: "Manage visibility, data & protection", href: "/privacy-security" },
  { icon: HelpCircle, label: "Help & Support", desc: "FAQ & contact us", href: "/faqs" },
  { icon: FileText, label: "Terms & Policies", desc: "Our terms, privacy policy & more", href: "/terms" },
];

const usePress = () => {
  const [pressed, setPressed] = useState(false);
  return {
    pressed,
    handlers: {
      onPointerDown: () => setPressed(true),
      onPointerUp: () => setPressed(false),
      onPointerLeave: () => setPressed(false),
    },
  };
};

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
      <div style={{ minHeight: "100vh", background: "#ebebeb", fontFamily: FF }}>
        <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
          <Skeleton className="h-4 w-20" />
          <div style={{ marginTop: 28 }}>
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#ebebeb", paddingBottom: 84, fontFamily: FF }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 8 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={20} strokeWidth={1.8} color="#2B2420" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: FF }}>Back</span>
        </button>
      </div>

      {/* Title */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 4 }}>
        <h1 style={{ fontSize: 53, fontWeight: 400, lineHeight: 1, letterSpacing: "0.01em", color: "#020202", textTransform: "none", margin: 0, fontFamily: FF }}>
          Account Settings
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.35, color: "rgba(18,18,20,0.55)", fontStyle: "italic", margin: 0, fontFamily: FF }}>
          Manage your account and preferences
        </p>
      </div>



      {/* Settings rows */}
      <div>
        {settingsRows.map((item, idx) => (
          <SettingsRow key={item.label} item={item} isLast={idx === settingsRows.length - 1} />
        ))}
      </div>

      {/* Delete account */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 32 }}>
        <DeleteAccountButton />
      </div>

    </div>
  );
};

function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      await supabase.auth.signOut();
      toast.success("Your account has been deleted");
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Could not delete account");
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, padding: "12px 24px", minHeight: 48,
          border: "1.5px solid rgba(220,38,38,0.35)",
          borderRadius: 24, background: "transparent", cursor: "pointer",
          transform: pressed ? "scale(0.97)" : "scale(1)",
          transition: "transform 0.12s ease",
          fontFamily: FF,
        }}
      >
        <Trash2 size={20} strokeWidth={1.8} color="#dc2626" />
        <span style={{ fontSize: 15, fontWeight: 500, color: "#dc2626", fontFamily: FF }}>Delete Account</span>
      </button>

      <AlertDialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={loading}
              style={{ background: "#dc2626", color: "#fff" }}
            >
              {loading ? (<><Loader2 size={16} className="animate-spin mr-2" /> Deleting...</>) : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProfileCard({ profile, profileLoading, user }: { profile: any; profileLoading: boolean; user: any }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid rgba(18,18,20,0.06)",
      borderRadius: 16,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
    }}>
      {/* Avatar */}
      <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#ebebeb", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
        {profileLoading ? (
          <Skeleton className="h-full w-full rounded-full" />
        ) : profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Profile" style={{ width: 48, height: 48, objectFit: "cover" }} />
        ) : (
          <UserCircle size={28} strokeWidth={1.8} color="rgba(18,18,20,0.4)" />
        )}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: "#020202", lineHeight: 1.3, marginBottom: 2, fontFamily: FF }}>
          {profileLoading ? <Skeleton className="h-5 w-28" /> : (profile?.display_name || user.email?.split("@")[0])}
        </div>
        <div style={{ fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FF }}>
          {profileLoading ? <Skeleton className="h-3 w-36" /> : user.email}
        </div>
      </div>
      {/* Edit */}
      <Link
        to="/my-account"
        style={{
          marginLeft: "auto",
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px",
          border: "1.5px solid rgba(18,18,20,0.12)",
          borderRadius: 24,
          background: "transparent",
          flexShrink: 0,
          textDecoration: "none",
          transform: pressed ? "scale(0.97)" : "scale(1)",
          transition: "transform 0.12s ease",
        }}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        <Pencil size={16} strokeWidth={1.8} color="#2B2420" />
        <span style={{ fontSize: 13, fontWeight: 500, color: "#2B2420", fontFamily: FF }}>Edit</span>
      </Link>
    </div>
  );
}

function SettingsRow({ item, isLast }: { item: typeof settingsRows[0]; isLast: boolean }) {
  const [pressed, setPressed] = useState(false);
  const Icon = item.icon;
  const inner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 24px",
        background: "transparent",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.15s ease",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <Icon size={24} strokeWidth={1.8} color="rgba(18,18,20,0.3)" style={{ flexShrink: 0, marginRight: 20 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 16, fontWeight: 500, color: "#2B2420", lineHeight: 1.3, fontFamily: FF }}>{item.label}</span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)", lineHeight: 1.4, marginTop: 2, fontFamily: FF }}>{item.desc}</span>
      </div>
      <ChevronRight size={20} strokeWidth={1.8} color="rgba(18,18,20,0.2)" style={{ flexShrink: 0, marginLeft: "auto" }} />
    </div>
  );

  const divider = !isLast ? (
    <div style={{ marginLeft: 68, height: 1, background: "rgba(18,18,20,0.08)" }} />
  ) : null;

  if (item.href) {
    return <div key={item.label}><Link to={item.href} style={{ textDecoration: "none" }}>{inner}</Link>{divider}</div>;
  }
  return <div key={item.label}><button className="w-full text-left" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%" }}>{inner}</button>{divider}</div>;
}

function LogOutButton({ onLogOut }: { onLogOut: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onLogOut}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, padding: "12px 24px", minHeight: 48,
        border: "1.5px solid rgba(18,18,20,0.15)",
        borderRadius: 24, background: "transparent", cursor: "pointer",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "transform 0.12s ease",
      }}
    >
      <LogOut size={20} strokeWidth={1.8} color="#2B2420" />
      <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: FF }}>Log out</span>
    </button>
  );
}

export default AccountSettings;
