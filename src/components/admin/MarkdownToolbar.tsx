import { useRef } from "react";
import { Bold, Heading } from "lucide-react";

type Props = {
  /** ref to the <textarea> being formatted */
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (next: string) => void;
};

/**
 * Tiny formatting toolbar for plain-text fields that are rendered as markdown
 * on the front end. Wraps the current selection in **bold** or prefixes the
 * line with "## " for a subtitle. Pairs with renderListingRichText().
 */
export default function MarkdownToolbar({ textareaRef, value, onChange }: Props) {
  const lastFocus = useRef(0);

  const apply = (fn: (sel: string, before: string, after: string) => { text: string; cursor: number }) => {
    const el = textareaRef.current;
    const start = el ? el.selectionStart : lastFocus.current;
    const end = el ? el.selectionEnd : lastFocus.current;
    const before = value.slice(0, start);
    const sel = value.slice(start, end);
    const after = value.slice(end);
    const { text, cursor } = fn(sel, before, after);
    onChange(text);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  const wrapBold = () =>
    apply((sel, before, after) => {
      const inner = sel || "bold text";
      const text = `${before}**${inner}**${after}`;
      return { text, cursor: before.length + 2 + inner.length + 2 };
    });

  const addSubtitle = () =>
    apply((sel, before, after) => {
      // Insert "## " at the start of the current line.
      const lineStart = before.lastIndexOf("\n") + 1;
      const prefix = before.slice(0, lineStart);
      const lineRest = before.slice(lineStart);
      const needsBreak = prefix.length > 0 && !prefix.endsWith("\n\n") && !prefix.endsWith("\n");
      const text = `${prefix}${needsBreak ? "\n" : ""}## ${lineRest}${sel}${after}`;
      const cursor = prefix.length + (needsBreak ? 1 : 0) + 3 + lineRest.length + sel.length;
      return { text, cursor };
    });

  const btn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 10px", borderRadius: 8, cursor: "pointer",
    border: "1px solid #d4d4d8", background: "#fafafa",
    fontSize: 12, fontWeight: 600, color: "#3f3f46", lineHeight: 1,
  };

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
      <button type="button" onClick={wrapBold} style={btn} aria-label="Bold selected text">
        <Bold size={13} strokeWidth={2.5} /> Bold
      </button>
      <button type="button" onClick={addSubtitle} style={btn} aria-label="Make this line a subtitle">
        <Heading size={13} strokeWidth={2.5} /> Subtitle
      </button>
    </div>
  );
}
