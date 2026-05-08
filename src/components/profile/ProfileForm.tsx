import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Loader2, ArrowLeft, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const DEEP = "#2A2A24";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const AREA_CODES = [
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+31", country: "NL", flag: "🇳🇱" },
  { code: "+351", country: "PT", flag: "🇵🇹" },
  { code: "+254", country: "KE", flag: "🇰🇪" },
  { code: "+255", country: "TZ", flag: "🇹🇿" },
  { code: "+258", country: "MZ", flag: "🇲🇿" },
  { code: "+267", country: "BW", flag: "🇧🇼" },
  { code: "+264", country: "NA", flag: "🇳🇦" },
  { code: "+263", country: "ZW", flag: "🇿🇼" },
];

function parsePhone(phone: string) {
  for (const ac of AREA_CODES) {
    if (phone.startsWith(ac.code)) {
      return { areaCode: ac.code, number: phone.slice(ac.code.length).trim() };
    }
  }
  return { areaCode: "+27", number: phone.replace(/^\+?\d{1,3}\s?/, "") };
}

function formatLocalNumber(n: string) {
  const digits = n.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
}

interface ProfileFormProps {
  profile: {
    display_name: string | null;
    username?: string | null;
    avatar_url: string | null;
    location: string | null;
    phone: string | null;
    email: string | null;
    bio: string | null;
  } | null;
}

const ROW_LABEL: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 10.5,
  fontWeight: 400,
  letterSpacing: "1.8px",
  textTransform: "uppercase",
  color: MUTED,
  marginBottom: 6,
  display: "block",
};

const ROW_VALUE: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.3,
  letterSpacing: "-0.1px",
  color: DEEP,
  background: "transparent",
  border: "none",
  outline: "none",
  width: "100%",
  padding: 0,
  margin: 0,
};

