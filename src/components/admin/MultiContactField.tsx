import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  label: string;
  primary: string;
  onPrimaryChange: (v: string) => void;
  extras: string[];
  onExtrasChange: (next: string[]) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  addLabel?: string;
};

export default function MultiContactField({
  label,
  primary,
  onPrimaryChange,
  extras,
  onExtrasChange,
  placeholder,
  type = "text",
  addLabel,
}: Props) {
  const list = Array.isArray(extras) ? extras : [];
  const updateAt = (i: number, v: string) => {
    const next = [...list];
    next[i] = v;
    onExtrasChange(next);
  };
  const removeAt = (i: number) => onExtrasChange(list.filter((_, idx) => idx !== i));
  const add = () => onExtrasChange([...list, ""]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={primary || ""}
        placeholder={placeholder}
        onChange={(e) => onPrimaryChange(e.target.value)}
      />
      {list.map((v, i) => (
        <div key={i} className="flex gap-2">
          <Input
            type={type}
            value={v || ""}
            placeholder={placeholder}
            onChange={(e) => updateAt(i, e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeAt(i)}
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        {addLabel || `Add ${label.toLowerCase()}`}
      </Button>
    </div>
  );
}
