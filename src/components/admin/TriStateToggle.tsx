import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TriStateToggleProps {
  label: string;
  value: boolean | null | undefined;
  onChange: (value: boolean | null) => void;
  className?: string;
}

const OPTIONS: { label: string; value: boolean | null }[] = [
  { label: "N/A", value: null },
  { label: "Yes", value: true },
  { label: "No", value: false },
];

export const TriStateToggle = ({ label, value, onChange, className }: TriStateToggleProps) => {
  const current = value === true ? true : value === false ? false : null;
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <Label className="text-sm">{label}</Label>
      <div className="inline-flex rounded-md border border-border bg-background overflow-hidden">
        {OPTIONS.map((opt) => {
          const active = current === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "px-3 py-1 text-xs transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TriStateToggle;
