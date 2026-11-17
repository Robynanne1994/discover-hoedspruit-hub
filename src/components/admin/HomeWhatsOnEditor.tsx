import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Search, Plus } from "lucide-react";

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
      const todayIso = new Date().toISOString().slice(0, 10);
      let q = supabase
        .from("events")
        .select("id, title, image_url, date, start_date, end_date, location")
        .or(`end_date.gte.${todayIso},start_date.gte.${todayIso}`)
        .order("start_date", { ascending: true, nullsFirst: false })
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
    <section aria-label="What's On" className="bg-card text-card-foreground border border-border rounded-xl p-4 sm:p-6 space-y-5 shadow-sm">
      <div className="border-b border-border pb-4">
        <h3 className="font-bold text-lg text-foreground">What's On (Featured Events)</h3>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-3 leading-6">
          Selected ({curatedIds.length}/{MAX}) — {curatedIds.length === 0 ? "showing upcoming events" : "showing curated picks"}
        </p>
        <div className="divide-y divide-border">
          {curatedEvents.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 py-3">
              {ev.image_url && <img src={ev.image_url} alt="" className="w-12 h-12 shrink-0 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground break-words">{ev.title}</p>
                <p className="text-sm text-muted-foreground break-words">{ev.date}{ev.location ? ` · ${ev.location}` : ""}</p>
              </div>
              <Button size="icon" className="h-7 w-7 shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={() => remove(ev.id)} disabled={saveMutation.isPending} aria-label={`Remove ${ev.title}`} title={`Remove ${ev.title}`}>
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
              aria-label="Search What's On Events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-12 bg-card border-primary/30 focus-visible:ring-primary"
            />
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {available.map((ev) => (
              <Button
                key={ev.id}
                onClick={() => add(ev.id)}
                variant="ghost"
                disabled={saveMutation.isPending}
                aria-label={`Add ${ev.title}`}
                className="flex items-center justify-start gap-3 w-full h-auto min-h-16 text-left p-3 rounded-none whitespace-normal text-foreground hover:bg-surface-inset hover:text-foreground"
              >
                {ev.image_url && <img src={ev.image_url} alt="" className="w-12 h-12 shrink-0 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold break-words">{ev.title}</p>
                  <p className="text-sm font-normal text-muted-foreground break-words">{ev.date}{ev.location ? ` · ${ev.location}` : ""}</p>
                </div>
                <Plus className="h-4 w-4 text-primary shrink-0" />
              </Button>
            ))}
          </div>
        </div>
      )}

      {curatedIds.length > 0 && (
        <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate([])}>
          Clear All (Use Upcoming Events)
        </Button>
      )}
    </section>
  );
};

export default HomeWhatsOnEditor;
