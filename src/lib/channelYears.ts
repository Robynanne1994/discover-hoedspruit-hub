type ChannelYears = { since_year?: number | null; years_running?: number | null };

export function channelCurrentYear(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en", { timeZone: "Africa/Johannesburg", year: "numeric" }).format(now));
}

export function channelYearsRunning(channel: ChannelYears, now = new Date()): number | null {
  return channel.since_year != null
    ? Math.max(0, channelCurrentYear(now) - channel.since_year)
    : channel.years_running ?? null;
}

export function channelYearStarted(channel: ChannelYears, now = new Date()): number | null {
  return channel.since_year ?? (channel.years_running != null ? channelCurrentYear(now) - channel.years_running : null);
}

export function channelCsvYears(row: Record<string, string>, now = new Date()): ChannelYears {
  const raw = row.year_started ?? row.yearstarted;
  if (raw === undefined) {
    // Older sheets retain their original duration meaning, not a start-year meaning.
    if (row.years_running === undefined) return {};
    const years = row.years_running.trim() === "" ? null : Number(row.years_running);
    if (years != null && (!Number.isInteger(years) || years < 0)) throw new Error("Years running must be a non-negative whole number");
    return { since_year: null, years_running: years };
  }
  if (!raw.trim()) return { since_year: null, years_running: null };
  const year = Number(raw);
  if (!Number.isInteger(year) || year < 1000 || year > channelCurrentYear(now)) {
    throw new Error(`Year started must be a whole year between 1000 and ${channelCurrentYear(now)}`);
  }
  return { since_year: year, years_running: null };
}