import {
  MessageCircleMore, Sparkles, Tag, ClipboardList, Info, Star, Heart, Award,
  Calendar, Clock, MapPin, Home, Utensils, Coffee, Wine, Music, Camera,
  Car, Plane, Bed, ShoppingBag, Gift, CreditCard, Wifi, PawPrint, Baby,
  Leaf, Wrench, ShieldCheck, Users, Phone, Mail, Globe, Flame, Sun,
  Droplets, Mountain, TreePine, Bike, Dumbbell, Scissors, Brush, Stethoscope,
} from "lucide-react";

export type CustomIconDef = { key: string; label: string; Icon: any };

/**
 * Curated set of icons a business / admin can pick for custom detail rows.
 * The first entry (the default) renders when no icon is chosen.
 */
export const CUSTOM_ICONS: CustomIconDef[] = [
  { key: "message", label: "Note", Icon: MessageCircleMore },
  { key: "info", label: "Info", Icon: Info },
  { key: "sparkles", label: "Sparkles", Icon: Sparkles },
  { key: "star", label: "Star", Icon: Star },
  { key: "heart", label: "Heart", Icon: Heart },
  { key: "award", label: "Award", Icon: Award },
  { key: "shield", label: "Shield", Icon: ShieldCheck },
  { key: "tag", label: "Tag", Icon: Tag },
  { key: "clipboard", label: "Clipboard", Icon: ClipboardList },
  { key: "calendar", label: "Calendar", Icon: Calendar },
  { key: "clock", label: "Clock", Icon: Clock },
  { key: "map-pin", label: "Location", Icon: MapPin },
  { key: "home", label: "Home", Icon: Home },
  { key: "users", label: "People", Icon: Users },
  { key: "utensils", label: "Food", Icon: Utensils },
  { key: "coffee", label: "Coffee", Icon: Coffee },
  { key: "wine", label: "Drinks", Icon: Wine },
  { key: "music", label: "Music", Icon: Music },
  { key: "camera", label: "Photo", Icon: Camera },
  { key: "car", label: "Car", Icon: Car },
  { key: "plane", label: "Travel", Icon: Plane },
  { key: "bed", label: "Bed", Icon: Bed },
  { key: "shopping-bag", label: "Shopping", Icon: ShoppingBag },
  { key: "gift", label: "Gift", Icon: Gift },
  { key: "credit-card", label: "Payment", Icon: CreditCard },
  { key: "wifi", label: "WiFi", Icon: Wifi },
  { key: "paw", label: "Pets", Icon: PawPrint },
  { key: "baby", label: "Kids", Icon: Baby },
  { key: "leaf", label: "Nature", Icon: Leaf },
  { key: "tree", label: "Trees", Icon: TreePine },
  { key: "mountain", label: "Mountain", Icon: Mountain },
  { key: "sun", label: "Sun", Icon: Sun },
  { key: "flame", label: "Fire", Icon: Flame },
  { key: "droplets", label: "Water", Icon: Droplets },
  { key: "wrench", label: "Tools", Icon: Wrench },
  { key: "bike", label: "Cycling", Icon: Bike },
  { key: "dumbbell", label: "Fitness", Icon: Dumbbell },
  { key: "scissors", label: "Beauty", Icon: Scissors },
  { key: "brush", label: "Art", Icon: Brush },
  { key: "stethoscope", label: "Health", Icon: Stethoscope },
  { key: "phone", label: "Phone", Icon: Phone },
  { key: "mail", label: "Email", Icon: Mail },
  { key: "globe", label: "Web", Icon: Globe },
];

const ICON_MAP: Record<string, any> = Object.fromEntries(
  CUSTOM_ICONS.map((i) => [i.key, i.Icon])
);

/** Resolve a stored icon key to its lucide component, falling back to the default. */
export const getCustomIcon = (key: string | null | undefined): any =>
  (key && ICON_MAP[key]) || MessageCircleMore;
