import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Eye, EyeOff, X, Check } from "lucide-react";
import { toast } from "sonner";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PF = "'Playfair Display', Georgia, serif";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const SOFT_CREAM = "#F4EFE3";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";

const AREA_CODES = [
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+31", country: "NL", flag: "🇳🇱" },
  { code: "+351", country: "PT", flag: "🇵🇹" },
];

function parsePhone(phone: string) {
  for (const ac of AREA_CODES) {
    if (phone.startsWith(ac.code)) {
      return { areaCode: ac.code, number: phone.slice(ac.code.length).trim(), flag: ac.flag };
    }
  }
  return { areaCode: "+27", number: phone.replace(/^\+?\d{1,3}\s?/, ""), flag: "🇿🇦" };
}

const rowLabelStyle: React.CSSProperties = {
  fontFamily: FF,
  fontSize: 10.5,
  fontWeight: 400,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: MUTED,
  marginBottom: 6,
  display: "block",
};

const rowValueStyle: React.CSSProperties = {
  fontFamily: FF,
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.3,
  letterSpacing: "-0.1px",
  color: INK,
};

const rowInputStyle: React.CSSProperties = {
  ...rowValueStyle,
  border: "none",
  outline: "none",
  background: "transparent",
  width: "100%",
  padding: 0,
  paddingRight: 28,
};

type FieldKey = "name" | "username" | "email" | "phone" | "location";

