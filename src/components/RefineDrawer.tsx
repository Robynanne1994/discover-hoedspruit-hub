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

      {/* Side Drawer (full height, slides from right) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          width: "88%",
          maxWidth: 420,
          background: "#ffffff",
          color: "#020202",
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
        <div style={{ padding: "calc(env(safe-area-inset-top) + 18px) 20px 14px 20px" }}>
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
                  fontWeight: 400,
                  fontSize: 13,
                  color: "rgba(2,2,2,0.55)",
                  letterSpacing: "0.01em",
                  textTransform: "capitalize",
                  marginBottom: 4,
                }}
              >
                Refine
              </div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: SANS,
                  fontSize: 34,
                  lineHeight: 1,
                  fontWeight: 700,
                  color: "#020202",
                  letterSpacing: "-0.01em",
                  textTransform: "capitalize",
                }}
              >
                Filters
              </h2>
            </div>
            <button
              onClick={onClear}
              style={{
                background: "#715a3d",
                border: "none",
                padding: "10px 18px",
                borderRadius: 999,
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.01em",
                textTransform: "capitalize",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(113,90,61,0.25)",
              }}
            >
              Clear All
            </button>
          </div>

          {activeChips && activeChips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
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
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    textTransform: "capitalize",
                    cursor: "pointer",
                  }}
                  aria-label={`Remove ${chip.label}`}
                >
                  {chip.label}
                  <X size={14} strokeWidth={2.2} />
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
            padding: "0 20px 24px 20px",
          }}
        >
          {children}
        </div>

        {/* Sticky CTA */}
        <div
          style={{
            padding: "12px 20px calc(env(safe-area-inset-bottom) + 16px)",
            background: "#ffffff",
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 999,
              background: "#020202",
              color: "#ffffff",
              border: "none",
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.01em",
              textTransform: "capitalize",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <span>
              Show {resultsCount} {resultsLabel}
            </span>
            <ArrowRight
              size={18}
              strokeWidth={1.8}
              style={{ position: "absolute", right: 22, top: "50%", transform: "translateY(-50%)" }}
            />
          </button>
        </div>
      </aside>
    </>
  );
};

// Eyebrow group label (e.g. "SORT", "FILTER BY") — visually differentiates sort vs filter
export const RefineGroupLabel = ({ label }: { label: string }) => (
  <div
    style={{
      fontFamily: SANS,
      fontWeight: 400,
      fontSize: 11,
      color: "#715a3d",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      padding: "18px 0 4px 0",
    }}
  >
    {label}
  </div>
);

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
          padding: "16px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span
            style={{
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 400,
              color: "#020202",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              lineHeight: 1.15,
            }}
          >
            {label}
          </span>
          {summary && (
            <span
              style={{
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 400,
                color: "rgba(43,36,32,0.55)",
                letterSpacing: "0.01em",
              }}
            >
              {summary}
            </span>
          )}
        </span>
        {open ? (
          <ChevronDown size={18} strokeWidth={1.6} color="#020202" />
        ) : (
          <ChevronRight size={18} strokeWidth={1.6} color="#020202" />
        )}
      </button>
      {open && <div style={{ padding: "2px 0 16px 0" }}>{children}</div>}
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
      fontWeight: 400,
      fontSize: 13,
      letterSpacing: "0.01em",
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
      fontWeight: 400,
      fontSize: 12,
      letterSpacing: "0.02em",
      cursor: "pointer",
    }}
  >
    {label}
  </button>
);
