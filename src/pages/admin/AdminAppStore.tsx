import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Star, Apple, Smartphone, ExternalLink, Check } from "lucide-react";
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

  const field = (
    id: string,
    Icon: typeof Star,
    label: string,
    value: string,
    set: (v: string) => void,
    placeholder: string,
  ) => {
    const v = value.trim();
    const valid = /^https?:\/\//i.test(v);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon className="h-4 w-4 text-primary" />
            {label}
          </label>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              v ? "bg-[var(--filter-ink)] text-primary-foreground" : "bg-primary-tint text-muted-foreground border border-border"
            }`}
          >
            {v ? <><Check className="h-3 w-3" /> Live</> : "Coming Soon"}
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            id={id}
            value={value}
            onChange={(e) => set(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="h-12 rounded-xl bg-card border-border flex-1"
          />
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-xl px-3"
            disabled={!valid}
            onClick={() => window.open(v, "_blank", "noopener")}
            aria-label={`Test ${label}`}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Test</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-tint border border-border">
          <Star className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">App Store</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-6">
            Links users are sent to when they tap Rate Us in My Account.
          </p>
        </div>
      </div>

      <section className="bg-card text-card-foreground border border-border rounded-xl shadow-sm">
        <div className="px-5 py-4 rounded-t-xl bg-primary-tint border-b border-border">
          <h2 className="font-heading text-lg font-bold text-foreground">Rate Us Links</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Leave a link blank to show "coming soon" for that store.
          </p>
        </div>
        <div className="p-5 space-y-5">
          {field("apple-link", Apple, "Apple App Store (iOS)", apple, setApple, "https://apps.apple.com/...")}
          {field("android-link", Smartphone, "Google Play (Android)", android, setAndroid, "https://play.google.com/store/apps/details?id=...")}
        </div>
        <div className="border-t border-border px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Links must start with https://</p>
          <Button onClick={save} disabled={saving || isLoading}>{saving ? "Saving..." : "Save Links"}</Button>
        </div>
      </section>
    </div>
  );
};

export default AdminAppStore;
