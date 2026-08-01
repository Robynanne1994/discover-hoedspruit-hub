import { useEffect } from "react";
import { X } from "lucide-react";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const SHEET = "#F5F1E8";
const WHITE = "#FFFFFF";
const CREAM = "#EFE7D3";
const DARK_BROWN = "#423324";
const INK = "#1A1A1A";
const SUBTLE = "rgba(26,26,26,0.55)";
const PILL_BORDER = "#E8E4DF";

export type SavedSort = "recent" | "az" | "rating";

export const SORT_OPTIONS: { id: SavedSort; label: string }[] = [
  { id: "recent", label: "Recently Saved" },
  { id: "az", label: "A–Z" },
  { id: "rating", label: "Rating" },
];

export const sortLabel = (id: SavedSort) =>
  SORT_OPTIONS.find((o) => o.id === id)?.label ?? "Recently Saved";

const Overline = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: SANS,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: SUBTLE,
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

const Chip = ({
  label,
  active,
  onClick,
  grow,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  grow?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    style={{
      // Sort chips share the row but size from their own label first, so the
      // longest one ("Recently Saved") never gets clipped by an equal split.
      flex: grow ? "1 1 auto" : "0 0 auto",
      minWidth: 0,
      background: active ? CREAM : WHITE,
      color: INK,
      border: `1.5px solid ${active ? DARK_BROWN : PILL_BORDER}`,
      borderRadius: 999,
      // The three sort chips share a row, so they run a touch tighter than the
      // free-flowing category chips to keep "Recently Saved" on one line.
      padding: grow ? "12px 10px" : "12px 16px",
      cursor: "pointer",
      fontFamily: SANS,
      fontSize: grow ? 13 : 14,
      fontWeight: active ? 600 : 400,
      lineHeight: 1.2,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }}
  >
    {label}
  </button>
);

/**
 * Bottom sheet holding the sort order and category filter for the saved grid
 * on the profile page. Selections are drafted locally by the caller and only
 * committed when Apply is tapped, so a half-made choice never reflows the grid
 * underneath the sheet.
 */
const SavedFilterSheet = ({
  open,
  onClose,
  sort,
  onSortChange,
  categories,
  category,
  onCategoryChange,
  onReset,
  onApply,
  resultsCount,
}: {
  open: boolean;
  onClose: () => void;
  sort: SavedSort;
  onSortChange: (s: SavedSort) => void;
  categories: string[];
  category: string | null;
  onCategoryChange: (c: string | null) => void;
  onReset: () => void;
  onApply: () => void;
  resultsCount: number;
}) => {
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
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(26,26,26,0.45)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 240ms ease",
          zIndex: 80,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter and sort saved items"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: SHEET,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -8px 30px rgba(26,26,26,0.16)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          zIndex: 90,
          fontFamily: SANS,
          color: INK,
          maxHeight: "82dvh",
          display: "flex",
          flexDirection: "column",
          visibility: open ? "visible" : "hidden",
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "24px 24px 8px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: HEAD,
              fontSize: 22,
              fontWeight: 550,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: INK,
            }}
          >
            Filter &amp; Sort
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filter and sort"
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: "50%",
              background: "#E4DFD4",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={18} strokeWidth={2} color={INK} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "16px 24px 4px" }}>
          <Overline>Sort By</Overline>
          <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
            {SORT_OPTIONS.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                active={sort === o.id}
                onClick={() => onSortChange(o.id)}
                grow
              />
            ))}
          </div>

          {categories.length > 0 && (
            <>
              <Overline>Category</Overline>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                {categories.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    active={category === c}
                    onClick={() => onCategoryChange(category === c ? null : c)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "16px 24px",
            paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
          }}
        >
          <button
            type="button"
            onClick={onReset}
            style={{
              flex: "0 0 auto",
              height: 52,
              padding: "0 22px",
              borderRadius: 999,
              background: "transparent",
              color: INK,
              border: `1.5px solid ${PILL_BORDER}`,
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onApply}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 999,
              background: DARK_BROWN,
              color: WHITE,
              border: "none",
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {resultsCount === 1 ? "Show 1 Item" : `Show ${resultsCount} Items`}
          </button>
        </div>
      </div>
    </>
  );
};

export default SavedFilterSheet;
