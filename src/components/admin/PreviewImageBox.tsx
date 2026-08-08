import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * The image box of an admin card preview, painted at the size it actually
 * comes out at.
 *
 * Several of the app's image slots don't have a fixed height in the source:
 * a tile can be `alignSelf: stretch` over a `minHeight`, or hold a ratio and
 * take its width from the column. Handing `renderImage` a nominal size would
 * hide that, which is the one thing these previews exist to show. So the box
 * measures itself and the picture is drawn at whatever came out, with
 * `overflow: hidden` keeping the measurement from feeding back into layout.
 *
 * `fallback` is used before the first measurement — and in jsdom, where there
 * is no ResizeObserver.
 */
const PreviewImageBox = ({
  style,
  fallback,
  renderImage,
}: {
  style: CSSProperties;
  fallback: { width: number; height: number };
  renderImage: (width: number, height: number) => ReactNode;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(fallback);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setSize((prev) =>
          Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5
            ? prev
            : { width: r.width, height: r.height },
        );
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ overflow: "hidden", ...style }}>
      {renderImage(size.width, size.height)}
    </div>
  );
};

export default PreviewImageBox;
