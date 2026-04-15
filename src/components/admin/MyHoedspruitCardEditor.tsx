import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, X, Sun, Moon } from "lucide-react";
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
  text_color?: "dark" | "white";
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

  const updateCard = (cardKey: string, updates: Partial<CardConfig>) => {
    const current = cardsConfig[cardKey] || {};
    const newConfig = {
      ...cardsConfig,
      [cardKey]: { ...current, ...updates },
    };
    saveMutation.mutate(newConfig);
  };

  const removeImage = (cardKey: string) => {
    const current = cardsConfig[cardKey] || {};
    const { image_url, ...rest } = current;
    const newConfig = { ...cardsConfig, [cardKey]: rest };
    saveMutation.mutate(newConfig);
  };

  return (
    <div className="space-y-4">
      {CARD_KEYS.map(({ key, label }) => (
        <CardRow
          key={key}
          cardKey={key}
          label={label}
          config={cardsConfig[key] || {}}
          onUpdateCard={updateCard}
          onRemoveImage={removeImage}
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
  onUpdateCard,
  onRemoveImage,
  isSaving,
}: {
  cardKey: string;
  label: string;
  config: CardConfig;
  onUpdateCard: (key: string, updates: Partial<CardConfig>) => void;
  onRemoveImage: (key: string) => void;
  isSaving: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const textColor = config.text_color || "dark";
  const hasImage = !!config.image_url;

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

      onUpdateCard(cardKey, { image_url: urlData.publicUrl });
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
    onUpdateCard(cardKey, { image_url: urlInput.trim() });
    setUrlInput("");
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{label}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Text:</span>
          <Button
            size="sm"
            variant={textColor === "dark" ? "default" : "outline"}
            className="h-7 px-2 text-xs gap-1"
            onClick={() => onUpdateCard(cardKey, { text_color: "dark" })}
            disabled={isSaving}
          >
            <Moon className="h-3 w-3" /> Dark
          </Button>
          <Button
            size="sm"
            variant={textColor === "white" ? "default" : "outline"}
            className="h-7 px-2 text-xs gap-1"
            onClick={() => onUpdateCard(cardKey, { text_color: "white" })}
            disabled={isSaving}
          >
            <Sun className="h-3 w-3" /> White
          </Button>
        </div>
      </div>

      {hasImage && (
        <div className="flex items-center gap-3">
          <img
            src={config.image_url}
            alt=""
            className="w-20 h-14 object-cover rounded"
          />
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-destructive"
            onClick={() => onRemoveImage(cardKey)}
            disabled={isSaving}
          >
            <X className="h-3 w-3 mr-1" /> Remove
          </Button>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || isSaving}
        >
          <Upload className="h-3 w-3" />
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        <span className="text-xs text-muted-foreground">or</span>
        <Input
          placeholder="Paste image URL…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="h-8 text-xs flex-1"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={handleUrlSave}
          disabled={!urlInput.trim() || isSaving}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default MyHoedspruitCardEditor;
