import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Store, CalendarDays, Tag } from "lucide-react";

// Notifications are now driven entirely by the app's live data — there is
// nothing to configure here. When you add or edit a listing, event or special,
// the app automatically notifies every user who has the matching notification
// toggled on and the matching category / tag selected.
//
//   • New / updated listings  -> matched on the listing's real categories
//   • New / updated events     -> matched on the event's real tag
//   • New specials             -> matched on the special's real tag
//
// This page just surfaces the live categories and tags those notifications use,
// so you can see exactly what users can subscribe to.

const AdminNotifications = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [eventTags, setEventTags] = useState<string[]>([]);
  const [specialTags, setSpecialTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [cats, events, specials] = await Promise.all([
        supabase.from("categories").select("title").order("sort_order"),
        supabase.from("events").select("tag"),
        supabase.from("specials").select("tag"),
      ]);
      setCategories((cats.data ?? []).map((c: any) => c.title).filter(Boolean));
      setEventTags(
        Array.from(
          new Set((events.data ?? []).map((e: any) => e.tag).filter(Boolean) as string[]),
        ).sort(),
      );
      setSpecialTags(
        Array.from(
          new Set((specials.data ?? []).map((s: any) => s.tag).filter(Boolean) as string[]),
        ).sort(),
      );
      setLoading(false);
    };
    load();
  }, []);

  const Section = ({
    icon: Icon,
    title,
    description,
    items,
    emptyLabel,
  }: {
    icon: typeof Bell;
    title: string;
    description: string;
    items: string[];
    emptyLabel: string;
  }) => (
    <div className="bg-card rounded-lg p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-slate-700" />
        <h2 className="text-lg font-medium text-slate-950">{title}</h2>
        <span className="text-xs opacity-60">({items.length})</span>
      </div>
      <p className="text-sm opacity-80">{description}</p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {items.length === 0 ? (
          <span className="text-xs opacity-60">{emptyLabel}</span>
        ) : (
          items.map((label) => (
            <span
              key={label}
              className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/15 text-xs text-slate-800"
            >
              {label}
            </span>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Notifications</h1>
        <p className="text-sm opacity-80 mt-1">
          Notifications now run automatically off your live content. There's nothing to assign here —
          when you add or edit a listing, event or special, every user who has the matching
          notification switched on (and the matching category or tag selected) is notified. Below is
          what users can currently subscribe to.
        </p>
      </div>

      {loading ? (
        <div className="text-sm">Loading…</div>
      ) : (
        <div className="space-y-4">
          <Section
            icon={Store}
            title="Listing categories"
            description="Used for New Listings and Listing Updates notifications."
            items={categories}
            emptyLabel="No categories yet."
          />
          <Section
            icon={CalendarDays}
            title="Event tags"
            description="Used for New Events notifications. These are the live tags on your events."
            items={eventTags}
            emptyLabel="No event tags yet."
          />
          <Section
            icon={Tag}
            title="Special tags"
            description="Used for New Specials notifications. These are the live tags on your specials."
            items={specialTags}
            emptyLabel="No special tags yet."
          />
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