const ProfileForm = ({ profile }: ProfileFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  // Load Playfair
  useEffect(() => {
    const id = "playfair-display-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState((profile as any)?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [email, setEmail] = useState(profile?.email || user?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "+27");
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(newUrl);
      await supabase.from("profiles").update({ avatar_url: newUrl }).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile photo updated");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName.trim() || null,
        username: username.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        bio: bio.trim() || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Saved.");
      navigate(-1);
    },
    onError: () => toast.error("We couldn't save your changes right now."),
  });

  const initial = (displayName || user?.email || "?")[0].toUpperCase();
  const parsed = parsePhone(phone);
  const flag = (AREA_CODES.find((a) => a.code === parsed.areaCode) || AREA_CODES[0]).flag;

  const SectionEyebrow = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: "2.4px",
        textTransform: "uppercase",
        color: "rgba(238,232,218,0.7)",
        padding: "0 24px",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );

  const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      style={{
        background: CREAM,
        borderRadius: 20,
        margin: "0 24px",
        padding: "4px 22px",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );

  const Row: React.FC<{ first?: boolean; children: React.ReactNode }> = ({ first, children }) => (
    <div
      style={{
        position: "relative",
        paddingTop: 16,
        paddingBottom: 18,
        borderTop: first ? "none" : `1px solid ${LINE}`,
      }}
    >
      {children}
    </div>
  );

  const PencilIcon = () => (
    <Pencil
      size={14}
      strokeWidth={1.5}
      style={{ position: "absolute", top: 18, right: 0, color: MUTED, opacity: 0.6 }}
    />
  );

  return (
    <div style={{ minHeight: "100vh", background: OLIVE, paddingBottom: 120, fontFamily: SANS }}>
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
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: CREAM,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Back"
        >
          <ArrowLeft size={18} strokeWidth={1.6} color={DEEP} />
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 400,
            color: "rgba(238,232,218,0.75)",
          }}
        >
          Cancel
        </button>
      </div>

      {/* Hero */}
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: "rgba(238,232,218,0.7)",
            marginBottom: 14,
          }}
        >
          Your Account
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 72,
            lineHeight: 0.92,
            letterSpacing: "-2.5px",
            color: CREAM,
            margin: 0,
            marginBottom: 14,
          }}
        >
          edit.
        </h1>
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            color: "rgba(238,232,218,0.75)",
            margin: 0,
            marginBottom: 28,
          }}
        >
          Update your details and photo.
        </p>
      </div>

      {/* Avatar card */}
      <div
        style={{
          margin: "0 24px 24px",
          background: CREAM,
          borderRadius: 24,
          padding: "28px 24px 26px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", width: 96, height: 96 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              overflow: "hidden",
              background: "linear-gradient(135deg, #E8B999 0%, #C18866 50%, #8B5C3E 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 38,
                  color: CREAM,
                }}
              >
                {initial}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: RUST,
              border: `3px solid ${CREAM}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
            aria-label="Change photo"
          >
            {uploading ? (
              <Loader2 size={14} color={CREAM} className="animate-spin" />
            ) : (
              <Camera size={14} strokeWidth={1.8} color={CREAM} fill="none" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadAvatar(file);
            }}
          />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveProfile.mutate();
        }}
      >
        {/* About You */}
        <SectionEyebrow>About You</SectionEyebrow>
        <Card>
          <Row first>
            <label style={ROW_LABEL}>Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
              style={ROW_VALUE}
            />
            <PencilIcon />
          </Row>
          <Row>
            <label style={{ ...ROW_LABEL, marginBottom: 6 }}>
              Username
              <span
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 11.5,
                  textTransform: "none",
                  letterSpacing: 0,
                  marginLeft: 4,
                  opacity: 0.85,
                  color: MUTED,
                }}
              >
                (display name)
              </span>
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, "").toLowerCase())}
              placeholder="@yourhandle"
              autoCapitalize="none"
              autoCorrect="off"
              style={ROW_VALUE}
            />
            <PencilIcon />
          </Row>
          <Row>
            <label style={ROW_LABEL}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 220))}
              placeholder="A short line about you."
              style={{
                ...ROW_VALUE,
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 17,
                lineHeight: 1.5,
                minHeight: 48,
                resize: "none",
                paddingRight: 50,
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: 14,
                right: 0,
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 12,
                color: bio.length > 200 ? DEEP : MUTED,
                opacity: bio.length > 200 ? 1 : 0.7,
              }}
            >
              {bio.length} / 200
            </span>
          </Row>
        </Card>

        <div style={{ height: 24 }} />

        {/* Contact */}
        <SectionEyebrow>Contact</SectionEyebrow>
        <Card>
          <Row first>
            <label style={ROW_LABEL}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              style={ROW_VALUE}
            />
            <PencilIcon />
          </Row>
          <Row>
            <label style={ROW_LABEL}>Phone Number</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: SANS,
                      fontSize: 16,
                      fontWeight: 400,
                      color: DEEP,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{flag}</span>
                    <span>{parsed.areaCode}</span>
                    <span style={{ fontSize: 11, color: MUTED }}>▾</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1 rounded-xl" align="start">
                  {AREA_CODES.map((ac) => (
                    <button
                      key={ac.code}
                      type="button"
                      onClick={() => setPhone(ac.code + parsed.number)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-base">{ac.flag}</span>
                      <span>{ac.code}</span>
                      <span className="text-muted-foreground text-xs ml-auto">{ac.country}</span>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
              <span
                style={{
                  width: 1,
                  height: 18,
                  background: LINE,
                  margin: "0 4px",
                  display: "inline-block",
                }}
              />
              <input
                type="tel"
                inputMode="tel"
                value={formatLocalNumber(parsed.number)}
                onChange={(e) =>
                  setPhone(parsed.areaCode + e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="063 241 0296"
                style={{ ...ROW_VALUE, flex: 1, paddingLeft: 4, paddingRight: 24 }}
              />
            </div>
            <PencilIcon />
          </Row>
        </Card>

        {/* Save */}
        <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
          <button
            type="submit"
            disabled={saveProfile.isPending}
            style={{
              width: "100%",
              height: 54,
              borderRadius: 999,
              background: DEEP,
              color: CREAM,
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 400,
              letterSpacing: "0.1px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: saveProfile.isPending ? 0.7 : 1,
            }}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