const AccountInfo = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      setDisplayName(profile.display_name || "");
      setUsername((profile as any).username || "");
      setEmail(profile.email || user?.email || "");
      setPhone(profile.phone || "");
      setLocation(profile.location || "");
      initialized.current = true;
    } else if (!profile && user && !initialized.current) {
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setEditing(null);
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName.trim() || null,
        username: username.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        location: location.trim() || null,
      } as any);
      if (error) throw error;

      if (email.trim() && email.trim() !== user.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email: email.trim() });
        if (authErr) toast.error(authErr.message);
      }

      toast.success("Saved.", {
        style: { fontFamily: PF, fontStyle: "italic", fontSize: 16, background: CREAM, color: INK, border: "none" },
      });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message || "Could not save changes");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", background: OLIVE, fontFamily: FF }}>
        <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
          <Skeleton className="h-11 w-11 rounded-full" />
          <div style={{ marginTop: 28 }}>
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>
    );
  }

  const parsed = parsePhone(phone);

  const Row = ({
    fieldKey,
    label,
    children,
    onActivate,
    isFirst,
    isPassword,
  }: {
    fieldKey?: FieldKey;
    label: string;
    children: React.ReactNode;
    onActivate?: () => void;
    isFirst?: boolean;
    isPassword?: boolean;
  }) => {
    const handleClick = () => {
      if (isPassword) {
        setPwOpen(true);
        return;
      }
      if (fieldKey) setEditing(fieldKey);
      onActivate?.();
    };
    return (
      <div
        onClick={handleClick}
        style={{
          position: "relative",
          paddingTop: 16,
          paddingBottom: 18,
          borderTop: isFirst ? "none" : `1px solid ${LINE}`,
          cursor: "pointer",
        }}
      >
        <span style={rowLabelStyle}>{label}</span>
        {children}
        <Pencil
          size={14}
          strokeWidth={1.5}
          color={MUTED}
          style={{ position: "absolute", top: 18, right: 0, opacity: 0.6 }}
        />
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: OLIVE, paddingBottom: 100, fontFamily: FF }}>
      {/* Top bar */}
      <div
        style={{
          paddingTop: 32,
          paddingLeft: 24,
          paddingRight: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: CREAM,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={18} strokeWidth={1.6} color={INK} />
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent",
            border: "none",
            color: CREAM,
            opacity: 0.75,
            fontFamily: FF,
            fontSize: 14,
            fontWeight: 400,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      {/* Hero */}
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24 }}>
        <div
          style={{
            fontFamily: FF,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: CREAM,
            opacity: 0.7,
            marginBottom: 14,
          }}
        >
          Your Account
        </div>
        <h1
          style={{
            fontFamily: PF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 60,
            lineHeight: 0.92,
            letterSpacing: "-2px",
            color: CREAM,
            margin: 0,
            marginBottom: 14,
          }}
        >
          account info.
        </h1>
        <p
          style={{
            fontFamily: PF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            color: CREAM,
            opacity: 0.75,
            maxWidth: 300,
            margin: 0,
            marginBottom: 32,
          }}
        >
          Where to reach you, and how to log in.
        </p>
      </div>

      {/* Section eyebrow */}
      <div
        style={{
          paddingLeft: 24,
          paddingRight: 24,
          marginBottom: 10,
          fontFamily: FF,
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: "2.4px",
          textTransform: "uppercase",
          color: CREAM,
          opacity: 0.7,
        }}
      >
        Personal Details
      </div>

      {/* Personal details card */}
      <div style={{ paddingLeft: 24, paddingRight: 24 }}>
        <div
          style={{
            background: CREAM,
            borderRadius: 20,
            padding: "4px 22px",
            overflow: "hidden",
          }}
        >
          {profileLoading ? (
            <div style={{ padding: "16px 0" }}>
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full mb-2" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <Row fieldKey="name" label="Name" isFirst>
                {editing === "name" ? (
                  <input
                    autoFocus
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={() => setEditing(null)}
                    style={rowInputStyle}
                  />
                ) : (
                  <div style={rowValueStyle}>{displayName || "—"}</div>
                )}
              </Row>

              <Row fieldKey="username" label="Username">
                {editing === "username" ? (
                  <input
                    autoFocus
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.replace(/\s+/g, "").toLowerCase().replace(/^@+/, ""))
                    }
                    onBlur={() => setEditing(null)}
                    style={rowInputStyle}
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                ) : (
                  <div style={rowValueStyle}>{username ? `@${username}` : "—"}</div>
                )}
              </Row>

              <Row fieldKey="email" label="Email">
                {editing === "email" ? (
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEditing(null)}
                    style={rowInputStyle}
                  />
                ) : (
                  <div style={rowValueStyle}>{email || "—"}</div>
                )}
              </Row>

              <Row fieldKey="phone" label="Phone">
                {editing === "phone" ? (
                  <input
                    autoFocus
                    type="tel"
                    value={parsed.number}
                    onChange={(e) => setPhone(parsed.areaCode + " " + e.target.value.replace(/^\s+/, ""))}
                    onBlur={() => setEditing(null)}
                    style={rowInputStyle}
                    placeholder="063 241 0296"
                  />
                ) : (
                  <div style={{ ...rowValueStyle, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{parsed.flag}</span>
                    <span>{parsed.areaCode}</span>
                    <span style={{ color: LINE }}>·</span>
                    <span>{parsed.number || "—"}</span>
                  </div>
                )}
              </Row>

              <Row fieldKey="location" label="Location">
                {editing === "location" ? (
                  <input
                    autoFocus
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onBlur={() => setEditing(null)}
                    style={rowInputStyle}
                  />
                ) : (
                  <div style={rowValueStyle}>{location || "—"}</div>
                )}
              </Row>

              <Row label="Password" isPassword>
                <div style={{ ...rowValueStyle, letterSpacing: "2px" }}>••••••••</div>
              </Row>
            </>
          )}
        </div>

        {/* Save changes */}
        <button
          onClick={handleSaveProfile}
          disabled={savingProfile || profileLoading}
          style={{
            marginTop: 16,
            width: "100%",
            height: 54,
            background: INK,
            color: CREAM,
            border: "none",
            borderRadius: 999,
            fontFamily: FF,
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: "0.1px",
            cursor: savingProfile ? "not-allowed" : "pointer",
            opacity: savingProfile ? 0.7 : 1,
          }}
        >
          Save Changes
        </button>
      </div>

      {pwOpen && <ChangePasswordSheet onClose={() => setPwOpen(false)} />}
    </div>
  );
};

