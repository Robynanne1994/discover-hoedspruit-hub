import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      toast.success("Profile saved!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveProfile.mutate();
      }}
      className="bg-card border border-border rounded-xl p-6 space-y-6"
    >
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <div className="h-20 w-20 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {(displayName || user?.email || "?")[0].toUpperCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </button>
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
        <div>
          <p className="font-medium text-foreground text-sm">Profile Photo</p>
          <p className="text-xs text-muted-foreground">Click to upload or change</p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <Label htmlFor="profileEmail">Email</Label>
          <Input
            id="profileEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Hoedspruit"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+27..."
          />
        </div>
      </div>

      <Button type="submit" disabled={saveProfile.isPending}>
        {saveProfile.isPending ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
};

export default ProfileForm;
