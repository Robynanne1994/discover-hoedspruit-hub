import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";

type Props = {
  label: string;
  primary: string;
  onPrimaryChange: (v: string) => void;
  extras: string[];
  onExtrasChange: (next: string[]) => void;
  /** Optional custom label for the primary contact (e.g. "Emergency Contact"). */
  primaryLabel?: string;
  onPrimaryLabelChange?: (v: string) => void;
  /** Optional custom label per extra contact. Length should mirror `extras`. */
  extraLabels?: string[];
  onExtraLabelsChange?: (next: string[]) => void;
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
  primaryLabel,
  onPrimaryLabelChange,
  extraLabels,
  onExtraLabelsChange,
  placeholder,
  type = "text",
  addLabel,
}: Props) {
  const list = Array.isArray(extras) ? extras : [];
  const labels = Array.isArray(extraLabels) ? extraLabels : [];
  const supportsLabels = !!onExtraLabelsChange || !!onPrimaryLabelChange;
  const [primaryLabelOpen, setPrimaryLabelOpen] = useState(!!primaryLabel);
  const [extraLabelOpen, setExtraLabelOpen] = useState<Record<number, boolean>>(
    () => Object.fromEntries(labels.map((l, i) => [i, !!l])),
  );

  const updateAt = (i: number, v: string) => {
    const next = [...list];
    next[i] = v;
    onExtrasChange(next);
  };
  const setLabelAt = (i: number, v: string) => {
    if (!onExtraLabelsChange) return;
    const next = [...labels];
    while (next.length <= i) next.push("");
    next[i] = v;
    onExtraLabelsChange(next);
  };
  const removeAt = (i: number) => {
    onExtrasChange(list.filter((_, idx) => idx !== i));
    if (onExtraLabelsChange) onExtraLabelsChange(labels.filter((_, idx) => idx !== i));
    setExtraLabelOpen((s) => {
      const n: Record<number, boolean> = {};
      Object.keys(s).forEach((k) => {
        const idx = Number(k);
        if (idx < i) n[idx] = s[idx];
        else if (idx > i) n[idx - 1] = s[idx];
      });
      return n;
    });
  };
  const add = () => onExtrasChange([...list, ""]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-1.5">
        <Input
          type={type}
          value={primary || ""}
          placeholder={placeholder}
          onChange={(e) => onPrimaryChange(e.target.value)}
        />
        {supportsLabels && onPrimaryLabelChange && (
          primaryLabelOpen ? (
            <div className="flex gap-2 items-center">
              <Input
                value={primaryLabel || ""}
                placeholder='Custom label (e.g. "Emergency Contact")'
                onChange={(e) => onPrimaryLabelChange(e.target.value)}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Remove label"
                onClick={() => {
                  onPrimaryLabelChange("");
                  setPrimaryLabelOpen(false);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPrimaryLabelOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Tag className="h-3 w-3" /> Add custom label
            </button>
          )
        )}
      </div>
      {list.map((v, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex gap-2">
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
          {onExtraLabelsChange && (
            extraLabelOpen[i] || labels[i] ? (
              <div className="flex gap-2 items-center pl-1">
                <Input
                  value={labels[i] || ""}
                  placeholder='Custom label (e.g. "Emergency Contact")'
                  onChange={(e) => setLabelAt(i, e.target.value)}
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Remove label"
                  onClick={() => {
                    setLabelAt(i, "");
                    setExtraLabelOpen((s) => ({ ...s, [i]: false }));
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setExtraLabelOpen((s) => ({ ...s, [i]: true }))}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 pl-1"
              >
                <Tag className="h-3 w-3" /> Add custom label
              </button>
            )
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        {addLabel || `Add ${label.toLowerCase()}`}
      </Button>
    </div>
  );
}
