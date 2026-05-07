import BackButton from "@/components/BackButton";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "rgba(18,18,20,0.55)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 8,
  display: "block",
  fontFamily: FF,
};

const inputStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid rgba(18,18,20,0.08)",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: 15,
  fontWeight: 400,
  color: "#2b2420",
  width: "100%",
  outline: "none",
  fontFamily: FF,
};

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
  const [savingProfile, setSavingProfile] = useState(false);
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

      // If email changed from auth email, update auth as well
      if (email.trim() && email.trim() !== user.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email: email.trim() });
        if (authErr) {
          toast.error(authErr.message);
        } else {
          toast.success("Saved. Check your new email to confirm the change.");
        }
      } else {
        toast.success("Account info updated");
      }

      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message || "Could not save changes");
    } finally {
      setSavingProfile(false);
    }
  };

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Could not update password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", background: "#555340", fontFamily: FF }}>
        <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
          <Skeleton className="h-4 w-20" />
          <div style={{ marginTop: 28 }}>
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>
    );
  }

  const parsed = parsePhone(phone);
  const flag = (AREA_CODES.find((a) => a.code === parsed.areaCode) || AREA_CODES[0]).flag;

  return (
    <div style={{ minHeight: "100vh", background: "#555340", paddingBottom: 100, fontFamily: FF }}>
      {/* Back */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <BackButton iconColor="#F0EAD9" />
      </div>

      {/* Title */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 4 }}>
        <h1 style={{ fontFamily: FF, fontSize: 52, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em", color: "#F0EAD9", textTransform: "none", margin: 0 }}>
          Account Info
        </h1>
      </div>
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
      </div>

      {/* Personal details card */}
      <div style={{ paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#F0EAD9", marginBottom: 8, fontFamily: FF }}>
          Personal Details
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {profileLoading ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Name</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your first name" style={inputStyle} maxLength={50} />
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, "").toLowerCase())}
                  placeholder="yourusername"
                  style={inputStyle}
                  maxLength={30}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
                {email.trim() && email.trim() !== user.email && (
                  <p style={{ fontSize: 12, color: "rgba(18,18,20,0.55)", marginTop: 6, fontFamily: FF }}>
                    You'll receive a confirmation email at the new address.
                  </p>
                )}
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        style={{
                          ...inputStyle,
                          width: "auto",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{flag}</span>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{parsed.areaCode}</span>
                        <ChevronDown size={14} color="rgba(18,18,20,0.3)" />
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
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Hoedspruit" style={inputStyle} />
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile || profileLoading}
          style={{
            width: "100%",
            background: "#0A0A0A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            minHeight: 48,
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1,
            fontFamily: "'Pragmatica', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: savingProfile ? 0.7 : 1,
            marginBottom: 32,
          }}
        >
          {savingProfile ? (<><Loader2 size={16} className="animate-spin" /> Saving...</>) : "Save Changes"}
        </button>

        {/* Password */}
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#F0EAD9", marginBottom: 8, fontFamily: FF }}>
          Password
        </div>
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={inputStyle}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              style={inputStyle}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={savingPassword || !newPassword || !confirmPassword}
          style={{
            width: "100%",
            background: "#0A0A0A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            minHeight: 48,
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1,
            fontFamily: "'Pragmatica', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: savingPassword || !newPassword || !confirmPassword ? 0.5 : 1,
          }}
        >
          {savingPassword ? (<><Loader2 size={16} className="animate-spin" /> Updating...</>) : "Update Password"}
        </button>
      </div>
    </div>
  );
};

export default AccountInfo;
