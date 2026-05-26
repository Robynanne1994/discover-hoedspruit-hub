type Props = {
  label: string;
  values: string[];
  labels: string[];
  selected: number;
  onChange: (index: number) => void;
};

/** Renders a small "use this one for the top action button" picker
 *  only when there is more than 1 non-empty value to choose from. */
export default function ActionPicker({ label, values, labels, selected, onChange }: Props) {
  const items = values
    .map((v, i) => ({ v: (v || "").trim(), l: (labels[i] || "").trim(), i }))
    .filter((x) => x.v.length > 0);

  if (items.length < 2) return null;

  const safeSelected = items.some((x) => x.i === selected) ? selected : items[0].i;

  return (
    <div className="flex flex-wrap items-center gap-2 pl-1 pt-1">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <select
        value={safeSelected}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="h-8 text-xs rounded-md border border-input bg-background px-2"
      >
        {items.map((x) => {
          const display = x.l || x.v;
          return (
            <option key={x.i} value={x.i}>
              {display.length > 40 ? display.slice(0, 40) + "…" : display}
            </option>
          );
        })}
      </select>
    </div>
  );
}
