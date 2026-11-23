import { splitEventNotificationTags, splitNotificationTags } from "@/lib/notificationTags";
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
        supabase.from("specials").select("tag,tags"),
      ]);
      setCategories((cats.data ?? []).map((c: any) => c.title).filter(Boolean));
      setEventTags(
        splitEventNotificationTags((events.data ?? []).map((e: any) => e.tag)),
      );
      setSpecialTags(
        splitNotificationTags(
          (specials.data ?? []).flatMap((s: any) => [s.tag, ...((s.tags as string[] | null) ?? [])]),
        ),
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
    <section className="bg-card text-card-foreground border border-border rounded-xl shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 rounded-t-xl bg-primary-tint border-b border-border">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card border border-border">
          <Icon className="h-[18px] w-[18px] text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-bold text-foreground leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--filter-ink)] px-2.5 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums">
          {items.length}
        </span>
      </div>
      <div className="p-5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((label) => (
              <span
                key={label}
                className="inline-flex items-center h-8 px-3 rounded-full border border-border bg-card text-sm text-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-tint border border-border">
          <Bell className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
            Notification Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-6">
            Notifications run automatically off your live content. When you add or edit a listing,
            event or special, every user with the matching notification switched on is notified.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Store, label: "Listings", text: "New listings and listing updates, matched on category." },
          { icon: CalendarDays, label: "Events", text: "New events, matched on the event's tags." },
          { icon: Tag, label: "Specials", text: "New specials, matched on the special's tags." },
        ].map(({ icon: I, label, text }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <I className="h-4 w-4 text-primary" />
              <p className="font-semibold text-foreground text-sm">{label}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-5">{text}</p>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        What Users Can Subscribe To
      </p>

      {loading ? (
        <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground shadow-sm">
          Loading…
        </div>
      ) : (
        <div className="space-y-4">
          <Section
            icon={Store}
            title="Listing Categories"
            description="Used for New Listings and Listing Updates."
            items={categories}
            emptyLabel="No categories yet."
          />
          <Section
            icon={CalendarDays}
            title="Event Tags"
            description="Used for New Events. These are the live tags on your events."
            items={eventTags}
            emptyLabel="No event tags yet."
          />
          <Section
            icon={Tag}
            title="Special Tags"
            description="Used for New Specials. These are the live tags on your specials."
            items={specialTags}
            emptyLabel="No special tags yet."
          />
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
