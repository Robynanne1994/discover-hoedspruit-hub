import { useState, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon, Crop } from "lucide-react";
import { toast } from "sonner";
import ImageCropDialog from "./ImageCropDialog";
import CropGuides from "./CropGuides";
import { DEFAULT_PREVIEW_WIDTH } from "@/lib/appLayout";
import type { SlotGuides } from "@/lib/imageSlots";
import type { SlotGuide } from "@/lib/imageSlotGuides";

interface ImageUploadProps {
  bucket: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: number;
  /** Hold the crop to `aspect` by default — see ImageCropDialog. */
  lockAspect?: boolean;
  /** Label for the locked ratio, e.g. "4:3". */
  aspectLabel?: string;
  /** Heading for the crop dialog — name the slot when a form has several. */
  cropTitle?: string;
  /**
   * Frame the image in the chrome it will appear in, in place of the plain
   * thumbnail. The same function frames the live crop inside the crop dialog,
   * so what you position and what you see afterwards are one picture.
   */
  previewRender?: (renderImage: (width: number, height: number) => ReactNode) => ReactNode;
  /**
   * Chrome the app paints over this picture. Drawn inside the crop frame while
   * positioning, and over the saved thumbnail afterwards so an image uploaded
   * before the guides existed can still be checked at a glance.
   */
  guides?: SlotGuides;
  /**
   * The slot's life-size box at a device width — the scale `guides` are
   * measured in. Both take the width because the app's chrome is a fixed pixel
   * size: the share of the picture it covers, and where a detail hero's
   * floating buttons land under the status bar, depend on how wide the card is.
   */
  guideBox?: (viewport: number) => { width: number; height: number };
}

const ImageUpload = ({
  bucket,
  value,
  onChange,
  aspect,
  lockAspect,
  aspectLabel,
  cropTitle,
  previewRender,
  guides,
  guideBox,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  // Which device the guides are drawn for. Held here rather than in the dialog
  // so the saved thumbnail and the crop frame always show the same card.
  const [previewWidth, setPreviewWidth] = useState(DEFAULT_PREVIEW_WIDTH);
  const fileRef = useRef<HTMLInputElement>(null);

  // A box means the thumbnail can be drawn at the slot's own ratio; guides are
  // the chrome laid over it, and not every slot has any.
  const box = guideBox?.(previewWidth);
  const slotGuides: SlotGuide[] = guides?.(previewWidth) ?? [];
  const hasBox = !!box;
  const hasGuides = slotGuides.length > 0 && !!box;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadBlob = async (blob: Blob) => {
    setUploading(true);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: "image/jpeg",
    });
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  };

  const handleEditExisting = async () => {
    if (!value) return;
    try {
      const res = await fetch(value, { mode: "cors" });
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => setCropSrc(reader.result as string);
      reader.readAsDataURL(blob);
    } catch {
      toast.error("Couldn't load image for cropping");
    }
  };

  // `cover` is what every card in the app uses, so a saved image that is not
  // on the slot's ratio is trimmed here the same way it will be on the phone.
  const renderStoredImage = (width: number, height: number) => (
    <img
      src={value}
      alt="Preview"
      style={{ width, height, objectFit: "cover", display: "block" }}
    />
  );

  return (
    <div className="space-y-2">
      {value &&
        // With a preview the controls go underneath: floated over the corner
        // they land on top of the very chrome the preview is there to show.
        (previewRender ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-border bg-muted/40 p-3 flex justify-center">
              {previewRender(renderStoredImage)}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleEditExisting}>
                <Crop className="h-3.5 w-3.5" /> Crop / reposition
              </Button>
              <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => onChange("")}>
                <X className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </div>
        ) : hasBox ? (
          // The thumbnail is drawn at the slot's own ratio rather than a generic
          // 160px strip: this is the picture the phone will show, and the guides
          // only sit in the right place if the box they are measured against is
          // the one on screen.
          <div className="space-y-2">
            <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-3">
              <div
                className="relative overflow-hidden rounded"
                style={{
                  // Life-size: the card is this many CSS px wide in the app, so
                  // the thumbnail is the picture at the size it will be seen at
                  // rather than a blown-up version of it.
                  width: box!.width,
                  maxWidth: "100%",
                  aspectRatio: `${box!.width} / ${box!.height}`,
                }}
              >
                <img src={value} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
                {hasGuides && <CropGuides box={box!} guides={slotGuides} />}
              </div>
              <p className="text-[11px] tabular-nums text-muted-foreground">
                Life-size — {Math.round(box!.width)} × {Math.round(box!.height)}px on a {previewWidth}px screen
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleEditExisting}>
                <Crop className="h-3.5 w-3.5" /> Crop / reposition
              </Button>
              <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => onChange("")}>
                <X className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-40 rounded-none overflow-hidden border border-border">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-7 w-7"
                onClick={handleEditExisting}
                title="Crop / reposition"
              >
                <Crop className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-7 w-7"
                onClick={() => onChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      <div className="flex gap-2">
        <Input
          placeholder="Image URL or upload"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <ImageIcon className="h-4 w-4 animate-pulse" /> : <Upload className="h-4 w-4" />}
        </Button>
      </div>

      <ImageCropDialog
        open={!!cropSrc}
        imageSrc={cropSrc}
        defaultAspect={aspect}
        lockAspect={lockAspect}
        aspectLabel={aspectLabel}
        title={cropTitle}
        previewRender={previewRender}
        guides={slotGuides}
        guideBox={box}
        previewWidth={previewWidth}
        onPreviewWidthChange={setPreviewWidth}
        onCancel={() => setCropSrc(null)}
        onConfirm={async (blob) => {
          setCropSrc(null);
          await uploadBlob(blob);
        }}
      />
    </div>
  );
};

export default ImageUpload;
