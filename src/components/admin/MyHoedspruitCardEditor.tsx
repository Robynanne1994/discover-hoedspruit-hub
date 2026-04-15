import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, X, Save } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

const CARD_KEYS = [
  { key: "saved-listings", label: "Saved Listings" },
  { key: "my-events", label: "My Events" },
  { key: "saved-specials", label: "Saved Specials" },
  { key: "visited-places", label: "Visited Places" },
  { key: "coming-soon", label: "Coming Soon" },
];

interface CardConfig {
  image_url?: string;
  text_color?: string;
  icon_color?: string;
  count_color?: string;
  bg_color?: string;
  text_transform?: "none" | "uppercase" | "capitalize";
  text_size?: number;
}

type CardsConfig = Record<string, CardConfig>;

const SECTION_KEY = "my-hoedspruit-cards";

const MyHoedspruitCardEditor = () => {
  const queryClient = useQueryClient();

  const { data: cardsConfig = {} as CardsConfig } = useQuery({
    queryKey: ["site-content", SECTION_KEY],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", SECTION_KEY)
        .maybeSingle();
      if (data?.content && typeof data.content === "object" && !Array.isArray(data.content)) {
        return data.content as CardsConfig;
      }
      return {} as CardsConfig;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newConfig: CardsConfig) => {
      const { data: existing } = await supabase
        .from("site_content")
        .select("id")
        .eq("section", SECTION_KEY)
        .maybeSingle();

      const contentValue = JSON.parse(JSON.stringify(newConfig)) as Json;

      if (existing) {
        await supabase
          .from("site_content")
          .update({ content: contentValue })
          .eq("section", SECTION_KEY);
      } else {
        await supabase
          .from("site_content")
          .insert([{ section: SECTION_KEY, content: contentValue }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content", SECTION_KEY] });
      toast.success("Card settings updated");
    },
  });

  return (
    <div className="space-y-4">
      {CARD_KEYS.map(({ key, label }) => (
        <CardRow
          key={key}
          cardKey={key}
          label={label}
          config={cardsConfig[key] || {}}
          allConfig={cardsConfig}
          onSave={(updated) => saveMutation.mutate(updated)}
          isSaving={saveMutation.isPending}
        />
      ))}
    </div>
  );
};

const CardRow = ({
  cardKey,
  label,
  config,
  allConfig,
  onSave,
  isSaving,
}: {
  cardKey: string;
  label: string;
  config: CardConfig;
  allConfig: CardsConfig;
  onSave: (config: CardsConfig) => void;
  isSaving: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  // Local draft state
  const [draft, setDraft] = useState<CardConfig>(config);

  // Sync draft when config changes from server
  useEffect(() => {
    setDraft(config);
  }, [JSON.stringify(config)]);

  const hasImage = !!draft.image_url;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(config);

  const updateDraft = (updates: Partial<CardConfig>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const saveCard = () => {
    onSave({ ...allConfig, [cardKey]: draft });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `my-hoedspruit/${cardKey}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(fileName);

      const newDraft = { ...draft, image_url: urlData.publicUrl };
      setDraft(newDraft);
      onSave({ ...allConfig, [cardKey]: newDraft });
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlSave = () => {
    if (!urlInput.trim()) return;
    const newDraft = { ...draft, image_url: urlInput.trim() };
    setDraft(newDraft);
    onSave({ ...allConfig, [cardKey]: newDraft });
    setUrlInput("");
  };

  const removeImage = () => {
    const { image_url, ...rest } = draft;
    const newDraft = rest;
    setDraft(newDraft);
    onSave({ ...allConfig, [cardKey]: newDraft });
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{label}</h4>
        {isDirty && (
          <Button
            size="sm"
            className="h-7 px-3 text-xs gap-1"
            onClick={saveCard}
            disabled={isSaving}
          >
            <Save className="h-3 w-3" /> Save
          </Button>
        )}
      </div>

      {/* Image section */}
      {hasImage && (
        <div className="flex items-center gap-3">
          <img src={draft.image_url} alt="" className="w-20 h-14 object-cover rounded" />
          <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={removeImage} disabled={isSaving}>
            <X className="h-3 w-3 mr-1" /> Remove
          </Button>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()} disabled={uploading || isSaving}>
          <Upload className="h-3 w-3" />
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        <span className="text-xs text-muted-foreground">or</span>
        <Input placeholder="Paste image URL…" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="h-8 text-xs flex-1" />
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleUrlSave} disabled={!urlInput.trim() || isSaving}>
          Set URL
        </Button>
      </div>

      {/* Color & typography controls */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Text color:</span>
          <Input
            placeholder="#2b2420"
            value={draft.text_color || ""}
            onChange={(e) => updateDraft({ text_color: e.target.value || undefined })}
            className="h-7 text-xs w-24"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Card BG:</span>
          <Input
            placeholder="#ffffff"
            value={draft.bg_color || ""}
            onChange={(e) => updateDraft({ bg_color: e.target.value || undefined })}
            className="h-7 text-xs w-24"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Icon color:</span>
          <Input
            placeholder="#hex"
            value={draft.icon_color || ""}
            onChange={(e) => updateDraft({ icon_color: e.target.value || undefined })}
            className="h-7 text-xs w-24"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Count color:</span>
          <Input
            placeholder="#hex"
            value={draft.count_color || ""}
            onChange={(e) => updateDraft({ count_color: e.target.value || undefined })}
            className="h-7 text-xs w-24"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Text size:</span>
          <Input
            placeholder="26"
            type="number"
            value={draft.text_size || ""}
            onChange={(e) => updateDraft({ text_size: e.target.value ? Number(e.target.value) : undefined })}
            className="h-7 text-xs w-20"
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Transform:</span>
          <select
            value={draft.text_transform || "none"}
            onChange={(e) => updateDraft({ text_transform: e.target.value as CardConfig["text_transform"] })}
            className="h-7 text-xs rounded border border-input bg-background px-2"
          >
            <option value="none">None</option>
            <option value="uppercase">UPPERCASE</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </div>
      </div>

      {isDirty && (
        <div className="pt-1">
          <Button size="sm" className="h-7 px-3 text-xs gap-1" onClick={saveCard} disabled={isSaving}>
            <Save className="h-3 w-3" /> Save Card
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyHoedspruitCardEditor;
