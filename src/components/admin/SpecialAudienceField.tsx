import { useId, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
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
      <div className="flex flex-wrap gap-x-5 gap-y-2">
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
    </fieldset>
  );
}