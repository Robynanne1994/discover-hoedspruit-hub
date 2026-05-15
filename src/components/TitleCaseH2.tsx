import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * SMALL_WORDS: words that should remain lowercase unless they are the first word.
 * The user specified 'to', 'and', 'by', 'on'.
 */
const SMALL_WORDS = new Set(["to", "and", "by", "on"]);

const toTitleCase = (input: string): string => {
  // Split by whitespace but keep the whitespace segments
  const segments = input.toLowerCase().split(/(\s+)/);
  
  // Find the index of the first actual word (non-whitespace)
  let firstWordIdx = -1;
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].trim().length > 0) {
      firstWordIdx = i;
      break;
    }
  }

  return segments
    .map((segment, i) => {
      // If it's just whitespace, return as is
      if (!segment.trim()) return segment;

      // Cleaned version to check against SMALL_WORDS (removing punctuation)
      const cleaned = segment.replace(/[^a-z']/g, "");
      const isSmall = SMALL_WORDS.has(cleaned);
      
      // If it's a small word and NOT the first word, keep it lowercase
      if (isSmall && i !== firstWordIdx) return segment;

      // Otherwise, capitalize the first letter and keep the rest lowercase
      // (The rest is already lowercase from .toLowerCase() at the start)
      return segment.replace(/([a-z])/, (m) => m.toUpperCase());
    })
    .join("");
};

const applyToH2s = () => {
  const h2s = document.querySelectorAll<HTMLElement>("h2");
  h2s.forEach((el) => {
    // Skip if we've already processed this specific text content
    if (el.dataset.titleCased === el.textContent) return;
    
    // Check if the H2 has only text nodes or a very simple structure
    // We check children.length === 0 to avoid breaking icons or nested interactive elements
    if (el.children.length === 0 && el.textContent) {
      const original = el.textContent;
      const transformed = toTitleCase(original);
      
      if (transformed !== original) {
        el.textContent = transformed;
      }
      // Store the result so we don't re-process unnecessarily
      el.dataset.titleCased = transformed;
    }
  });
};

const TitleCaseH2 = () => {
  const location = useLocation();

  useEffect(() => {
    // Run immediately and also set up an observer for dynamic content
    const raf = requestAnimationFrame(() => applyToH2s());
    
    const observer = new MutationObserver(() => applyToH2s());
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      characterData: true 
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [location.pathname]);

  return null;
};

export default TitleCaseH2;