const ChangePasswordSheet = ({ onClose }: { onClose: () => void }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorField, setErrorField] = useState<{ field: "current" | "new" | "confirm"; msg: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 200);
  };

  const enabled = current && next.length >= 8 && next === confirm && !submitting;

  const handleSubmit = async () => {
    if (!enabled) return;
    setErrorField(null);
    setSubmitting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const email = sess.session?.user.email;
      if (email) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: current });
        if (signInErr) {
          setErrorField({ field: "current", msg: "That doesn't match your current password." });
          setSubmitting(false);
          return;
        }
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success("Password updated.", {
        style: { fontFamily: PF, fontStyle: "italic", fontSize: 16, background: CREAM, color: INK, border: "none" },
      });
      handleClose();
    } catch (err: any) {
      setErrorField({ field: "new", msg: err.message || "Could not update password." });
    } finally {
      setSubmitting(false);
    }
  };

  // touch-drag dismiss
  const dragRef = useRef<{ startY: number; current: number } | null>(null);
  const [dragY, setDragY] = useState(0);

  const onTouchStart = (e: React.TouchEvent) => {
    dragRef.current = { startY: e.touches[0].clientY, current: 0 };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    if (dy > 0) {
      dragRef.current.current = dy;
      setDragY(dy);
    }
  };
  const onTouchEnd = () => {
    if (dragRef.current && dragRef.current.current > 100) {
      handleClose();
    } else {
      setDragY(0);
    }
    dragRef.current = null;
  };

  const Field = ({
    label,
    value,
    onChange,
    show,
    setShow,
    placeholder,
    autoFocus,
    error,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    setShow: (v: boolean) => void;
    placeholder: string;
    autoFocus?: boolean;
    error?: string;
  }) => (
    <div>
      <div
        style={{
          fontFamily: FF,
          fontSize: 10.5,
          fontWeight: 400,
          letterSpacing: "1.8px",
          textTransform: "uppercase",
          color: MUTED,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: 48,
          borderRadius: 14,
          background: SOFT_CREAM,
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <input
          autoFocus={autoFocus}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: FF,
            fontSize: 15,
            fontWeight: 400,
            color: INK,
          }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            display: "flex",
            cursor: "pointer",
            opacity: 0.7,
          }}
        >
          {show ? (
            <EyeOff size={16} strokeWidth={1.6} color={MUTED} />
          ) : (
            <Eye size={16} strokeWidth={1.6} color={MUTED} />
          )}
        </button>
      </div>
      {error && (
        <div
          style={{
            fontFamily: PF,
            fontStyle: "italic",
            fontSize: 13,
            color: INK,
            marginTop: 6,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Scrim */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(20,20,18,0.4)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          opacity: mounted ? 1 : 0,
          transition: "opacity 200ms ease-out",
          zIndex: 60,
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: CREAM,
          borderRadius: "24px 24px 0 0",
          padding: "14px 24px 28px",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.18)",
          transform: mounted ? `translateY(${dragY}px)` : "translateY(100%)",
          transition: dragRef.current ? "none" : "transform 250ms ease-out",
          zIndex: 70,
          fontFamily: FF,
        }}
      >
        {/* Drag handle */}
        <div
          onClick={handleClose}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: MUTED,
            opacity: 0.35,
            margin: "0 auto 16px",
            cursor: "pointer",
          }}
        />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FF,
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: "2.2px",
                textTransform: "uppercase",
                color: MUTED,
                marginBottom: 6,
              }}
            >
              Your Account
            </div>
            <h2
              style={{
                fontFamily: PF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 34,
                lineHeight: 1,
                letterSpacing: "-0.7px",
                color: INK,
                margin: 0,
              }}
            >
              change password.
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: 999,
              background: "rgba(106,106,94,0.12)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={14} strokeWidth={1.8} color={INK} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
          <Field
            label="Current Password"
            value={current}
            onChange={(v) => {
              setCurrent(v);
              if (errorField?.field === "current") setErrorField(null);
            }}
            show={showCurrent}
            setShow={setShowCurrent}
            placeholder="Enter your current password"
            autoFocus
            error={errorField?.field === "current" ? errorField.msg : undefined}
          />
          <Field
            label="New Password"
            value={next}
            onChange={(v) => {
              setNext(v);
              if (errorField?.field === "new") setErrorField(null);
            }}
            show={showNext}
            setShow={setShowNext}
            placeholder="At least 8 characters"
            error={errorField?.field === "new" ? errorField.msg : undefined}
          />
          <Field
            label="Confirm New Password"
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              if (errorField?.field === "confirm") setErrorField(null);
            }}
            show={showConfirm}
            setShow={setShowConfirm}
            placeholder="Re-enter your new password"
            error={errorField?.field === "confirm" ? errorField.msg : undefined}
          />
        </div>

        {/* Update button */}
        <button
          onClick={handleSubmit}
          disabled={!enabled}
          style={{
            width: "100%",
            height: 54,
            background: INK,
            color: CREAM,
            border: "none",
            borderRadius: 999,
            fontFamily: FF,
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: "0.1px",
            cursor: enabled ? "pointer" : "not-allowed",
            opacity: enabled ? 1 : 0.4,
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {submitting ? "Updating…" : "Update Password"}
          {!submitting && enabled && <Check size={14} strokeWidth={1.8} />}
        </button>

        {/* Helper note */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "0 4px" }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: RUST,
              flexShrink: 0,
              marginTop: 7,
            }}
          />
          <div
            style={{
              fontFamily: PF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 13.5,
              lineHeight: 1.55,
              color: INK,
              opacity: 0.7,
            }}
          >
            At least 8 characters with a mix of letters, numbers, and symbols. We'll never email you asking for it.
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountInfo;
