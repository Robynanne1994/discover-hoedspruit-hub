import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface GalleryUploadProps {
  value: string; // newline-separated URLs
  onChange: (value: string) => void;
}

const GalleryUpload = ({ value, onChange }: GalleryUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const urls = value ? value.split("\n").filter(Boolean) : [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("listing-images").upload(path, file);
      if (error) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    if (newUrls.length > 0) {
      const updated = [...urls, ...newUrls].join("\n");
      onChange(updated);
      toast.success(`${newUrls.length} image(s) uploaded`);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
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
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removeUrl(i)}
              >
                <X className="h-3 w-3" />
              </Button>
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
          onChange={handleUpload}
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
    </div>
  );
};

export default GalleryUpload;
