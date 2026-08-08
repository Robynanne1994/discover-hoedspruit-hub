import type { ReactNode } from "react";
import ImageUpload from "./ImageUpload";
import PreviewImageBox from "./PreviewImageBox";
import type { EventImageSlot } from "@/lib/eventImageSlots";

interface EventImageFieldProps {
  slot: EventImageSlot;
  value: string;
  onChange: (url: string) => void;
  /** Override the slot label, e.g. "Photo" for a host row. */
  label?: string;
  bucket?: string;
}

/**
 * One event picture, cropped and previewed at the exact box the app paints it
 * into.
 *
 * The preview uses the same `renderImage` callback the crop dialog uses for its
 * live preview, so what is positioned mid-crop and what lands on the phone are
 * one picture: same ratio, same zoom, no background fill showing at the edges.
 */
const EventImageField = ({ slot, value, onChange, label, bucket = "listing-images" }: EventImageFieldProps) => {
  const previewRender = (renderImage: (w: number, h: number) => ReactNode) => (
    <PreviewImageBox
      style={{
        width: slot.box.width,
        height: slot.box.height,
        borderRadius: slot.key === "host" ? 999 : 12,
        background: "#F4EFE3",
      }}
      fallback={slot.box}
      renderImage={renderImage}
    />
  );

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">{label ?? slot.label}</p>
      <p className="text-[11px] text-muted-foreground">
        Cropped to {slot.aspectLabel}. {slot.where} {!value && slot.fallback}
      </p>
      <ImageUpload
        bucket={bucket}
        value={value}
        onChange={onChange}
        aspect={slot.aspect}
        lockAspect
        aspectLabel={slot.aspectLabel}
        cropTitle={`Crop — ${slot.label}`}
        previewRender={previewRender}
      />
    </div>
  );
};

export default EventImageField;
