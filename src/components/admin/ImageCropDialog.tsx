import { useState, useCallback, useEffect, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Pipette } from "lucide-react";
import { toast } from "sonner";

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  defaultAspect?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

const ASPECTS: { label: string; value: number | "free" }[] = [
  { label: "Free", value: "free" },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
];

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}

async function getCroppedBlob(imageSrc: string, area: Area, bgColor: string): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d")!;
  // Fill background first so any area outside the source image shows the chosen colour
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Clamp source rect to image bounds and compute matching destination rect
  const sx = Math.max(0, area.x);
  const sy = Math.max(0, area.y);
  const sxEnd = Math.min(img.width, area.x + area.width);
  const syEnd = Math.min(img.height, area.y + area.height);
  const sw = Math.max(0, sxEnd - sx);
  const sh = Math.max(0, syEnd - sy);

  if (sw > 0 && sh > 0) {
    const dx = ((sx - area.x) / area.width) * canvas.width;
    const dy = ((sy - area.y) / area.height) * canvas.height;
    const dw = (sw / area.width) * canvas.width;
    const dh = (sh / area.height) * canvas.height;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92));
}

function rgbToHex(r: number, g: number, b: number) {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

const ImageCropDialog = ({ open, imageSrc, defaultAspect, onCancel, onConfirm }: ImageCropDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | "free">(defaultAspect ?? "free");
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [picking, setPicking] = useState(false);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sampleImgRef = useRef<HTMLImageElement | null>(null);
  const cropperWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspect(defaultAspect ?? "free");
      setBgColor("#ffffff");
      setPicking(false);
    }
  }, [open, defaultAspect]);

  // Preload an image into an offscreen canvas for eyedropper sampling
  useEffect(() => {
    if (!imageSrc) return;
    loadImage(imageSrc)
      .then((img) => {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d")!.drawImage(img, 0, 0);
        sampleCanvasRef.current = c;
        sampleImgRef.current = img;
      })
      .catch(() => {});
  }, [imageSrc]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedArea) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea, bgColor);
      onConfirm(blob);
    } finally {
      setBusy(false);
    }
  };

  const openNativeEyedropper = async () => {
    // @ts-ignore - EyeDropper is a newer browser API
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        // @ts-ignore
        const ed = new window.EyeDropper();
        const res = await ed.open();
        if (res?.sRGBHex) setBgColor(res.sRGBHex);
      } catch {
        // user cancelled
      }
    } else {
      // Fallback: enable in-cropper picking
      setPicking(true);
      toast("Click anywhere on the image to pick a colour");
    }
  };

  const handlePickClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!picking) return;
    const wrap = cropperWrapRef.current;
    const c = sampleCanvasRef.current;
    const img = sampleImgRef.current;
    if (!wrap || !c || !img || !croppedArea) {
      setPicking(false);
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1 inside crop frame
    const py = (e.clientY - rect.top) / rect.height;
    // Map crop-frame coords -> source image coords using croppedArea
    const ix = Math.round(croppedArea.x + px * croppedArea.width);
    const iy = Math.round(croppedArea.y + py * croppedArea.height);
    if (ix < 0 || iy < 0 || ix >= img.width || iy >= img.height) {
      toast.error("Pick a point inside the image");
      return;
    }
    try {
      const data = c.getContext("2d")!.getImageData(ix, iy, 1, 1).data;
      setBgColor(rgbToHex(data[0], data[1], data[2]));
      setPicking(false);
    } catch {
      toast.error("Couldn't sample colour (CORS)");
      setPicking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop & position image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            ref={cropperWrapRef}
            className="relative w-full h-[400px]"
            style={{ background: bgColor, cursor: picking ? "crosshair" : "default" }}
            onClick={handlePickClick}
          >
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect === "free" ? undefined : aspect}
                minZoom={0.2}
                maxZoom={4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={false}
                style={{ containerStyle: { background: bgColor } }}
              />
            )}
            {picking && (
              <div className="pointer-events-none absolute inset-0 ring-2 ring-primary/60" />
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ASPECTS.map((a) => (
              <Button
                key={a.label}
                type="button"
                size="sm"
                variant={aspect === a.value ? "default" : "outline"}
                onClick={() => setAspect(a.value)}
              >
                {a.label}
              </Button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Background fill</Label>
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded border border-border shrink-0"
                style={{ background: bgColor }}
                aria-label="Current background colour"
              />
              <Input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                placeholder="#ffffff"
                className="w-32"
              />
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(bgColor) ? bgColor : "#ffffff"}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                title="Pick any colour"
              />
              <Button
                type="button"
                size="sm"
                variant={picking ? "default" : "outline"}
                onClick={openNativeEyedropper}
                title="Pick a colour from the image"
              >
                <Pipette className="h-4 w-4 mr-1" />
                {picking ? "Click image…" : "Eyedropper"}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Zoom</Label>
            <Slider value={[zoom]} min={0.2} max={4} step={0.01} onValueChange={(v) => setZoom(v[0])} />
          </div>
          <p className="text-xs text-muted-foreground">
            Drag to reposition. Zoom out below 100% to add space around the image — the background fill colour will be baked into the export.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={busy || !croppedArea}>
            {busy ? "Processing..." : "Apply crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
