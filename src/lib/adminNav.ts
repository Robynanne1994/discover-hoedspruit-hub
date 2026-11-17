import {
  Bell,
  Calendar,
  FileBarChart,
  Flag,
  FolderOpen,
  HelpCircle,
  Home,
  LayoutDashboard,
  List,
  Megaphone,
  Radio,
  Search as SearchIcon,
  ShieldAlert,
  Star,
  Tag,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  icon: LucideIcon;
  /** Section page a nested URL belongs to, used for mobile header titles. */
  path?: string;
  children: NavItem[];
};

export type NavEntry = NavItem | NavGroup;

export const isNavGroup = (entry: NavEntry): entry is NavGroup =>
  "children" in entry;

const userNavItems: NavItem[] = [
  { label: "App Users", path: "/admin/users", icon: Users },
  { label: "Reported Users", path: "/admin/user-reports", icon: Flag },
  { label: "Moderated Users", path: "/admin/moderated-users", icon: ShieldAlert },
];

const eventNavItems: NavItem[] = [
  { label: "Upcoming Events", path: "/admin/events/upcoming", icon: Calendar },
  { label: "Past Events", path: "/admin/events/past", icon: Calendar },
  { label: "Event Hosts", path: "/admin/event-hosts", icon: Users },
];

const specialNavItems: NavItem[] = [
  { label: "Active Specials", path: "/admin/specials/active", icon: Tag },
  { label: "Past Specials", path: "/admin/specials/past", icon: Tag },
];

const appContentNavItems: NavItem[] = [
  { label: "Homepage", path: "/admin/homepage", icon: Home },
  { label: "Search Suggestions", path: "/admin/search-suggested", icon: SearchIcon },
  { label: "App Store", path: "/admin/app-store", icon: Star },
  { label: "FAQs", path: "/admin/faqs", icon: HelpCircle },
];

const notificationNavItems: NavItem[] = [
  { label: "Notifications", path: "/admin/notifications", icon: Bell },
  { label: "App Updates", path: "/admin/app-updates", icon: Megaphone },
];

export const adminNavEntries: NavEntry[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "App Content", icon: FolderOpen, children: appContentNavItems },
  { label: "Users", icon: Users, children: userNavItems },
  { label: "Categories", path: "/admin/categories", icon: FolderOpen },
  { label: "Listings", path: "/admin/listings", icon: List },
  { label: "Events", path: "/admin/events", icon: Calendar, children: eventNavItems },
  { label: "Specials", path: "/admin/specials", icon: Tag, children: specialNavItems },
  { label: "Local Channels", path: "/admin/local-channels", icon: Radio },
  {
    label: "App Updates & Notifications",
    icon: Megaphone,
    children: notificationNavItems,
  },
  { label: "Reports", path: "/admin/reports", icon: FileBarChart },
  { label: "Import CSV", path: "/admin/import", icon: Upload },
];

export const adminNavGroups: NavGroup[] = adminNavEntries.filter(isNavGroup);

// Every path the sidebar knows about, plus each group's own section page so a
// nested URL (e.g. /admin/events/import) still resolves to its section title.
export const allAdminNavItems: NavItem[] = adminNavEntries.flatMap(
  (entry): NavItem[] =>
    isNavGroup(entry)
      ? [
          ...(entry.path ? [{ label: entry.label, path: entry.path, icon: entry.icon }] : []),
          ...entry.children,
        ]
      : [entry],
);

export const navGroupActive = (group: NavGroup, pathname: string) =>
  (group.path ? pathname === group.path : false) ||
  group.children.some((child) => pathname === child.path);
