import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  bucket: string;
  value: string;
  onChange: (url: string) => void;
}

const ImageUpload = ({ bucket, value, onChange }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file);
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

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative w-full h-40 rounded-none overflow-hidden border border-border">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Image URL or upload"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
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
    </div>
  );
};

export default ImageUpload;
