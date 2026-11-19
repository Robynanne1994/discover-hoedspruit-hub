// The dashboard's headline numbers. Events count only what is still to come,
// using the same live rule as the admin tabs and the public cards, so a past
// event can never inflate the figure. Specials count every deal that has not
// expired, including drafts — the same set the Active Specials tab shows.

import { isEventPassedForAdmin } from "./eventLive";
import type { EventScheduleLike } from "./eventSchedule";
import { isActiveSpecial, specialToday, type SpecialVisibilityFields } from "./specialVisibility";

/** Events that have not passed yet, including anything happening right now. */
export function upcomingEventCount(events: EventScheduleLike[], now = new Date()): number {
  return events.filter((event) => !isEventPassedForAdmin(event, now)).length;
}

/** Specials that have not passed yet, including drafts awaiting an image. */
export function activeSpecialCount(specials: SpecialVisibilityFields[], today = specialToday()): number {
  return specials.filter((special) => isActiveSpecial(special, today)).length;
}
