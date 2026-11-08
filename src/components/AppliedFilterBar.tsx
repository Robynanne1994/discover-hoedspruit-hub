import { forwardRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PILL_ICON_SIZE, PILL_ICON_NUDGE, PILL_BADGE_SIZE, PILL_BADGE_NUDGE } from "@/lib/pillIcon";

type Chip = { key: string; label: string; onRemove: () => void };

export const AppliedFilterBar = forwardRef<HTMLDivElement, {
  chips: Chip[];
  onOpen: () => void;
  onClear: () => void;
}>(({ chips, onOpen, onClear }, ref) => (
  <div ref={ref} className="applied-filter-bar scrollbar-hide">
    <div className="applied-filter-controls">
      <Button variant="ghost" className="applied-filter-button" aria-label="Filters and sort" aria-haspopup="dialog" onClick={onOpen}>
        <SlidersHorizontal size={PILL_ICON_SIZE} strokeWidth={1.9} style={{ transform: `translateY(${PILL_ICON_NUDGE})` }} />
        Filters
        {chips.length > 0 && <span className="applied-filter-badge" aria-label={`${chips.length} ${chips.length === 1 ? "filter" : "filters"} applied`} style={{ minWidth: PILL_BADGE_SIZE, height: PILL_BADGE_SIZE }}>
          <span style={{ transform: `translateY(${PILL_BADGE_NUDGE})` }}>{chips.length}</span>
        </span>}
      </Button>
      {chips.length > 0 && <>
        <span className="applied-filter-divider" aria-hidden="true" />
        <Button variant="ghost" className="applied-filter-chip" onClick={onClear}>
          <X size={PILL_ICON_SIZE} strokeWidth={2} style={{ transform: `translateY(${PILL_ICON_NUDGE})` }} />Clear All
        </Button>
      </>}
    </div>
    {chips.length > 0 && <div className="applied-filter-chips">
      {chips.map((chip) => <Button key={chip.key} variant="ghost" className="applied-filter-chip" aria-label={`Remove ${chip.label} filter`} onClick={chip.onRemove}>
        <X size={PILL_ICON_SIZE} strokeWidth={2} style={{ transform: `translateY(${PILL_ICON_NUDGE})` }} />{chip.label}
      </Button>)}
    </div>}
  </div>
));
AppliedFilterBar.displayName = "AppliedFilterBar";