// Each category pill on /specials carries a small mark that hints at what the
// category is. Tags are free text, so the mark is chosen from the words in the
// label: "Beauty" gets the beauty mark, "Game Drives" gets the safari vehicle.
// A tag none of the rules know keeps the plain tag mark, so a new tag still
// renders a pill rather than nothing.
import {
  Bed,
  Car,
  Compass,
  Heart,
  HeartPulse,
  Home,
  Leaf,
  ShoppingBag,
  Sparkles,
  Tag,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import { PILL_ICON_SIZE } from "@/lib/pillIcon";

const mark = (Icon: any) => <Icon size={PILL_ICON_SIZE} strokeWidth={1.8} />;

export const specialPillIcon = (tab: string) => {
  const t = tab.toLowerCase();
  if (t.includes("restaurant") || t.includes("food") || t.includes("café") || t.includes("cafe")) return mark(UtensilsCrossed);
  if (t.includes("accommodation") || t.includes("stay") || t.includes("lodge") || t.includes("hotel")) return mark(Bed);
  if (t.includes("beauty") || t.includes("nail") || t.includes("salon") || t.includes("hair")) return mark(Sparkles);
  if (t.includes("couple") || t.includes("romance") || t.includes("honeymoon")) return mark(Heart);
  if (t.includes("health") || t.includes("medical") || t.includes("clinic") || t.includes("pharmac")) return mark(HeartPulse);
  if (t.includes("game drive") || t.includes("safari") || t.includes("wildlife")) return mark(Car);
  if (t.includes("wellness") || t.includes("spa") || t.includes("massage") || t.includes("yoga")) return mark(Leaf);
  if (t.includes("activit") || t.includes("adventure") || t.includes("tour") || t.includes("experience")) return mark(Compass);
  if (t.includes("home") || t.includes("lifestyle") || t.includes("garden")) return mark(Home);
  if (t.includes("shop") || t.includes("retail") || t.includes("shopping")) return mark(ShoppingBag);
  if (t.includes("service") || t.includes("trade") || t.includes("business")) return mark(Wrench);
  return mark(Tag);
};
