import { useEffect, ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const IVORY = "#f5f0e8";
const CARD = "#ffffff";
const BROWN = "#715a3d";
const DARK_BROWN = "#423324";
const INK = "#1a1a1a";
const BORDER = "rgba(0,0,0,0.12)";

export interface ActiveChip {
  label: string;
  onRemove: () => void;
}

interface RefineDrawerProps {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  resultsCount: number;
  resultsLabel?: string;
  activeChips?: ActiveChip[];
  children: ReactNode;
}

export const RefineDrawer = ({
  open,
  onClose,
  onClear,
  resultsCount,
  resultsLabel = "results",
  children,
}: RefineDrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 240ms ease",
          zIndex: 80,
        }}
      />

      {/* Side Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filter & Sort"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          width: "86%",
          maxWidth: 400,
          background: IVORY,
          color: INK,
          boxShadow: "-12px 0 36px rgba(0,0,0,0.18)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 280ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          fontFamily: SANS,
        }}
      >
        {/* Header */}
        <div style={{ padding: "calc(env(safe-area-inset-top) + 20px) 20px 14px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: SANS,
                fontSize: 22,
                lineHeight: 1.1,
                fontWeight: 700,
                color: INK,
                letterSpacing: "-0.01em",
              }}
            >
              Filter & Sort
            </h2>
            <button
              onClick={onClose}
              aria-label="Close Filter & Sort"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: DARK_BROWN,
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Divider below title */}
        <div style={{ height: 1, background: "rgba(0,0,0,0.10)", margin: "0 20px" }} />





        {/* Scroll area with cards */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px 24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {children}
        </div>

        {/* Sticky footer */}
        <div
          style={{
            padding: "14px 20px calc(env(safe-area-inset-bottom) + 16px)",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <button
            onClick={onClear}
            style={{
              background: "transparent",
              border: "none",
              padding: "10px 6px",
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 500,
              color: INK,
              letterSpacing: "0.01em",
              cursor: "pointer",
            }}
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            onPointerDown={(e) => {
              e.currentTarget.style.transform = "scale(0.97)";
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            style={{
              flex: 1,
              maxWidth: 240,
              height: 48,
              borderRadius: 9999,
              background: DARK_BROWN,
              color: "#ffffff",
              border: "none",
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.01em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.12s ease",
            }}
          >
            Show {resultsCount}&nbsp;{resultsLabel.charAt(0).toUpperCase() + resultsLabel.slice(1)}
          </button>
        </div>
      </aside>
    </>
  );
};

// Group label kept for backwards compat
export const RefineGroupLabel = ({ label }: { label: string }) => (
  <div
    style={{
      fontFamily: SANS,
      fontWeight: 700,
      fontSize: 11,
      color: BROWN,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      padding: "4px 0 0 0",
    }}
  >
    {label}
  </div>
);

interface RefineSectionProps {
  label?: string;
  open?: boolean;
  onToggle?: () => void;
  summary?: string;
  children: ReactNode;
  isFirst?: boolean;
}

// Card-style section. If `onToggle` is provided the section becomes a
// collapsible accordion (closed by default unless `open` is true). Otherwise
// the card is always open with an optional uppercase label.
export const RefineSection = ({ label, open, onToggle, summary, children }: RefineSectionProps) => {
  const isAccordion = typeof onToggle === "function";
  return (
    <section
      style={{
        background: CARD,
        borderRadius: 16,
        padding: isAccordion ? "0" : "18px 18px 18px 18px",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {isAccordion ? (
        <>
          <button
            onClick={onToggle}
            aria-expanded={!!open}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              width: "100%",
              padding: "16px 18px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              {label && (
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </span>
              )}
              {summary && (
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "rgba(26,26,26,0.55)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {summary}
                </span>
              )}
            </span>
            <ChevronDown
              size={18}
              strokeWidth={2}
              color={INK}
              style={{
                flexShrink: 0,
                transition: "transform 0.18s ease",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
        </>
      ) : (
        <>
          {label && (
            <div
              style={{
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 700,
                color: INK,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              {label}
            </div>
          )}
          <div>{children}</div>
        </>
      )}
    </section>
  );
};



// Row with label on left and radio control on right
export const RefineOption = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    role="radio"
    aria-checked={active}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      width: "100%",
      textAlign: "left",
      padding: "6px 0",
      background: "transparent",
      border: "none",
      cursor: "pointer",
    }}
  >
    <span
      style={{
        fontFamily: SANS,
        fontWeight: 500,
        fontSize: 14,
        color: INK,
        letterSpacing: "0.01em",
        lineHeight: 1.2,
      }}
    >
      {label}
    </span>
    <span
      aria-hidden
      style={{
        flexShrink: 0,
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: active ? `2px solid ${DARK_BROWN}` : `1.5px solid rgba(26,26,26,0.30)`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "border-color 0.12s ease",
      }}
    >
      {active && (
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: DARK_BROWN,
          }}
        />
      )}
    </span>
  </button>

);

// Toggle row — label + optional description on left, switch on right.
// Designed to sit as the only child inside its own RefineSection card (no inner label).
export const RefineToggle = ({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description?: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    role="switch"
    aria-checked={active}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      width: "100%",
      background: "transparent",
      border: "none",
      padding: 0,
      cursor: "pointer",
      textAlign: "left",
    }}
  >
    <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 16,
          color: INK,
          letterSpacing: "0.01em",
          lineHeight: 1.2,
        }}
      >
        {label}
      </span>
      {description && (
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 13,
            color: "rgba(26,26,26,0.55)",
            letterSpacing: "0.01em",
            lineHeight: 1.3,
          }}
        >
          {description}
        </span>
      )}
    </span>
    <span
      aria-hidden
      style={{
        flexShrink: 0,
        width: 48,
        height: 28,
        borderRadius: 999,
        background: active ? DARK_BROWN : "rgba(0,0,0,0.18)",
        position: "relative",
        transition: "background-color 0.18s ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: active ? 22 : 2,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          transition: "left 0.18s ease",
        }}
      />
    </span>
  </button>
);


