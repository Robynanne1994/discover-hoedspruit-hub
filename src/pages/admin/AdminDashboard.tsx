import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderOpen,
  List,
  Calendar,
  ShieldCheck,
  Inbox,
  Tag,
  Newspaper,
  Radio,
  Users,
  Briefcase,
} from "lucide-react";

const useCount = (key: string, table: string) =>
  useQuery({
    queryKey: [`admin-count-${key}`],
    queryFn: async () => {
      const { count } = await supabase.from(table as any).select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

const AdminDashboard = () => {
  const cats = useCount("cats", "categories");
  const lists = useCount("lists", "listings");
  const events = useCount("events", "events");
  const specials = useCount("specials", "specials");
  const articles = useCount("articles", "articles");
  const resources = useCount("resources", "bush_telegraph_resources");
  const businesses = useCount("businesses", "business_accounts");
  const contacts = useCount("contacts", "contact_submissions");
  const feedback = useCount("feedback", "feedback");

  // moderation = pending across the three pending tables
  const moderation = useQuery({
    queryKey: ["admin-count-moderation"],
    queryFn: async () => {
      const tables = ["listing_edits_pending", "events_pending", "specials_pending"] as const;
      const results = await Promise.all(
        tables.map((t) =>
          supabase.from(t).select("*", { count: "exact", head: true }).eq("status", "pending"),
        ),
      );
      return results.reduce((sum, r) => sum + (r.count ?? 0), 0);
    },
  });

  // users count via edge function (auth.users not directly queryable)
  const users = useQuery({
    queryKey: ["admin-count-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-users");
      if (error) throw error;
      return Array.isArray((data as any)?.users) ? (data as any).users.length : 0;
    },
  });

  const submissions = (contacts.data ?? 0) + (feedback.data ?? 0);

  const cards = [
    { label: "Moderation", count: moderation.data, to: "/admin/moderation", icon: ShieldCheck, hint: "Pending items" },
    { label: "Submissions", count: submissions, to: "/admin/submissions", icon: Inbox, hint: "Contact + feedback" },
    { label: "Categories", count: cats.data, to: "/admin/categories", icon: FolderOpen },
    { label: "Listings", count: lists.data, to: "/admin/listings", icon: List },
    { label: "Events", count: events.data, to: "/admin/events", icon: Calendar },
    { label: "Specials", count: specials.data, to: "/admin/specials", icon: Tag },
    { label: "Lowveld Lowdown", count: articles.data, to: "/admin/articles", icon: Newspaper },
    { label: "Resources", count: resources.data, to: "/admin/bush-telegraph", icon: Radio },
    { label: "Users", count: users.data, to: "/admin/users", icon: Users },
    { label: "Businesses", count: businesses.data, to: "/admin/users?tab=businesses", icon: Briefcase },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-6 lg:mb-8">
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
