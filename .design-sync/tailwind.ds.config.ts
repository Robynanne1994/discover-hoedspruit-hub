// Design-sync Tailwind config: reuses the repo's theme (tokens, colors, radius,
// fonts) but adds a `safelist` so the compiled stylesheet ships the FULL semantic
// token utility set (not just classes that happen to be used in src). This is what
// lets the design agent style with any bg-primary-tint / hover:bg-accent-hover /
// shadow-warm etc. Content still scans src so all real utility classes are included.
import base from "../tailwind.config";
import { readFileSync } from "node:fs";

const safelist = readFileSync("./.design-sync/safelist.txt", "utf8")
  .split(/\s+/)
  .filter(Boolean);

export default {
  ...base,
  content: ["./src/**/*.{ts,tsx}"],
  safelist,
};
