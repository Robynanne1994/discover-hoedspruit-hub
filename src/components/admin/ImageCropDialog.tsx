import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Pipette, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import CropPreviewImage from "./CropPreviewImage";
import CropGuides from "./CropGuides";
import { exportSize } from "@/lib/cropPreview";
import type { SlotGuide } from "@/lib/imageSlotGuides";

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  defaultAspect?: number;
  /**
   * Start with the ratio held at `defaultAspect` and the free-ratio buttons
   * out of the way. The lock can still be released in the dialog.
   */
  lockAspect?: boolean;
  /** Label for the locked ratio, e.g. "4:3". */
  aspectLabel?: string;
  /** Dialog heading — name the slot being cropped when there is more than one. */
  title?: string;
  /**
   * Frame the live crop in whatever chrome it will land in. The callback is
   * handed a painter that draws the current crop at an exact box size, so the
   * preview updates as the image is dragged rather than after it is saved.
   */
  previewRender?: (renderImage: (width: number, height: number) => ReactNode) => ReactNode;
  /**
   * Chrome the live screen paints over this image — the white title card, the
   * heart, the rating chip, the round search mask. Drawn inside the crop frame
   * so nothing important is parked underneath it. `guideBox` is the slot's
   * life-size box, which is the scale the guides are measured in.
   */
  guides?: SlotGuide[];
  guideBox?: { width: number; height: number };
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

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}

