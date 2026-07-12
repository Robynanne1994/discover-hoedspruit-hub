import { CSSProperties, useEffect, useState, useRef } from "react";
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
import { ArrowLeft, Pencil, Eye, EyeOff, X, Check, Camera, Loader2, Upload, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/passwordPolicy";

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
  fontSize: 16,
  lineHeight: 1.25,
  border: "none",
  outline: "none",
  background: "transparent",
  width: "100%",
  padding: 0,
  paddingRight: 28,
};

type FieldKey = "firstName" | "surname" | "username" | "email" | "phone" | "location";

// Split a combined name on the first space so older accounts (which only have
// a display_name) still populate the separate fields sensibly.
function splitDisplayName(full: string | null | undefined) {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || "", surname: parts.slice(1).join(" ") };
}

const RESIDENCY_OPTIONS = [
  "I live in Hoedspruit",
  "I am a visitor in Hoedspruit",
] as const;

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

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [editSnapshot, setEditSnapshot] = useState("");
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
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      const fallbackName = splitDisplayName(profile.display_name);
      setFirstName((profile as any).first_name ?? fallbackName.first);
      setSurname((profile as any).surname ?? fallbackName.surname);
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

  const handleAvatarRemove = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_url: null } as any);
      if (error) throw error;
      setAvatarUrl("");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile photo removed");
    } catch (err: any) {
      toast.error(err.message || "Could not remove photo");
    } finally {
      setUploadingAvatar(false);
      setPhotoSheetOpen(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const trimmedFirstName = firstName.trim();
    const trimmedSurname = surname.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirstName) {
      toast.error("Please enter your name.");
      startEditing("firstName");
      return;
    }
    if (!trimmedSurname) {
      toast.error("Please enter your surname.");
      startEditing("surname");
      return;
    }

    setSavingProfile(true);
    try {
      // Only check availability when the handle actually changed. Re-saving your
      // own existing username must never be flagged as "taken" — you already own it.
      const currentUsername = ((profile as any)?.username || "").trim();
      const usernameChanged =
        trimmedUsername.toLowerCase() !== currentUsername.toLowerCase();
      // Username uniqueness via SECURITY DEFINER RPC. RLS blocks reading other
      // users' profile rows, so a direct query here would never see a clash.
      if (trimmedUsername && usernameChanged) {
        const { data: available, error: unameErr } = await supabase.rpc(
          "is_username_available" as any,
          { _username: trimmedUsername, _exclude_id: user.id } as any
        );
        if (unameErr) throw unameErr;
        if (!available) {
          toast.error("That username is already taken. Please choose a different one.");
          setSavingProfile(false);
          return;
        }
      }

      // Uniqueness checks against other users' profiles
      const checks: Array<{ field: string; value: string; label: string }> = [];
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
        first_name: trimmedFirstName,
        surname: trimmedSurname,
        display_name: `${trimmedFirstName} ${trimmedSurname}`,
        username: trimmedUsername || null,
        email: trimmedEmail || null,
        phone: trimmedPhone || null,
        location: location.trim() || null,
      } as any);
      if (error) {
        if ((error as any).code === "23505") {
          toast.error("That username is already taken. Please choose a different one.");
          setSavingProfile(false);
          return;
        }
        throw error;
      }

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

  const getFieldValue = (key: FieldKey): string => {
    switch (key) {
      case "firstName":
        return firstName;
      case "surname":
        return surname;
      case "username":
        return username;
      case "email":
        return email;
      case "phone":
        return phone;
      case "location":
        return location;
    }
  };

  const applyFieldValue = (key: FieldKey, value: string) => {
    switch (key) {
      case "firstName":
        setFirstName(value);
        break;
      case "surname":
        setSurname(value);
        break;
      case "username":
        setUsername(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "phone":
        setPhone(value);
        break;
      case "location":
        setLocation(value);
        break;
    }
  };

  // Begin editing a field, remembering its value so editing can be cancelled.
  const startEditing = (key: FieldKey) => {
    if (editing === key) return;
    setEditSnapshot(getFieldValue(key));
    setEditing(key);
  };

  // Cancel reverts the field to the value it had when editing began.
  const handleCancelEdit = () => {
    if (editing) applyFieldValue(editing, editSnapshot);
    setEditing(null);
  };

  const handleDoneEdit = () => setEditing(null);

  const EditActions = () => (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          handleCancelEdit();
        }}
        style={{
          flex: 1,
          height: 38,
          background: "transparent",
          border: `1px solid ${LINE}`,
          borderRadius: 999,
          fontFamily: FF,
          fontSize: 14,
          fontWeight: 600,
          color: MUTED,
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          handleDoneEdit();
        }}
        style={{
          flex: 1,
          height: 38,
          background: DARK,
          border: "none",
          borderRadius: 999,
          fontFamily: FF,
          fontSize: 14,
          fontWeight: 600,
          color: "#FFFFFF",
          cursor: "pointer",
        }}
      >
        Done
      </button>
    </div>
  );

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
      if (fieldKey) startEditing(fieldKey);
      onActivate?.();
    };
    const isEditingThis = !!fieldKey && editing === fieldKey;
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
        <span className="text-primary" style={rowLabelStyle}>{label}</span>
        {children}
        {!isEditingThis && (
          <Pencil
            size={14}
            strokeWidth={1.5}
            color={MUTED}
            style={{ position: "absolute", top: 18, right: 0, opacity: 0.6 }}
          />
        )}
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
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatarUpload(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => setPhotoSheetOpen(true)}
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
              <Row fieldKey="firstName" label="FIRST NAME" isFirst>
                {editing === "firstName" ? (
                  <>
                    <input
                      autoFocus
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={rowInputStyle}
                    />
                    <EditActions />
                  </>
                ) : (
                  <div style={rowValueStyle}>{firstName || "—"}</div>
                )}
              </Row>

              <Row fieldKey="surname" label="SURNAME">
                {editing === "surname" ? (
                  <>
                    <input
                      autoFocus
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      style={rowInputStyle}
                    />
                    <EditActions />
                  </>
                ) : (
                  <div style={rowValueStyle}>{surname || "—"}</div>
                )}
              </Row>

              <Row fieldKey="username" label="Username">
                {editing === "username" ? (
                  <>
                    <input
                      autoFocus
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.replace(/\s+/g, "").toLowerCase().replace(/^@+/, ""))
                      }
                      style={rowInputStyle}
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                    <EditActions />
                  </>
                ) : (
                  <div style={rowValueStyle}>{username ? `@${username}` : "—"}</div>
                )}
              </Row>

              <Row fieldKey="email" label="Email">
                {editing === "email" ? (
                  <>
                    <input
                      autoFocus
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={rowInputStyle}
                    />
                    <EditActions />
                  </>
                ) : (
                  <div style={rowValueStyle}>{email || "—"}</div>
                )}
              </Row>

              <Row fieldKey="phone" label="Phone">
                {editing === "phone" ? (
                  <>
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
                    <EditActions />
                  </>
                ) : (
                  <div style={{ ...rowValueStyle, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{parsed.flag}</span>
                    <span>{parsed.areaCode}</span>
                    <span style={{ color: LINE }}>·</span>
                    <span>{parsed.number || "—"}</span>
                  </div>
                )}
              </Row>

              <Row fieldKey="location" label="Residency">
                {editing === "location" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                    {RESIDENCY_OPTIONS.map((opt) => {
                      const active = location === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(opt);
                            setEditing(null);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "13px 16px",
                            borderRadius: 12,
                            border: `1px solid ${active ? DARK : LINE}`,
                            background: active ? DARK : "#FFFFFF",
                            color: active ? "#FFFFFF" : INK,
                            fontFamily: FF,
                            fontSize: 15,
                            fontWeight: active ? 600 : 400,
                            cursor: "pointer",
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      style={{
                        alignSelf: "flex-start",
                        marginTop: 2,
                        background: "transparent",
                        border: "none",
                        padding: "4px 0",
                        fontFamily: FF,
                        fontSize: 14,
                        fontWeight: 600,
                        color: MUTED,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
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
        {(() => {
          const fallbackName = splitDisplayName((profile as any)?.display_name);
          const origFirst = ((profile as any)?.first_name ?? fallbackName.first ?? "") as string;
          const origSurname = ((profile as any)?.surname ?? fallbackName.surname ?? "") as string;
          const origUsername = ((profile as any)?.username || "") as string;
          const origEmail = ((profile as any)?.email || user?.email || "") as string;
          const origPhone = ((profile as any)?.phone || "") as string;
          const origLocation = ((profile as any)?.location || "") as string;
          const isDirty =
            firstName.trim() !== origFirst.trim() ||
            surname.trim() !== origSurname.trim() ||
            username.trim() !== origUsername.trim() ||
            email.trim() !== origEmail.trim() ||
            phone.trim() !== origPhone.trim() ||
            location.trim() !== origLocation.trim();
          const disabled = savingProfile || profileLoading || !isDirty;
          return (
            <button
              onClick={handleSaveProfile}
              disabled={disabled}
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
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
              }}
            >
              Save Changes
            </button>
          );
        })()}


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

      {photoSheetOpen && (
        <PhotoPickerSheet
          hasPhoto={!!avatarUrl}
          onClose={() => setPhotoSheetOpen(false)}
          onTakePhoto={() => {
            setPhotoSheetOpen(false);
            cameraInputRef.current?.click();
          }}
          onUpload={() => {
            setPhotoSheetOpen(false);
            fileInputRef.current?.click();
          }}
          onRemove={handleAvatarRemove}
          busy={uploadingAvatar}
        />
      )}
    </div>
  );
};

// Styling mirrors the "Suggest a Channel" sheet on the Local Channels page.
const pwInputStyle: React.CSSProperties = {
  fontFamily: FF, fontWeight: 400, fontSize: 15, color: INK,
  background: "#fff", border: "2px solid #C5C0BA", borderRadius: 12,
  padding: "13px 14px", outline: "none", width: "100%", boxSizing: "border-box",
  lineHeight: 1.4,
};

const pwLabelStyle: React.CSSProperties = {
  fontFamily: FF, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
  textTransform: "uppercase", color: "#715a3d", marginBottom: 6, display: "block",
};

const PwField = ({
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
    <label style={pwLabelStyle}>{label}</label>
    <div style={{ position: "relative" }}>
      <input
        autoFocus={autoFocus}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
        style={{ ...pwInputStyle, paddingRight: 44, border: error ? "2px solid #C0392B" : pwInputStyle.border }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          padding: 0,
          display: "flex",
          cursor: "pointer",
          opacity: 0.7,
        }}
      >
        {show ? (
          <EyeOff size={18} strokeWidth={1.6} color={MUTED} />
        ) : (
          <Eye size={18} strokeWidth={1.6} color={MUTED} />
        )}
      </button>
    </div>
    {error && (
      <div
        style={{
          fontFamily: FF,
          fontSize: 13,
          lineHeight: 1.45,
          color: "#C0392B",
          marginTop: 6,
        }}
      >
        {error}
      </div>
    )}
  </div>
);

const PhotoPickerSheet = ({
  hasPhoto,
  busy,
  onClose,
  onTakePhoto,
  onUpload,
  onRemove,
}: {
  hasPhoto: boolean;
  busy: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onUpload: () => void;
  onRemove: () => void;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rowBase: CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 4px",
    background: "transparent",
    border: "none",
    cursor: busy ? "not-allowed" : "pointer",
    textAlign: "left",
    fontFamily: FF,
    fontSize: 16,
    color: INK,
    opacity: busy ? 0.5 : 1,
  };

  const iconWrap: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#F2EBDC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(10,10,10,0.4)",
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: FF,
          width: "100%",
          background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 32px",
          animation: "pp-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <style>{`@keyframes pp-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "#9C9387",
              textTransform: "uppercase",
            }}
          >
            Profile photo
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
          >
            <X size={20} color={INK} strokeWidth={1.75} />
          </button>
        </div>
        <h2
          style={{
            fontFamily: "'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 400,
            fontSize: 22,
            color: INK,
            margin: "0 0 12px",
          }}
        >
          {hasPhoto ? "Change profile photo" : "Add profile photo"}
        </h2>

        <button type="button" style={rowBase} disabled={busy} onClick={onTakePhoto}>
          <span style={iconWrap}>
            <Camera size={20} color={INK} strokeWidth={1.6} />
          </span>
          Take new photo
        </button>

        <div style={{ height: 1, background: "#EAE4D5" }} />

        <button type="button" style={rowBase} disabled={busy} onClick={onUpload}>
          <span style={iconWrap}>
            <Upload size={20} color={INK} strokeWidth={1.6} />
          </span>
          Upload from device
        </button>

        {hasPhoto && (
          <>
            <div style={{ height: 1, background: "#EAE4D5" }} />
            <button
              type="button"
              style={{ ...rowBase, color: "#B00020" }}
              disabled={busy}
              onClick={onRemove}
            >
              <span style={{ ...iconWrap, background: "#FDECEC" }}>
                {busy ? (
                  <Loader2 size={18} className="animate-spin" color="#B00020" />
                ) : (
                  <Trash2 size={20} color="#B00020" strokeWidth={1.6} />
                )}
              </span>
              Remove profile photo
            </button>
          </>
        )}
      </div>
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const enabled = !!current && !!next && !!confirm && !submitting;

  const handleSubmit = async () => {
    if (submitting) return;
    setErrorField(null);

    if (!current) {
      setErrorField({ field: "current", msg: "Please enter your current password." });
      return;
    }

    // Strength: min 8 chars, at least one letter, one number and one symbol.
    const strengthError = validatePassword(next);
    if (strengthError) {
      setErrorField({ field: "new", msg: `${strengthError} ${PASSWORD_REQUIREMENTS_TEXT}` });
      return;
    }

    if (next === current) {
      setErrorField({ field: "new", msg: "New password must be different from your current password." });
      return;
    }

    // The two new passwords must match.
    if (next !== confirm) {
      setErrorField({ field: "confirm", msg: "The passwords don't match. Please re-enter them." });
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
      onClose();
    } catch (err: any) {
      setErrorField({ field: "new", msg: err.message || "Could not update password." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,10,10,0.4)", display: "flex", alignItems: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: FF, width: "100%", background: "#ffffff",
          borderRadius: "20px 20px 0 0", padding: "20px 20px 32px",
          animation: "pw-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <style>{`@keyframes pw-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: FF, fontSize: 11, letterSpacing: "0.08em", color: MUTED, textTransform: "uppercase" }}>{"\n"}</div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
            <X size={20} color={INK} strokeWidth={1.75} />
          </button>
        </div>
        <h2 style={{ fontFamily: "'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: 22, color: INK, margin: "0 0 8px" }}>Change Password</h2>
        <p style={{ fontFamily: FF, fontSize: 14, lineHeight: 1.55, color: MUTED, margin: "0 0 20px" }}>
          Choose a strong new password. {PASSWORD_REQUIREMENTS_TEXT}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <PwField
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
          <PwField
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
          <PwField
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
        <button
          onClick={handleSubmit}
          disabled={!enabled}
          style={{
            fontFamily: FF, marginTop: 20, width: "100%", height: 48, borderRadius: 999,
            background: "#423324", color: "#FFFFFF", border: "none", fontSize: 14,
            letterSpacing: "0.04em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: enabled ? "pointer" : "default", opacity: enabled ? 1 : 0.6,
          }}
        >
          {submitting ? "Updating…" : "Update Password"}
          {!submitting && <Check size={14} strokeWidth={1.8} />}
        </button>
      </div>
    </div>
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
