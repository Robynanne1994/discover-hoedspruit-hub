import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, List, Calendar } from "lucide-react";

const AdminDashboard = () => {
  const { data: catCount } = useQuery({
    queryKey: ["admin-cat-count"],
    queryFn: async () => {
      const { count } = await supabase.from("categories").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });
  const { data: listCount } = useQuery({
    queryKey: ["admin-list-count"],
    queryFn: async () => {
      const { count } = await supabase.from("listings").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });
  const { data: eventCount } = useQuery({
    queryKey: ["admin-event-count"],
    queryFn: async () => {
      const { count } = await supabase.from("events").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const stats = [
    { label: "Categories", count: catCount, icon: FolderOpen },
    { label: "Listings", count: listCount, icon: List },
    { label: "Events", count: eventCount, icon: Calendar },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-6 lg:mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-2">
              <s.icon className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground text-sm font-medium">{s.label}</span>
            </div>
            <p className="font-heading text-2xl lg:text-3xl font-bold text-foreground">{s.count ?? "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
