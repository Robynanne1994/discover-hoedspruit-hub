import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderOpen,
  List,
  Calendar,
  ShieldCheck,
  Tag,
  
  Radio,
  Users,
  Megaphone,
  Flag,
} from "lucide-react";

type CountableTable = "categories" | "listings" | "events" | "specials" | "bush_telegraph_resources";

const useCount = (key: string, table: CountableTable) =>
  useQuery({
    queryKey: [`admin-count-${key}`],
    queryFn: async () => {
      const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

const AdminDashboard = () => {
  const cats = useCount("cats", "categories");
  const lists = useCount("lists", "listings");
  const events = useCount("events", "events");
  const specials = useQuery({
    queryKey: ["admin-count-specials-active"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { count, error } = await supabase
        .from("specials")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`);
      if (error) throw error;
      return count ?? 0;
    },
  });
  
  const resources = useCount("resources", "bush_telegraph_resources");
  
  // users count via edge function (auth.users not directly queryable)
  const users = useQuery({
    queryKey: ["admin-count-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-users");
      if (error) throw error;
      const usersData = data as { users?: unknown[] } | null;
      return Array.isArray(usersData?.users) ? usersData.users.length : 0;
    },
  });

  const userReports = useQuery({
    queryKey: ["admin-count-user-reports-unread"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_reports")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const appUpdates = useQuery({
    queryKey: ["admin-count-app-update-broadcasts"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("app_update_broadcasts")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const cards = [
    { label: "Reported Users", count: userReports.data, to: "/admin/user-reports", icon: Flag, hint: "Unread reports" },
    { label: "Categories", count: cats.data, to: "/admin/categories", icon: FolderOpen },
    { label: "Listings", count: lists.data, to: "/admin/listings", icon: List },
    { label: "Events", count: events.data, to: "/admin/events", icon: Calendar },
    { label: "Active Specials", count: specials.data, to: "/admin/specials", icon: Tag },
    
    { label: "Resources", count: resources.data, to: "/admin/local-channels", icon: Radio },
    { label: "Users", count: users.data, to: "/admin/users", icon: Users },
    { label: "App Updates", count: appUpdates.data, to: "/admin/app-updates", icon: Megaphone, hint: "Notify all users" },
  ];


  return (
    <div>
      <h1 className="font-heading text-2xl lg:text-3xl font-[550] text-slate-950 mb-6 lg:mb-8">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="bg-card border border-border rounded-xl p-4 lg:p-5 hover:border-primary hover:shadow-sm transition-all block"
          >
            <div className="flex items-center gap-3 mb-2">
              <c.icon className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground text-sm font-medium">{c.label}</span>
            </div>
            <p className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
              {c.count ?? "—"}
            </p>
            {c.hint && <p className="text-xs text-muted-foreground mt-1">{c.hint}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
