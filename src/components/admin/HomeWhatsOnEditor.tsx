import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Search, GripVertical } from "lucide-react";

const SECTION_KEY = "homepage-whats-on";
const MAX = 6;

interface EventRow {
  id: string;
  title: string;
  image_url: string | null;
  date: string;
  location: string | null;
}

const HomeWhatsOnEditor = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: curatedIds = [] } = useQuery({
    queryKey: ["site-content", SECTION_KEY],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", SECTION_KEY)
        .maybeSingle();
      if (data?.content && Array.isArray(data.content)) return data.content as string[];
      return [];
    },
  });

  const { data: curatedEvents = [] } = useQuery({
    queryKey: ["curated-events", curatedIds],
    queryFn: async () => {
      if (!curatedIds.length) return [];
      const { data } = await supabase
        .from("events")
        .select("id, title, image_url, date, location")
        .in("id", curatedIds);
      const map = new Map((data || []).map((e) => [e.id, e]));
      return curatedIds.map((id) => map.get(id)).filter(Boolean) as EventRow[];
    },
    enabled: curatedIds.length > 0,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["event-search", search],
    queryFn: async () => {
      let q = supabase
        .from("events")
        .select("id, title, image_url, date, location")
        .order("date", { ascending: true })
        .limit(30);
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      const { data } = await q;
      return (data || []) as EventRow[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newIds: string[]) => {
      const { data: existing } = await supabase
        .from("site_content")
        .select("id")
        .eq("section", SECTION_KEY)
        .maybeSingle();
      const value = JSON.parse(JSON.stringify(newIds));
      if (existing) {
        await supabase.from("site_content").update({ content: value }).eq("section", SECTION_KEY);
      } else {
        await supabase.from("site_content").insert([{ section: SECTION_KEY, content: value }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content", SECTION_KEY] });
      queryClient.invalidateQueries({ queryKey: ["curated-events"] });
      queryClient.invalidateQueries({ queryKey: ["home-whats-on"] });
      toast.success("Featured events updated");
    },
  });

  const add = (id: string) => {
    if (curatedIds.includes(id)) return;
    if (curatedIds.length >= MAX) {
      toast.error(`Maximum ${MAX} events`);
      return;
    }
    saveMutation.mutate([...curatedIds, id]);
  };
  const remove = (id: string) => saveMutation.mutate(curatedIds.filter((c) => c !== id));

  const available = searchResults.filter((e) => !curatedIds.includes(e.id));

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div>
        <h3 className="font-bold text-lg">What's On (Featured Events)</h3>
        <p className="text-xs text-muted-foreground">
          Pick which events appear in the homepage "What's on" section. Leave empty to auto-show upcoming events.
        </p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Selected ({curatedIds.length}/{MAX}) — {curatedIds.length === 0 ? "showing upcoming events" : "showing curated picks"}
        </p>
        <div className="space-y-2">
          {curatedEvents.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 bg-muted rounded-lg p-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {ev.image_url && <img src={ev.image_url} alt="" className="w-10 h-10 rounded object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ev.title}</p>
                <p className="text-xs text-muted-foreground truncate">{ev.date}{ev.location ? ` · ${ev.location}` : ""}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(ev.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {curatedIds.length < MAX && (
        <div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events to add..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {available.map((ev) => (
              <button
                key={ev.id}
                onClick={() => add(ev.id)}
                className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {ev.image_url && <img src={ev.image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{ev.date}{ev.location ? ` · ${ev.location}` : ""}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {curatedIds.length > 0 && (
        <Button variant="outline" size="sm" onClick={() => saveMutation.mutate([])}>
          Clear all (use upcoming events)
        </Button>
      )}
    </div>
  );
};

export default HomeWhatsOnEditor;
