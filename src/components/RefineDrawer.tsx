import { useEffect, ReactNode } from "react";
import { ChevronRight, ChevronDown, X, ArrowRight } from "lucide-react";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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
  activeChips,
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

      {/* Bottom Sheet */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "92dvh",
          background: "#ffffff",
          color: "#020202",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -12px 36px rgba(0,0,0,0.25)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          fontFamily: SANS,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6 }}>
          <div style={{ width: 44, height: 5, borderRadius: 999, background: "rgba(0,0,0,0.18)" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "10px 24px 8px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 13,
                  color: "rgba(2,2,2,0.55)",
                  letterSpacing: "0.02em",
                  marginBottom: 4,
                }}
              >
                Refine
              </div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: SANS,
                  fontSize: 38,
                  lineHeight: 1,
                  fontWeight: 700,
                  color: "#020202",
                  letterSpacing: "-0.01em",
                }}
              >
                Filters
              </h2>
            </div>
            <button
              onClick={onClear}
              style={{
                background: "transparent",
                border: "none",
                padding: "4px 0",
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 400,
                color: "#020202",
                textDecoration: "underline",
                textUnderlineOffset: 4,
                cursor: "pointer",
              }}
            >
              Clear All
            </button>
          </div>

          {activeChips && activeChips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
              {activeChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={chip.onRemove}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: "#020202",
                    color: "#ffffff",
                    border: "none",
                    fontFamily: SANS,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {chip.label}
                  <X size={14} strokeWidth={2} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sections */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 24px 24px 24px",
          }}
        >
          {children}
        </div>

        {/* Sticky CTA */}
        <div
          style={{
            padding: "12px 24px calc(env(safe-area-inset-bottom) + 18px)",
            background: "#ffffff",
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "100%",
              height: 60,
              borderRadius: 999,
              background: "#020202",
              color: "#ffffff",
              border: "none",
              fontFamily: SANS,
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: "0.01em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <span>
              Show {resultsCount} {resultsLabel.charAt(0).toUpperCase() + resultsLabel.slice(1)}
            </span>
            <ArrowRight
              size={20}
              strokeWidth={1.8}
              style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)" }}
            />
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
        borderTop: isFirst ? "none" : "1px solid rgba(0,0,0,0.10)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "20px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontFamily: SANS,
              fontSize: 22,
              fontWeight: 700,
              color: "#020202",
              letterSpacing: "-0.005em",
              lineHeight: 1.1,
            }}
          >
            {label}
          </span>
          {summary && (
            <span
              style={{
                fontFamily: SANS,
                fontSize: 14,
                color: "rgba(2,2,2,0.5)",
              }}
            >
              {summary}
            </span>
          )}
        </span>
        {open ? (
          <ChevronDown size={20} strokeWidth={1.8} color="#020202" />
        ) : (
          <ChevronRight size={20} strokeWidth={1.8} color="#020202" />
        )}
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
