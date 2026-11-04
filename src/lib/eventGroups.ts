// Heading groups for the events list, shared by the page and its tests so the
// order of sections is defined in one place:
//   • This year → one group per month ("October"), title case like every
//     other heading in the app
//   • Any future year → one group carrying the year alone ("2027"), always
//     rendered after Recurring so the near-term list stays short

//   • Recurring events → one "Recurring" group
//   • Past filter → one heading for the whole window, no month groups
//   • One time-frame pill on its own → that pill's own heading; any further
//     narrowing → one plain "Events" heading

import { format } from "date-fns";
import { PAST_GROUP_LABEL } from "./eventPastWindow";
import { hasPerformances, resolveRecurrenceRule } from "./eventSchedule";

export type EventGroup = {
  key: string;
  label: string;
  events: any[];
  showCount?: boolean;
};

/**
 * The heading a lone time-frame pill wears in place of "Events". Each pill
 * keeps its own words, and "Today" carries the date too so the heading says
 * which day the list beneath it belongs to.
 */
export function eventTimeFrameHeading(activeFilter: string, today: Date = new Date()): string {
  switch (activeFilter) {
    case "today":
      return `Today, ${format(today, "d MMMM")}`;
    case "this-week":
      return "This Week";
    case "this-weekend":
      return "This Weekend";
    case "this-month":
      return "This Month";
    case "this-year":
      return "This Year";
    case "next-year":
      return String(today.getFullYear() + 1);
    case "past":
      return PAST_GROUP_LABEL;
    default:
      return "Events";
  }
}

export function buildEventGroups(
  filtered: any[],
  activeFilter: string,
  filtersOn = false,
  onlyDateFilter = false
): EventGroup[] {
  const groups: EventGroup[] = [];

  // Any filter applied → one plain "Events (N)" heading, since the results
  // may be narrowed by more than a date. A lone time-frame pill is the
  // exception: with nothing else switched on it says the whole narrowing, so
  // the heading wears that pill's own words instead.
  if (filtersOn) {
    if (!filtered.length) return [];
    return [
      {
        key: onlyDateFilter ? `timeframe-${activeFilter}` : "filtered",
        label: onlyDateFilter ? eventTimeFrameHeading(activeFilter) : "Events",
        events: filtered,
      },
    ];
  }

  if (activeFilter === "past") {
    return filtered.length
      ? [{ key: "past", label: PAST_GROUP_LABEL, events: filtered, showCount: false }]
      : [];
  }

  const recurring: any[] = [];
  // Next-year events are held back so they always render after Recurring.
  const futureYearGroups: EventGroup[] = [];

  filtered.forEach((e) => {
    if (resolveRecurrenceRule(e) && !hasPerformances(e)) {
      recurring.push(e);
      return;
    }

    const eventYear = e._parsed ? e._parsed.getFullYear() : null;
    const currentYear = new Date().getFullYear();
    const isFutureYear = eventYear !== null && eventYear > currentYear;
    const label = e._parsed
      ? isFutureYear
        ? String(eventYear)
        : format(e._parsed, eventYear === currentYear ? "MMMM" : "MMMM yyyy")
      : "DATE TO BE CONFIRMED";
    const key = e._parsed ? (isFutureYear ? `y-${eventYear}` : format(e._parsed, "yyyy-MM")) : "tbc";

    if (isFutureYear) {
      const existingFuture = futureYearGroups.find((g) => g.key === key);
      if (existingFuture) existingFuture.events.push(e);
      else futureYearGroups.push({ key, label, events: [e] });
      return;
    }

    const existing = groups.find((g) => g.key === key);
    if (existing) existing.events.push(e);
    else groups.push({ key, label, events: [e] });
  });

  if (recurring.length) groups.push({ key: "recurring", label: "Recurring", events: recurring });
  groups.push(...futureYearGroups);
  return groups;
}
