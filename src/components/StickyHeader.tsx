import { CSSProperties, useEffect, useRef, useState } from "react";
import PageHeader, { PageHeaderProps } from "@/components/PageHeader";

/**
 * A pinned copy of the page header that appears only while the reader is
 * scrolling up — back towards something they passed — and tucks itself away
 * the moment they scroll down again, so the content keeps the whole screen.
 *
 * The bar is a fixed duplicate of PageHeader (same title fit, same back
 * button, same divider), painted in the page's own canvas colour so it reads
 * as part of the page rather than app chrome. It only shows once the real
 * header has scrolled fully out of view: the bar renders identical content,
 * so its own height is exactly the distance the header needed to travel. The
 * two are therefore never on screen together.
 *
 * Fixed rather than sticky on purpose: html and body both carry
 * overflow-x: hidden (src/index.css) to stop iOS rubber-band sideways, and
 * that makes a sticky element's containing scroll box unreliable in WebKit.
 */

/** Page canvas, so the bar matches the screen it is pinned over. */
const CANVAS = "#E6E0CC";
/** Below the bottom nav and every dialog/drawer (z-50 and up). */
const STACK = 40;
/** Sub-pixel wobble (momentum rounding, iOS overscroll) is not a direction. */
const JITTER = 2;
/** Slide duration. */
const SLIDE = 200;

type StickyHeaderProps = PageHeaderProps & {
  /** Canvas colour painted behind the bar. Defaults to the page background. */
  background?: string;
  /** Stack order. Keep below drawers and dialogs. */
  zIndex?: number;
};

const StickyHeader = ({
  background = CANVAS,
  zIndex = STACK,
  ...header
}: StickyHeaderProps) => {
  const barRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);
  const frame = useRef(0);
  const [shown, setShown] = useState(false);

  // Respect the OS "reduce motion" setting: the bar simply appears.
  const [instant] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
  );

  useEffect(() => {
    lastY.current = window.scrollY;

    const evaluate = () => {
      frame.current = 0;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY.current;
      if (Math.abs(delta) < JITTER) return;
      lastY.current = y;

      if (delta > 0) {
        setShown(false);
        return;
      }

      // Scrolling up. Worth showing only once the real header has left.
      const height = barRef.current?.offsetHeight ?? 0;
      setShown(y > height - JITTER);
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(evaluate);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  const style: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex,
    background,
    transform: shown ? "translateY(0)" : "translateY(-100%)",
    // Hidden keeps the bar out of the tab order and the screen-reader tree;
    // the delay stops it blinking off mid-slide.
    visibility: shown ? "visible" : "hidden",
    transition: instant
      ? "none"
      : shown
        ? `transform ${SLIDE}ms ease-out, visibility 0s`
        : `transform ${SLIDE}ms ease-out, visibility 0s linear ${SLIDE}ms`,
    pointerEvents: shown ? "auto" : "none",
    willChange: "transform",
  };

  return (
    <div ref={barRef} style={style}>
      <PageHeader {...header} />
    </div>
  );
};

export default StickyHeader;
