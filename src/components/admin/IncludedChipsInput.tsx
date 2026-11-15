import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  revealOnAdd?: boolean;
}

const IncludedChipsInput = ({ value, onChange, placeholder, revealOnAdd = false }: Props) => {
  const [draft, setDraft] = useState("");
  const [draftOpen, setDraftOpen] = useState(!revealOnAdd);

  const commit = () => {
    const t = draft.trim();
    if (!t) return;
    if (value.includes(t)) { setDraft(""); return; }
    onChange([...value, t]);
    setDraft("");
    if (revealOnAdd) setDraftOpen(false);
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
              <button type="button" onClick={() => remove(i)} aria-label={`Remove ${item}`} className="ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover">
                <X size={10} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
      {draftOpen ? <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={commit}
          placeholder={placeholder || "e.g. Welcome drink, then press Enter"}
        />
        <Button type="button" onClick={commit} disabled={!draft.trim()} className="h-7 px-2.5 text-xs">Add</Button>
      </div> : <Button type="button" onClick={() => setDraftOpen(true)} className="h-7 px-2.5 text-xs">Add</Button>}
    </div>
  );
};

export default IncludedChipsInput;
