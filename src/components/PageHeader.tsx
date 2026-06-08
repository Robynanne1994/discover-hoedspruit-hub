import { CSSProperties, ReactNode } from "react";
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
 */

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const LINE = "rgba(26,26,26,0.10)";
const CARD = "#FFFFFF";

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
        style={{
          padding: `${typeof topPad === "number" ? `${topPad}px` : topPad} 20px 0`,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          minHeight: 44,
          ...style,
        }}
      >
        <div style={{ justifySelf: "start", display: "flex", alignItems: "center" }}>
          {leftSlot}
        </div>
        <div style={{ justifySelf: "center", textAlign: "center", minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: SANS,
              fontSize: 20,
              fontWeight: 700,
              color: INK,
              letterSpacing: "-0.2px",
              lineHeight: 1,
            }}
          >
            {title}
          </h1>
          {subtitle != null && <div style={{ marginTop: 4 }}>{subtitle}</div>}
        </div>
        <div style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 6 }}>
          {right}
        </div>
      </div>
      <div style={{ height: 1, background: LINE, marginTop: 20 }} />
    </>
  );
};

export default PageHeader;
