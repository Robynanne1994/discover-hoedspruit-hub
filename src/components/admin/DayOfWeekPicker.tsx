import { DAY_NAMES, formatDays, parseDays, type DayName } from "@/lib/specialDays";

// A weekly special can run on any combination of days, so the day field is a
// row of toggles rather than a dropdown. Both specials editors use this one, so
// the two can never disagree about what a stored day list looks like.
const DayOfWeekPicker = ({
  value,
  onChange,
  hint,
}: {
  /** Whatever the row holds: a list, a single legacy name, or nothing. */
  value: unknown;
  /** Null when no day is selected — an empty list is not a schedule. */
  onChange: (days: string[] | null) => void;
  hint?: string;
}) => {
  const selected = parseDays(value);
  const summary = formatDays(selected, "long");

  const toggle = (day: DayName) => {
    const next = selected.includes(day)
      ? selected.filter((d) => d !== day)
      // Rebuilt from DAY_NAMES so the list is always stored in week order.
      : DAY_NAMES.filter((d) => d === day || selected.includes(d));
    onChange(next.length ? [...next] : null);
  };

  return (
    <div className="mt-1 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {DAY_NAMES.map((day) => {
          const active = selected.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(day)}
              className={`h-9 px-3 rounded-full border text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary font-medium"
                  : "bg-background text-foreground border-input hover:border-primary"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 min-h-5">
        <p className="text-xs text-muted-foreground flex-1">
          {summary ? `Runs every ${summary === "Every day" ? "day" : summary}` : hint || "No day set"}
        </p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default DayOfWeekPicker;
