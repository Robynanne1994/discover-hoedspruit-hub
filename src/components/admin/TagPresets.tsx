import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SPECIAL_TAG_PRESETS, tagKey } from "@/lib/specialTags";

// One-tap picks for the "Tag / Main Category" box, so the main categories are
// typed the same way every time and one special doesn't end up in its own pill.
export default function TagPresets({
  value,
  onPick,
}: {
  value: string | null | undefined;
  onPick: (tag: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
      {SPECIAL_TAG_PRESETS.map((t) => {
        const active = tagKey(value) === tagKey(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => onPick(active ? "" : t)}
            style={{
              height: 26,
              padding: "0 10px",
              borderRadius: 999,
              cursor: "pointer",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 11,
              lineHeight: 1,
              border: `1px solid ${active ? "#423324" : "rgba(26,26,26,0.12)"}`,
              background: active ? "#423324" : "#FFFFFF",
              color: active ? "#FFFFFF" : "#2B2420",
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

// As many tags as needed per special: tap a preset to add or remove it, or
// type a custom tag and press Add. Order is kept; the first tag is the main one.
export function TagListEditor({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const tags = value ?? [];
  const has = (t: string) => tags.some((x) => tagKey(x) === tagKey(t));
  const add = (t: string) => {
    const label = t.trim().replace(/\s+/g, " ");
    if (!tagKey(label) || has(label)) return;
    onChange([...tags, label]);
  };
  const remove = (t: string) => onChange(tags.filter((x) => tagKey(x) !== tagKey(t)));
  return (
    <div style={{ marginTop: 6 }}>
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {tags.map((t) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 28, padding: "0 6px 0 10px", borderRadius: 999, background: "#423324", color: "#FFFFFF", fontSize: 12 }}>
              {t}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => remove(t)} style={{ background: "transparent", border: 0, color: "#FFFFFF", cursor: "pointer", display: "inline-flex" }}>
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <Input
          value={draft}
          placeholder="Add a tag, e.g. Honeymoon"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(draft); setDraft(""); } }}
        />
        <Button type="button" variant="outline" onClick={() => { add(draft); setDraft(""); }}>Add</Button>
      </div>
      <TagPresetsMulti tags={tags} onToggle={(t) => (has(t) ? remove(t) : add(t))} />
    </div>
  );
}

function TagPresetsMulti({ tags, onToggle }: { tags: string[]; onToggle: (t: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
      {SPECIAL_TAG_PRESETS.map((t) => {
        const active = tags.some((x) => tagKey(x) === tagKey(t));
        return (
          <button key={t} type="button" onClick={() => onToggle(t)}
            style={{ height: 26, padding: "0 10px", borderRadius: 999, cursor: "pointer", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, lineHeight: 1, border: `1px solid ${active ? "#423324" : "rgba(26,26,26,0.12)"}`, background: active ? "#423324" : "#FFFFFF", color: active ? "#FFFFFF" : "#2B2420" }}>
            {t}
          </button>
        );
      })}
    </div>
  );
}