async function getCroppedBlob(
  imageSrc: string,
  area: Area,
  bgColor: string,
  outputAspect?: number,
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  // Snapping to the target ratio keeps `object-fit: cover` from shaving a
  // hairline off one edge — see exportSize.
  const size = exportSize(area, outputAspect);
  canvas.width = size.width;
  canvas.height = size.height;
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


const ImageCropDialog = ({
  open,
  imageSrc,
  defaultAspect,
  lockAspect,
  aspectLabel,
  title,
  previewRender,
  guides,
  guideBox,

  onCancel,
  onConfirm,
}: ImageCropDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | "free">(defaultAspect ?? "free");
  const [locked, setLocked] = useState(!!lockAspect && !!defaultAspect);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [picking, setPicking] = useState(false);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [sourceSettled, setSourceSettled] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  // The photo as react-easy-crop lays it out (contained in the container) and
  // the crop frame it derived from the ratio — the two sizes the cover zoom is
  // worked out from.
  const [mediaSize, setMediaSize] = useState<{ width: number; height: number } | null>(null);
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | null>(null);
  const fittedRef = useRef(false);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sampleImgRef = useRef<HTMLImageElement | null>(null);
  const cropperWrapRef = useRef<HTMLDivElement | null>(null);
  // Where the crop frame currently sits inside the wrapper, so the guide can be
  // laid over exactly the part of the crop the app's chrome will cover.
  const [frameBox, setFrameBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const hasGuides = !!(guides?.length && guideBox);

  useEffect(() => {
    if (!open || !hasGuides) return;
    const wrap = cropperWrapRef.current;
    if (!wrap) return;
    const frame = wrap.querySelector(".reactEasyCrop_CropArea") as HTMLElement | null;
    if (!frame) return;
    const w = wrap.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    // The frame carries a 1px border; only its content box maps to the pixels
    // that get exported, so the guide is measured off that.
    setFrameBox({
      left: f.left - w.left + frame.clientLeft,
      top: f.top - w.top + frame.clientTop,
      width: frame.clientWidth,
      height: frame.clientHeight,
    });
  }, [open, hasGuides, croppedArea, zoom, aspect, resetKey, sourceSettled]);




  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspect(defaultAspect ?? "free");
      setLocked(!!lockAspect && !!defaultAspect);
      setCroppedArea(null);
      setBgColor("#ffffff");
      setPicking(false);
      setMediaSize(null);
      setCropSize(null);
      fittedRef.current = false;
    }
  }, [open, defaultAspect, lockAspect]);

  // Preload the source: the offscreen canvas backs eyedropper sampling, and
  // the natural size is what the opening crop is worked out from. The cropper
  // waits for this, because `initialCroppedAreaPixels` is only read once, when
  // the media first loads.
  useEffect(() => {
    setNatural(null);
    setSourceSettled(false);
    sampleCanvasRef.current = null;
    sampleImgRef.current = null;
    if (!imageSrc) return;
    let cancelled = false;
    loadImage(imageSrc)
      .then((img) => {
        if (cancelled) return;
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d")!.drawImage(img, 0, 0);
        sampleCanvasRef.current = c;
        sampleImgRef.current = img;
        setNatural({ width: img.naturalWidth, height: img.naturalHeight });
        setSourceSettled(true);
      })
      .catch(() => {
        // Still show the cropper — it loads the image itself; only the opening
        // crop and the eyedropper need our own copy.
        if (!cancelled) setSourceSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  // `onCropAreaChange` fires on every frame of a drag, so the preview keeps up
  // with the image instead of snapping into place when the pointer is released.
  const onCropAreaChange = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const activeAspect = aspect === "free" ? undefined : aspect;

  /**
   * The zoom at which the photo exactly covers the crop frame — the same
   * picture `object-fit: cover` would show. react-easy-crop measures zoom
   * against the *contained* image, so for any crop whose ratio differs from
   * the photo's this is above 1; letting the user go below it is what left
   * background bands baked into the export, and passing an opening crop area
   * instead of a zoom is what made square slots jump on open.
   */
  const coverZoom =
    mediaSize && cropSize && mediaSize.width > 0 && mediaSize.height > 0
      ? Math.max(cropSize.width / mediaSize.width, cropSize.height / mediaSize.height)
      : null;

  // Zoom-out is always allowed so the background colour can be used as filler.
  const effectiveMinZoom = MIN_ZOOM;

  // Open on the cover crop, but never force the user back up to it.
  useEffect(() => {
    if (!locked || !coverZoom) return;
    if (!fittedRef.current) {
      fittedRef.current = true;
      setZoom(coverZoom);
      setCrop({ x: 0, y: 0 });
    }
  }, [locked, coverZoom]);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedArea) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea, bgColor, activeAspect);
      onConfirm(blob);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    fittedRef.current = false;
    setZoom(1);
    if (lockAspect && defaultAspect) {
      setLocked(true);
      setAspect(defaultAspect);
    }
    setResetKey((k) => k + 1);
  };

  const nudgeZoom = (delta: number) =>
    setZoom((z) =>
      Math.min(MAX_ZOOM, Math.max(effectiveMinZoom, Math.round((z + delta) * 100) / 100)),
    );

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
    // Map through the crop frame, not the whole container: the frame is the
    // only rectangle whose corners we know in source-image pixels
    // (`croppedArea`). Clicks outside it still map correctly, because the same
    // linear relation carries on past the frame's edges.
    const frame = wrap.querySelector(".reactEasyCrop_CropArea");
    const rect = (frame ?? wrap).getBoundingClientRect();
    if (!rect.width || !rect.height) {
      setPicking(false);
      return;
    }
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
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

  const renderLiveImage = useCallback(
    (width: number, height: number) => (
      <CropPreviewImage
        src={imageSrc}
        area={croppedArea}
        bgColor={bgColor}
        width={width}
        height={height}
      />
    ),
    [imageSrc, croppedArea, bgColor],
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title || "Crop & position image"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            ref={cropperWrapRef}
            className="relative w-full h-[340px]"
            style={{ background: bgColor, cursor: picking ? "crosshair" : "default" }}
            onClick={handlePickClick}
          >
            {imageSrc && sourceSettled && (
              <Cropper
                key={resetKey}
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={activeAspect}
                // While the ratio is locked the crop is held inside the source
                // image: zooming out past fit or dragging past an edge would
                // bake the background fill into the export, which shows up as
                // white bands beside the picture on the phone.
                minZoom={effectiveMinZoom}
                maxZoom={MAX_ZOOM}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropAreaChange={onCropAreaChange}
                onMediaLoaded={(m) => setMediaSize({ width: m.width, height: m.height })}
                onCropSizeChange={(s) => setCropSize({ width: s.width, height: s.height })}
                restrictPosition={locked ? true : false}
                style={{ containerStyle: { background: bgColor } }}
              />
            )}
            {hasGuides && frameBox && (
              <div
                className="pointer-events-none absolute"
                style={{
                  left: frameBox.left,
                  top: frameBox.top,
                  width: frameBox.width,
                  height: frameBox.height,
                }}
              >
                <CropGuides box={guideBox!} guides={guides!} />
              </div>
            )}
            {picking && <div className="pointer-events-none absolute inset-0 ring-2 ring-primary/60" />}

          </div>

          {hasGuides && (
            <ul className="space-y-1 rounded-lg border border-border bg-muted/40 p-3">
              <li className="text-xs font-medium text-foreground">
                The app paints these over the picture — position it so nothing important lands underneath.
              </li>
              {guides!.map((g) => (
                <li key={g.key} className="flex gap-2 text-[11px] text-muted-foreground">
                  <span aria-hidden className="text-[#B42318]">
                    ▸
                  </span>
                  {g.legend}
                </li>
              ))}
            </ul>
          )}

          {previewRender && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">In the app</Label>
                <span className="text-[11px] text-muted-foreground">
                  Live — this is exactly what saving will produce.
                </span>
              </div>
              <div className="flex justify-center">{previewRender(renderLiveImage)}</div>
            </div>
          )}

          {defaultAspect && lockAspect ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <Label className="text-sm">Lock to the app's shape{aspectLabel ? ` (${aspectLabel})` : ""}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Keeps the crop the same shape as the space the app paints it into, so nothing gets
                  trimmed off after saving.
                </p>
              </div>
              <Switch
                checked={locked}
                onCheckedChange={(c) => {
                  setLocked(c);
                  setAspect(c ? defaultAspect : "free");
                  // Locking pulls the crop back inside the image, so any
                  // zoomed-out padding has to go with it.
                  if (c) setZoom((z) => Math.max(1, z));
                }}
              />
            </div>
          ) : null}

          {!locked && (
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
          )}

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
            <div className="flex items-center justify-between">
              <Label className="text-xs">Zoom</Label>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => nudgeZoom(-ZOOM_STEP)}
                disabled={zoom <= effectiveMinZoom}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                value={[zoom]}
                min={effectiveMinZoom}
                max={MAX_ZOOM}
                step={0.01}
                onValueChange={(v) => setZoom(v[0])}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => nudgeZoom(ZOOM_STEP)}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1"
                onClick={reset}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Drag to reposition. Zoom out below 100% to add space around the image — the background
            fill colour will be baked into the export.
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
