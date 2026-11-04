import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isBefore, startOfToday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, GripVertical, RotateCcw, Save } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { compareFeaturedEvents } from "@/lib/featuredEventOrder";
import { getEventSortDate } from "@/lib/eventDates";
import { getNextOccurrence } from "@/lib/eventSchedule";

type Row = { id: string; title: string; date: string; featured_position: number | null; _parsed: Date | null };

const AdminFeaturedEventsOrder = () => {
  const qc = useQueryClient();
  const [items, setItems] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-featured-events-order"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("is_featured", true);
      if (error) throw error;
      const today = startOfToday();
      const rows = (data || []).map((e: any) => {
        const next = getNextOccurrence(e, new Date());
        return { ...e, _parsed: next ? next.date : getEventSortDate(e) };
      });
      return rows
        .filter((e: any) => !e._parsed || !isBefore(e._parsed, today))
        .sort(compareFeaturedEvents) as Row[];
    },
  });

  useEffect(() => { if (data) setItems(data); }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const o = items.findIndex((i) => i.id === active.id);
    const n = items.findIndex((i) => i.id === over.id);
    if (o >= 0 && n >= 0) setItems(arrayMove(items, o, n));
  };

  const done = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ["events-page"] });
  };

  const save = async () => {
    setSaving(true);
    try {
      const results = await Promise.all(
        items.map((it, idx) => supabase.from("events").update({ featured_position: idx + 1 }).eq("id", it.id)),
      );
      const err = results.find((r) => r.error)?.error;
      if (err) throw err;
      toast.success("Order saved");
      done();
    } catch (err: any) {
      toast.error(err.message || "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm("Clear the custom order? Featured events will fall back to date order.")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("events").update({ featured_position: null }).not("featured_position", "is", null);
      if (error) throw error;
      toast.success("Custom order cleared");
      done();
    } catch (err: any) {
      toast.error(err.message || "Failed to reset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/events"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <h1 className="text-xl font-[550]">Order Featured Events</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Drag featured events into the order you want in the Featured Events carousel. Featured events without a place here follow, soonest first.
      </p>
      <div className="flex gap-2 mb-4">
        <Button onClick={save} disabled={saving || isLoading} className="gap-1"><Save className="h-4 w-4" /> Save Order</Button>
        <Button onClick={reset} disabled={saving || isLoading} variant="outline" className="gap-1"><RotateCcw className="h-4 w-4" /> Clear Custom Order</Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming featured events.</p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((it, idx) => <SortableRow key={it.id} item={it} index={idx} />)}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

const SortableRow = ({ item, index }: { item: Row; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className="flex items-center gap-3 px-3 py-2 border-t border-border first:border-t-0 bg-background"
    >
      <button {...attributes} {...listeners} aria-label="Drag to reorder" className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="text-sm text-muted-foreground w-8 tabular-nums">{index + 1}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground truncate">{item.title}</div>
        <div className="text-xs text-muted-foreground truncate">{item.date}</div>
      </div>
    </div>
  );
};

export default AdminFeaturedEventsOrder;
