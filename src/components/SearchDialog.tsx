import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, MapPin, CalendarDays, FolderOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: results, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query.trim()) return { listings: [], categories: [], events: [] };

      const term = `%${query.trim()}%`;

      const [listingsRes, categoriesRes, eventsRes] = await Promise.all([
        supabase
          .from("listings")
          .select("id, title, location, category_id")
          .ilike("title", term)
          .limit(6),
        supabase
          .from("categories")
          .select("id, title")
          .ilike("title", term)
          .limit(4),
        supabase
          .from("events")
          .select("id, title, date, location")
          .ilike("title", term)
          .limit(4),
      ]);

      return {
        listings: listingsRes.data ?? [],
        categories: categoriesRes.data ?? [],
        events: eventsRes.data ?? [],
      };
    },
    enabled: open && query.trim().length > 0,
    staleTime: 1000,
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  const goTo = useCallback(
    (path: string) => {
      onOpenChange(false);
      navigate(path);
    },
    [navigate, onOpenChange]
  );

  const hasResults =
    (results?.listings?.length ?? 0) +
      (results?.categories?.length ?? 0) +
      (results?.events?.length ?? 0) >
    0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden [&>button.absolute]:hidden">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings, categories, events…"
            className="border-0 shadow-none focus-visible:ring-0 h-12 text-base placeholder:text-muted-foreground/60"
            autoFocus
          />
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
          <button
            onClick={() => onOpenChange(false)}
            className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-1 text-[10px] font-mono text-muted-foreground hover:bg-muted/80 transition-colors shrink-0"
          >
            ESC
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.trim().length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Start typing to search…
            </div>
          )}

          {query.trim().length > 0 && !isFetching && !hasResults && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}

          {results?.categories && results.categories.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Categories
              </p>
              {results.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => goTo(`/category/${cat.id}`)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{cat.title}</span>
                </button>
              ))}
            </div>
          )}

          {results?.listings && results.listings.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Listings
              </p>
              {results.listings.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => goTo(`/listing/${listing.id}`)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm text-foreground block truncate">{listing.title}</span>
                    {listing.location && (
                      <span className="text-xs text-muted-foreground truncate block">{listing.location}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {results?.events && results.events.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Events
              </p>
              {results.events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => goTo(`/events`)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm text-foreground block truncate">{event.title}</span>
                    {event.location && (
                      <span className="text-xs text-muted-foreground truncate block">{event.location}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Search across all content</span>
          <span className="hidden sm:inline">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">⌘</kbd>
            {" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">K</kbd>
            {" "}to toggle
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
