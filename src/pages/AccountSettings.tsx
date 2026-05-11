import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2 } from "lucide-react";
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

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const COLORS = {
  bg: "#5C6446",
  blob: "#454C36",
  cream: "#EEE8DA",
  ink: "#2A2A24",
  muted: "#6B6A5E",
  line: "#D9D2C0",
};

type Row = { title: string; desc: string; href?: string };

const accountRows: Row[] = [
  { title: "Account Info", desc: "Manage email, phone, and password", href: "/account-settings/info" },
  { title: "Notification Preferences", desc: "Customise what you hear from us", href: "/notifications" },
  { title: "Privacy & Security", desc: "Manage visibility, data, and protection", href: "/privacy-security" },
];

const supportRows: Row[] = [
  { title: "Help & Support", desc: "FAQ and contact", href: "/faqs" },
  { title: "Terms & Policies", desc: "Our terms, privacy policy, and more", href: "/terms" },
];

const AccountSettings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const [backPressed, setBackPressed] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        paddingBottom: 140,
        fontFamily: SANS,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Top-extending blob */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 220,
          height: 320,
          background: COLORS.blob,
          borderRadius: "50% 45% 55% 50% / 55% 50% 60% 45%",
          opacity: 0.85,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 3, paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          onPointerDown={() => setBackPressed(true)}
          onPointerUp={() => setBackPressed(false)}
          onPointerLeave={() => setBackPressed(false)}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: COLORS.cream,
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transform: backPressed ? "scale(0.96)" : "scale(1)",
            transition: "transform 150ms ease-out",
          }}
        >
          <ArrowLeft size={18} strokeWidth={1.6} color={COLORS.ink} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ position: "relative", padding: "18px 24px 0", overflow: "hidden" }}>
        {/* Blob 1 */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -40,
            right: -80,
            width: 220,
            height: 240,
            background: COLORS.blob,
            borderRadius: "50% 45% 55% 50% / 55% 50% 60% 45%",
            opacity: 0.85,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        {/* Blob 2 */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 60,
            right: -30,
            width: 120,
            height: 130,
            background: "rgba(238, 232, 218, 0.08)",
            borderRadius: "55% 45% 50% 55% / 50% 60% 45% 55%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: "2.4px",
              textTransform: "uppercase",
              color: "rgba(238, 232, 218, 0.7)",
              marginBottom: 14,
            }}
          >
            ACCOUNT
          </div>
          <h1
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 72,
              lineHeight: 0.92,
              letterSpacing: "-2.5px",
              color: COLORS.cream,
              margin: 0,
              marginBottom: 18,
              textTransform: "lowercase",
            }}
          >
            settings.
          </h1>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 400,
              lineHeight: 1.65,
              color: "rgba(238, 232, 218, 0.9)",
              margin: 0,
              marginBottom: 36,
              maxWidth: 260,
            }}
          >
            Manage your account and preferences.
          </p>
        </div>
      </div>

      {/* Your Account */}
      <SettingsGroup label="Your Account" rows={accountRows} marginTop={0} />

      {/* Support & Legal */}
      <SettingsGroup label="Support & Legal" rows={supportRows} marginTop={28} />

      {/* Delete */}
      <div style={{ marginTop: 24, paddingLeft: 24, paddingRight: 24 }}>
        <div
          style={{
            borderTop: "1px solid rgba(238, 232, 218, 0.18)",
            paddingTop: 24,
            paddingBottom: 12,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
};

function SettingsGroup({ label, rows, marginTop }: { label: string; rows: Row[]; marginTop: number }) {
  return (
    <div style={{ marginTop, paddingLeft: 24, paddingRight: 24 }}>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: "2.4px",
          textTransform: "uppercase",
          color: "rgba(238, 232, 218, 0.7)",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          background: COLORS.cream,
          borderRadius: 20,
          overflow: "hidden",
          padding: "4px 22px",
        }}
      >
        {rows.map((row, idx) => (
          <SettingsRow key={row.title} row={row} isFirst={idx === 0} />
        ))}
      </div>
    </div>
  );
}

function SettingsRow({ row, isFirst }: { row: Row; isFirst: boolean }) {
  const [pressed, setPressed] = useState(false);

  const inner = (
    <div
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        width: "100%",
        textAlign: "left",
        padding: "20px 0",
        borderTop: isFirst ? "none" : `1px solid ${COLORS.line}`,
        transform: pressed ? "scale(0.99)" : "scale(1)",
        transition: "transform 150ms ease-out",
        cursor: "pointer",
        background: "transparent",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 16,
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: "-0.1px",
            color: COLORS.ink,
            marginBottom: 5,
          }}
        >
          {row.title}
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 13.5,
            lineHeight: 1.35,
            color: COLORS.muted,
          }}
        >
          {row.desc}
        </div>
      </div>
      <div
        aria-hidden
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "rgba(106, 106, 94, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontFamily: SANS,
          fontSize: 12,
          color: COLORS.muted,
          lineHeight: 1,
        }}
      >
        ↗
      </div>
    </div>
  );

  if (row.href) {
    return (
      <Link to={row.href} style={{ textDecoration: "none", display: "block", color: "inherit" }}>
        {inner}
      </Link>
    );
  }
  return (
    <button style={{ background: "none", border: "none", padding: 0, width: "100%", cursor: "pointer" }}>
      {inner}
    </button>
  );
}

function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 17,
          color: "rgba(238, 232, 218, 0.55)",
          textTransform: "lowercase",
        }}
      >
        delete account.
      </button>

      <AlertDialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <AlertDialogContent style={{ fontFamily: SANS }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em" }}>
              Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: SANS, color: COLORS.muted }}>
              This permanently deletes your account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} style={{ fontFamily: SANS, background: "transparent", border: "none", color: COLORS.muted }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={loading}
              style={{ background: COLORS.ink, color: COLORS.cream, borderRadius: 999, padding: "12px 22px", fontFamily: SANS, fontSize: 15 }}
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
