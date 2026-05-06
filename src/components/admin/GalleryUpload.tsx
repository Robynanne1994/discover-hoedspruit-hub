import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Image as ImageIcon, Crop } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import ImageCropDialog from "./ImageCropDialog";

interface GalleryUploadProps {
  value: string; // newline-separated URLs
  onChange: (value: string) => void;
}

const GalleryUpload = ({ value, onChange }: GalleryUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const urls = value ? value.split("\n").filter(Boolean) : [];

  const readAsDataUrl = (file: Blob) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const dataUrls = await Promise.all(Array.from(files).map((f) => readAsDataUrl(f)));
    setQueue(dataUrls);
    setCropSrc(dataUrls[0]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadBlob = async (blob: Blob): Promise<string | null> => {
    const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await supabase.storage
      .from("listing-images")
      .upload(path, blob, { contentType: "image/jpeg" });
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleConfirm = async (blob: Blob) => {
    setUploading(true);
    const newUrl = await uploadBlob(blob);

    if (editingIndex !== null && newUrl) {
      const updated = [...urls];
      updated[editingIndex] = newUrl;
      onChange(updated.join("\n"));
      setEditingIndex(null);
      setCropSrc(null);
      setUploading(false);
      toast.success("Image updated");
      return;
    }

    const remaining = queue.slice(1);
    const currentList = newUrl ? [...urls, newUrl] : urls;
    if (newUrl) onChange(currentList.join("\n"));

    if (remaining.length > 0) {
      setQueue(remaining);
      setCropSrc(remaining[0]);
    } else {
      setQueue([]);
      setCropSrc(null);
      toast.success("Images uploaded");
    }
    setUploading(false);
  };

  const handleCancel = () => {
    const remaining = queue.slice(1);
    if (editingIndex !== null) {
      setEditingIndex(null);
      setCropSrc(null);
      return;
    }
    if (remaining.length > 0) {
      setQueue(remaining);
      setCropSrc(remaining[0]);
    } else {
      setQueue([]);
      setCropSrc(null);
    }
  };

  const editExisting = async (i: number) => {
    try {
      const res = await fetch(urls[i], { mode: "cors" });
      const blob = await res.blob();
      const dataUrl = await readAsDataUrl(blob);
      setEditingIndex(i);
      setCropSrc(dataUrl);
    } catch {
      toast.error("Couldn't load image for cropping");
    }
  };

  const removeUrl = (index: number) => {
    const updated = urls.filter((_, i) => i !== index).join("\n");
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label>Gallery Images</Label>

      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {urls.map((url, i) => (
            <div key={i} className="relative aspect-[4/3] rounded overflow-hidden border border-border">
              <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute top-1 right-1 flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => editExisting(i)}
                  title="Crop"
                >
                  <Crop className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeUrl(i)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={"Paste image URLs (one per line) or upload below"}
        className="text-xs"
      />

      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="gap-1.5"
        >
          {uploading ? (
            <><ImageIcon className="h-3.5 w-3.5 animate-pulse" /> Uploading...</>
          ) : (
            <><Upload className="h-3.5 w-3.5" /> Upload Images</>
          )}
        </Button>
      </div>

      <ImageCropDialog
        open={!!cropSrc}
        imageSrc={cropSrc}
        defaultAspect={4 / 3}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default GalleryUpload;
