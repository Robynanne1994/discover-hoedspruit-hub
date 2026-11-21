import ImageUpload from "./ImageUpload";
import { Label } from "@/components/ui/label";
import type { ImageSlot } from "@/lib/imageSlots";

interface ImageSlotFieldProps {
  slot: ImageSlot;
  value: string;
  onChange: (url: string) => void;
  /** Override the slot label, e.g. "Photo" for a host row. */
  label?: string;
  bucket?: string;
  /**
   * Lay the picture out like the form's other fields: the shared Label heading
   * used by "Name" and "Link Type", and a preview that sits on the page
   * background instead of a tinted panel.
   */
  asField?: boolean;
}

/**
 * One picture, for one place in the app.
 *
 * The same field serves events, listings, specials and Local Channels: the slot
 * carries its own ratio, its own hint and its own guides, so this only has to
 * hand them to the upload control. The ratio is offered as the starting shape
 * and stays free to change, and the guides are drawn both on the saved
 * thumbnail and inside the crop dialog.
 *
 * `box` and `guides` are passed as the slot's own functions of device width —
 * the upload control picks the width being previewed and calls them.
 */
const ImageSlotField = ({ slot, value, onChange, label, bucket = "listing-images", asField = false }: ImageSlotFieldProps) => (
  <div className={asField ? "space-y-1.5" : "space-y-1"}>
    {asField ? (
      <Label className="block">{label ?? slot.label}</Label>
    ) : (
      <>
        <p className="text-sm font-medium text-foreground">{label ?? slot.label}</p>
        <p className="text-[11px] text-muted-foreground">{"\n"}</p>
      </>
    )}
    <ImageUpload
      bucket={bucket}
      value={value}
      onChange={onChange}
      aspect={slot.aspect}
      lockAspect
      aspectLabel={slot.aspectLabel}
      cropTitle={`Crop — ${label ?? slot.label}`}
      guides={slot.guides}
      guideBox={slot.box}
      plainPreview={asField}
    />
  </div>
);

export default ImageSlotField;
