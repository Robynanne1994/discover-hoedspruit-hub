import { useState } from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  List,
  Calendar,
  FolderOpen,
  FileText,
  LogOut,
  Upload,
  Home,
  Tag,
  Newspaper,
  Radio,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Moderation", path: "/admin/moderation", icon: ShieldCheck },
  { label: "Homepage", path: "/admin/homepage", icon: Home },
  { label: "Categories", path: "/admin/categories", icon: FolderOpen },
  { label: "Listings", path: "/admin/listings", icon: List },
  { label: "Events", path: "/admin/events", icon: Calendar },
  { label: "Specials", path: "/admin/specials", icon: Tag },
  { label: "Lowveld Lowdown", path: "/admin/articles", icon: Newspaper },
  { label: "Local Channels", path: "/admin/bush-telegraph", icon: Radio },
  { label: "Site Content", path: "/admin/content", icon: FileText },
  { label: "Import CSV", path: "/admin/import", icon: Upload },
];

const NavList = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  return (
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => {
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
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/" />;

  const currentTitle =
    navItems.find((i) => i.path === location.pathname)?.label ?? "Admin";

  return (
    <div className="min-h-screen flex bg-background">
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
          <span className="font-heading text-base font-semibold text-foreground truncate">
            {currentTitle}
          </span>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
