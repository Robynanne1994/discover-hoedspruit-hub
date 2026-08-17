import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Heart } from "lucide-react";
import type { GuideAnchor, SlotGuide } from "@/lib/imageSlotGuides";

/**
 * Draws the app's chrome over a picture while it is being positioned.
 *
 * The guides are declared in life-size px against the slot's `box` (see
 * imageSlotGuides.ts), but the crop frame is whatever size the dialog happens
 * to give it. Rather than converting every measurement to a fraction — which
 * would make a 10px chip's text unreadable and its padding wrong — the whole
 * guide is built at life size and then scaled by `frame width ÷ box width`.
 * A heart drawn here is therefore exactly as big, relative to the picture, as
 * the heart the phone will paint on it.
 *
 * The component measures its own width, so it just has to be dropped into any
 * `position: relative` box that already carries the slot's ratio.
 */

const GUIDE_LINE = "rgba(180,35,24,0.9)";
const CHIP_LIGHT = "rgba(255,255,255,0.94)";
const CHIP_DEAL = "#C0392B";
const CHIP_QUIET = "#4F4A38";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const anchorStyle = (anchor: GuideAnchor, x: number, y: number, scale: number): CSSProperties => {
  const [vertical, horizontal] = anchor.split("-") as ["top" | "bottom", "left" | "right"];
  return {
    position: "absolute",
    top: vertical === "top" ? y * scale : undefined,
    bottom: vertical === "bottom" ? y * scale : undefined,
    left: horizontal === "left" ? x * scale : undefined,
    right: horizontal === "right" ? x * scale : undefined,
    transform: `scale(${scale})`,
    // Scaling from the pinned corner keeps the inset honest: the chip grows
    // inward, exactly as it does on the phone.
    transformOrigin: `${vertical} ${horizontal}`,
  };
};

const GuideBody = ({ guide }: { guide: SlotGuide }) => {
  const { shape } = guide;

  if (shape.kind === "pill") {
    const light = shape.tone === "light";
    return (
      <div
        style={{
          height: shape.height,
          padding: `0 ${shape.paddingX}px`,
          borderRadius: 9999,
          display: "inline-flex",
          alignItems: "center",
          gap: shape.star ? 4 : 0,
          whiteSpace: "nowrap",
          background: light ? CHIP_LIGHT : shape.tone === "deal" ? CHIP_DEAL : CHIP_QUIET,
          color: light ? "#2b2420" : "#FFFFFF",
          border: `1px dashed ${GUIDE_LINE}`,
          fontFamily: SANS,
          fontSize: shape.fontSize,
          fontWeight: 700,
          letterSpacing: shape.letterSpacing,
          textTransform: shape.letterSpacing ? "uppercase" : undefined,
          lineHeight: 1,
        }}
      >
        {shape.star && <span style={{ color: "#E9B417" }}>★</span>}
        {shape.text}
      </div>
    );
  }

  if (shape.kind === "circle") {
    return (
      <div
        style={{
          width: shape.size,
          height: shape.size,
          borderRadius: 9999,
          background: CHIP_LIGHT,
          border: `1px dashed ${GUIDE_LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SANS,
          fontSize: shape.size * 0.3,
          fontWeight: 700,
          color: "#2b2420",
          lineHeight: 1,
        }}
      >
        {shape.glyph === "heart" ? (
          <Heart size={shape.size * 0.55} strokeWidth={2} color="#5b4632" fill="#5b4632" />
        ) : (
          <span>18</span>
        )}
      </div>
    );
  }

  return null;
};

const CropGuides = ({ box, guides }: { box: { width: number; height: number }; guides: SlotGuide[] }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({ width: r.width, height: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = size && box.width > 0 ? size.width / box.width : 0;

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden">
      {scale > 0 &&
        guides.map((guide) => {
          const { shape } = guide;

          if (shape.kind === "sheet") {
            const height = shape.height * scale;
            const radius = shape.radius * scale;
            return (
              <div
                key={guide.key}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height,
                  background: "rgba(255,255,255,0.72)",
                  borderTop: `1.5px dashed ${GUIDE_LINE}`,
                  borderTopLeftRadius: radius,
                  borderTopRightRadius: radius,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontSize: Math.max(7, Math.min(10, height * 0.4)),
                    lineHeight: 1,
                    color: "#B42318",
                    textAlign: "center",
                    padding: "0 6px",
                  }}
                >
                  {shape.label}
                </span>
              </div>
            );
          }

          if (shape.kind === "circleMask") {
            if (!size) return null;
            // The circle the app will keep; a huge spread shadow greys out
            // everything the round mask throws away.
            const diameter = Math.min(size.width, size.height);
            return (
              <div
                key={guide.key}
                style={{
                  position: "absolute",
                  left: (size.width - diameter) / 2,
                  top: (size.height - diameter) / 2,
                  width: diameter,
                  height: diameter,
                  borderRadius: 9999,
                  border: `1.5px dashed ${GUIDE_LINE}`,
                  boxShadow: "0 0 0 9999px rgba(26,26,26,0.55)",
                }}
              />
            );
          }

          return (
            <div key={guide.key} style={anchorStyle(guide.anchor ?? "top-left", guide.x ?? 0, guide.y ?? 0, scale)}>
              <GuideBody guide={guide} />
            </div>
          );
        })}
    </div>
  );
};

export default CropGuides;
