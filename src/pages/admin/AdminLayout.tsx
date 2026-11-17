import { useEffect, useId, useRef, useState } from "react";
import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  List,
  ArrowLeft,
  Calendar,
  ChevronDown,
  FolderOpen,
  LogOut,
  Upload,
  Home,
  Tag,
  Radio,
  Menu,
  
  Users,
  FileBarChart,
  Bell,
  Megaphone,
  Flag,
  ShieldAlert,
  HelpCircle,
  Search as SearchIcon,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
};

type NavGroup = {
  label: string;
  icon: typeof LayoutDashboard;
  children: NavItem[];
};

const userNavItems: NavItem[] = [
  { label: "App Users", path: "/admin/users", icon: Users },
  { label: "Reported Users", path: "/admin/user-reports", icon: Flag },
  { label: "Moderated Users", path: "/admin/moderated-users", icon: ShieldAlert },
];

const navItems: (NavItem | NavGroup)[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Homepage", path: "/admin/homepage", icon: Home },
  { label: "Search Suggested", path: "/admin/search-suggested", icon: SearchIcon },
  { label: "App Store", path: "/admin/app-store", icon: Star },
  { label: "Users", icon: Users, children: userNavItems },
  { label: "Categories", path: "/admin/categories", icon: FolderOpen },
  { label: "Listings", path: "/admin/listings", icon: List },
  { label: "Events", path: "/admin/events", icon: Calendar },
  { label: "Event Hosts", path: "/admin/event-hosts", icon: Users },
  { label: "Specials", path: "/admin/specials", icon: Tag },
  { label: "Local Channels", path: "/admin/local-channels", icon: Radio },
  { label: "Notifications", path: "/admin/notifications", icon: Bell },
  { label: "App Updates & Notifications", path: "/admin/app-updates", icon: Megaphone },
  { label: "Reports", path: "/admin/reports", icon: FileBarChart },
  { label: "FAQs", path: "/admin/faqs", icon: HelpCircle },
  { label: "Import CSV", path: "/admin/import", icon: Upload },
];

const allNavItems: NavItem[] = navItems.flatMap((item): NavItem[] =>
  "children" in item ? item.children : [item],
);

const NavList = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const usersMenuId = useId();
  const usersSectionActive = userNavItems.some(
    (item) => location.pathname === item.path,
  );
  const [usersOpen, setUsersOpen] = useState(usersSectionActive);

  useEffect(() => {
    if (usersSectionActive) setUsersOpen(true);
  }, [usersSectionActive]);

  const renderLink = (item: NavItem) => {
    const active = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => {
        if (!("children" in item)) return renderLink(item);

        return (
          <div key={item.label} className="space-y-1">
            <button
              type="button"
              aria-expanded={usersOpen}
              aria-controls={usersMenuId}
              onClick={() => setUsersOpen((open) => !open)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                usersSectionActive
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              <ChevronDown
                className={`ml-auto h-4 w-4 transition-transform ${
                  usersOpen ? "" : "-rotate-90"
                }`}
              />
            </button>
            {usersOpen && (
              <div
                id={usersMenuId}
                className="ml-5 space-y-1 border-l border-border pl-3"
              >
                {item.children.map(renderLink)}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mobile back navigation: the dashboard always returns to My Account
  // (where the admin entry lives); deep pages step up to their parent
  // section; section pages step up to the dashboard.
  const segments = location.pathname.split("/").filter(Boolean); // ["admin", ...]
  const depth = segments.length; // 1 = /admin, 2 = section, 3+ = nested
  const backPath =
    depth > 2
      ? "/" + segments.slice(0, 2).join("/")
      : depth === 2
        ? "/admin"
        : "/my-account";
  const goBack = () => navigate(backPath);
  const parentTitle =
    depth > 2
      ? allNavItems.find((i) => i.path === "/" + segments.slice(0, 2).join("/"))?.label
      : undefined;
  const currentTitle =
    allNavItems.find((i) => i.path === location.pathname)?.label ??
    parentTitle ??
    "Admin";

  // Only show the initial loading state. Subsequent auth events
  // (token refresh, focus) must not flash the layout.
  const hasResolvedRef = useRef(false);
  if (!loading) hasResolvedRef.current = true;

  if (loading && !hasResolvedRef.current)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#c5bcaa]">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="min-h-screen flex bg-[#c5bcaa]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border p-4 flex-col">
        <Link
          to="/"
          className="font-heading text-lg font-bold text-foreground mb-8 block"
        >
          Hello <span className="text-primary">Hoedspruit</span>
        </Link>
        <NavList />
        <Button variant="ghost" className="rounded-none bg-accent" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-card border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 shrink-0"
            aria-label="Back"
            onClick={goBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4 flex flex-col">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="font-heading text-lg font-bold text-foreground mb-6 block"
              >
                Hello <span className="text-primary">Hoedspruit</span>
              </Link>
              <NavList onNavigate={() => setMobileOpen(false)} />
              <Button
                variant="ghost"
                className="justify-start gap-2 mt-2"
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </SheetContent>
          </Sheet>
          <span className="font-heading text-base font-semibold text-slate-950 truncate">
            {currentTitle}
          </span>
        </header>

        <div className="flex-1 p-4 lg:p-8 overflow-auto min-w-0 text-slate-950 [&_h1]:text-slate-950 [&_h2]:text-slate-950 [&_h3]:text-slate-950 [&_.bg-card]:text-zinc-950 [&_.bg-card_h1]:text-zinc-950 [&_.bg-card_h2]:text-zinc-950 [&_.bg-card_h3]:text-zinc-950 [&_.bg-muted]:text-zinc-950 [&_.bg-background]:text-zinc-950 [&_.text-muted-foreground]:text-slate-950 [&_.bg-card_.text-muted-foreground]:text-muted-foreground [&_.bg-muted_.text-muted-foreground]:text-muted-foreground [&_.bg-background_.text-muted-foreground]:text-muted-foreground bg-[#c5bcaa]" style={{ overscrollBehaviorX: "contain" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
