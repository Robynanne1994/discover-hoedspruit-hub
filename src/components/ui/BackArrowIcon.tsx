import backArrowSrc from "@/assets/back-arrow-icon.svg";

// Color filter presets generated from a black source.
const COLOR_FILTERS: Record<string, string> = {
  "#FFFFFF": "brightness(0) invert(1)",
  "#ffffff": "brightness(0) invert(1)",
  "white": "brightness(0) invert(1)",
};

const filterFor = (color?: string) => {
  if (!color) return "none";
  if (COLOR_FILTERS[color]) return COLOR_FILTERS[color];
  // Default: dark — keep as-is (assumes the SVG is dark already)
  // For non-white custom colors, just leave the SVG natural.
  return "none";
};

interface BackArrowIconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

const BackArrowIcon = ({ size = 22, color, style, className }: BackArrowIconProps) => (
  <img
    src={backArrowSrc}
    alt=""
    className={className}
    style={{
      width: size,
      height: size,
      objectFit: "contain",
      display: "block",
      filter: filterFor(color),
      ...style,
    }}
  />
);

export default BackArrowIcon;
