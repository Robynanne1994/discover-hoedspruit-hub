import ImageUpload from "./ImageUpload";
import ChannelImagePreview, { type ChannelPreviewData } from "./ChannelImagePreview";
import type { ChannelImageSlot } from "@/lib/channelImageSlots";

interface ChannelImageFieldProps {
  slot: ChannelImageSlot;
  value: string;
  onChange: (url: string) => void;
  /** The row being edited, so the preview carries its real title and meta. */
  channel: ChannelPreviewData;
  bucket?: string;
}

/**
 * One Local Channel picture, shown in the card it will end up in.
 *
 * The preview is built from the same `renderImage` callback the crop dialog
 * uses for its live preview, so the card here and the card mid-crop cannot
 * drift apart.
 */
const ChannelImageField = ({
  slot,
  value,
  onChange,
  channel,
  bucket = "local-channels-images",
}: ChannelImageFieldProps) => {
  const previewRender = (renderImage: (w: number, h: number) => React.ReactNode) => (
    <ChannelImagePreview slot={slot} channel={channel} renderImage={renderImage} />
  );

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{slot.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {slot.where} Cropped to {slot.aspectLabel}.{" "}
          {!value && <span>Empty: {slot.fallback.toLowerCase()}</span>}
        </p>
      </div>

      {!value && (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3 flex justify-center">
          <ChannelImagePreview
            slot={slot}
            channel={channel}
            renderImage={(width, height) => (
              <div
                style={{
                  width,
                  height,
                  background: "#F4EFE3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9A9384",
                  fontSize: 11,
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {slot.aspectLabel}
              </div>
            )}
          />
        </div>
      )}

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

export default ChannelImageField;
