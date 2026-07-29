import { CSSProperties, useCallback, useEffect, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Minus, Plus, RotateCw } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const MUTED = "#7A6E5C";
const BROWN = "#423324";
const CREAM = "#E6E0CC";

// Profile pictures are always rendered in a circle at small sizes, so a square
// export at this edge keeps them crisp on retina without bloating storage.
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/**
 * Renders the selected crop area (in source-image pixels) into a square canvas,
 * applying rotation first so the maths below always works on an upright image.
 */
async function getCroppedBlob(src: string, area: Area, rotation: number): Promise<Blob> {
  const img = await loadImage(src);

  // Draw the (optionally rotated) source onto a scratch canvas so the crop area
  // coordinates react-easy-crop reports line up with the pixels we sample.
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const rotW = img.width * cos + img.height * sin;
  const rotH = img.width * sin + img.height * cos;

  const scratch = document.createElement("canvas");
  scratch.width = Math.round(rotW);
  scratch.height = Math.round(rotH);
  const sctx = scratch.getContext("2d")!;
  sctx.translate(rotW / 2, rotH / 2);
  sctx.rotate(rad);
  sctx.drawImage(img, -img.width / 2, -img.height / 2);

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d")!;
  // Transparent source pixels (PNGs) would otherwise export as black.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    scratch,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9),
  );
}

const zoomBtn: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  border: "none",
  background: "rgba(26,26,26,0.06)",
  color: INK,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

type Props = {
  /** Object URL / data URL of the picked file. Null closes the dialog. */
  imageSrc: string | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
};

const AvatarCropDialog = ({ imageSrc, busy, onCancel, onConfirm }: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setArea(null);
    }
  }, [imageSrc]);

  useEffect(() => {
    if (!imageSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processing && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    // The cropper is drag-driven; letting the page scroll behind it makes
    // repositioning on a phone almost impossible.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [imageSrc, onCancel, processing, busy]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setArea(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !area) return;
    setProcessing(true);
    try {
      onConfirm(await getCroppedBlob(imageSrc, area, rotation));
    } finally {
      setProcessing(false);
    }
  };

  if (!imageSrc) return null;

  const working = processing || !!busy;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop your profile photo"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(26,26,26,0.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={() => !working && onCancel()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: CREAM,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontFamily: '"Nohemi", ' + FF,
            fontSize: 18,
            fontWeight: 600,
            color: INK,
            marginBottom: 4,
          }}
        >
          Position your photo
        </div>
        <div
          style={{
            fontFamily: FF,
            fontSize: 13,
            color: MUTED,
            marginBottom: 14,
          }}
        >
          Drag to move, pinch or use the slider to zoom.
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            maxHeight: "48vh",
            borderRadius: 16,
            overflow: "hidden",
            background: "#000",
            touchAction: "none",
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            // "cover" (not the default "contain") means the photo always fills
            // the circle at zoom 1, so a landscape or portrait shot can never be
            // exported with empty bands down the sides.
            objectFit="cover"
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            zoomWithScroll
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(2)))}
            style={zoomBtn}
          >
            <Minus size={16} strokeWidth={2} />
          </button>
          <Slider
            value={[zoom]}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            onValueChange={(v) => setZoom(v[0])}
            aria-label="Zoom"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(2)))}
            style={zoomBtn}
          >
            <Plus size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Rotate 90 degrees"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            style={zoomBtn}
          >
            <RotateCw size={16} strokeWidth={2} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 999,
              border: `1px solid rgba(26,26,26,0.18)`,
              background: "transparent",
              color: INK,
              fontFamily: FF,
              fontSize: 15,
              fontWeight: 500,
              cursor: working ? "not-allowed" : "pointer",
              opacity: working ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={working || !area}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 999,
              border: "none",
              background: BROWN,
              color: "#FFFFFF",
              fontFamily: FF,
              fontSize: 15,
              fontWeight: 600,
              cursor: working || !area ? "not-allowed" : "pointer",
              opacity: working || !area ? 0.7 : 1,
            }}
          >
            {working ? "Saving…" : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropDialog;
