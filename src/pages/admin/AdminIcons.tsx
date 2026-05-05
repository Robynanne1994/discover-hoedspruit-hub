import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ICON_SLOTS, ICON_SLOT_GROUPS } from "@/lib/iconSlots";

const AdminIcons = () => {
  const qc = useQueryClient();
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: overrides } = useQuery({
    queryKey: ["icon-overrides", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("icon_overrides")
        .select("slot, image_url");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => (map[r.slot] = r.image_url));
      return map;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["icon-overrides"] });
    qc.invalidateQueries({ queryKey: ["icon-overrides", "admin"] });
  };

  const handleUpload = async (slot: string, file: File) => {
    setUploadingSlot(slot);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${slot.replace(/\./g, "-")}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("app-icons")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("app-icons").getPublicUrl(path);
      const url = pub.publicUrl;

      const { error: dbErr } = await supabase
        .from("icon_overrides")
        .upsert({ slot, image_url: url }, { onConflict: "slot" });
      if (dbErr) throw dbErr;

      toast.success("Icon uploaded");
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleRemove = async (slot: string) => {
    const { error } = await supabase.from("icon_overrides").delete().eq("slot", slot);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reset to default");
    refresh();
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Custom Icons</h1>
        <p className="text-sm text-muted-foreground">
          Upload your own PNG or SVG (transparent background recommended) for
          any icon slot. If no custom icon is uploaded, the default app icon is
          used. Click reset to restore the default.
        </p>
      </div>

      {ICON_SLOT_GROUPS.map((group) => (
        <div key={group} className="space-y-3">
          <h2 className="text-lg font-semibold">{group}</h2>
          <div className="border border-border rounded-lg divide-y divide-border bg-card">
            {ICON_SLOTS.filter((s) => s.group === group).map((slot) => {
              const url = overrides?.[slot.key];
              const isUp = uploadingSlot === slot.key;
              return (
                <div key={slot.key} className="flex items-center gap-4 p-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-muted rounded">
                    {url ? (
                      <img
                        src={url}
                        alt={slot.label}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{slot.label}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {slot.key}
                    </div>
                  </div>
                  <input
                    ref={(el) => (fileRefs.current[slot.key] = el)}
                    type="file"
                    accept="image/png,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(slot.key, f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUp}
                    onClick={() => fileRefs.current[slot.key]?.click()}
                  >
                    {isUp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {url ? "Replace" : "Upload"}
                  </Button>
                  {url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(slot.key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminIcons;
