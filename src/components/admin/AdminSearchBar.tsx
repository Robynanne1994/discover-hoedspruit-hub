import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** The search field shown above admin tables, matching the Listings page. */
const AdminSearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="relative mb-4">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="pl-9" />
  </div>
);

export const matchesSearch = (q: string, ...fields: unknown[]) => {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return fields.some((f) => (Array.isArray(f) ? f.join(" ") : String(f ?? "")).toLowerCase().includes(t));
};

export default AdminSearchBar;
