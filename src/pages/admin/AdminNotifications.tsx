import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";

const FILTER_TYPES = [
  { value: "events_new", label: "New Events", sourceType: "event_tag" as const },
  { value: "listings_new", label: "New Listings", sourceType: "category" as const },
  { value: "listings_updates", label: "Listing Updates", sourceType: "category" as const },
  { value: "specials_new", label: "New Specials", sourceType: "special_category" as const },
];

type FilterType = (typeof FILTER_TYPES)[number]["value"];

interface Group { id: string; filter_type: string; label: string; sort_order: number; }
interface Item { id: string; group_id: string; slug: string; label: string; sort_order: number; }
interface Mapping { id: string; item_id: string; source_type: string; source_value: string; }

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

const AdminNotifications = () => {
  const [active, setActive] = useState<FilterType>("events_new");
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [sources, setSources] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const meta = FILTER_TYPES.find((f) => f.value === active)!;

  const load = async () => {
    setLoading(true);
    const { data: g } = await supabase
      .from("notification_groups")
      .select("*")
      .eq("filter_type", active)
      .order("sort_order");
    const groupIds = (g ?? []).map((x) => x.id);
    const { data: i } = groupIds.length
      ? await supabase.from("notification_items").select("*").in("group_id", groupIds).order("sort_order")
      : { data: [] as Item[] };
    const itemIds = (i ?? []).map((x) => x.id);
    const { data: m } = itemIds.length
      ? await supabase.from("notification_item_mappings").select("*").in("item_id", itemIds)
      : { data: [] as Mapping[] };
    setGroups(g ?? []);
    setItems(i ?? []);
    setMappings(m ?? []);
    setLoading(false);
  };

  const loadSources = async () => {
    if (meta.sourceType === "category") {
      const { data } = await supabase.from("categories").select("id,title").order("title");
      setSources((data ?? []).map((c) => ({ value: c.id, label: c.title })));
    } else if (meta.sourceType === "event_tag") {
      const { data } = await supabase.from("events").select("tag");
      const tags = Array.from(new Set((data ?? []).map((e: any) => e.tag).filter(Boolean))).sort();
      setSources(tags.map((t) => ({ value: t as string, label: t as string })));
    } else if (meta.sourceType === "special_category") {
      const { data } = await supabase.from("specials").select("category");
      const cats = Array.from(new Set((data ?? []).map((s: any) => s.category).filter(Boolean))).sort();
      setSources(cats.map((c) => ({ value: c as string, label: c as string })));
    }
  };

  useEffect(() => {
    load();
    loadSources();
  }, [active]);

  const addGroup = async () => {
    const label = prompt("Sub-heading label?");
    if (!label) return;
    const { error } = await supabase.from("notification_groups").insert({
      filter_type: active,
      label,
      sort_order: groups.length,
    });
    if (error) return toast.error(error.message);
    toast.success("Sub-heading added");
    load();
  };

  const renameGroup = async (g: Group) => {
    const label = prompt("New label?", g.label);
    if (!label || label === g.label) return;
    const { error } = await supabase.from("notification_groups").update({ label }).eq("id", g.id);
    if (error) return toast.error(error.message);
    load();
  };

  const moveGroup = async (g: Group, dir: -1 | 1) => {
    const sorted = [...groups].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((x) => x.id === g.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await supabase.from("notification_groups").update({ sort_order: swap.sort_order }).eq("id", g.id);
    await supabase.from("notification_groups").update({ sort_order: g.sort_order }).eq("id", swap.id);
    load();
  };

  const deleteGroup = async (g: Group) => {
    if (!confirm(`Delete sub-heading "${g.label}" and all its toggles?`)) return;
    const { error } = await supabase.from("notification_groups").delete().eq("id", g.id);
    if (error) return toast.error(error.message);
    load();
  };

  const addItem = async (group_id: string) => {
    const label = prompt("Toggle label?");
    if (!label) return;
    const slug = slugify(label);
    const count = items.filter((i) => i.group_id === group_id).length;
    const { error } = await supabase.from("notification_items").insert({
      group_id,
      label,
      slug,
      sort_order: count,
    });
    if (error) return toast.error(error.message);
    toast.success("Toggle added");
    load();
  };

  const renameItem = async (it: Item) => {
    const label = prompt("New label?", it.label);
    if (!label || label === it.label) return;
    const { error } = await supabase.from("notification_items").update({ label }).eq("id", it.id);
    if (error) return toast.error(error.message);
    load();
  };

  const moveItem = async (it: Item, dir: -1 | 1) => {
    const siblings = items.filter((i) => i.group_id === it.group_id).sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex((x) => x.id === it.id);
    const swap = siblings[idx + dir];
    if (!swap) return;
    await supabase.from("notification_items").update({ sort_order: swap.sort_order }).eq("id", it.id);
    await supabase.from("notification_items").update({ sort_order: it.sort_order }).eq("id", swap.id);
    load();
  };

  const deleteItem = async (it: Item) => {
    if (!confirm(`Delete toggle "${it.label}"?`)) return;
    const { error } = await supabase.from("notification_items").delete().eq("id", it.id);
    if (error) return toast.error(error.message);
    load();
  };

  const addMapping = async (item_id: string, value: string) => {
    if (!value) return;
    const { error } = await supabase
      .from("notification_item_mappings")
      .insert({ item_id, source_type: meta.sourceType, source_value: value });
    if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    load();
  };

  const removeMapping = async (id: string) => {
    const { error } = await supabase.from("notification_item_mappings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Notifications</h1>
        <p className="text-sm opacity-80 mt-1">
          Edit the sub-headings and toggle options shown when users refine each notification type. Assign which
          categories / tags feed into each toggle.
        </p>
      </div>

      <Tabs value={active} onValueChange={(v) => setActive(v as FilterType)}>
        <TabsList className="bg-card">
          {FILTER_TYPES.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
          ))}
        </TabsList>

        {FILTER_TYPES.map((f) => (
          <TabsContent key={f.value} value={f.value} className="mt-4 space-y-4">
            {loading && <div className="text-sm">Loading…</div>}

            {groups.sort((a, b) => a.sort_order - b.sort_order).map((g) => {
              const groupItems = items.filter((i) => i.group_id === g.id).sort((a, b) => a.sort_order - b.sort_order);
              return (
                <div key={g.id} className="bg-card rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => renameGroup(g)} className="text-lg font-semibold flex-1 text-left hover:underline text-slate-950">
                      {g.label}
                    </button>
                    <Button size="sm" variant="ghost" onClick={() => moveGroup(g, -1)}><ChevronUp className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => moveGroup(g, 1)}><ChevronDown className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteGroup(g)}><Trash2 className="h-4 w-4" /></Button>
                  </div>

                  <div className="space-y-2">
                    {groupItems.map((it) => {
                      const itMappings = mappings.filter((m) => m.item_id === it.id);
                      const usedValues = new Set(itMappings.map((m) => m.source_value));
                      const available = sources.filter((s) => !usedValues.has(s.value));
                      return (
                        <div key={it.id} className="border border-border rounded-md p-3 space-y-2 bg-background/50">
                          <div className="flex items-center gap-2">
                            <button onClick={() => renameItem(it)} className="font-medium flex-1 text-left hover:underline">
                              {it.label} <span className="text-xs opacity-60">({it.slug})</span>
                            </button>
                            <Button size="sm" variant="ghost" onClick={() => moveItem(it, -1)}><ChevronUp className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => moveItem(it, 1)}><ChevronDown className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteItem(it)}><Trash2 className="h-4 w-4" /></Button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {itMappings.map((m) => {
                              const lbl = sources.find((s) => s.value === m.source_value)?.label ?? m.source_value;
                              return (
                                <span key={m.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-xs">
                                  {lbl}
                                  <button onClick={() => removeMapping(m.id)} className="hover:opacity-70">
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              );
                            })}
                            {itMappings.length === 0 && (
                              <span className="text-xs opacity-60">No assignments yet</span>
                            )}
                          </div>

                          <select
                            className="w-full text-sm bg-background border border-border rounded px-2 py-1.5"
                            value=""
                            onChange={(e) => {
                              addMapping(it.id, e.target.value);
                              e.target.value = "";
                            }}
                          >
                            <option value="">+ Assign {meta.sourceType === "category" ? "category" : meta.sourceType === "event_tag" ? "event tag" : "special category"}…</option>
                            {available.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}

                    <Button size="sm" variant="outline" onClick={() => addItem(g.id)} className="w-full">
                      <Plus className="h-4 w-4 mr-1" /> Add toggle
                    </Button>
                  </div>
                </div>
              );
            })}

            <Button onClick={addGroup} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Add sub-heading
            </Button>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminNotifications;
