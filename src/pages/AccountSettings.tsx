import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const DISPLAY = "'Helvetica Neue', Helvetica, 'Pragmatica', 'Inter', sans-serif";

const CORAL_GRADIENT =
  "radial-gradient(circle at 35% 30%, #F47356 0%, #EB6240 70%, #D9572F 100%)";

type Row = { title: string; desc: string; href?: string };

const accountRows: Row[] = [
  { title: "Account Info", desc: "Manage email, phone and password", href: "/account-settings/info" },
  { title: "Notification Preferences", desc: "Customise what you hear from us", href: "/notifications" },
  { title: "Privacy & Security", desc: "Manage visibility, data and protection", href: "/privacy-security" },
];

const supportRows: Row[] = [
  { title: "Help and support", desc: "FAQ and contact us", href: "/faqs" },
  { title: "Terms and policies", desc: "Our terms, privacy policy and more", href: "/terms" },
];

const AccountSettings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const [backPressed, setBackPressed] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", paddingBottom: 140, fontFamily: SANS, position: "relative", overflowX: "hidden" }}>
      {/* Back */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          onPointerDown={() => setBackPressed(true)}
          onPointerUp={() => setBackPressed(false)}
          onPointerLeave={() => setBackPressed(false)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "transparent", border: "none", padding: 0, cursor: "pointer",
            transform: backPressed ? "scale(0.98)" : "scale(1)",
            transition: "transform 150ms ease-out",
            fontFamily: SANS,
          }}
        >
          <ChevronLeft size={20} strokeWidth={2} color="#0A0A0A" />
          <span style={{ fontSize: 15, fontWeight: 400, color: "#0A0A0A", fontFamily: SANS }}>Back</span>
        </button>
      </div>

      {/* Header area with coral circle */}
      <div style={{ position: "relative", paddingLeft: 24, paddingRight: 24 }}>
        {/* Coral circle */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -20,
            right: -120,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: CORAL_GRADIENT,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 400, letterSpacing: "0.02em", color: "#8A8480", marginBottom: 8 }}>
            Settings
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 52, fontWeight: 700, lineHeight: 0.98, letterSpacing: "-0.03em", color: "#0A0A0A", margin: 0, marginBottom: 14 }}>
            Account<br />settings
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 15, fontWeight: 400, lineHeight: 1.45, color: "#8A8480", margin: 0, maxWidth: 260 }}>
            Manage your account and preferences.
          </p>
        </div>
      </div>

      {/* Group: Your account */}
      <SettingsGroup label="Your account" rows={accountRows} marginTop={40} />

      {/* Group: Support and legal */}
      <SettingsGroup label="Support and legal" rows={supportRows} marginTop={40} />

      {/* Delete */}
      <div style={{ marginTop: 40, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ borderTop: "1px solid #E0DCD6", paddingTop: 24, display: "flex", justifyContent: "center" }}>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
};

function SettingsGroup({ label, rows, marginTop }: { label: string; rows: Row[]; marginTop: number }) {
  return (
    <div style={{ marginTop, paddingLeft: 24, paddingRight: 24 }}>
      <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 400, letterSpacing: "0.02em", color: "#8A8480", marginBottom: 10, paddingLeft: 4 }}>
        {label}
      </div>
      <div style={{ background: "#FFFFFF", borderRadius: 24, overflow: "hidden" }}>
        {rows.map((row, idx) => (
          <SettingsRow key={row.title} row={row} isFirst={idx === 0} />
        ))}
      </div>
    </div>
  );
}

function SettingsRow({ row, isFirst }: { row: Row; isFirst: boolean }) {
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);
  const bg = pressed ? "#F7F5F2" : hover ? "#FBFAF8" : "#FFFFFF";

  const inner = (
    <div
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => { setPressed(false); setHover(false); }}
      onPointerEnter={() => setHover(true)}
      style={{
        display: "flex", alignItems: "center", gap: 16,
        width: "100%", textAlign: "left",
        padding: "18px 20px",
        background: bg,
        border: "none",
        borderTop: isFirst ? "none" : "1px solid #F2EFEC",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 150ms ease-out, background-color 150ms ease-out",
        cursor: "pointer",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.005em", color: "#0A0A0A" }}>
          {row.title}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 400, lineHeight: 1.3, letterSpacing: "0.01em", color: "#8A8480", marginTop: 4 }}>
          {row.desc}
        </div>
      </div>
      <ChevronRight size={20} strokeWidth={2} strokeLinecap="round" color="#8A8480" style={{ flexShrink: 0 }} />
    </div>
  );

  if (row.href) {
    return <Link to={row.href} style={{ textDecoration: "none", display: "block" }}>{inner}</Link>;
  }
  return <button style={{ background: "none", border: "none", padding: 0, width: "100%", cursor: "pointer" }}>{inner}</button>;
}

function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);
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
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          padding: "8px 12px",
          fontFamily: SANS, fontSize: 14, fontWeight: 400, letterSpacing: "0.01em",
          color: hover ? "#0A0A0A" : "#8A8480",
          transition: "color 150ms ease-out",
        }}
      >
        Delete account
      </button>

      <AlertDialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <AlertDialogContent style={{ fontFamily: SANS }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: DISPLAY, letterSpacing: "-0.02em" }}>
              Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: SANS, color: "#8A8480" }}>
              This permanently deletes your account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} style={{ fontFamily: SANS, background: "transparent", border: "none", color: "#8A8480" }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={loading}
              style={{ background: "#0A0A0A", color: "#FFFFFF", borderRadius: 999, padding: "12px 22px", fontFamily: SANS, fontSize: 15 }}
            >
              {loading ? (<><Loader2 size={16} className="animate-spin mr-2" /> Deleting...</>) : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AccountSettings;
