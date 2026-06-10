import { useEffect, ReactNode } from "react";
import { ChevronUp, ChevronDown, X } from "lucide-react";

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
          width: "86%",
          maxWidth: 400,
          background: "#ffffff",
          color: "#020202",
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
          boxShadow: "-12px 0 36px rgba(0,0,0,0.18)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 280ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          fontFamily: SANS,
        }}
      >
        {/* Header — mirrors the app's PageHeader: 20px/700 title with a full-bleed divider */}
        <div style={{ padding: "calc(env(safe-area-inset-top) + 18px) 20px 0 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              minHeight: 40,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: SANS,
                fontSize: 20,
                lineHeight: 1,
                fontWeight: 700,
                color: "#1A1A1A",
                letterSpacing: "-0.2px",
              }}
            >
              FILTER & SORT
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={onClear}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px 4px",
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#715a3d",
                  letterSpacing: "0.01em",
                  cursor: "pointer",
                }}
              >
                Clear All
              </button>
              <button
                onClick={onClose}
                aria-label="Close FILTER & SORT"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#1A1A1A",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  flexShrink: 0,
                }}
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {activeChips && activeChips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              {activeChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={chip.onRemove}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "#020202",
                    color: "#ffffff",
                    border: "none",
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    textTransform: "capitalize",
                    cursor: "pointer",
                  }}
                  aria-label={`Remove ${chip.label}`}
                >
                  {chip.label}
                  <X size={13} strokeWidth={2.2} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider beneath header (full-bleed, matches PageHeader) */}
        <div style={{ height: 1, background: "rgba(26,26,26,0.10)", marginTop: 16 }} />

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

        {/* Sticky CTA — uses the app's primary button style (brown, 48px) */}
        <div
          style={{
            padding: "12px 20px calc(env(safe-area-inset-bottom) + 16px)",
            background: "#ffffff",
            borderTop: "1px solid rgba(26,26,26,0.10)",
          }}
        >
          <button
            onClick={onClose}
            onPointerDown={(e) => {
              e.currentTarget.style.transform = "scale(0.97)";
              e.currentTarget.style.opacity = "0.85";
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.opacity = "1";
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.opacity = "1";
            }}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 9999,
              background: "#423324",
              color: "#ffffff",
              border: "none",
              fontFamily: SANS,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.12s ease, opacity 0.12s ease",
            }}
          >
            See {resultsLabel} ({resultsCount})
          </button>
        </div>
      </aside>
    </>
  );
};

// Eyebrow group label (e.g. "Sort", "Filter By") — visually differentiates sort vs filter
export const RefineGroupLabel = ({ label }: { label: string }) => (
  <div
    style={{
      fontFamily: SANS,
      fontWeight: 600,
      fontSize: 11,
      color: "#715a3d",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      padding: "18px 0 2px 0",
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
          padding: "18px 0",
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
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              lineHeight: 1.2,
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
          <ChevronUp size={20} strokeWidth={1.8} color="rgba(26,26,26,0.7)" />
        ) : (
          <ChevronDown size={20} strokeWidth={1.8} color="rgba(26,26,26,0.7)" />
        )}
      </button>
      {open && <div style={{ padding: "0 0 14px 0" }}>{children}</div>}
    </div>
  );
};

// Reusable single-select option row, rendered as a radio control
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
      gap: 10,
      width: "100%",
      textAlign: "left",
      padding: "6px 2px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
    }}
  >
    {/* Radio control */}
    <span
      aria-hidden
      style={{
        flexShrink: 0,
        width: 18,
        height: 18,
        borderRadius: "50%",
        border: active ? "2px solid #1A1A1A" : "2px solid rgba(26,26,26,0.30)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "border-color 0.12s ease",
      }}
    >
      {active && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#1A1A1A",
          }}
        />
      )}
    </span>
    <span
      style={{
        fontFamily: SANS,
        fontWeight: 400,
        fontSize: 14,
        color: "#1A1A1A",
        letterSpacing: "0.01em",
        lineHeight: 1.2,
      }}
    >
      {label}
    </span>
  </button>
);

// Full-width rectangular single-select option (stacked card-style buttons)
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
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      padding: "10px 12px",
      marginBottom: 6,
      borderRadius: 6,
      border: active ? "1px solid #1A1A1A" : "1px solid rgba(0,0,0,0.15)",
      background: active ? "#020202" : "#ffffff",
      color: active ? "#ffffff" : "#1A1A1A",
      fontFamily: SANS,
      fontWeight: 400,
      fontSize: 13,
      letterSpacing: "0.01em",
      lineHeight: 1.2,
      cursor: "pointer",
      transition: "background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease",
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
