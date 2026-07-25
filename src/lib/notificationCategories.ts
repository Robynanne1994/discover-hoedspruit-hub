// Notification filter catalogues.
//
// These are no longer hand-maintained lists — they are the app's REAL data:
//   * Listings  -> the real listing categories (public.categories)
//   * Events    -> the real event tags in use (events.tag)
//   * Specials  -> the real special tags in use (specials.tag)
//
// The value stored on the user's notification_preferences.*_categories row is:
//   * the category id (uuid, as text) for listing filters, and
//   * the tag string itself for event / special filters.
// A NULL array means "everything is selected" (the parent toggle drives it).

import { supabase } from "@/integrations/supabase/client";

export type NotificationFilterType =
  | "events_new"
  | "listings_new"
  | "listings_updates"
  | "specials_new";

// Where the live options come from.
export type NotificationSource = "category" | "event_tag" | "special_tag";

export interface NotificationOption {
  id: string; // stored value: category id (uuid) OR tag string
  label: string; // what the user sees
}

export const FILTER_TYPE_META: Record<
  NotificationFilterType,
  {
    eyebrow: string;
    title: string;
    subline: string;
    source: NotificationSource;
    column:
      | "events_new_categories"
      | "listings_new_categories"
      | "listings_updates_categories"
      | "specials_new_categories";
    itemNoun: { one: string; many: string };
  }
> = {
  events_new: {
    eyebrow: "NEW EVENTS",
    title: "pick your kind of fun.",
    subline: "Choose which event categories you want to be notified about.",
    source: "event_tag",
    column: "events_new_categories",
    itemNoun: { one: "Category", many: "Categories" },
  },
  listings_new: {
    eyebrow: "NEW LISTINGS",
    title: "tell us what to send.",
    subline:
      "Choose which categories you want to be notified about when a new business listing is added.",
    source: "category",
    column: "listings_new_categories",
    itemNoun: { one: "Category", many: "Categories" },
  },
  listings_updates: {
    eyebrow: "LISTING UPDATES",
    title: "narrow it down.",
    subline:
      "Choose which categories you want updates from when a business changes its details.",
    source: "category",
    column: "listings_updates_categories",
    itemNoun: { one: "Category", many: "Categories" },
  },
  specials_new: {
    eyebrow: "NEW SPECIALS",
    title: "pick your kind of deal.",
    subline: "Choose which special categories you want to be notified about.",
    source: "special_tag",
    column: "specials_new_categories",
    itemNoun: { one: "Category", many: "Categories" },
  },
};

// Fetch the live options for a given source, straight from the real data.
export const fetchNotificationOptions = async (
  source: NotificationSource,
): Promise<NotificationOption[]> => {
  if (source === "category") {
    const { data } = await supabase
      .from("categories")
      .select("id,title")
      .order("sort_order");
    return (data ?? []).map((c) => ({ id: c.id, label: c.title }));
  }

  if (source === "event_tag") {
    const { data } = await supabase.from("events").select("tag");
    const tags = Array.from(
      new Set((data ?? []).map((e: any) => e.tag).filter(Boolean) as string[]),
    ).sort((a, b) => a.localeCompare(b));
    return tags.map((t) => ({ id: t, label: t }));
  }

  // special_tag
  const { data } = await supabase.from("specials").select("tag");
  const tags = Array.from(
    new Set((data ?? []).map((s: any) => s.tag).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b));
  return tags.map((t) => ({ id: t, label: t }));
};
