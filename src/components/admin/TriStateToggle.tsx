import { Button } from "@/components/ui/button";
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
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <div className="inline-flex shrink-0 rounded-md border border-primary bg-card overflow-hidden">
        {OPTIONS.map((opt) => {
          const active = current === opt.value;
          return (
            <Button
              key={String(opt.value)}
              type="button"
                      variant="ghost"
                      aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "h-7 rounded-none px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default TriStateToggle;
