interface BackArrowIconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

// Lucide-style left arrow built from two SVG paths inside a 24x24 viewBox.
// Replaces the previous custom uploaded SVG asset so every back button across
// the app shares one consistent mark.
const BackArrowIcon = ({ size = 18, color = "#2A2A24", style, className }: BackArrowIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: "block", ...style }}
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export default BackArrowIcon;
