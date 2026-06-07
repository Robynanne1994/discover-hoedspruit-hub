import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "be", "but", "by", "for", "from",
  "if", "in", "into", "is", "it", "nor", "of", "off", "on", "or",
  "per", "the", "to", "up", "via", "vs", "with", "yet",
]);

const toTitleCase = (input: string): string => {
  const words = input.toLowerCase().split(/(\s+)/);
  let firstWordIdx = -1;
  for (let i = 0; i < words.length; i++) {
    if (words[i].trim().length > 0) {
      firstWordIdx = i;
      break;
    }
  }
  return words
    .map((segment, i) => {
      if (!segment.trim()) return segment;
      const cleaned = segment.replace(/[^a-zA-Z']/g, "");
      const isSmall = SMALL_WORDS.has(cleaned.toLowerCase());
      if (isSmall && i !== firstWordIdx) return segment;
      return segment.replace(/([a-z])/, (m) => m.toUpperCase());
    })
    .join("");
};

let isApplying = false;

const applyToAll = () => {
  if (isApplying) return;
  isApplying = true;
  try {
    const h1s = document.querySelectorAll<HTMLElement>("h1");
    h1s.forEach((el) => {
      if (el.dataset.titleCased === el.textContent) return;
      if (el.hasAttribute("data-no-title-case") || el.closest("[data-no-title-case]")) {
        el.dataset.titleCased = el.textContent || "";
        return;
      }
      if (el.children.length === 0 && el.textContent) {
        const next = toTitleCase(el.textContent);
        if (next !== el.textContent) {
          el.textContent = next;
        }
        el.dataset.titleCased = next;
      }
    });
  } finally {
    isApplying = false;
  }
};

const TitleCaseH1 = () => {
  const location = useLocation();
  useEffect(() => {
    // Run once per route change, on the next frame. A global
    // MutationObserver watching the whole body subtree caused jitter
    // (and thrash) on every click because almost every interaction
    // mutates the DOM somewhere.
    const raf = requestAnimationFrame(() => applyToAll());
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);
  return null;
};

export default TitleCaseH1;
