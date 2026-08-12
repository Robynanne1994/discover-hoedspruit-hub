import { CSSProperties, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
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
import { ArrowLeft, Eye, EyeOff, X, Check, Camera, Loader2, Upload, Trash2, ChevronRight, Image as ImageIcon } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { sanitiseUsername, validateUsername, USERNAME_MAX } from "@/lib/username";

import AvatarCropDialog from "@/components/profile/AvatarCropDialog";
import { toast } from "sonner";
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from "@/lib/passwordPolicy";
import { RESET_LINK_TTL_MINUTES, sendPasswordResetEmail } from "@/lib/passwordReset";
import { useResendCooldown } from "@/hooks/useResendCooldown";
import VerificationCodeInput from "@/components/auth/VerificationCodeInput";
import {
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_TTL_MINUTES,
  cancelEmailChange,
  isCompleteCode,
  isEmailVerified,
  isValidEmail,
  readPendingEmailChange,
  resendEmailChangeCode,
  resendSignupCode,
  startEmailChange,
  verifyEmailChangeCode,
  verifySignupCode,
} from "@/lib/emailVerification";
import { hasPasswordIdentity, signInMethodLabel } from "@/lib/authProviders";
import { MUTED as TOKEN_MUTED, SECTION_INSET, type } from "@/lib/type";
import {
  clearEmailChangeParams,
  forgetEmailChangeLink,
  readEmailChangeLink,
  redeemEmailChangeLink,
} from "@/lib/emailChangeLink";

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
  { code: "+27", country: "ZA" },
  { code: "+1", country: "US" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "AU" },
  { code: "+49", country: "DE" },
  { code: "+33", country: "FR" },
  { code: "+31", country: "NL" },
  { code: "+351", country: "PT" },
  { code: "+263", country: "ZW" },
  { code: "+267", country: "BW" },
  { code: "+264", country: "NA" },
  { code: "+258", country: "MZ" },
  { code: "+260", country: "ZM" },
  { code: "+254", country: "KE" },
  { code: "+255", country: "TZ" },
  { code: "+353", country: "IE" },
  { code: "+34", country: "ES" },
  { code: "+39", country: "IT" },
  { code: "+41", country: "CH" },
  { code: "+43", country: "AT" },
  { code: "+32", country: "BE" },
  { code: "+45", country: "DK" },
  { code: "+46", country: "SE" },
  { code: "+47", country: "NO" },
  { code: "+64", country: "NZ" },
  { code: "+971", country: "AE" },
  { code: "+972", country: "IL" },
  { code: "+91", country: "IN" },
];

function parsePhone(phone: string) {
  for (const ac of AREA_CODES) {
    if (phone.startsWith(ac.code)) {
      return { areaCode: ac.code, number: phone.slice(ac.code.length).trim() };
    }
  }
  return { areaCode: "+27", number: phone.replace(/^\+?\d{1,3}\s?/, "") };
}

const Row = ({
  label,
  children,
  isFirst,
  onClick,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  isFirst?: boolean;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    style={{
      position: "relative",
      paddingTop: 16,
      paddingBottom: 8,
      borderTop: isFirst ? "none" : `1px solid ${LINE}`,
      cursor: onClick ? "pointer" : "default",
    }}
  >
    <span style={{ ...rowLabelStyle, color: "#423324" }}>{label}</span>
    {children}
  </div>
);

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
  fontSize: 15,
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
};


const emailStatusLinkStyle: React.CSSProperties = {
  fontFamily: FF,
  fontSize: "inherit",
  fontWeight: 700,
  color: "#715a3d",
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: 2,
};

const EMAIL_STATUS_TONES = {
  ok: { color: "#3F6B3F" },
  warn: { color: "#B4630F" },
  pending: { color: "#715a3d" },
} as const;

