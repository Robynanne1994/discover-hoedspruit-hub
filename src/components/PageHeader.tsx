import { CSSProperties, ReactNode, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

/**
 * Shared top page header used across the mobile app so every page title
 * (top centre) and the divider line beneath it are identical in size,
 * weight, colour, position and spacing.
 *
 * Standard:
 *  - Title: <h1>, Helvetica Neue, 20px / 700, #1A1A1A, letterSpacing -0.2px, centred
 *  - Top spacing: notch-safe calc(env(safe-area-inset-top) + 56px)
 *  - Divider: 1px, rgba(26,26,26,0.10), full-bleed, 20px below the title
 *
 * The title is centred with a 3-column grid (1fr / auto / 1fr) so it stays
 * perfectly centred regardless of the left (back) or right (actions) content.
 *
 * Fitting: the left (back) and right (actions) slots are reserved symmetrically
 * so the title is always perfectly centred, and the title font auto-scales down
 * (from 20px to a 15px floor) only when a long title would otherwise collide
 * with the side buttons. This keeps every header's buttons identical in size
 * and position while guaranteeing the title always fits on a single line.
 */

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const LINE = "rgba(26,26,26,0.10)";
const CARD = "#FFFFFF";

/** Title font size when there's plenty of room. */
const MAX_TITLE_FONT = 20;
/** Smallest the title will ever shrink to before relying on the ellipsis. */
const MIN_TITLE_FONT = 15;
/** Breathing room (px) kept between the title and the side button slots. */
const TITLE_SIDE_GAP = 16;

export type PageHeaderProps = {
  /** Centred page title text. */
  title: string;
  /** Optional second line rendered under the title (e.g. a count). */
  subtitle?: ReactNode;
  /** Click handler for the default back button. Defaults to navigate(-1). */
  onBack?: () => void;
  /** Hide the default back button (e.g. top-level tab pages). */
  showBack?: boolean;
  /** Custom left-slot content. Overrides the default back button when provided. */
  left?: ReactNode;
  /** Right-slot content (action buttons). */
  right?: ReactNode;
  /** Override the back button background colour (defaults to white card). */
  backBackground?: string;
  /** Override the notch-safe top offset. */
  topPad?: number | string;
  /** Extra style merged onto the header row container. */
  style?: CSSProperties;
};

const PageHeader = ({
  title,
  subtitle,
  onBack,
  showBack = true,
  left,
  right,
  backBackground = CARD,
  topPad = "calc(env(safe-area-inset-top) + 56px)",
  style,
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const rowRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [titleFont, setTitleFont] = useState(MAX_TITLE_FONT);

  // Scale the title down only as much as needed so it never wraps or collides
  // with the back/action buttons. The side slots are reserved symmetrically
  // (using the wider of the two) so the title stays perfectly centred.
  useLayoutEffect(() => {
    const fit = () => {
      const row = rowRef.current;
      const titleEl = titleRef.current;
      if (!row || !titleEl) return;

      const rowStyle = window.getComputedStyle(row);
      const padL = parseFloat(rowStyle.paddingLeft) || 0;
      const padR = parseFloat(rowStyle.paddingRight) || 0;
      const contentWidth = row.clientWidth - padL - padR;

      const reserve = Math.max(
        leftRef.current?.offsetWidth ?? 0,
        rightRef.current?.offsetWidth ?? 0,
      );
      const available = contentWidth - reserve * 2 - TITLE_SIDE_GAP;
      if (available <= 0) return;

      // Measure the title's natural width at full size, then scale to fit.
      const prev = titleEl.style.fontSize;
      titleEl.style.fontSize = `${MAX_TITLE_FONT}px`;
      const natural = titleEl.scrollWidth;
      titleEl.style.fontSize = prev;

      if (natural <= available) {
        setTitleFont(MAX_TITLE_FONT);
      } else {
        const scaled = Math.floor((available / natural) * MAX_TITLE_FONT);
        setTitleFont(Math.max(MIN_TITLE_FONT, scaled));
      }
    };

    fit();
    // Refit on viewport changes and whenever a side slot (back / action
    // buttons) appears or changes width, so the reserved gutters stay accurate.
    const ro = new ResizeObserver(fit);
    [rowRef, leftRef, rightRef].forEach((r) => r.current && ro.observe(r.current));
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [title]);

  const leftSlot =
    left !== undefined ? (
      left
    ) : showBack ? (
      <button
        type="button"
        aria-label="Back"
        onClick={onBack ?? (() => navigate(-1))}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: backBackground,
          border: "none",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <BackArrowIcon size={18} color={INK} />
      </button>
    ) : null;

  return (
    <>
      <div
        ref={rowRef}
        style={{
          padding: `${typeof topPad === "number" ? `${topPad}px` : topPad} 20px 0`,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          minHeight: 44,
          ...style,
        }}
      >
        <div ref={leftRef} style={{ justifySelf: "start", display: "flex", alignItems: "center" }}>
          {leftSlot}
        </div>
        <div style={{ justifySelf: "center", textAlign: "center", minWidth: 0, maxWidth: "100%" }}>
          <h1
            ref={titleRef}
            style={{
              margin: 0,
              fontFamily: HEAD,
              fontSize: titleFont,
              fontWeight: 700,
              color: INK,
              letterSpacing: "-0.2px",
              lineHeight: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </h1>
          {subtitle != null && <div style={{ marginTop: 4 }}>{subtitle}</div>}
        </div>
        <div ref={rightRef} style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 6 }}>
          {right}
        </div>
      </div>
      <div style={{ height: 1, background: LINE, marginTop: 20 }} />
    </>
  );
};

export default PageHeader;
