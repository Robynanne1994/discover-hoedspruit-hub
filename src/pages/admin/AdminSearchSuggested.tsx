import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  X,
  Search,
  GripVertical,
  Plus,
  Sparkles,
  Store,
  CircleAlert,
  RotateCcw,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SECTION_KEY = "search-suggested-listings";
const MAX = 15;

interface Listing {
  id: string;
  title: string;
  image_url: string | null;
  location: string | null;
  is_active?: boolean | null;
}

const AdminSearchSuggested = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [ids, setIds] = useState<string[]>([]);

  const { data: curatedIds = [], isLoading: loadingSaved } = useQuery({
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

  useEffect(() => {
    setIds(curatedIds);
  }, [curatedIds]);

  const { data: curatedListings = [] } = useQuery({
    queryKey: ["curated-search-suggested", ids],
    queryFn: async () => {
      if (!ids.length) return [];
      const { data } = await supabase
        .from("listings")
        .select("id, title, image_url, location, is_active")
        .in("id", ids);
      const map = new Map((data || []).map((l) => [l.id, l]));
      return ids.map((id) => map.get(id)).filter(Boolean) as Listing[];
    },
    enabled: ids.length > 0,
  });

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ["admin-listing-search-suggested", search],
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select("id, title, image_url, location, is_active")
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

  const persist = (next: string[]) => {
    setIds(next);
    saveMutation.mutate(next);
  };

  const add = (id: string) => {
    if (ids.includes(id)) return;
    if (ids.length >= MAX) {
      toast.error(`Maximum ${MAX} listings`);
      return;
    }
    persist([...ids, id]);
  };
  const remove = (id: string) => persist(ids.filter((c) => c !== id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = ids.findIndex((i) => i === active.id);
    const newIdx = ids.findIndex((i) => i === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    persist(arrayMove(ids, oldIdx, newIdx));
  };

  const available = searchResults.filter((l) => !ids.includes(l.id));
  const full = ids.length >= MAX;
  const hiddenCount = curatedListings.filter((l) => l.is_active !== true).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-tint border border-border">
          <Sparkles className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
            Search Suggestions
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-6">
            Pick the listings shown under &ldquo;Suggested&rdquo; on the app&apos;s Search page before
            anyone types. Drag to set the order. Leave it empty to fall back to the automatic default:
            featured first, then most recent.
          </p>
        </div>
      </div>

      <section className="bg-card text-card-foreground border border-border rounded-xl shadow-sm">
        <div className="px-5 py-4 rounded-t-xl bg-primary-tint border-b border-border flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Suggested Listings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shown in this order. Drag the handle, or focus it and use the arrow keys.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--filter-ink)] text-primary-foreground tabular-nums">
            {ids.length} of {MAX}
          </span>
        </div>

        <div className="p-5">
          {loadingSaved ? (
            <p className="text-sm text-muted-foreground">Loading&hellip;</p>
          ) : curatedListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-primary-tint/60 px-5 py-8 text-center">
              <Search className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Nothing suggested yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                The app will use the default suggestions until you add a listing below.
              </p>
            </div>
          ) : (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {curatedListings.map((listing, idx) => (
                      <SortableRow
                        key={listing.id}
                        listing={listing}
                        index={idx}
                        last={idx === curatedListings.length - 1}
                        onRemove={() => remove(listing.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {hiddenCount > 0 && (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-destructive">
                  <CircleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {hiddenCount === 1
                    ? "1 suggested listing is not active, so users will not see it."
                    : `${hiddenCount} suggested listings are not active, so users will not see them.`}
                </p>
              )}
            </>
          )}
        </div>

        {ids.length > 0 && (
          <div className="border-t border-border px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Changes save automatically.</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={saveMutation.isPending}
              onClick={() => persist([])}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear All (Use Default)
            </Button>
          </div>
        )}
      </section>

      <section className="bg-card text-card-foreground border border-border rounded-xl shadow-sm">
        <div className="px-5 py-4 rounded-t-xl bg-primary-tint border-b border-border flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Add Listings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Search by business name and tap Add.
            </p>
          </div>
          {search.trim() && (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {available.length} {available.length === 1 ? "result" : "results"}
            </span>
          )}
        </div>

        <div className="p-5">
          {full ? (
            <div className="rounded-xl border border-dashed border-border bg-primary-tint/60 px-5 py-8 text-center">
              <p className="text-sm font-semibold text-foreground">Suggested list is full</p>
              <p className="text-xs text-muted-foreground mt-1">
                Remove a listing above to make room for another.
              </p>
            </div>
          ) : (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings by name&hellip;"
                  aria-label="Search listings to add"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 rounded-xl bg-card border-border pl-10 pr-10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-primary-tint"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-1 -mx-1 px-1">
                {available.map((listing) => (
                  <button
                    key={listing.id}
                    onClick={() => add(listing.id)}
                    className="group flex items-center gap-3 w-full text-left p-2 rounded-xl border border-transparent hover:border-border hover:bg-primary-tint transition-colors"
                  >
                    <Thumb listing={listing} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{listing.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {listing.location || "No location set"}
                      </p>
                    </div>
                    {listing.is_active !== true && (
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Not live
                      </span>
                    )}
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--filter-ink)] text-primary-foreground px-2.5 py-1 text-xs font-semibold opacity-90 group-hover:opacity-100">
                      <Plus className="h-3 w-3" />
                      Add
                    </span>
                  </button>
                ))}
                {available.length === 0 && (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    {searching
                      ? "Searching&hellip;"
                      : search.trim()
                        ? "No matching listings."
                        : "Type a business name to find a listing."}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

const Thumb = ({ listing, size }: { listing: Listing; size: number }) =>
  listing.image_url ? (
    <img
      src={listing.image_url}
      alt=""
      style={{ width: size, height: size }}
      className="shrink-0 rounded-lg object-cover border border-border"
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="shrink-0 grid place-items-center rounded-lg bg-primary-tint border border-border text-muted-foreground"
    >
      <Store className="h-4 w-4" />
    </span>
  );

const SortableRow = ({
  listing,
  index,
  last,
  onRemove,
}: {
  listing: Listing;
  index: number;
  last: boolean;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: listing.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${listing.title}`}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="shrink-0 w-5 text-center text-xs font-semibold text-muted-foreground tabular-nums">
        {index + 1}
      </span>
      <Thumb listing={listing} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{listing.title}</p>
        <p className="text-xs text-muted-foreground truncate">{listing.location || "No location set"}</p>
      </div>
      {listing.is_active !== true && (
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Not live
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${listing.title}`}
        className={`shrink-0 grid h-7 w-7 place-items-center rounded-full bg-[var(--filter-ink)] text-primary-foreground hover:bg-primary-hover ${
          last ? "" : ""
        }`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default AdminSearchSuggested;
