import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SMALL_WORDS = new Set(["to", "and", "by", "on", "of", "it", "or"]);

const toTitleCase = (input: string): string => {
  const segments = input.toLowerCase().split(/(\s+)/);
  let firstWordIdx = -1;
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].trim().length > 0) {
      firstWordIdx = i;
      break;
    }
  }
  return segments
    .map((segment, i) => {
      if (!segment.trim()) return segment;
      const cleaned = segment.replace(/[^a-z']/g, "");
      const isSmall = SMALL_WORDS.has(cleaned);
      if (isSmall && i !== firstWordIdx) return segment;
      return segment.replace(/([a-z])/, (m) => m.toUpperCase());
    })
    .join("");
};

let isApplying = false;

const applyToH2s = () => {
  if (isApplying) return;
  isApplying = true;
  try {
    const h2s = document.querySelectorAll<HTMLElement>("h2");
    h2s.forEach((el) => {
      if (el.dataset.titleCased === el.textContent) return;
      if (el.hasAttribute("data-no-title-case") || el.closest("[data-no-title-case]")) {
        el.dataset.titleCased = el.textContent || "";
        return;
      }
      if (el.children.length === 0 && el.textContent) {
        const original = el.textContent;
        const transformed = toTitleCase(original);
        if (transformed !== original) {
          el.textContent = transformed;
        }
        el.dataset.titleCased = transformed;
      }
    });
  } finally {
    isApplying = false;
  }
};

const TitleCaseH2 = () => {
  const location = useLocation();

  useEffect(() => {
    let raf = 0;
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      raf = requestAnimationFrame(() => {
        scheduled = false;
        applyToH2s();
      });
    };
    schedule();

    const observer = new MutationObserver((mutations) => {
      if (isApplying) return;
      for (const m of mutations) {
        const target = m.target as HTMLElement;
        if (
          (target && target.nodeType === 1 && (target.tagName === "H2" || target.querySelector?.("h2"))) ||
          (m.type === "characterData" && (target.parentElement?.tagName === "H2"))
        ) {
          schedule();
          return;
        }
        for (const n of Array.from(m.addedNodes)) {
          if (n.nodeType === 1) {
            const el = n as HTMLElement;
            if (el.tagName === "H2" || el.querySelector?.("h2")) {
              schedule();
              return;
            }
          }
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [location.pathname]);

  return null;
};

export default TitleCaseH2;
