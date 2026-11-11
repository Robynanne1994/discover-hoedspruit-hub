import { Globe, Linkedin, Youtube } from "lucide-react";
import type { SVGProps } from "react";

type P = { size?: number; color?: string; strokeWidth?: number } & SVGProps<SVGSVGElement>;

/** TikTok note glyph, outline style to sit beside lucide icons. */
export const TikTokIcon = ({ size = 20, color = "currentColor", strokeWidth = 1.5, ...props }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
    <path d="M14 3c.4 2.6 2.2 4.4 5 4.6" />
  </svg>
);

/** Threads "@" style glyph, outline. */
export const ThreadsIcon = ({ size = 20, color = "currentColor", strokeWidth = 1.5, ...props }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16.5 11.2c-.6-2.6-2.4-3.7-4.6-3.7-2.6 0-4 1.8-4 1.8" />
    <path d="M16.6 11.5c-3.4-1-7.1-.3-7.1 2.4 0 1.5 1.4 2.4 3 2.3 2.6-.1 4-2 4-5.3" />
    <path d="M19 8c-1.2-3-3.8-5-7.2-5C7 3 4 6.6 4 12s3 9 7.8 9c3.6 0 6.3-1.9 6.9-4.6" />
  </svg>
);

/** Pick the icon for an "other social" link from its label (or URL). */
export function socialIconFor(label: string, url = "") {
  const s = `${label} ${url}`.toLowerCase();
  if (/youtube|youtu\.be/.test(s)) return Youtube;
  if (/tiktok/.test(s)) return TikTokIcon;
  if (/linkedin/.test(s)) return Linkedin;
  if (/threads/.test(s)) return ThreadsIcon;
  return Globe;
}
