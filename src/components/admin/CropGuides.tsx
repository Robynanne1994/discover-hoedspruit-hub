import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, Heart, Share2 } from "lucide-react";
import {
  pillHeight,
  type CircleContent,
  type GuideAnchor,
  type GuideShape,
  type SlotGuide,
} from "@/lib/imageSlotGuides";

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
 * That only holds if `box` is the width the app really paints the card at. It
 * is: every box is derived from the app shell and the screen's own grid in
 * `appLayout.ts`, at the device width the editor is previewing.
 *
 * The component measures its own width, so it just has to be dropped into any
 * `position: relative` box that already carries the slot's ratio.
 */

const GUIDE_LINE = "rgba(180,35,24,0.9)";

const anchorStyle = (anchor: GuideAnchor, x: number, y: number, scale: number): CSSProperties => {
  const [vertical, horizontal] = anchor.split("-") as ["top" | "bottom", "left" | "right"];
  return {
    position: "absolute",
    top: vertical === "top" ? y * scale : undefined,
    bottom: vertical === "bottom" ? y * scale : undefined,
    left: horizontal === "left" ? x * scale : undefined,
    right: horizontal === "right" ? x * scale : undefined,
    // A block wrapper would lay its chip out as an inline box on a text
    // baseline, and the line box's leading pushed the chip about 2px past the
    // inset it was supposed to sit at — 5px once scaled up in the dialog, which
    // is the crop tool's chrome sitting visibly lower than the app's. A flex
    // wrapper has no line box, so the chip starts exactly at the inset.
    display: "flex",
    transform: `scale(${scale})`,
    // Scaling from the pinned corner keeps the inset honest: the chip grows
    // inward, exactly as it does on the phone.
    transformOrigin: `${vertical} ${horizontal}`,
  };
};

const CircleGlyph = ({ content }: { content: CircleContent }) => {
  if (content.kind === "date") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#6B6A5E",
            lineHeight: 1,
          }}
        >
          {content.month}
        </span>
        <span
          style={{
            fontFamily: "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 17,
            fontWeight: 550,
            color: "#1A1A1A",
            lineHeight: 1,
            marginTop: 2,
          }}
        >
          {content.day}
        </span>
      </div>
    );
  }

  const Icon = content.icon === "back" ? ArrowLeft : content.icon === "share" ? Share2 : Heart;
  const filled = content.icon === "heart";
  return (
    <Icon
      size={content.size}
      strokeWidth={content.strokeWidth}
      color={content.color}
      fill={filled ? content.color : "none"}
    />
  );
};

/**
 * The text inside a chip.
 *
 * A chip whose runs are separate flex items — the category card's ★ / score /
 * count, spaced by a `gap` — renders one span per run. An `inline` chip is a
 * single run of text on the phone, spaces and all, so its runs have to share
 * one span here too: as flex items the browser strips the leading space off
 * " 4.3" and " (294)", which came out 6px narrower than the chip the app
 * paints.
 */
const PillRuns = ({ shape }: { shape: Extract<GuideShape, { kind: "pill" }> }) => {
  const runs = shape.runs.map((run, i) => (
    <span
      key={`${run.text}-${i}`}
      style={{ color: run.color, fontWeight: run.fontWeight, letterSpacing: run.letterSpacing }}
    >
      {shape.inline && i > 0 ? " " : ""}
      {run.text}
    </span>
  ));
  return shape.inline ? <span style={{ whiteSpace: "nowrap" }}>{runs}</span> : <>{runs}</>;
};

const GuideBody = ({ guide }: { guide: SlotGuide }) => {
  const { shape } = guide;

  if (shape.kind === "pill") {
    return (
      <div
        style={{
          boxSizing: "border-box",
          height: pillHeight(shape),
          padding: `0 ${shape.paddingX}px`,
          borderRadius: 9999,
          display: "inline-flex",
          alignItems: "center",
          gap: shape.inline ? 0 : shape.gap ?? 0,
          whiteSpace: "nowrap",
          background: shape.background,
          color: shape.color,
          // The chip's own shadow, plus an inset outline so the guide reads as
          // a guide. A border would push the chip past the size the phone
          // paints it at, so the outline is drawn inside.
          boxShadow: [shape.shadow, `inset 0 0 0 1px ${GUIDE_LINE}`].filter(Boolean).join(", "),
          fontFamily: shape.fontFamily,
          fontSize: shape.fontSize,
          fontWeight: shape.fontWeight,
          letterSpacing: shape.letterSpacing,
          textTransform: shape.uppercase ? "uppercase" : undefined,
          lineHeight: shape.lineHeight,
        }}
      >
        <PillRuns shape={shape} />
      </div>
    );
  }

  if (shape.kind === "circle") {
    return (
      <div
        style={{
          boxSizing: "border-box",
          width: shape.size,
          height: shape.size,
          borderRadius: 9999,
          background: shape.background,
          boxShadow: [shape.shadow, `inset 0 0 0 1px ${GUIDE_LINE}`].filter(Boolean).join(", "),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        <CircleGlyph content={shape.content} />
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
    if (typeof ResizeObserver === "undefined") return;
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
