import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * Standardized page header used on EVERY page in the app.
 * Do not introduce per-page header markup — always use this component.
 *
 * Spec:
 * - Background: page cream (#ebebeb) — matches body
 * - Top padding: env(safe-area-inset-top) + enough to bring total top space above title to ~60px
 * - Bottom padding: 16px (+16px when subtitle present)
 * - Horizontal padding: 20px
 * - Title: 22px / weight 600 / letter-spacing -0.2px / line-height 1.2, centered
 * - Optional subtitle: 12px / 400 / uppercase / letter-spacing 1px / 60% ink, centered, 4px gap
 * - Back arrow (left, optional): 24px chevron-left, 44x44 tap target
 * - Right icons (optional): array of nodes, 16px gap, each 44x44 tap target
 * - 1px full-width divider directly below the header content
 */

export type RightIcon = {
  key: string;
  label: string;
  onClick?: () => void;
  icon: ReactNode;
  /** Visual indicator (e.g. active filter) — turns the button dark */
  active?: boolean;
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcons?: RightIcon[];
}

const INK = "#020202";
const PAGE_BG = "#ebebeb";
const DIVIDER = "rgba(2, 2, 2, 0.1)";

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightIcons = [],
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header
      style={{
        width: "100%",
        background: PAGE_BG,
        // 60px total above the title on standard iPhone; safe-area inset adds on iOS
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)",
        paddingBottom: 16,
        paddingLeft: 20,
        paddingRight: 20,
        position: "relative",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Back arrow */}
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: 44,
              height: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "flex-start",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: INK,
            }}
          >
            <ChevronLeft size={24} strokeWidth={1.8} />
          </button>
        )}

        {/* Title + subtitle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.2px",
              lineHeight: 1.2,
              color: INK,
              textAlign: "center",
              textTransform: "none",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 400,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "rgba(2, 2, 2, 0.6)",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Right icons */}
        {rightIcons.length > 0 && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {rightIcons.map((ic) => (
              <button
                key={ic.key}
                type="button"
                onClick={ic.onClick}
                aria-label={ic.label}
                style={{
                  width: 44,
                  height: 44,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: ic.active ? "hsl(var(--primary))" : INK,
                }}
              >
                {ic.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-width divider */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background: DIVIDER,
        }}
      />
    </header>
  );
}
