import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { STORE_LINKS_SECTION, APPLE_REVIEW_URL } from "@/lib/storeReview";
import { useStoreReviewLinks, STORE_LINKS_QUERY_KEY } from "@/hooks/useStoreReviewLinks";

const AdminAppStore = () => {
  const queryClient = useQueryClient();
  const { data: links, isLoading } = useStoreReviewLinks();
  const [apple, setApple] = useState("");
  const [android, setAndroid] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!links) return;
    setApple(links.apple ?? APPLE_REVIEW_URL);
    setAndroid(links.android ?? "");
  }, [links]);

  const save = async () => {
    for (const v of [apple, android]) {
      if (v.trim() && !/^https?:\/\//i.test(v.trim())) {
        toast.error("Links must start with https://");
        return;
      }
    }
    setSaving(true);
    const content = { apple: apple.trim() || null, android: android.trim() || null };
    const { data: existing } = await supabase
      .from("site_content").select("id").eq("section", STORE_LINKS_SECTION).maybeSingle();
    const { error } = existing
      ? await supabase.from("site_content").update({ content }).eq("section", STORE_LINKS_SECTION)
      : await supabase.from("site_content").insert([{ section: STORE_LINKS_SECTION, content }]);
    setSaving(false);
    if (error) { toast.error("Could not save links."); return; }
    queryClient.invalidateQueries({ queryKey: STORE_LINKS_QUERY_KEY });
    toast.success("Rating links saved.");
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">App Store</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage the links used across the app.</p>
      </div>
      <section className="rounded-2xl border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Rate Us</h2>
          <p className="text-sm text-muted-foreground">
            Opened from My Account, Rate Us. Leave Google blank to show "coming soon".
          </p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Apple (iOS) Rating Link</span>
          <Input value={apple} onChange={(e) => setApple(e.target.value)} placeholder="https://apps.apple.com/..." disabled={isLoading} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Google (Android) Rating Link</span>
          <Input value={android} onChange={(e) => setAndroid(e.target.value)} placeholder="https://play.google.com/store/apps/details?id=..." disabled={isLoading} />
        </label>
        <Button onClick={save} disabled={saving || isLoading}>{saving ? "Saving..." : "Save Links"}</Button>
      </section>
    </div>
  );
};

export default AdminAppStore;
