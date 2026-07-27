const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const parseTime = (s: string) => {
  const [h, mm] = s.replace(".", ":").split(":");
  return parseInt(h, 10) * 60 + (mm ? parseInt(mm, 10) : 0);
};

export const todayHours = (openingHours: Record<string, string> | null | undefined) => {
  if (!openingHours) return null;
  const now = new Date();
  const todayIdx = now.getDay();
  const todayLabel = todayIdx === 0 ? "Sunday" : DAY_LABELS[todayIdx - 1];
  const raw = openingHours[todayLabel.toLowerCase()];
  return typeof raw === "string" ? raw : null;
};

export const isAlwaysOpen = (v: string | null | undefined): boolean => {
  if (!v) return false;
  return /always\s*open|24\s*\/?\s*7|open\s*24|24\s*hours?|24h\b/i.test(v);
};

export const isOpenNow = (openingHours: Record<string, string> | null | undefined): boolean => {
  const v = todayHours(openingHours);
  if (!v || /closed/i.test(v)) return false;
  if (isAlwaysOpen(v)) return true;
  const m = v.match(/(\d{1,2}[:.]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.]?\d{0,2})/);
  if (!m) return false;
  const cur = new Date().getHours() * 60 + new Date().getMinutes();
  const o = parseTime(m[1]);
  let c = parseTime(m[2]);
  if (c <= o) c += 24 * 60;
  return cur >= o && cur <= c;
};

export const opensAt = (openingHours: Record<string, string> | null | undefined): string | null => {
  const v = todayHours(openingHours);
  if (!v || /closed/i.test(v)) return null;
  const m = v.match(/(\d{1,2}[:.]?\d{0,2})\s*[-–]/);
  return m ? m[1].replace(".", ":") : null;
};
