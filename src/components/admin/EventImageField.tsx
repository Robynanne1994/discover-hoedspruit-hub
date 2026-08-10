import ImageUpload from "./ImageUpload";
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
 * One event picture.
 *
 * Deliberately the same behaviour as the listings editor: the plain
 * ImageUpload thumbnail plus the standard crop dialog, with the slot's ratio
 * offered as the starting shape and free to change. The locked-ratio, live
 * in-app preview version was too fiddly to work with.
 */
const EventImageField = ({ slot, value, onChange, label, bucket = "listing-images" }: EventImageFieldProps) => (
  <div className="space-y-1">
    <p className="text-sm font-medium text-foreground">{label ?? slot.label}</p>
    <p className="text-[11px] text-muted-foreground">
      Best at {slot.aspectLabel}. {slot.where} {!value && slot.fallback}
    </p>
    <ImageUpload
      bucket={bucket}
      value={value}
      onChange={onChange}
      aspect={slot.aspect}
      bottomGuide={
        slot.bottomOverlay
          ? {
              heightRatio: slot.bottomOverlay.heightPx / slot.box.height,
              radiusRatio: slot.bottomOverlay.radiusPx / slot.box.width,
              label: slot.bottomOverlay.label,
            }
          : undefined
      }
    />
  </div>
);


export default EventImageField;
