import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ArrowLeft, Pencil, Eye, EyeOff, X, Check, Camera, Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#9C9387";
const LINE = "#EAE4D5";
const DARK = "#3D2E22";
const CREAM = "#FFFFFF";
const SOFT_CREAM = "#F6F1E4";
const OLIVE = PAGE_BG;
const RUST = "#C0392B";

const AREA_CODES = [
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+31", country: "NL", flag: "🇳🇱" },
  { code: "+351", country: "PT", flag: "🇵🇹" },
  { code: "+263", country: "ZW", flag: "🇿🇼" },
  { code: "+267", country: "BW", flag: "🇧🇼" },
  { code: "+264", country: "NA", flag: "🇳🇦" },
  { code: "+258", country: "MZ", flag: "🇲🇿" },
  { code: "+260", country: "ZM", flag: "🇿🇲" },
  { code: "+254", country: "KE", flag: "🇰🇪" },
  { code: "+255", country: "TZ", flag: "🇹🇿" },
  { code: "+353", country: "IE", flag: "🇮🇪" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+41", country: "CH", flag: "🇨🇭" },
  { code: "+43", country: "AT", flag: "🇦🇹" },
  { code: "+32", country: "BE", flag: "🇧🇪" },
  { code: "+45", country: "DK", flag: "🇩🇰" },
  { code: "+46", country: "SE", flag: "🇸🇪" },
  { code: "+47", country: "NO", flag: "🇳🇴" },
  { code: "+64", country: "NZ", flag: "🇳🇿" },
  { code: "+971", country: "AE", flag: "🇦🇪" },
  { code: "+972", country: "IL", flag: "🇮🇱" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
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
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: MUTED,
  marginBottom: 4,
  display: "block",
};

const rowValueStyle: React.CSSProperties = {
  fontFamily: FF,
  fontSize: 17,
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

const PrivacyToggleRow = ({
  label,
  description,
  checked,
  disabled,
  onChange,
  isFirst,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  isFirst?: boolean;
}) => (
  <div
    style={{
      borderTop: isFirst ? "none" : `1px solid ${LINE}`,
      padding: "16px 0",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: FF, fontSize: 15, color: INK }}>{label}</div>
      <div style={{ fontFamily: FF, fontSize: 12.5, color: MUTED, marginTop: 2, lineHeight: 1.45 }}>
        {description}
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: checked ? DARK : "#D8D2C2",
        border: "none",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        transition: "background 120ms ease",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 120ms ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  </div>
);



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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [activityPrivate, setActivityPrivate] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const { data: pendingRequestCount } = useQuery({
    queryKey: ["follow-request-count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", user!.id)
        .eq("status", "pending");
      return count ?? 0;
    },
  });

  const togglePrivacy = async (field: "is_private" | "activity_private", value: boolean) => {
    if (!user) return;
    setSavingPrivacy(true);
    const prevIs = isPrivate;
    const prevAct = activityPrivate;
    if (field === "is_private") setIsPrivate(value);
    else setActivityPrivate(value);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, [field]: value } as any);
    setSavingPrivacy(false);
    if (error) {
      if (field === "is_private") setIsPrivate(prevIs);
      else setActivityPrivate(prevAct);
      toast.error("Could not update privacy. Please try again.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    toast.success("Privacy updated.");
  };


  const handleDeleteAccount = async () => {
    setDeleting(true);
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
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      setDisplayName(profile.display_name || "");
      setUsername((profile as any).username || "");
      setEmail(profile.email || user?.email || "");
      setPhone(profile.phone || "");
      setLocation(profile.location || "");
      setAvatarUrl((profile as any).avatar_url || "");
      setIsPrivate(!!(profile as any).is_private);
      setActivityPrivate(!!(profile as any).activity_private);
      initialized.current = true;
    } else if (!profile && user && !initialized.current) {
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: dbErr } = await supabase.from("profiles").upsert({ id: user.id, avatar_url: url } as any);
      if (dbErr) throw dbErr;
      setAvatarUrl(url);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile photo updated");
    } catch (err: any) {
      toast.error(err.message || "Could not upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    setSavingProfile(true);
    try {
      // Uniqueness checks against other users' profiles
      const checks: Array<{ field: string; value: string; label: string }> = [];
      if (trimmedUsername) checks.push({ field: "username", value: trimmedUsername, label: "username" });
      if (trimmedEmail) checks.push({ field: "email", value: trimmedEmail, label: "email" });
      if (trimmedPhone) checks.push({ field: "phone", value: trimmedPhone, label: "phone number" });

      for (const c of checks) {
        const { data: existing, error: checkErr } = await supabase
          .from("profiles")
          .select("id")
          .ilike(c.field, c.value)
          .neq("id", user.id)
          .limit(1)
          .maybeSingle();
        if (checkErr) throw checkErr;
        if (existing) {
          toast.error(`That ${c.label} is already in use by another account.`);
          setSavingProfile(false);
          return;
        }
      }

      // If changing auth email, attempt update first so a duplicate is caught before saving profile
      if (trimmedEmail && trimmedEmail !== user.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email: trimmedEmail });
        if (authErr) {
          toast.error(authErr.message || "That email is already in use.");
          setSavingProfile(false);
          return;
        }
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName.trim() || null,
        username: trimmedUsername || null,
        email: trimmedEmail || null,
        phone: trimmedPhone || null,
        location: location.trim() || null,
      } as any);
      if (error) throw error;

      setEditing(null);
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
        <div style={{ paddingTop: 60, paddingLeft: 24, paddingRight: 24 }}>
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
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 100, fontFamily: FF }}>
      {/* Top bar */}
      <PageHeader title="Account Info" />

      {/* Profile Photo */}
      <div
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          marginTop: 24,
          marginBottom: 10,
          fontFamily: '"Bricolage Grotesque", ' + FF,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: INK,
        }}
      >
        {"\n"}
      </div>

      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 24 }}>
        <div
          style={{
            background: CARD,
            borderRadius: 16,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              background: SOFT_CREAM,
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Camera size={20} strokeWidth={1.5} color={MUTED} />
            )}
            {uploadingAvatar && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader2 size={20} className="animate-spin" color="#FFFFFF" />
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FF, fontSize: 15, fontWeight: 700, color: INK }}>
              {avatarUrl ? "Profile Picture" : "Add a photo"}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatarUpload(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              background: DARK,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "10px 20px",
              fontFamily: FF,
              fontSize: 14,
              fontWeight: 600,
              cursor: uploadingAvatar ? "not-allowed" : "pointer",
              opacity: uploadingAvatar ? 0.7 : 1,
              flexShrink: 0,
            }}
          >
            {avatarUrl ? "Change" : "Upload"}
          </button>
        </div>
      </div>

      {/* Section eyebrow */}
      <div
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          marginBottom: 10,
          fontFamily: '"Bricolage Grotesque", ' + FF,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: INK,
        }}
      >
        Personal Details
      </div>


      {/* Personal details card */}
      <div style={{ paddingLeft: 20, paddingRight: 20 }}>
        <div
          style={{
            background: CARD,
            borderRadius: 16,
            padding: "4px 20px",
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                    <DialCodePicker
                      value={parsed.areaCode}
                      onChange={(newCode) => {
                        const ac = AREA_CODES.find((a) => a.code === newCode);
                        setPhone(`${newCode}${parsed.number ? " " + parsed.number : ""}`);
                      }}
                    />
                    <input
                      autoFocus
                      type="tel"
                      value={parsed.number}
                      onChange={(e) => setPhone(parsed.areaCode + " " + e.target.value.replace(/^\s+/, ""))}
                      style={{ ...rowInputStyle, flex: 1 }}
                      placeholder="063 241 0296"
                    />
                  </div>
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
            marginTop: 20,
            width: "100%",
            height: 56,
            background: DARK,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            fontFamily: FF,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.1px",
            cursor: savingProfile ? "not-allowed" : "pointer",
            opacity: savingProfile ? 0.7 : 1,
          }}
        >
          Save Changes
        </button>

        {/* Privacy section */}
        <div
          style={{
            marginTop: 28,
            marginBottom: 10,
            fontFamily: '"Bricolage Grotesque", ' + FF,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: INK,
          }}
        >
          Privacy
        </div>
        <div style={{ background: CARD, borderRadius: 16, padding: "4px 20px" }}>
          <PrivacyToggleRow
            label="Private account"
            description="New followers will need your approval before they can see your activity."
            checked={isPrivate}
            disabled={savingPrivacy}
            onChange={(v) => togglePrivacy("is_private", v)}
            isFirst
          />
          <PrivacyToggleRow
            label="Hide my activity"
            description="Keep your saves and visited places visible only to you."
            checked={activityPrivate}
            disabled={savingPrivacy}
            onChange={(v) => togglePrivacy("activity_private", v)}
          />
          <div
            onClick={() => navigate("/follow-requests")}
            style={{
              borderTop: `1px solid ${LINE}`,
              padding: "16px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div>
              <div style={{ fontFamily: FF, fontSize: 15, color: INK }}>Follow requests</div>
              <div style={{ fontFamily: FF, fontSize: 12.5, color: MUTED, marginTop: 2 }}>
                {pendingRequestCount
                  ? `${pendingRequestCount} pending`
                  : "No pending requests"}
              </div>
            </div>
            <span style={{ fontFamily: FF, fontSize: 18, color: MUTED }}>›</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          style={{
            marginTop: 10,
            width: "100%",
            height: 56,
            background: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            cursor: "pointer",
            fontFamily: FF,
            fontSize: 16,
            fontWeight: 700,
            color: RUST,
            letterSpacing: "0.02em",
          }}
        >
          Delete Account
        </button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={(o) => !deleting && setDeleteOpen(o)}>
        <AlertDialogContent style={{ fontFamily: FF }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: FF, color: INK }}>
              Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: FF, color: MUTED, fontSize: 14, lineHeight: 1.5 }}>
              Are you sure? This will permanently delete your account and all of your associated data, including saved listings, collections and reviews. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} style={{ fontFamily: FF }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              style={{ fontFamily: FF, background: "#B00020", color: "#fff" }}
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    if (next === current) {
      setErrorField({ field: "new", msg: "New password must be different from your current password." });
      return;
    }
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
          background: "rgba(20,20,18,0.5)",
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

function DialCodePicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = AREA_CODES.find((a) => a.code === value) || AREA_CODES[0];

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 38,
          padding: "0 10px",
          background: SOFT_CREAM,
          border: `1px solid ${LINE}`,
          borderRadius: 10,
          cursor: "pointer",
          fontFamily: FF,
          fontSize: 15,
          color: INK,
        }}
      >
        <span style={{ fontSize: 16 }}>{current.flag}</span>
        <span>{current.code}</span>
        <span style={{ fontSize: 10, color: MUTED, marginLeft: 2 }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            maxHeight: 240,
            overflowY: "auto",
            minWidth: 200,
          }}
        >
          {AREA_CODES.map((ac) => (
            <button
              key={ac.code + ac.country}
              type="button"
              onClick={() => {
                onChange(ac.code);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 12px",
                background: ac.code === value ? SOFT_CREAM : "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: FF,
                fontSize: 14,
                color: INK,
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 16 }}>{ac.flag}</span>
              <span style={{ width: 50 }}>{ac.code}</span>
              <span style={{ color: MUTED }}>{ac.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AccountInfo;
