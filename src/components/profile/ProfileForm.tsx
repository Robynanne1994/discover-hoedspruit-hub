import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Loader2, ChevronDown, ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

interface ProfileFormProps {
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    location: string | null;
    phone: string | null;
    email: string | null;
    bio: string | null;
  } | null;
}

const inputStyle: React.CSSProperties = {
  background: "rgba(18,18,20,0.03)",
  border: "1px solid rgba(18,18,20,0.08)",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: 15,
  fontWeight: 500,
  color: "#2b2420",
  width: "100%",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "rgba(18,18,20,0.35)",
  textTransform: "uppercase",
  letterSpacing: 2,
  marginBottom: 8,
  display: "block",
};

const ProfileForm = ({ profile }: ProfileFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [email, setEmail] = useState(profile?.email || user?.email || "");
  const [bio, setBio] = useState(profile?.bio || "");
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
      toast.success("Profile photo updated!");
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
        location: location.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        bio: bio.trim() || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: () => toast.error("We couldn't save your changes right now. Please try again."),
  });

  const initial = (displayName || user?.email || "?")[0].toUpperCase();
  const parsed = parsePhone(phone);

  return (
    <div className="min-h-screen pb-20" style={{ background: "#ffffff" }}>
      {/* Back button */}
      <div style={{ paddingTop: 44, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
          <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.4)" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px" }}>Back</span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.5px", color: "#2b2420", textTransform: "uppercase" }}>
          EDIT PROFILE
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <p style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px", lineHeight: 1.4 }}>
          Update your details and photo
        </p>
      </div>

      {/* Avatar section */}
      <div className="flex flex-col items-center" style={{ marginBottom: 32 }}>
        <div className="relative">
          <div className="overflow-hidden flex items-center justify-center" style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(18,18,20,0.06)" }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 700, color: "rgba(18,18,20,0.25)" }}>{initial}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute flex items-center justify-center active:scale-95 transition-transform"
            style={{ bottom: -2, right: -2, width: 28, height: 28, borderRadius: "50%", background: "#121214" }}
          >
            {uploading ? (
              <Loader2 style={{ width: 14, height: 14, color: "#ffffff" }} className="animate-spin" />
            ) : (
              <Camera style={{ width: 14, height: 14, color: "#ffffff" }} />
            )}
          </button>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(18,18,20,0.4)", marginTop: 10, textAlign: "center" }}>
          {displayName || "Your Name"}
        </p>
        <p style={{ fontSize: 12, color: "rgba(18,18,20,0.3)", marginTop: 4, textAlign: "center" }}>
          Tap icon to change photo
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadAvatar(file);
          }}
        />
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); saveProfile.mutate(); }}
        style={{ paddingLeft: 24, paddingRight: 24 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Username */}
          <div>
            <label style={labelStyle}>Username</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "rgba(18,18,20,0.2)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(18,18,20,0.08)"}
            />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "rgba(18,18,20,0.2)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(18,18,20,0.08)"}
            />
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Hoedspruit"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "rgba(18,18,20,0.2)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(18,18,20,0.08)"}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Phone Number</label>
            <div className="flex" style={{ gap: 8 }}>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center shrink-0"
                    style={{
                      ...inputStyle,
                      width: "auto",
                      gap: 6,
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{(AREA_CODES.find((a) => a.code === parsed.areaCode) || AREA_CODES[0]).flag}</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{parsed.areaCode}</span>
                    <ChevronDown style={{ width: 14, height: 14, color: "rgba(18,18,20,0.3)" }} />
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
              <input
                type="tel"
                value={parsed.number}
                onChange={(e) => setPhone(parsed.areaCode + e.target.value)}
                placeholder="Phone number"
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => e.target.style.borderColor = "rgba(18,18,20,0.2)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(18,18,20,0.08)"}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label style={labelStyle}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people a little about yourself..."
              maxLength={200}
              style={{
                ...inputStyle,
                minHeight: 100,
                resize: "none",
                fontFamily: "inherit",
              }}
              onFocus={(e) => e.target.style.borderColor = "rgba(18,18,20,0.2)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(18,18,20,0.08)"}
            />
            <p style={{ fontSize: 12, color: "rgba(18,18,20,0.3)", textAlign: "right", marginTop: 4 }}>{bio.length}/200</p>
          </div>
        </div>

        {/* Save button */}
        <div style={{ marginTop: 32, marginBottom: 100 }}>
          <button
            type="submit"
            disabled={saveProfile.isPending}
            className="w-full flex items-center justify-center active:scale-[0.98] transition-transform"
            style={{
              background: "#121214",
              borderRadius: 16,
              padding: 16,
              fontSize: 15,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.3px",
              border: "none",
              cursor: "pointer",
              opacity: saveProfile.isPending ? 0.7 : 1,
            }}
          >
            {saveProfile.isPending ? (
              <><Loader2 style={{ width: 16, height: 16, marginRight: 8 }} className="animate-spin" /> Saving...</>
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
