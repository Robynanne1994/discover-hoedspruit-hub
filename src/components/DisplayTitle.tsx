import { CSSProperties, ReactNode } from "react";
import { getDisplayTitle, hasTitleOverride } from "@/lib/displayTitle";

type Props = {
  item: any;
  as?: "h1" | "h2" | "h3" | "h4" | "div" | "span" | "p";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode; // unused; kept for ergonomics
};

/**
 * Renders an item's display title. If the item has a non-empty
 * title_override, it is rendered verbatim inside a <span> marked with
 * data-no-title-case, so the global TitleCaseH1/H2 DOM transformers skip it.
 * Otherwise, falls back to the normal title and the global transformer
 * applies as usual.
 */
const DisplayTitle = ({ item, as: Tag = "span", className, style }: Props) => {
  const text = getDisplayTitle(item);
  if (hasTitleOverride(item)) {
    return (
      <Tag className={className} style={style} data-no-title-case="true">
        <span data-no-title-case="true">{text}</span>
      </Tag>
    );
  }
  return (
    <Tag className={className} style={style}>
      {text}
    </Tag>
  );
};

export default DisplayTitle;
