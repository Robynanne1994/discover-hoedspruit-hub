import SectionHeader from "./SectionHeader";

const events = [
  { time: "9:00 AM", title: "Farmers Market", location: "Zandspruit" },
  { time: "2:00 PM", title: "Reptile Show", location: "Kinyonga Park" },
  { time: "6:30 PM", title: "Live Music", location: "Safari Brewery" },
];

const WhatsOnToday = () => {
  return (
    <section className="pb-4">
      <SectionHeader title="What's On Today" actionLabel="See all" actionHref="/events" />
      <div className="mx-4 divide-y divide-border">
        {events.map((event, i) => (
          <div key={i} className="flex items-baseline gap-4 py-3">
            <span className="text-sm font-semibold text-primary whitespace-nowrap w-[72px]">
              {event.time}
            </span>
            <span className="text-sm text-foreground">
              {event.title}{" "}
              <span className="text-muted-foreground">at {event.location}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhatsOnToday;
