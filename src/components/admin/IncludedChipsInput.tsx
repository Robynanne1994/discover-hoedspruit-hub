import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}

const IncludedChipsInput = ({ value, onChange, placeholder }: Props) => {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const t = draft.trim();
    if (!t) return;
    if (value.includes(t)) { setDraft(""); return; }
    onChange([...value, t]);
    setDraft("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item, i) => (
            <span key={`${item}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-sm">
              {item}
              <button type="button" onClick={() => remove(i)} aria-label={`Remove ${item}`} className="ml-1 opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={commit}
          placeholder={placeholder || "e.g. Welcome drink, then press Enter"}
        />
        <Button type="button" variant="secondary" onClick={commit} disabled={!draft.trim()}>Add</Button>
      </div>
    </div>
  );
};

export default IncludedChipsInput;
