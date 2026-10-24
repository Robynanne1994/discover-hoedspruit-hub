import { Instagram, type LucideProps } from "lucide-react";

/** One consistent camera outline, inheriting each placement's brand colour. */
const InstagramIcon = ({ size = 20, color = "currentColor", strokeWidth = 1.75, ...props }: LucideProps) => (
  <Instagram {...props} size={size} color={color} strokeWidth={strokeWidth} fill="none" aria-hidden="true" />
);

export default InstagramIcon;