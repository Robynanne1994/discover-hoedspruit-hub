import { EventCard } from "vite_react_shadcn_ts";
import eventImg from "@/assets/activities-card.jpg";

export const Featured = () => (
  <div style={{ padding: 20, maxWidth: 440 }}>
    <EventCard event={{
      id: "evt-1",
      title: "Bushveld Music Evening",
      date: "2026-07-25",
      start_date: "2026-07-25",
      start_time: "18:00",
      end_time: "22:00",
      location: "The Junction, Hoedspruit",
      image_url: eventImg,
      tag: "Live Music",
      description: "Live acoustic music under the Lowveld stars, with local food stalls and craft beer.",
    }} />
  </div>
);

export const Recurring = () => (
  <div style={{ padding: 20, maxWidth: 440 }}>
    <EventCard event={{
      id: "evt-2",
      title: "Saturday Farmers Market",
      date: "2026-07-26",
      start_time: "07:00",
      end_time: "12:00",
      recurrence: "weekly",
      location: "Kamogelo Centre, Hoedspruit",
      tag: "Market",
      description: "Fresh produce, macadamias, biltong and baked goods from Lowveld growers every Saturday.",
    }} />
  </div>
);
