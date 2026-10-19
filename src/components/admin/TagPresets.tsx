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
