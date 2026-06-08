import React from "react";
import { ArrowUpRight } from "lucide-react";

/**
 * Lightweight markdown renderer for listing copy (long description + custom rows).
 *
 * Supported syntax:
 *   ## Subtitle            → section subheading
 *   ### Smaller subtitle   → smaller subheading
 *   **bold**               → bold inline
 *   [label](https://url)   → clickable link (with arrow)
 *   https://bare-url       → clickable link
 *   blank line             → new paragraph
 *
 * Kept deliberately small so it matches the app's existing markdown-link
 * convention without pulling in a heavy editor / parser dependency.
 */

const COLORS = {
  heading: "#020202",
  text: "#2b2420",
  primary: "#715a3d",
};

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const paraStyle: React.CSSProperties = {
  fontFamily: FONT, fontWeight: 400, fontSize: 14.5, lineHeight: 1.6,
  color: COLORS.text, margin: "0 0 10px",
};

const h2Style: React.CSSProperties = {
  fontFamily: FONT, fontWeight: 700, fontSize: 16.5, lineHeight: 1.3,
  color: COLORS.heading, margin: "18px 0 8px",
};

const h3Style: React.CSSProperties = {
  fontFamily: FONT, fontWeight: 700, fontSize: 14.5, lineHeight: 1.3,
  color: COLORS.heading, margin: "14px 0 6px", letterSpacing: "0.01em",
};

// Inline: **bold** + [label](url) markdown links + bare URLs.
const renderInline = (text: string, keyBase: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    if (m[1] !== undefined) {
      // **bold**
      nodes.push(
        <strong key={`${keyBase}-b-${i++}`} style={{ fontWeight: 700, color: COLORS.heading }}>
          {m[1]}
        </strong>
      );
    } else {
      // link
      const label = m[2] || m[4];
      const href = m[3] || m[4];
      nodes.push(
        <a
          key={`${keyBase}-l-${i++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: COLORS.primary, textDecoration: "none", fontWeight: 400, wordBreak: "break-word", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          {label}
          <ArrowUpRight size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
        </a>
      );
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

/**
 * Render listing rich text as block-level React nodes.
 * Splits on newlines, treating ## / ### lines as subtitles and the rest as
 * paragraphs. A blank line starts a new paragraph; single newlines become <br/>.
 */
export const renderListingRichText = (text: string): React.ReactNode => {
  if (!text) return null;
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: { type: "h2" | "h3" | "p"; lines: string[] }[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      blocks.push({ type: "h3", lines: [line.replace(/^###\s+/, "")] });
    } else if (/^##\s+/.test(line)) {
      blocks.push({ type: "h2", lines: [line.replace(/^##\s+/, "")] });
    } else if (line.trim() === "") {
      // Blank line: close any open paragraph so the next line starts a new one.
      const last = blocks[blocks.length - 1];
      if (last && last.type === "p" && last.lines[last.lines.length - 1] !== "") {
        last.lines.push("");
      }
    } else {
      const last = blocks[blocks.length - 1];
      // Append to the current paragraph unless it was closed by a blank line.
      if (last && last.type === "p" && last.lines[last.lines.length - 1] !== "") {
        last.lines.push(line);
      } else {
        blocks.push({ type: "p", lines: [line] });
      }
    }
  }

  const out: React.ReactNode[] = [];
  let key = 0;
  for (const b of blocks) {
    if (b.type === "h2") {
      out.push(<h3 key={`h2-${key++}`} style={h2Style}>{renderInline(b.lines[0], `h2-${key}`)}</h3>);
    } else if (b.type === "h3") {
      out.push(<h4 key={`h3-${key++}`} style={h3Style}>{renderInline(b.lines[0], `h3-${key}`)}</h4>);
    } else {
      const real = b.lines.filter((l) => l !== "");
      if (real.length === 0) continue;
      const inner: React.ReactNode[] = [];
      real.forEach((l, idx) => {
        if (idx > 0) inner.push(<br key={`br-${key}-${idx}`} />);
        inner.push(...renderInline(l, `p-${key}-${idx}`));
      });
      out.push(<p key={`p-${key++}`} style={paraStyle}>{inner}</p>);
    }
  }
  return out;
};
