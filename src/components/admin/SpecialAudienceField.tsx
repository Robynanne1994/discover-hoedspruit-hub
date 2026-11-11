import { useId, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SPECIAL_AUDIENCE_OPTIONS, specialAudience } from "@/lib/specialAudience";

export default function SpecialAudienceField({ value, onChange }: { value: unknown; onChange: (value: string[] | null) => void }) {
  const id = useId();
  const selected = specialAudience(value);
  const [draft, setDraft] = useState("");
  const choices = specialAudience([...SPECIAL_AUDIENCE_OPTIONS, ...selected]);
  const commit = (next: string[]) => onChange(next.length ? next : null);
  const add = () => {
    if (!draft.trim()) return;
    commit(specialAudience([...selected, ...specialAudience(draft)]));
    setDraft("");
  };
  return (
    <fieldset className="space-y-2">
      <legend><Label>Who's It For?</Label></legend>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="flex h-10 w-full items-center justify-between rounded-md border border-gray-950 bg-slate-50 px-3 text-sm text-left">
            <span className={selected.length ? "truncate" : "truncate text-muted-foreground"}>{selected.length ? selected.join(", ") : "Select audience"}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-100" strokeWidth={2.75} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] space-y-3">
      <div className="flex flex-col gap-2">
        {choices.map((choice, index) => (
          <div key={choice} className="flex items-center gap-2">
            <Checkbox id={`${id}-${index}`} checked={selected.includes(choice)} onCheckedChange={(checked) => commit(checked === true ? [...selected, choice] : selected.filter((item) => item !== choice))} />
            <Label htmlFor={`${id}-${index}`} className="text-sm font-normal">{choice}</Label>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input aria-label="Other Audience" placeholder="Other audience" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} />
        <Button type="button" variant="outline" size="icon" aria-label="Add Audience" title="Add Audience" disabled={!draft.trim()} onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
        </PopoverContent>
      </Popover>
    </fieldset>
  );
}