import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";

export type HostLinkValue = { link: string; listingId: string };

type Mode = "none" | "url" | "listing";

const MODES: { key: Mode; label: string }[] = [
  { key: "none", label: "No Link" },
  { key: "url", label: "Website Link" },
  { key: "listing", label: "App Listing" },
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
    <div className="grid grid-cols-2 gap-3 items-end">
      <div className="space-y-2">
        <Label className="block">Link Type</Label>
        <div className="relative">
          <select
            className="flex h-10 w-full appearance-none rounded-md border border-gray-950 bg-slate-50 px-3 py-2 pr-9 text-sm text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={mode}
            onChange={(e) => pick(e.target.value as Mode)}
          >
            {MODES.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" strokeWidth={2.75} aria-hidden />
        </div>
      </div>
      <div>
      {mode === "url" && (
        <Input
          value={value.link || ""}
          onChange={(e) => onChange({ link: e.target.value, listingId: "" })}
          placeholder="https://..."
        />
      )}
      {mode === "listing" && (
        <>
          <div className="relative">
          <select
            className="flex h-10 w-full appearance-none rounded-md border border-gray-950 bg-slate-50 px-3 py-2 pr-9 text-sm text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={value.listingId || ""}
            onChange={(e) => onChange({ link: "", listingId: e.target.value })}
          >
            <option value="">— Select a listing —</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" strokeWidth={2.75} aria-hidden />
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default HostLinkField;
