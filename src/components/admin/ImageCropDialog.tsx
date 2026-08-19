import { useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Pipette, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import CropPreviewImage from "./CropPreviewImage";
import CropGuides from "./CropGuides";
import { exportSize } from "@/lib/cropPreview";
import { PREVIEW_VIEWPORTS } from "@/lib/appLayout";
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
   * The app clips this picture to a circle — a search row, an avatar, a host
   * photo. The crop frame is drawn round to match, so what is inside the frame
   * is exactly what survives and everything dimmed around it is thrown away.
   */
  round?: boolean;
  /**
   * Frame the live crop in whatever chrome it will land in. The callback is
   * handed a painter that draws the current crop at an exact box size. Left
   * unset, the dialog draws its own life-size preview from `guideBox`.
   */
  previewRender?: (renderImage: (width: number, height: number) => ReactNode) => ReactNode;
  /**
   * Chrome the live screen paints over this image — the white title card, the
   * heart, the rating chip. Drawn inside the crop frame so nothing important is
   * parked underneath it. `guideBox` is the slot's life-size box, which is the
   * scale the guides are measured in.
   */
  guides?: SlotGuide[];
  guideBox?: { width: number; height: number };
  /**
   * The device width the guides are drawn for. The app's chrome is a fixed
   * pixel size, so how much of the picture it covers depends on how wide the
   * card is — see appLayout.ts.
   */
  previewWidth?: number;
  onPreviewWidthChange?: (width: number) => void;
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
/** Slider steps are 0.01, so anything inside this reads as "on the mark". */
const ZOOM_EPS = 0.006;

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
  round,
  previewRender,
  guides,
  guideBox,
  previewWidth,
  onPreviewWidthChange,
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

  /**
   * The round mask is drawn by the cropper itself when `round` is set — its own
   * frame *is* the circle, and it dims everything outside it. Drawing the guide
   * version on top of that put a second, differently-shaded circle over the
   * first, which is what made it impossible to tell kept from trimmed.
   */
  const overlayGuides = useMemo(
    () => (guides ?? []).filter((g) => g.shape.kind !== "circleMask"),
    [guides],
  );
  const hasGuides = !!(overlayGuides.length && guideBox);

  /**
   * Where the crop frame sits inside the wrapper, so the guides can be laid
   * over exactly the pixels that will be exported.
   *
   * react-easy-crop derives `croppedAreaPixels` straight from its `cropSize`,
   * and applies that size to `.reactEasyCrop_CropArea` — which is
   * `box-sizing: border-box` with a 1px border. So the exported rectangle is
   * the frame's **border box**, not its content box: measuring off
   * `clientWidth` shrank the guide by a pixel on each side and shifted it a
   * pixel down and right.
   *
   * Measuring is also driven by observers rather than by a render pass. The
   * frame is created by the cropper after this effect first runs, and it
   * resizes whenever the dialog does, neither of which shows up in a
   * dependency list.
   */
  useEffect(() => {
    if (!open || !hasGuides) return;
    const wrap = cropperWrapRef.current;
    if (!wrap) return;

    let frameObserved: Element | null = null;
    let raf = 0;
    // Enough frames to cover the cropper mounting; not a loop that spins on
    // forever if the image never loads.
    let tries = 120;

    const measure = () => {
      const frame = wrap.querySelector(".reactEasyCrop_CropArea") as HTMLElement | null;
      if (!frame) {
        setFrameBox(null);
        // The cropper mounts its frame a tick after the media loads.
        if (tries-- > 0) raf = requestAnimationFrame(measure);
        return;
      }
      if (frame !== frameObserved) {
        if (frameObserved) ro.unobserve(frameObserved);
        ro.observe(frame);
        frameObserved = frame;
      }
      const w = wrap.getBoundingClientRect();
      const f = frame.getBoundingClientRect();
      const next = { left: f.left - w.left, top: f.top - w.top, width: f.width, height: f.height };
      setFrameBox((prev) =>
        prev &&
        Math.abs(prev.left - next.left) < 0.5 &&
        Math.abs(prev.top - next.top) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.height - next.height) < 0.5
          ? prev
          : next,
      );
    };

    const ro =
      typeof ResizeObserver === "undefined" ? ({ observe() {}, unobserve() {}, disconnect() {} } as unknown as ResizeObserver) : new ResizeObserver(measure);
    ro.observe(wrap);
    measure();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [open, hasGuides, aspect, resetKey, sourceSettled]);




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

  // Preload the source: the offscreen canvas backs eyedropper sampling. The
  // cropper waits for this so the crop it opens on and the picture the
  // eyedropper samples are the same file.
  useEffect(() => {
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
   * the photo's this is above 1.
   */
  const coverZoom =
    mediaSize && cropSize && mediaSize.width > 0 && mediaSize.height > 0
      ? Math.max(cropSize.width / mediaSize.width, cropSize.height / mediaSize.height)
      : null;

  /** The zoom at which the *whole* photo sits inside the frame, nothing lost. */
  const containZoom =
    mediaSize && cropSize && mediaSize.width > 0 && mediaSize.height > 0
      ? Math.min(cropSize.width / mediaSize.width, cropSize.height / mediaSize.height)
      : null;

  // Zoom-out is always allowed so the background colour can be used as filler,
  // and never above the zoom that shows the whole photo — otherwise "show the
  // whole picture" would be off the bottom of the slider.
  const effectiveMinZoom = Math.min(MIN_ZOOM, containZoom ?? MIN_ZOOM);

  /** True while the picture covers the frame, so nothing but photo is exported. */
  const filling = coverZoom == null || zoom >= coverZoom - ZOOM_EPS;
  /** True once the whole photo is inside the frame, so nothing is trimmed off. */
  const whole = containZoom != null && zoom <= containZoom + ZOOM_EPS;

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

  const fillFrame = () => {
    setCrop({ x: 0, y: 0 });
    if (coverZoom) setZoom(coverZoom);
  };

  const showWhole = () => {
    setCrop({ x: 0, y: 0 });
    if (containZoom) setZoom(containZoom);
  };

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    if (lockAspect && defaultAspect) {
      setLocked(true);
      setAspect(defaultAspect);
    }
    // Back to the crop the dialog opened on — the picture filling its box —
    // rather than to a bare 100%, which for an off-ratio photo is a crop with
    // background bands baked down two of its sides.
    fittedRef.current = false;
    setZoom(coverZoom ?? 1);
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

  /**
   * The result, at the size the phone paints it — plus a blown-up copy for the
   * slots that are painted tiny. A 42px search thumbnail is too small to judge
   * a face or a logo in, and that is exactly the slot where a bad crop is
   * hardest to spot once it is live.
   */
  const previewScales = guideBox ? (guideBox.width < 130 ? [3, 1] : [1]) : [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title || "Crop & position image"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            ref={cropperWrapRef}
            className="relative w-full h-[360px] overflow-hidden rounded-lg"
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
                // The frame is drawn in the shape the app will clip to, so the
                // bright part of the picture is the part that survives and the
                // dimmed part is the part thrown away.
                cropShape={round ? "round" : "rect"}
                showGrid={!round}
                minZoom={effectiveMinZoom}
                maxZoom={MAX_ZOOM}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropAreaChange={onCropAreaChange}
                onMediaLoaded={(m) => setMediaSize({ width: m.width, height: m.height })}
                onCropSizeChange={(s) => setCropSize({ width: s.width, height: s.height })}
                // Dragging is always free, including at exactly the cover zoom,
                // so the picture can be repositioned; any background pulled in
                // is painted with the chosen fill colour.
                restrictPosition={false}
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
                <CropGuides box={guideBox!} guides={overlayGuides} />
              </div>
            )}
            {picking && <div className="pointer-events-none absolute inset-0 ring-2 ring-primary/60" />}

          </div>

          <p className="text-xs text-muted-foreground">
            {filling
              ? round
                ? "Everything inside the bright circle is kept — the dimmed edges are trimmed off. Drag to reposition."
                : "Everything inside the bright frame is kept — the dimmed edges are trimmed off. Drag to reposition."
              : whole
                ? "The whole picture fits, with the background fill colour around it. Both get baked into the export."
                : "The picture no longer fills the frame — the background fill colour shows around it, and gets baked into the export."}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={filling ? "default" : "outline"}
              className="gap-1.5"
              onClick={fillFrame}
              disabled={!coverZoom}
            >
              <Maximize2 className="h-3.5 w-3.5" /> Fill the frame
            </Button>
            <Button
              type="button"
              size="sm"
              variant={whole && !filling ? "default" : "outline"}
              className="gap-1.5"
              onClick={showWhole}
              disabled={!containZoom}
            >
              <Minimize2 className="h-3.5 w-3.5" /> Show the whole picture
            </Button>
            <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
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
            </div>
          </div>

          {/* Only worth the room once there is background showing to colour in. */}
          {!filling && (
            <div className="space-y-1.5">
              <Label className="text-xs">Background fill</Label>
              <div className="flex items-center gap-2">
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
                  aria-label="Pick any colour"
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
          )}

          {(previewRender || previewScales.length > 0) && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <Label className="text-xs">Exactly what the app will show</Label>
                {guideBox && (
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {Math.round(guideBox.width)} × {Math.round(guideBox.height)}px
                    {previewWidth ? ` on a ${previewWidth}px screen` : ""}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-end justify-center gap-4">
                {previewRender
                  ? previewRender(renderLiveImage)
                  : previewScales.map((scale) => (
                      <div key={scale} className="flex flex-col items-center gap-1">
                        <div
                          className="relative overflow-hidden border border-border"
                          style={{
                            width: guideBox!.width * scale,
                            height: guideBox!.height * scale,
                            borderRadius: round ? 9999 : 6,
                          }}
                        >
                          {renderLiveImage(guideBox!.width * scale, guideBox!.height * scale)}
                          {overlayGuides.length > 0 && (
                            <CropGuides box={guideBox!} guides={overlayGuides} />
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {scale === 1 ? "Life size" : `${scale}× — easier to check`}
                        </span>
                      </div>
                    ))}
              </div>
              {previewWidth && onPreviewWidthChange && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
                  <Label className="text-[11px] text-muted-foreground mr-1">Preview on a</Label>
                  {PREVIEW_VIEWPORTS.map((v) => (
                    <Button
                      key={v.width}
                      type="button"
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      variant={previewWidth === v.width ? "default" : "outline"}
                      onClick={() => onPreviewWidthChange(v.width)}
                      title={v.hint}
                    >
                      {v.label}
                    </Button>
                  ))}
                </div>
              )}
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
