import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon, Crop } from "lucide-react";
import { toast } from "sonner";
import ImageCropDialog from "./ImageCropDialog";

interface ImageUploadProps {
  bucket: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: number;
}

const ImageUpload = ({ bucket, value, onChange, aspect }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    toast.success("Image uploaded");
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

  return (
    <div className="space-y-2">
      {value && (
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
      )}
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
