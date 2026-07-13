const SMALL_WORDS = new Set([
  "a","an","and","as","at","but","by","for","if","in","nor","of","on","or",
  "the","to","up","from","be","is","it","so","via","with",
]);

export const titleCaseSubject = (s: string | null | undefined): string => {
  if (!s) return "";
  const words = s.trim().toLowerCase().split(/(\s+)/);
  let wordIdx = 0;
  const total = words.filter((w) => w.trim()).length;
  return words
    .map((w) => {
      if (!w.trim()) return w;
      const cur = wordIdx;
      wordIdx += 1;
      if (cur !== 0 && cur !== total - 1 && SMALL_WORDS.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join("");
};
