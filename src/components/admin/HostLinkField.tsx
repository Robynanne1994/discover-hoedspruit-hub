import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type HostLinkValue = { link: string; listingId: string };

type Mode = "none" | "url" | "listing";

const MODES: { key: Mode; label: string }[] = [
  { key: "none", label: "No link" },
  { key: "url", label: "Website link" },
  { key: "listing", label: "App listing" },
];

const modeOf = (v: HostLinkValue): Mode => (v.listingId ? "listing" : v.link ? "url" : "none");

interface Props {
  value: HostLinkValue;
  listings: { id: string; title: string }[];
  onChange: (value: HostLinkValue) => void;
}

/**
 * Link editor for a single event host.
 *
 * A host does not have to link anywhere, and when it does it is either an
 * outbound URL or a business already on the app — never both. Switching mode
 * clears the other side, so only one of the two ever reaches the database.
 *
 * The mode is local state so the field can sit on "Website link" with nothing
 * typed yet. Mount it with a key tied to the event and host slot so it re-seeds
 * when the form is pointed at a different event.
 */
const HostLinkField = ({ value, listings, onChange }: Props) => {
  const [mode, setMode] = useState<Mode>(() => modeOf(value));

  const pick = (next: Mode) => {
    setMode(next);
    onChange({
      link: next === "url" ? value.link : "",
      listingId: next === "listing" ? value.listingId : "",
    });
  };

  return (
    <div className="space-y-2">
      <Label>Link (optional)</Label>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <Button
            key={m.key}
            type="button"
            size="sm"
            variant={mode === m.key ? "default" : "outline"}
            onClick={() => pick(m.key)}
          >
            {m.label}
          </Button>
        ))}
      </div>
      {mode === "url" && (
        <Input
          value={value.link || ""}
          onChange={(e) => onChange({ link: e.target.value, listingId: "" })}
          placeholder="https://..."
        />
      )}
      {mode === "listing" && (
        <>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value.listingId || ""}
            onChange={(e) => onChange({ link: "", listingId: e.target.value })}
          >
            <option value="">— Select a listing —</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Opens that listing inside the app.</p>
        </>
      )}
    </div>
  );
};

export default HostLinkField;
