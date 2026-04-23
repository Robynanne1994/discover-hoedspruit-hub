import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

type EditableRow = Record<string, any> & { id: string; _dirty: boolean };

const COLUMNS = [
  { key: "title", label: "Title", type: "text", width: "200px" },
  { key: "description", label: "Description", type: "text", width: "200px" },
  { key: "location", label: "Location", type: "text", width: "160px" },
  { key: "phone", label: "Phone", type: "text", width: "130px" },
  { key: "email", label: "Email", type: "text", width: "160px" },
  { key: "website", label: "Website", type: "text", width: "160px" },
  { key: "website_label", label: "Website Display Text", type: "text", width: "180px" },
  { key: "whatsapp", label: "WhatsApp", type: "text", width: "130px" },
  { key: "google_maps_link", label: "Google Maps", type: "text", width: "160px" },
  { key: "google_rating", label: "Rating", type: "number", width: "80px" },
  { key: "google_reviews_count", label: "Reviews #", type: "number", width: "90px" },
  { key: "google_reviews_url", label: "Reviews URL", type: "text", width: "160px" },
  { key: "is_featured", label: "Featured", type: "switch", width: "80px" },
  { key: "show_attributes", label: "Show Attrs", type: "switch", width: "90px" },
  { key: "good_for_kids", label: "Kids", type: "switch", width: "70px" },
  { key: "pets_allowed", label: "Pets", type: "switch", width: "70px" },
  { key: "wheelchair_friendly", label: "Wheelchair", type: "switch", width: "90px" },
  { key: "smoking_allowed", label: "Smoking", type: "switch", width: "80px" },
  { key: "kids_playground", label: "Playground", type: "switch", width: "90px" },
  { key: "kids_menu", label: "Kids Menu", type: "switch", width: "90px" },
  { key: "high_chairs", label: "High Chairs", type: "switch", width: "95px" },
  { key: "has_toilet", label: "Toilet", type: "switch", width: "70px" },
  { key: "has_wifi", label: "Wi-Fi", type: "switch", width: "70px" },
  { key: "has_free_wifi", label: "Free Wi-Fi", type: "switch", width: "85px" },
] as const;

const AdminBulkEdit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [saving, setSaving] = useState(false);

  const ids = searchParams.get("ids")?.split(",") ?? [];

  const { data: listings, isLoading } = useQuery({
    queryKey: ["bulk-edit-listings", ids.join(",")],
    queryFn: async () => {
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .in("id", ids)
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: ids.length > 0,
  });

  useEffect(() => {
    if (listings) {
      setRows(listings.map((l) => ({ ...l, _dirty: false })));
    }
  }, [listings]);

  const updateCell = useCallback((id: string, key: string, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value, _dirty: true } : r))
    );
  }, []);

  const dirtyRows = rows.filter((r) => r._dirty);

  const saveAll = async () => {
    if (!dirtyRows.length) return;
    setSaving(true);
    try {
      for (const row of dirtyRows) {
        const payload: Record<string, any> = {};
        for (const col of COLUMNS) {
          payload[col.key] = row[col.key];
        }
        const { error } = await supabase.from("listings").update(payload as any).eq("id", row.id);
        if (error) throw error;
      }
      toast.success(`${dirtyRows.length} listing(s) saved`);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      setRows((prev) => prev.map((r) => ({ ...r, _dirty: false })));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!ids.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No listings selected for bulk editing.</p>
        <Button variant="outline" onClick={() => navigate("/admin/listings")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Listings
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-background z-10 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/listings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Bulk Edit</h1>
            <p className="text-sm text-muted-foreground">{rows.length} listing(s) · {dirtyRows.length} unsaved change(s)</p>
          </div>
        </div>
        <Button onClick={saveAll} disabled={saving || !dirtyRows.length} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="border border-border rounded-xl overflow-auto max-h-[calc(100vh-160px)]">
          <table className="text-xs border-collapse">
            <thead className="bg-muted sticky top-0 z-[5]">
              <tr>
                <th className="p-2 text-left font-medium text-muted-foreground border-r border-border sticky left-0 bg-muted z-[6] min-w-[180px]">
                  Title
                </th>
                {COLUMNS.filter((c) => c.key !== "title").map((col) => (
                  <th
                    key={col.key}
                    className="p-2 text-left font-medium text-muted-foreground border-r border-border whitespace-nowrap"
                    style={{ minWidth: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`border-t border-border ${row._dirty ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                  {/* Sticky title column */}
                  <td className="p-1 border-r border-border sticky left-0 bg-card z-[1] min-w-[180px]">
                    <Input
                      value={row.title ?? ""}
                      onChange={(e) => updateCell(row.id, "title", e.target.value)}
                      className="h-7 text-xs border-transparent focus:border-primary"
                    />
                  </td>
                  {COLUMNS.filter((c) => c.key !== "title").map((col) => (
                    <td key={col.key} className="p-1 border-r border-border" style={{ minWidth: col.width }}>
                      {col.type === "switch" ? (
                        <div className="flex justify-center">
                          <Switch
                            checked={row[col.key] === true}
                            onCheckedChange={(v) => updateCell(row.id, col.key, v)}
                          />
                        </div>
                      ) : col.type === "number" ? (
                        <Input
                          type="number"
                          step={col.key === "google_rating" ? "0.1" : "1"}
                          value={row[col.key] ?? ""}
                          onChange={(e) => updateCell(row.id, col.key, e.target.value ? parseFloat(e.target.value) : null)}
                          className="h-7 text-xs border-transparent focus:border-primary"
                        />
                      ) : (
                        <Input
                          value={row[col.key] ?? ""}
                          onChange={(e) => updateCell(row.id, col.key, e.target.value || null)}
                          className="h-7 text-xs border-transparent focus:border-primary"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBulkEdit;
