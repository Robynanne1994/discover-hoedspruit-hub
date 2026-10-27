// Heading groups for the events list, shared by the page and its tests so the
// order of sections is defined in one place:
//   • This year → one group per month ("OCTOBER")
//   • Any future year → one group carrying the year alone ("2027"), always
//     rendered after Recurring so the near-term list stays short

//   • Recurring events → one "Recurring" group
//   • Past filter → one heading for the whole window, no month groups

import { format } from "date-fns";
import { PAST_GROUP_LABEL } from "./eventPastWindow";
import { hasPerformances, resolveRecurrenceRule } from "./eventSchedule";

export type EventGroup = {
  key: string;
  label: string;
  events: any[];
  showCount?: boolean;
};

export function buildEventGroups(filtered: any[], activeFilter: string): EventGroup[] {
  const groups: EventGroup[] = [];

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
        : format(e._parsed, eventYear === currentYear ? "MMMM" : "MMMM yyyy").toUpperCase()
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
