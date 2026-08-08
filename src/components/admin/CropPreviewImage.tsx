import { useEffect, useState } from "react";
import { cropPreviewLayout, type CropArea, type Size } from "@/lib/cropPreview";

interface CropPreviewImageProps {
  /** The source photo being cropped (data URL or remote URL). */
  src: string | null;
  /** Crop rectangle in source pixels, straight from react-easy-crop. */
  area: CropArea | null;
  /** Colour baked in behind the photo when the crop runs past its edges. */
  bgColor: string;
  /** The box the app paints into. */
  width: number;
  height: number;
}

/**
 * The crop as the app will paint it, live, while the user is still dragging.
 *
 * Everything here is layout — no canvas, no re-encoding — so it stays smooth
 * at drag speed. See `cropPreviewLayout` for why the maths is a single scale.
 */
const CropPreviewImage = ({ src, area, bgColor, width, height }: CropPreviewImageProps) => {
  const [natural, setNatural] = useState<Size | null>(null);

  useEffect(() => {
    if (!src) {
      setNatural(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) setNatural({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  const layout =
    src && area && natural ? cropPreviewLayout(natural, area, { width, height }) : null;

  return (
    <div style={{ width, height, overflow: "hidden", position: "relative", background: bgColor }}>
      {layout && (
        <div
          style={{
            position: "absolute",
            left: layout.crop.left,
            top: layout.crop.top,
            width: layout.crop.width,
            height: layout.crop.height,
            overflow: "hidden",
            background: bgColor,
          }}
        >
          <img
            src={src!}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: layout.image.left,
              top: layout.image.top,
              width: layout.image.width,
              height: layout.image.height,
              maxWidth: "none",
              display: "block",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CropPreviewImage;
