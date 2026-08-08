import ImageUpload from "./ImageUpload";
import type { ChannelImageSlot } from "@/lib/channelImageSlots";

interface ChannelImageFieldProps {
  slot: ChannelImageSlot;
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
}

/**
 * One Local Channel picture.
 *
 * Same behaviour as the listings and events editors: the plain ImageUpload
 * thumbnail plus the standard crop dialog, with the slot's ratio offered as
 * the starting shape and free to change. The locked-ratio, live in-app
 * preview version was too fiddly to work with.
 */
const ChannelImageField = ({
  slot,
  value,
  onChange,
  bucket = "local-channels-images",
}: ChannelImageFieldProps) => (
  <div className="space-y-1">
    <p className="text-sm font-medium text-foreground">{slot.label}</p>
    <p className="text-[11px] text-muted-foreground">
      Best at {slot.aspectLabel}. {slot.where} {!value && slot.fallback}
    </p>
    <ImageUpload bucket={bucket} value={value} onChange={onChange} aspect={slot.aspect} />
  </div>
);

export default ChannelImageField;
