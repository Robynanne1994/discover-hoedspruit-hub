import { useEffect, ReactNode } from "react";
import { ChevronDown, ChevronUp, Bookmark } from "lucide-react";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

interface RefineDrawerProps {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  resultsCount: number;
  resultsLabel?: string;
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

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Refine"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          width: "85%",
          maxWidth: 420,
          background: "#ffffff",
          color: "#1a1a1a",
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
          boxShadow: "-12px 0 36px rgba(0,0,0,0.25)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 280ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          fontFamily: SANS,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "rgba(113,90,61,0.08)",
            borderBottom: "1px solid rgba(113,90,61,0.15)",
            padding: "20px 22px 18px 22px",
          }}
        >
          {/* Top row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <Bookmark size={24} strokeWidth={1.8} color="#715a3d" />
            <button
              onClick={onClear}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(113,90,61,0.35)",
                borderRadius: 999,
                padding: "6px 16px",
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                color: "#715a3d",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              Clear
            </button>
          </div>

          {/* Title */}
          <h2
            style={{
              margin: 0,
              fontFamily: SANS,
              fontSize: 26,
              fontWeight: 700,
              color: "#020202",
              letterSpacing: "0.01em",
            }}
          >
            Refine
          </h2>
        </div>

        {/* Sections */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 22px 24px 22px",
          }}
        >
          {children}
        </div>

        {/* Sticky CTA */}
        <div
          style={{
            padding: "14px 22px calc(env(safe-area-inset-bottom) + 18px)",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            background: "#ffffff",
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "100%",
              height: 50,
              borderRadius: 999,
              background: "#020202",
              color: "#ffffff",
              border: "none",
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "0.02em",
              cursor: "pointer",
            }}
          >
            Show {resultsCount} {resultsLabel}
          </button>
        </div>
      </aside>
    </>
  );
};

interface RefineSectionProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  summary?: string;
  children: ReactNode;
  isFirst?: boolean;
}

export const RefineSection = ({
  label,
  open,
  onToggle,
  summary,
  children,
  isFirst,
}: RefineSectionProps) => {
  return (
    <div
      style={{
        borderTop: isFirst ? "none" : "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "18px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontSize: 16,
            fontWeight: 600,
            color: "#020202",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {summary && (
            <span
              style={{
                fontFamily: SANS,
                fontSize: 13,
                color: "rgba(2,2,2,0.55)",
              }}
            >
              {summary}
            </span>
          )}
          {open ? (
            <ChevronUp size={20} strokeWidth={1.8} color="#1a1a1a" />
          ) : (
            <ChevronDown size={20} strokeWidth={1.8} color="#1a1a1a" />
          )}
        </span>
      </button>
      {open && <div style={{ padding: "2px 0 18px 0" }}>{children}</div>}
    </div>
  );
};

// Reusable option row
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
    style={{
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "11px 14px",
      marginBottom: 6,
      borderRadius: 12,
      border: active ? "1px solid #020202" : "1px solid rgba(0,0,0,0.12)",
      background: active ? "#020202" : "#ffffff",
      color: active ? "#ffffff" : "#020202",
      fontFamily: SANS,
      fontSize: 14,
      cursor: "pointer",
    }}
  >
    {label}
  </button>
);

// Chip for multi-select
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
      padding: "9px 14px",
      borderRadius: 999,
      border: active ? "1px solid #020202" : "1px solid rgba(0,0,0,0.15)",
      background: active ? "#020202" : "#ffffff",
      color: active ? "#ffffff" : "#020202",
      fontFamily: SANS,
      fontSize: 13,
      cursor: "pointer",
    }}
  >
    {label}
  </button>
);
