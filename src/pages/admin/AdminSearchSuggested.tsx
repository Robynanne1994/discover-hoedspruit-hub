import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Search, ArrowUp, ArrowDown } from "lucide-react";

const SECTION_KEY = "search-suggested-listings";
const MAX = 15;

interface Listing {
  id: string;
  title: string;
  image_url: string | null;
  location: string | null;
}

const AdminSearchSuggested = () => {
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

  const { data: curatedListings = [] } = useQuery({
    queryKey: ["curated-search-suggested", curatedIds],
    queryFn: async () => {
      if (!curatedIds.length) return [];
      const { data } = await supabase
        .from("listings")
        .select("id, title, image_url, location")
        .in("id", curatedIds);
      const map = new Map((data || []).map((l) => [l.id, l]));
      return curatedIds.map((id) => map.get(id)).filter(Boolean) as Listing[];
    },
    enabled: curatedIds.length > 0,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["admin-listing-search-suggested", search],
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select("id, title, image_url, location")
        .order("title", { ascending: true })
        .limit(30);
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      const { data } = await q;
      return (data || []) as Listing[];
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
      queryClient.invalidateQueries({ queryKey: ["curated-search-suggested"] });
      queryClient.invalidateQueries({ queryKey: ["search-listings"] });
      toast.success("Suggested listings updated");
    },
  });

  const add = (id: string) => {
    if (curatedIds.includes(id)) return;
    if (curatedIds.length >= MAX) {
      toast.error(`Maximum ${MAX} listings`);
      return;
    }
    saveMutation.mutate([...curatedIds, id]);
  };
  const remove = (id: string) => saveMutation.mutate(curatedIds.filter((c) => c !== id));
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...curatedIds];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    saveMutation.mutate(next);
  };

  const available = searchResults.filter((l) => !curatedIds.includes(l.id));

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl lg:text-3xl font-[550] text-slate-950 mb-2">
        Search — Suggested Listings
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Choose which listings appear (and in what order) under &ldquo;Suggested&rdquo; on the app&apos;s
        Search page before a user types a query. Leave empty to fall back to the automatic default
        (featured, then most recent).
      </p>

      <div className="border border-border rounded-lg p-4 space-y-5 bg-card">
        <div>
          <p className="text-sm font-medium text-slate-950 mb-2">
            Selected ({curatedIds.length}/{MAX})
          </p>
          {curatedListings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              None selected yet — the app will use the default suggestions.
            </p>
          ) : (
            <div className="space-y-2">
              {curatedListings.map((listing, idx) => (
                <div key={listing.id} className="flex items-center gap-2 bg-muted rounded-lg p-2">
                  <div className="flex flex-col">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={idx === 0}
                      onClick={() => move(idx, -1)}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={idx === curatedListings.length - 1}
                      onClick={() => move(idx, 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <span className="w-6 text-center text-xs font-semibold text-muted-foreground">
                    {idx + 1}
                  </span>
                  {listing.image_url && (
                    <img
                      src={listing.image_url}
                      alt=""
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-slate-950">{listing.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{listing.location}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(listing.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {curatedIds.length < MAX && (
          <div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search listings to add..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1">
              {available.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => add(listing.id)}
                  className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  {listing.image_url && (
                    <img
                      src={listing.image_url}
                      alt=""
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-slate-950">{listing.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{listing.location}</p>
                  </div>
                </button>
              ))}
              {available.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">No matching listings.</p>
              )}
            </div>
          </div>
        )}

        {curatedIds.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => saveMutation.mutate([])}>
            Clear all (use default)
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdminSearchSuggested;