/** The one-line "Verified" / "Not verified yet" note under the email field. */
const EmailStatusNote = ({
  tone,
  children,
}: {
  tone: keyof typeof EMAIL_STATUS_TONES;
  children: React.ReactNode;
}) => (
  <div
    style={{
      fontFamily: FF,
      fontSize: 12.5,
      lineHeight: 1.45,
      marginTop: 6,
      ...EMAIL_STATUS_TONES[tone],
    }}
  >
    {children}
  </div>
);

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
      minHeight: 56,
      padding: "10px 0",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: FF, fontSize: 16, fontWeight: 500, letterSpacing: "-0.01em", color: INK }}>{label}</div>
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

  // True for the whole of a page load that arrived on a confirmation link from
  // the change-of-address email. The token in that link IS the credential, and
  // redeeming it is what creates the session — so the "not signed in, go away"
  // guard below has to hold off until it has been spent, or it bounces the
  // visitor off the one screen that could have completed the change.
  const [redeemingEmailLink, setRedeemingEmailLink] = useState(
    () => readEmailChangeLink().kind !== "none",
  );

  useEffect(() => {
    if (!loading && !user && !redeemingEmailLink) navigate("/my-profile-guest", { replace: true });
  }, [user, loading, navigate, redeemingEmailLink]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [residencyOpen, setResidencyOpen] = useState(false);
  // Set while an email address is waiting on its six-digit code. Holds the
  // address the code went to and why we asked for it: "change" once a new
  // address has been requested, "confirm" for an account created before
  // verification existed and still sitting on an unconfirmed address.
  const [verifyTarget, setVerifyTarget] = useState<
    { email: string; reason: "change" | "confirm"; issuedAt: number } | null
  >(null);
  // Dismissing the sheet keeps the pending target so the Email row can say
  // what it's waiting for and offer the code entry again.
  const [verifySheetOpen, setVerifySheetOpen] = useState(false);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const emailCooldown = useResendCooldown();
  // The address a confirmation link moved the account to on this page load, if
  // any. Held in a ref so the profile-initialising effect can defer to it
  // whichever order the two finish in.
  const linkConfirmedEmail = useRef("");

  // "Verified" describes the address the ACCOUNT holds, not whatever is
  // currently typed into the box. Once the two differ the note has to say so —
  // otherwise a freshly typed, unsaved, unproven address sits under a green
  // "Verified", which is the opposite of the truth.
  const accountEmail = (user?.email || "").trim();
  const emailVerified = isEmailVerified(user);
  const emailEdited =
    email.trim().toLowerCase() !== accountEmail.toLowerCase() && email.trim() !== "";

  // The privacy toggles and the pending-request count used to be duplicated
  // here, unrendered — this screen has no privacy UI; it all lives in
  // AccountPrivacy. A second write path for is_private is worse than dead
  // code: it did not approve the waiting requests or refresh the follow
  // queries, so whichever one got wired up next would quietly disagree with
  // the other.


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
  // Object URL of the file the user just picked, held while they crop it.
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // Up to two initials from the name, shown when there is no photo yet.
  const avatarInitials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

  useEffect(() => {
    if (profile && !initialized.current) {
      const fallbackName = splitDisplayName(profile.display_name);
      const first = ((profile as any).first_name ?? fallbackName.first ?? "").trim();
      const last = ((profile as any).surname ?? fallbackName.surname ?? "").trim();
      setFullName(first && last ? `${first} ${last}` : first || last);
      setUsername((profile as any).username || "");
      // `linkConfirmedEmail` wins: when this page load redeemed a confirmation
      // link, the address it moved to is newer than anything the profile query
      // fetched, and the `profiles` row may not have caught up yet.
      setEmail(linkConfirmedEmail.current || profile.email || user?.email || "");
      setPhone(profile.phone || "");
      setLocation(profile.location || "");
      setAvatarUrl((profile as any).avatar_url || "");
      initialized.current = true;
    } else if (!profile && user && !initialized.current) {
      setEmail(linkConfirmedEmail.current || user.email || "");
    }
  }, [profile, user]);

  // An email change requested in an earlier visit may still be open: the code
  // lives for VERIFICATION_CODE_TTL_MINUTES whether or not the app stayed open.
  // Pick it back up so the row explains itself instead of looking like nothing
  // happened.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const pending = await readPendingEmailChange();
      if (cancelled || !pending) return;
      if (pending.email.toLowerCase() === (user.email || "").toLowerCase()) return;
      setVerifyTarget((prev) => {
        if (prev) return prev;
        // Count the window from when the code was issued, not from now, so a
        // code that is nearly out of time doesn't look brand new.
        const issuedAt =
          new Date(pending.expiresAt).getTime() - VERIFICATION_CODE_TTL_MINUTES * 60 * 1000;
        return { email: pending.email, reason: "change", issuedAt };
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // The code only works for VERIFICATION_CODE_TTL_MINUTES. Once that window
  // passes with nothing entered, drop the pending change entirely and put the
  // field back to the address the account actually holds — leaving a dead
  // "waiting on the code" note on screen just confuses things.
  useEffect(() => {
    if (!verifyTarget) return;
    const expiresAt = verifyTarget.issuedAt + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000;
    const ms = expiresAt - Date.now();
    const expire = () => {
      setVerifyTarget(null);
      setVerifySheetOpen(false);
      setEmail(user?.email || (profile as any)?.email || "");
    };
    if (ms <= 0) {
      expire();
      return;
    }
    const t = window.setTimeout(expire, ms);
    return () => window.clearTimeout(t);
  }, [verifyTarget, user, profile]);

  // Arrived here by tapping the link in the confirmation email rather than by
  // typing the code. Redeem it and say what happened — the alternative is a
  // page that looks identical to not having tapped anything, which is exactly
  // how "the button does nothing" is reported.
  useEffect(() => {
    const link = readEmailChangeLink();
    if (link.kind === "none") return;
    forgetEmailChangeLink();
    let cancelled = false;
    (async () => {
      const error = await redeemEmailChangeLink(link);
      clearEmailChangeParams();
      if (cancelled) return;
      setRedeemingEmailLink(false);
      if (error) {
        toast.error(error);
        return;
      }
      // `auth.users.email` is the source of truth for what the address is now —
      // never the link, and never the `profiles` mirror, which the trigger may
      // not have caught up with yet.
      const { data } = await supabase.auth.getUser();
      const confirmed = data?.user?.email || "";
      if (cancelled) return;
      if (!confirmed) {
        // Redeemed without leaving us a session to read the address off. Say so
        // rather than claiming a success we can't see.
        toast.error(
          "We couldn't confirm your new email from that link here. Enter the code from the email instead.",
        );
        return;
      }
      linkConfirmedEmail.current = confirmed;
      setEmail(confirmed);
      setVerifyTarget(null);
      setVerifySheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Email updated and verified.", {
        style: { fontFamily: PF, fontStyle: "italic", fontSize: 16, background: CREAM, color: INK, border: "none" },
      });
    })();
    return () => {
      cancelled = true;
    };
    // Runs once per page load: the link is a property of how the app was
    // opened, not of any value that changes while it is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Picking a file no longer uploads straight away — it opens the cropper, and
  // only the cropped square that comes back out of it is sent to storage.
  const handleAvatarPicked = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const closeCropper = () => {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  // Warm the browser cache so the profile page paints the new photo instantly
  // instead of showing a blank avatar while the file downloads.
  const preloadImage = (url: string) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });

  // Push the new avatar straight into every cached profile query so screens that
  // read from those caches (my profile, public profile, header) update at once.
  const primeAvatarCaches = (nextUrl: string | null) => {
    if (!user) return;
    const patch = (old: any) =>
      old && typeof old === "object" ? { ...old, avatar_url: nextUrl } : old;
    queryClient.setQueryData(["profile", user.id], patch);
    queryClient.setQueryData(["my-profile", user.id], patch);
    queryClient.setQueryData(["user-profile", user.id], patch);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["my-profile", user.id] });
    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
  };

  const handleAvatarUpload = async (blob: Blob) => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: dbErr } = await supabase.from("profiles").upsert({ id: user.id, avatar_url: url } as any);
      if (dbErr) throw dbErr;
      await preloadImage(url);
      setAvatarUrl(url);
      primeAvatarCaches(url);
      closeCropper();
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
      primeAvatarCaches(null);
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
    const trimmedFullName = fullName.trim();
    const nameParts = trimmedFullName.split(/\s+/).filter(Boolean);
    const trimmedFirstName = nameParts[0] || "";
    const trimmedSurname = nameParts.slice(1).join(" ") || "";
    const trimmedUsername = sanitiseUsername(username);
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirstName || !trimmedSurname) {
      toast.error("Please add your first name and last name.");
      return;
    }

    const usernameError = validateUsername(trimmedUsername);
    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    const emailChanged =
      !!trimmedEmail && trimmedEmail.toLowerCase() !== (user.email || "").toLowerCase();
    if (emailChanged && !isValidEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // A code is already out to this exact address. Asking for another one would
    // only hit the one-a-minute limit, so re-open the sheet instead — the thing
    // that is actually outstanding is the code, not the save.
    if (
      emailChanged &&
      verifyTarget?.reason === "change" &&
      verifyTarget.email.toLowerCase() === trimmedEmail.toLowerCase()
    ) {
      setVerifySheetOpen(true);
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

      // Uniqueness checks against other users' profiles. These must go through
      // SECURITY DEFINER RPCs (like the username check above): RLS only lets a
      // user read their own profile row, so a direct `.neq("id", user.id)` query
      // can never see another account's clash — it would always come back empty,
      // silently letting duplicate emails and phone numbers through.
      const uniquenessChecks: Array<{ rpc: string; value: string; label: string }> = [];
      if (trimmedEmail)
        uniquenessChecks.push({ rpc: "is_email_available", value: trimmedEmail, label: "email" });
      if (trimmedPhone)
        uniquenessChecks.push({ rpc: "is_phone_available", value: trimmedPhone, label: "phone number" });

      for (const c of uniquenessChecks) {
        const { data: available, error: checkErr } = await supabase.rpc(
          c.rpc as any,
          { [c.rpc === "is_email_available" ? "_email" : "_phone"]: c.value, _exclude_id: user.id } as any
        );
        if (checkErr) throw checkErr;
        if (!available) {
          toast.error(`That ${c.label} is already in use by another account.`);
          setSavingProfile(false);
          return;
        }
      }

      // Everything except the email saves immediately. The email is owned by
      // Supabase Auth and only moves once the new address has proved itself
      // with a code, so it is left alone here — the on_auth_user_email_changed
      // trigger copies it onto the profile at that point.
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: trimmedFirstName,
        surname: trimmedSurname,
        display_name: `${trimmedFirstName} ${trimmedSurname}`,
        username: trimmedUsername || null,
        ...(emailChanged ? {} : { email: trimmedEmail || null }),
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

      if (emailChanged) {
        // Sends a six-digit code to the NEW address. The account keeps its
        // current email until that code comes back, so a typo can never strand
        // an account on an inbox nobody can open. The function checks the
        // address against every other account first and refuses it if it is
        // already spoken for — that check is the authoritative one, since it
        // sees auth.users as well as profiles.
        const { error: sendErr } = await startEmailChange(trimmedEmail);
        if (sendErr) {
          toast.error(sendErr, { duration: 8000 });
          setSavingProfile(false);
          return;
        }
        emailCooldown.start();
        setVerifyTarget({ email: trimmedEmail, reason: "change", issuedAt: Date.now() });
        setVerifySheetOpen(true);
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["my-profile", user.id] });
        setSavingProfile(false);
        return;
      }

      toast.success("Saved.", {
        style: { fontFamily: PF, fontStyle: "italic", fontSize: 16, background: CREAM, color: INK, border: "none" },
      });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile", user.id] });
    } catch (err: any) {
      toast.error(err.message || "Could not save changes");
    } finally {
      setSavingProfile(false);
    }
  };

  /**
   * Send a code to an account that was created before verification existed and
   * still has an unconfirmed address, so it can be proved without changing it.
   */
  const handleConfirmCurrentEmail = async () => {
    const current = user?.email;
    if (!current || sendingEmailCode || emailCooldown.waiting) return;
    setSendingEmailCode(true);
    const { error } = await resendSignupCode(current);
    setSendingEmailCode(false);
    if (error) {
      toast.error(error);
      return;
    }
    emailCooldown.start();
    setVerifyTarget({ email: current, reason: "confirm", issuedAt: Date.now() });
    setVerifySheetOpen(true);
  };

  /** Email another copy of the code the verification sheet is waiting on. */
  const handleResendEmailCode = async () => {
    if (!verifyTarget || sendingEmailCode || emailCooldown.waiting) return;
    setSendingEmailCode(true);
    const { error } =
      verifyTarget.reason === "change"
        ? await resendEmailChangeCode()
        : await resendSignupCode(verifyTarget.email);
    setSendingEmailCode(false);
    if (error) {
      toast.error(error);
      return { error };
    }
    emailCooldown.start();
    // Fresh code, fresh expiry window.
    setVerifyTarget((prev) => (prev ? { ...prev, issuedAt: Date.now() } : prev));
    return { error: null };
  };

  /**
   * Redeem the code. For a change this is the moment the account actually moves
   * to the new address; the on_auth_user_email_changed trigger mirrors it onto
   * the profile.
   */
  const handleVerifyEmailCode = async (entered: string) => {
    if (!verifyTarget) return { error: "Nothing to verify." };
    const { error } =
      verifyTarget.reason === "change"
        ? await verifyEmailChangeCode(entered)
        : await verifySignupCode(verifyTarget.email, entered);
    if (error) return { error };
    // The access token in hand still carries the old address in its claims, so
    // `user.email` would keep reading back the address we just moved off until
    // it is refreshed.
    await supabase.auth.refreshSession();
    setEmail(verifyTarget.email);
    setVerifyTarget(null);
    setVerifySheetOpen(false);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["my-profile", user!.id] });
    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    toast.success(
      verifyTarget.reason === "change" ? "Email updated and verified." : "Email verified.",
      { style: { fontFamily: PF, fontStyle: "italic", fontSize: 16, background: CREAM, color: INK, border: "none" } },
    );
    return { error: null };
  };

  /** Abandon a pending change and put the field back to the live address. */
  const handleCancelVerification = () => {
    if (verifyTarget?.reason === "change") {
      // Nothing on the account has moved, so this is only tidying — but it
      // releases the one-a-minute limit and stops the row claiming to be
      // waiting for a code nobody is going to enter.
      void cancelEmailChange();
    }
    setVerifyTarget(null);
    setVerifySheetOpen(false);
    setEmail(user?.email || (profile as any)?.email || "");
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



  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 100, fontFamily: FF }}>
      {/* Top bar */}
      <PageHeader title="Account Info" />

      {/* Profile photo — centred portrait avatar on the page canvas, with a
          camera badge sitting on its lower right edge. */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: 24,
          paddingBottom: 28,
        }}
      >
        <div style={{ position: "relative", width: 152, height: 152 }}>
          <div
            style={{
              width: 152,
              height: 152,
              borderRadius: "50%",
              background: SOFT_CREAM,
              border: "6px solid #FFFFFF",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : avatarInitials ? (
              <span style={{ fontFamily: FF, fontSize: 42, fontWeight: 700, color: "#715A3D", letterSpacing: "0.01em" }}>
                {avatarInitials}
              </span>
            ) : (
              <Camera size={34} strokeWidth={1.5} color={MUTED} />
            )}
          </div>

          {uploadingAvatar && (
            <div
              style={{
                position: "absolute",
                inset: 6,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader2 size={24} className="animate-spin" color="#FFFFFF" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatarPicked(f);
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
              if (f) handleAvatarPicked(f);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            aria-label={avatarUrl ? "Change profile photo" : "Add profile photo"}
            onClick={() => setPhotoSheetOpen(true)}
            disabled={uploadingAvatar}
            style={{
              position: "absolute",
              right: 2,
              bottom: 8,
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: DARK,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: uploadingAvatar ? "not-allowed" : "pointer",
              opacity: uploadingAvatar ? 0.7 : 1,
              padding: 0,
            }}
          >
            <Camera size={20} strokeWidth={2} color="#FFFFFF" />
          </button>
        </div>
      </div>


      {/* Section eyebrow */}
      <div
        style={{
          ...type.sectionEyebrow,
          paddingLeft: SECTION_INSET,
          paddingRight: SECTION_INSET,
        }}
      >
        Personal Details
      </div>


      {/* Personal details card */}
      <div style={{ paddingLeft: SECTION_INSET, paddingRight: SECTION_INSET }}>
        <div
          style={{
            background: CARD,
            borderRadius: 20,
            padding: "0 16px",
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
              <Row label="NAME & SURNAME" isFirst>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="First name and last name"
                  style={rowInputStyle}
                />
              </Row>

              <Row label="Username">
                <div style={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                  <span style={{ ...rowInputStyle, width: "auto", flex: "0 0 auto", color: TOKEN_MUTED }}>
                    @
                  </span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(sanitiseUsername(e.target.value))}
                    style={{ ...rowInputStyle, flex: 1 }}
                    autoCapitalize="none"
                    autoCorrect="off"
                    maxLength={USERNAME_MAX}
                  />
                </div>
              </Row>


              <Row label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  style={rowInputStyle}
                />
                {verifyTarget?.reason === "change" ? (
                  <EmailStatusNote tone="pending">
                    Waiting on the code we sent to {verifyTarget.email}. Your account stays
                    on {user?.email} until it's confirmed.{" "}
                    <button
                      type="button"
                      onClick={() => setVerifySheetOpen(true)}
                      style={emailStatusLinkStyle}
                    >
                      Enter code
                    </button>
                  </EmailStatusNote>
                ) : emailEdited ? (
                  <EmailStatusNote tone="warn">
                    Not saved yet. Save Changes sends a code to this address, and your
                    account stays on {accountEmail || "its current address"} until you
                    enter it.
                  </EmailStatusNote>
                ) : emailVerified ? (
                  <EmailStatusNote tone="ok">Verified</EmailStatusNote>
                ) : (
                  <EmailStatusNote tone="warn">
                    Not verified yet — we can't reset your password or reach you here until
                    it is.{" "}
                    <button
                      type="button"
                      onClick={handleConfirmCurrentEmail}
                      disabled={sendingEmailCode || emailCooldown.waiting}
                      style={{
                        ...emailStatusLinkStyle,
                        opacity: sendingEmailCode || emailCooldown.waiting ? 0.6 : 1,
                      }}
                    >
                      {sendingEmailCode
                        ? "Sending…"
                        : emailCooldown.waiting
                        ? `Try again in ${emailCooldown.remaining}s`
                        : "Send me a code"}
                    </button>
                  </EmailStatusNote>
                )}
              </Row>

              <Row
                label="Residency"
                onClick={() => setResidencyOpen((v) => !v)}
              >
                {!residencyOpen ? (
                  <div style={{ ...rowValueStyle, cursor: "pointer" }}>
                    {location || "Select residency"}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                    {RESIDENCY_OPTIONS.map((opt) => {
                      const active = location === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(opt);
                            setResidencyOpen(false);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: `1px solid ${active ? DARK : LINE}`,
                            background: active ? DARK : "#FFFFFF",
                            color: active ? "#FFFFFF" : INK,
                            fontFamily: FF,
                            fontSize: 13,
                            fontWeight: active ? 600 : 400,
                            cursor: "pointer",
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Row>

              <Row
                label={
                  <span>
                    Phone{" "}
                    <span style={{ fontWeight: 400, color: MUTED, textTransform: "none", letterSpacing: "0.02em" }}>
                      optional
                    </span>
                  </span>
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                  <DialCodePicker
                    value={parsed.areaCode}
                    onChange={(newCode) => {
                      setPhone(`${newCode}${parsed.number ? " " + parsed.number : ""}`);
                    }}
                  />
                  <input
                    type="tel"
                    value={parsed.number}
                    onChange={(e) => setPhone(parsed.areaCode + " " + e.target.value.replace(/^\s+/, ""))}
                    style={{ ...rowInputStyle, flex: 1 }}
                    placeholder="063 241 0296"
                  />
                </div>
              </Row>

              <Row label="Password" onClick={() => setPwOpen(true)}>
                {hasPasswordIdentity(user) ? (
                  <div style={{ ...rowValueStyle, letterSpacing: "2px" }}>••••••••</div>
                ) : (
                  <>
                    <div style={rowValueStyle}>Set a password</div>
                    <EmailStatusNote tone="pending">
                      You sign in with {signInMethodLabel(user)}. You can add a password if
                      you'd like to log in with your email as well.
                    </EmailStatusNote>
                  </>
                )}
              </Row>
            </>
          )}
        </div>

        {/* Save changes */}
        {(() => {
          const fallbackName = splitDisplayName((profile as any)?.display_name);
          const origFirst = ((profile as any)?.first_name ?? fallbackName.first ?? "") as string;
          const origSurname = ((profile as any)?.surname ?? fallbackName.surname ?? "") as string;
          const origFullName = `${origFirst} ${origSurname}`.trim();
          const origUsername = ((profile as any)?.username || "") as string;
          const origEmail = ((profile as any)?.email || user?.email || "") as string;
          const origPhone = ((profile as any)?.phone || "") as string;
          const origLocation = ((profile as any)?.location || "") as string;
          const isDirty =
            fullName.trim() !== origFullName ||
            username.trim() !== origUsername.trim() ||
            email.trim() !== origEmail.trim() ||
            phone.trim() !== origPhone.trim() ||
            location.trim() !== origLocation.trim();
          const disabled = savingProfile || profileLoading || !isDirty;
          return (
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {isDirty && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={savingProfile}
                  style={{
                    flex: 1,
                    height: 56,
                    background: "transparent",
                    border: "1.5px solid #715A3D",
                    borderRadius: 999,
                    fontFamily: FF,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#715A3D",
                    letterSpacing: "0.1px",
                    cursor: savingProfile ? "not-allowed" : "pointer",
                    opacity: savingProfile ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={disabled}
                style={{
                  flex: 1,
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
            </div>
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

      {verifySheetOpen && verifyTarget && (
        <VerifyEmailSheet
          target={verifyTarget}
          currentEmail={user?.email || ""}
          cooldown={emailCooldown}
          sending={sendingEmailCode}
          onVerify={handleVerifyEmailCode}
          onResend={handleResendEmailCode}
          onDismiss={() => setVerifySheetOpen(false)}
          onCancel={handleCancelVerification}
        />
      )}

      {photoSheetOpen && (
        <PhotoPickerSheet
          hasPhoto={!!avatarUrl}
          avatarUrl={avatarUrl}
          initials={
            fullName
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? "")
              .join("") || "?"
          }
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

      <AvatarCropDialog
        imageSrc={cropSrc}
        busy={uploadingAvatar}
        onCancel={closeCropper}
        onConfirm={handleAvatarUpload}
      />
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
  textTransform: "uppercase", color: "#423324", marginBottom: 6, display: "block",
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
  avatarUrl,
  initials,
  busy,
  onClose,
  onTakePhoto,
  onUpload,
  onRemove,
}: {
  hasPhoto: boolean;
  avatarUrl: string;
  initials: string;
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
    padding: "16px 20px",
    background: "transparent",
    border: "none",
    cursor: busy ? "not-allowed" : "pointer",
    textAlign: "left",
    fontFamily: FF,
    fontSize: 16,
    fontWeight: 500,
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

  const divider = <div style={{ height: 1, background: "#EAE4D5" }} />;

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
          padding: "10px 0 calc(20px + env(safe-area-inset-bottom))",
          animation: "pp-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          position: "relative",
        }}
      >
        <style>{`@keyframes pp-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>

        {/* grab handle */}
        <div
          style={{
            width: 56,
            height: 5,
            borderRadius: 999,
            background: "#E2DED6",
            margin: "0 auto",
          }}
        />

        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "none",
            background: "#F2EBDC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={20} color={INK} strokeWidth={2} />
        </button>

        <div style={{ padding: "18px 20px 22px", textAlign: "center" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              margin: "0 auto 14px",
              overflow: "hidden",
              background: "#F2EBDC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasPhoto && avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  fontFamily: "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 34,
                  fontWeight: 600,
                  color: "#715A3D",
                  letterSpacing: "0.02em",
                }}
              >
                {initials}
              </span>
            )}
          </div>
          <h2
            style={{
              fontFamily: "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontWeight: 550,
              fontSize: 22,
              color: INK,
              margin: "0 0 4px",
            }}
          >
            {hasPhoto ? "Profile Photo" : "Add a Profile Photo"}
          </h2>
          <div style={{ fontFamily: FF, fontSize: 15, color: MUTED }}>
            JPG or PNG, up to 5MB
          </div>
        </div>

        {divider}

        <button type="button" style={rowBase} disabled={busy} onClick={onTakePhoto}>
          <span style={iconWrap}>
            <Camera size={20} color="#715A3D" strokeWidth={1.6} />
          </span>
          <span style={{ flex: 1 }}>Take a Photo</span>
          <ChevronRight size={20} color={MUTED} strokeWidth={1.6} />
        </button>

        {divider}

        <button type="button" style={rowBase} disabled={busy} onClick={onUpload}>
          <span style={iconWrap}>
            <ImageIcon size={20} color="#715A3D" strokeWidth={1.6} />
          </span>
          <span style={{ flex: 1 }}>Choose from Library</span>
          <ChevronRight size={20} color={MUTED} strokeWidth={1.6} />
        </button>

        {hasPhoto && (
          <>
            {divider}
            <button
              type="button"
              style={{ ...rowBase, color: "#B42318" }}
              disabled={busy}
              onClick={onRemove}
            >
              <span style={{ ...iconWrap, background: "#FDECEC" }}>
                {busy ? (
                  <Loader2 size={18} className="animate-spin" color="#B42318" />
                ) : (
                  <Trash2 size={20} color="#B42318" strokeWidth={1.6} />
                )}
              </span>
              <span style={{ flex: 1 }}>Remove Photo</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * "Check your email" for a signed-in user: the six-digit code that either moves
 * the account to a new address or confirms the one it already has.
 *
 * Dismissing it (the X, or tapping outside) leaves the request standing — the
 * Email row keeps offering the code entry. Only *Cancel* abandons the change
 * and puts the field back.
 */
const VerifyEmailSheet = ({
  target,
  currentEmail,
  cooldown,
  sending,
  onVerify,
  onResend,
  onDismiss,
  onCancel,
}: {
  target: { email: string; reason: "change" | "confirm" };
  currentEmail: string;
  cooldown: { remaining: number; waiting: boolean };
  sending: boolean;
  onVerify: (code: string) => Promise<{ error: string | null }>;
  onResend: () => Promise<{ error: string | null } | undefined>;
  onDismiss: () => void;
  onCancel: () => void;
}) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  const submit = async (entered?: string) => {
    const value = entered ?? code;
    if (submitting || !isCompleteCode(value)) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await onVerify(value);
    setSubmitting(false);
    if (err) setError(err);
  };

  const resend = async () => {
    setError(null);
    setCode("");
    const result = await onResend();
    if (result?.error) setError(result.error);
  };

  const ready = isCompleteCode(code) && !submitting;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onDismiss}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,10,10,0.4)", display: "flex", alignItems: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: FF, width: "100%", background: "#ffffff",
          borderRadius: "20px 20px 0 0", padding: "20px 20px 32px",
          animation: "ve-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <style>{`@keyframes ve-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 8 }}>
          <button onClick={onDismiss} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
            <X size={20} color={INK} strokeWidth={1.75} />
          </button>
        </div>

        <h2
          style={{
            fontFamily: "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 550, fontSize: 22, color: INK, margin: "0 0 8px",
          }}
        >
          {target.reason === "change" ? "Confirm your new email" : "Verify your email"}
        </h2>
        <p style={{ fontFamily: FF, fontSize: 14, lineHeight: 1.55, color: MUTED, margin: "0 0 20px" }}>
          We've sent a {VERIFICATION_CODE_LENGTH}-digit code to{" "}
          <span style={{ color: INK, fontWeight: 600 }}>{target.email}</span>.{" "}
          {target.reason === "change" ? (
            <>
              Your account stays on{" "}
              <span style={{ color: INK, fontWeight: 600 }}>{currentEmail}</span> until the
              code is entered, so a typo can't lock you out.
            </>
          ) : (
            <>
              Entering it proves the address is yours, so we can reset your password and
              reach you if there's ever a problem with your account.
            </>
          )}
        </p>

        <VerificationCodeInput
          value={code}
          onChange={(next) => {
            setCode(next);
            if (error) setError(null);
          }}
          onComplete={(full) => submit(full)}
          disabled={submitting}
          invalid={!!error}
          autoFocus
        />

        {error && (
          <div
            role="alert"
            style={{
              fontFamily: FF, fontSize: 13, lineHeight: 1.45,
              color: "#C0392B", marginTop: 10,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={() => submit()}
          disabled={!ready}
          style={{
            fontFamily: FF, marginTop: 20, width: "100%", height: 48, borderRadius: 999,
            background: "#423324", color: "#FFFFFF", border: "none", fontSize: 14,
            letterSpacing: "0.04em", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
            cursor: ready ? "pointer" : "default", opacity: ready ? 1 : 0.6,
          }}
        >
          {submitting ? "Verifying…" : target.reason === "change" ? "Confirm Email" : "Verify Email"}
          {!submitting && <Check size={14} strokeWidth={1.8} />}
        </button>

        <p style={{ fontFamily: FF, fontSize: 12.5, lineHeight: 1.5, color: MUTED, margin: "14px 0 0", textAlign: "center" }}>
          The code works for {VERIFICATION_CODE_TTL_MINUTES} minutes, so there's no rush.
          Nothing after a minute or two? Check your spam or junk folder — it comes from
          hello@hellohoedspruit.co.
        </p>

        <button
          type="button"
          onClick={resend}
          disabled={sending || cooldown.waiting}
          style={{
            marginTop: 12, width: "100%", background: "transparent", border: "none",
            fontFamily: FF, fontSize: 14, fontWeight: 600, color: "#715a3d",
            cursor: sending || cooldown.waiting ? "default" : "pointer", padding: 4,
            opacity: sending || cooldown.waiting ? 0.6 : 1,
          }}
        >
          {sending ? "Sending…" : cooldown.waiting ? `Resend in ${cooldown.remaining}s` : "Send a new code"}
        </button>

        {target.reason === "change" && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              marginTop: 4, width: "100%", background: "transparent", border: "none",
              fontFamily: FF, fontSize: 14, color: MUTED, cursor: "pointer", padding: 4,
            }}
          >
            Cancel and keep {currentEmail}
          </button>
        )}
      </div>
    </div>
  );
};

const ChangePasswordSheet = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorField, setErrorField] = useState<{ field: "current" | "new" | "confirm"; msg: string } | null>(null);
  // "change" = normal form, "forgot" = confirm sending a reset email,
  // "sent" = the reset email has gone out.
  //
  // An account that signed up with Google or Apple has never had a password,
  // so there is no current one to ask for and the form would be unanswerable.
  // It starts on "forgot" instead, which is the same email — the copy just
  // calls it setting a password rather than resetting one.
  const hasPassword = hasPasswordIdentity(user);
  const [view, setView] = useState<"change" | "forgot" | "sent">(
    hasPassword ? "change" : "forgot",
  );
  const [sendingReset, setSendingReset] = useState(false);
  const resetCooldown = useResendCooldown();
  const accountEmail = user?.email || "";

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

  const handleSendResetLink = async () => {
    if (sendingReset || resetCooldown.waiting) return;
    if (!accountEmail) {
      toast.error("We couldn't find the email address for your account.");
      return;
    }
    setSendingReset(true);
    const { error } = await sendPasswordResetEmail(accountEmail);
    setSendingReset(false);
    if (error) {
      toast.error(error);
      return;
    }
    resetCooldown.start();
    setView("sent");
  };

  const sheetHeadingStyle: React.CSSProperties = {
    fontFamily: "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontWeight: 550, fontSize: 22, color: INK, margin: "0 0 8px",
  };
  const sheetCopyStyle: React.CSSProperties = {
    fontFamily: FF, fontSize: 14, lineHeight: 1.55, color: MUTED, margin: "0 0 20px",
  };
  const primaryBtnStyle: React.CSSProperties = {
    fontFamily: FF, marginTop: 20, width: "100%", height: 48, borderRadius: 999,
    background: "#423324", color: "#FFFFFF", border: "none", fontSize: 14,
    letterSpacing: "0.04em",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  };
  const textLinkStyle: React.CSSProperties = {
    marginTop: 14, width: "100%", background: "transparent", border: "none",
    fontFamily: FF, fontSize: 14, fontWeight: 600, color: "#715a3d",
    cursor: "pointer", padding: 4,
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
        {view === "change" && (
          <>
            <h2 style={sheetHeadingStyle}>Change Password</h2>
            <p style={sheetCopyStyle}>
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
                ...primaryBtnStyle,
                cursor: enabled ? "pointer" : "default", opacity: enabled ? 1 : 0.6,
              }}
            >
              {submitting ? "Updating…" : "Update Password"}
              {!submitting && <Check size={14} strokeWidth={1.8} />}
            </button>
            <button type="button" onClick={() => setView("forgot")} style={textLinkStyle}>
              Forgot Password
            </button>
          </>
        )}

        {view === "forgot" && (
          <>
            <h2 style={sheetHeadingStyle}>
              {hasPassword ? "Forgot Password" : "Set a Password"}
            </h2>
            <p style={sheetCopyStyle}>
              {hasPassword ? (
                <>
                  No problem. We'll email a secure link to{" "}
                  <span style={{ color: INK, fontWeight: 600 }}>
                    {accountEmail || "your account email"}
                  </span>
                  . Open it within {RESET_LINK_TTL_MINUTES} minutes and you can choose a
                  brand-new password — no current password needed.
                </>
              ) : (
                <>
                  You sign in with {signInMethodLabel(user)}, so this account has never had
                  a password. You don't need one — but if you'd like to be able to log in
                  with your email too, we'll send a link to{" "}
                  <span style={{ color: INK, fontWeight: 600 }}>
                    {accountEmail || "your account email"}
                  </span>{" "}
                  where you can choose one. It works for {RESET_LINK_TTL_MINUTES} minutes.
                </>
              )}
            </p>
            <button
              onClick={handleSendResetLink}
              disabled={sendingReset || resetCooldown.waiting}
              style={{
                ...primaryBtnStyle, marginTop: 4,
                cursor: sendingReset || resetCooldown.waiting ? "default" : "pointer",
                opacity: sendingReset || resetCooldown.waiting ? 0.6 : 1,
              }}
            >
              {sendingReset
                ? "Sending…"
                : resetCooldown.waiting
                ? `Try again in ${resetCooldown.remaining}s`
                : hasPassword
                ? "Email Me a Reset Link"
                : "Email Me a Link"}
            </button>
            {hasPassword && (
              <button type="button" onClick={() => setView("change")} style={textLinkStyle}>
                Back to Change Password
              </button>
            )}
          </>
        )}

        {view === "sent" && (
          <>
            <h2 style={sheetHeadingStyle}>Check Your Email</h2>
            <p style={sheetCopyStyle}>
              We've sent a password reset link to{" "}
              <span style={{ color: INK, fontWeight: 600 }}>{accountEmail}</span>
              . The link expires in {RESET_LINK_TTL_MINUTES} minutes. If it doesn't arrive
              in a minute or two, check your spam folder.
            </p>
            <button
              onClick={onClose}
              style={{ ...primaryBtnStyle, marginTop: 4, cursor: "pointer" }}
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleSendResetLink}
              disabled={sendingReset || resetCooldown.waiting}
              style={{
                ...textLinkStyle,
                opacity: sendingReset || resetCooldown.waiting ? 0.6 : 1,
              }}
            >
              {sendingReset
                ? "Sending…"
                : resetCooldown.waiting
                ? `Resend in ${resetCooldown.remaining}s`
                : "Resend Link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

function DialCodePicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const current = AREA_CODES.find((a) => a.code === value) || AREA_CODES[0];

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: Event) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    // Close when the page behind scrolls, but NOT when the user scrolls the
    // dropdown list itself — otherwise the menu vanishes as soon as you try
    // to scroll down to the code you want.
    const onScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (target && menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const toggle = () => {
    if (!open && buttonRef.current) {
      setRect(buttonRef.current.getBoundingClientRect());
    }
    setOpen((v) => !v);
  };

  const dropdown = (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: (rect?.bottom ?? 0) + 6,
        left: rect?.left ?? 0,
        zIndex: 9999,
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        maxHeight: 260,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
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
          <span style={{ width: 50 }}>{ac.code}</span>
          <span style={{ color: MUTED }}>{ac.country}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
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
        <span>{current.code}</span>
        <span style={{ fontSize: 10, color: MUTED, marginLeft: 2 }}>▾</span>
      </button>
      {open && createPortal(dropdown, document.body)}
    </div>
  );
}

export default AccountInfo;
