import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
import { toast } from "sonner";
import BackButton from "@/components/BackButton";


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

const PhoneInput = ({ phone, onChange }: { phone: string; onChange: (v: string) => void }) => {
  const parsed = parsePhone(phone);
  const [areaCode, setAreaCode] = useState(parsed.areaCode);
  const [number, setNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onChange(number ? `${areaCode}${number}` : "");
  }, [areaCode, number]);

  const selected = AREA_CODES.find((a) => a.code === areaCode) || AREA_CODES[0];

  return (
    <div>
      <label className="block text-sm font-bold text-foreground mb-1.5">Phone Number</label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 h-12 px-3 rounded-xl border border-input bg-card text-sm font-medium shrink-0 hover:bg-accent/50 transition-colors"
            >
              <span className="text-base">{selected.flag}</span>
              <span>{selected.code}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1 rounded-xl" align="start">
            {AREA_CODES.map((ac) => (
              <button
                key={ac.code}
                type="button"
                onClick={() => { setAreaCode(ac.code); setOpen(false); }}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-accent/50 transition-colors ${ac.code === areaCode ? "bg-accent/30 font-semibold" : ""}`}
              >
                <span className="text-base">{ac.flag}</span>
                <span>{ac.code}</span>
                <span className="text-muted-foreground text-xs ml-auto">{ac.country}</span>
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <Input
          type="tel"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Phone number"
          className="rounded-xl bg-card h-12 flex-1"
        />
      </div>
    </div>
  );
};

const ProfileForm = ({ profile }: ProfileFormProps) => {
  const { user } = useAuth();
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

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
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
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          location: location.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          bio: bio.trim() || null,
        } as any)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: () => toast.error("We couldn't save your changes right now. Please try again."),
  });

  const initial = (displayName || user?.email || "?")[0].toUpperCase();

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="px-5 pt-4">
        <BackButton className="mb-0" />
      </div>

      <div className="px-5 pt-4">
        {/* Intro */}
        <div className="mb-6">
          <h2
            className="text-lg font-bold text-foreground mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Manage Your Profile
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Keep your Hello Hoedspruit account up to date.
          </p>
        </div>

        {/* Profile Photo Card */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div className="h-16 w-16 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span
                    className="text-xl font-bold text-muted-foreground"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {initial}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-md active:scale-95 transition-transform"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                )}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">Profile Photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upload or change photo</p>
            </div>
          </div>
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
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">Username</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl bg-card h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="rounded-xl bg-card h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">Location</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Hoedspruit"
              className="rounded-xl bg-card h-12"
            />
          </div>
          <PhoneInput phone={phone} onChange={setPhone} />
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people a little about yourself..."
              className="rounded-xl bg-card min-h-[80px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/200</p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saveProfile.isPending}
              className="w-full rounded-xl h-12 font-bold text-base"
            >
              {saveProfile.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
              ) : (
                "Save Profile"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;
