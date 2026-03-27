import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import heroBg from "@/assets/hero-homepage.jpg";

interface ProfileFormProps {
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    location: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

const ProfileForm = ({ profile }: ProfileFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [email, setEmail] = useState(profile?.email || user?.email || "");
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
        })
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
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[220px] overflow-hidden">
          <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
            <h1
              className="text-2xl font-bold tracking-tight mb-1"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Hello<br />Hoedspruit
            </h1>
            <p
              className="text-xl font-semibold mt-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Edit Profile
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-[2rem]" />
      </section>

      <div className="relative -mt-6 px-5 pt-6">
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
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full mt-4 rounded-xl h-10 gap-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold text-sm"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Camera className="h-4 w-4" /> Change Photo</>
            )}
          </Button>
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
            <label className="block text-sm font-bold text-foreground mb-1.5">Display Name</label>
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
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">Phone Number</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27..."
              className="rounded-xl bg-card h-12"
            />
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