// Pill-style option — used for subcategory lists. Renders inline so siblings wrap.
export const RefineRectOption = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    role="radio"
    aria-checked={active}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "7px 12px",
      marginRight: 6,
      marginBottom: 6,
      borderRadius: 999,
      border: active ? `1px solid ${DARK_BROWN}` : `1px solid ${BORDER}`,
      background: active ? DARK_BROWN : "#ffffff",
      color: active ? "#ffffff" : INK,
      fontFamily: SANS,
      fontWeight: 500,
      fontSize: 12,
      letterSpacing: "0.01em",
      lineHeight: 1.2,
      cursor: "pointer",
      transition: "background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease",
    }}
  >
    {label}
  </button>
);

// Pill chip — used for multi-select filter chips
export const RefineChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      padding: "7px 12px",
      borderRadius: 999,
      border: active ? `1px solid ${DARK_BROWN}` : `1px solid ${BORDER}`,
      background: active ? DARK_BROWN : "#ffffff",
      color: active ? "#ffffff" : INK,
      fontFamily: SANS,
      fontWeight: 500,
      fontSize: 12,
      letterSpacing: "0.01em",
      cursor: "pointer",
      transition: "background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease",
    }}
  >
    {label}
  </button>
);


// Distance/range slider — value in [min, max]. When value >= max, label shows `maxLabel` (e.g. "Anywhere").
export const RefineSlider = ({
  value,
  min,
  max,
  step = 0.5,
  onChange,
  formatValue,
  maxLabel,
  minLabel,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
  maxLabel?: string;
  minLabel?: string;
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  const fmt = formatValue || ((v: number) => `${v}`);
  const minDisplay = minLabel ?? fmt(min);
  const maxDisplay = maxLabel ?? fmt(max);

  return (
    <div style={{ padding: "4px 4px 0 4px" }}>
      <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        {/* Track */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 3,
            borderRadius: 999,
            background: "rgba(0,0,0,0.12)",
          }}
        />
        {/* Fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: `${pct}%`,
            height: 3,
            borderRadius: 999,
            background: DARK_BROWN,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            width: "100%",
            height: 28,
            margin: 0,
            padding: 0,
            background: "transparent",
            appearance: "none",
            WebkitAppearance: "none",
            cursor: "pointer",
            zIndex: 2,
          }}
          aria-label="Distance from town"
        />
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: ${DARK_BROWN};
            border: 3px solid #ffffff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.25);
            cursor: pointer;
          }
          input[type=range]::-moz-range-thumb {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: ${DARK_BROWN};
            border: 3px solid #ffffff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.25);
            cursor: pointer;
          }
          input[type=range]::-moz-range-track { background: transparent; }
        `}</style>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontFamily: SANS,
          fontSize: 12,
          color: "rgba(26,26,26,0.55)",
          letterSpacing: "0.01em",
        }}
      >
        <span>{minDisplay}</span>
        <span style={{ color: INK, fontWeight: 600 }}>
          {value >= max ? maxDisplay : fmt(value)}
        </span>
      </div>
    </div>
  );
};
