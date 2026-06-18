import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";

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
                width: 38,
                height: 38,
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

          {/* Results count pill */}
          <div style={{ marginTop: 14 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "#ffffff",
                borderRadius: 999,
                padding: "8px 14px",
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                color: BROWN,
                letterSpacing: "0.01em",
              }}
            >
              {resultsCount} {resultsLabel} match
            </span>
          </div>
        </div>

        {/* Scroll area with cards */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "4px 20px 24px 20px",
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
              height: 52,
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
            Show {resultsCount} {resultsLabel}
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
  label: string;
  open?: boolean;
  onToggle?: () => void;
  summary?: string;
  children: ReactNode;
  isFirst?: boolean;
}

// Card-style section: always-open white card with uppercase label at top.
// `open`/`onToggle`/`summary`/`isFirst` are accepted for API compatibility but no longer used.
export const RefineSection = ({ label, children }: RefineSectionProps) => {
  return (
    <section
      style={{
        background: CARD,
        borderRadius: 16,
        padding: "18px 18px 18px 18px",
      }}
    >
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
      <div>{children}</div>
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
      padding: "12px 0",
      background: "transparent",
      border: "none",
      cursor: "pointer",
    }}
  >
    <span
      style={{
        fontFamily: SANS,
        fontWeight: 500,
        fontSize: 16,
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
        width: 22,
        height: 22,
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
            width: 12,
            height: 12,
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
      padding: "10px 18px",
      marginRight: 8,
      marginBottom: 8,
      borderRadius: 999,
      border: active ? `1px solid ${DARK_BROWN}` : `1px solid ${BORDER}`,
      background: active ? DARK_BROWN : "#ffffff",
      color: active ? "#ffffff" : INK,
      fontFamily: SANS,
      fontWeight: 500,
      fontSize: 14,
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
      padding: "10px 16px",
      borderRadius: 999,
      border: active ? `1px solid ${DARK_BROWN}` : `1px solid ${BORDER}`,
      background: active ? DARK_BROWN : "#ffffff",
      color: active ? "#ffffff" : INK,
      fontFamily: SANS,
      fontWeight: 500,
      fontSize: 14,
      letterSpacing: "0.01em",
      cursor: "pointer",
      transition: "background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease",
    }}
  >
    {label}
  </button>
);
