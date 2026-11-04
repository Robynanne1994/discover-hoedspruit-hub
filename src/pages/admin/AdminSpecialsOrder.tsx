import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, GripVertical, RotateCcw, Save } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { sortSpecialsDefault } from "@/lib/specialOrder";
import { isVisibleSpecial, specialToday } from "@/lib/specialVisibility";

type Row = { id: string; title: string; business_name: string; is_featured: boolean; sort_position: number | null; created_at: string };

const AdminSpecialsOrder = () => {
  const qc = useQueryClient();
  const [items, setItems] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-specials-order"],
    queryFn: async () => {
      const today = specialToday();
      const { data, error } = await supabase
        .from("specials")
        .select("*")
        .or(`valid_until.is.null,valid_until.gte.${today}`);
      if (error) throw error;
      const visible = (data || []).filter((s) => isVisibleSpecial(s, today)) as any[];
      // Featured specials always sit on top of the page, so they are left out of this order.
      return sortSpecialsDefault(visible.filter((s) => !s.is_featured)) as Row[];
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
    qc.invalidateQueries({ queryKey: ["all-specials"] });
  };

  const save = async () => {
    setSaving(true);
    try {
      const results = await Promise.all(
        items.map((it, idx) => supabase.from("specials").update({ sort_position: idx + 1 }).eq("id", it.id)),
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
    if (!confirm("Clear the custom order? Specials will fall back to newest first.")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("specials").update({ sort_position: null }).not("sort_position", "is", null);
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
          <Link to="/admin/specials"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <h1 className="text-xl font-[550]">Order Specials</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Drag specials into the order you want on the Specials page under All. Featured specials always show at the top, so they are not listed here.
        New specials without a place in this order appear after these, newest first.
      </p>
      <div className="flex gap-2 mb-4">
        <Button onClick={save} disabled={saving || isLoading} className="gap-1"><Save className="h-4 w-4" /> Save Order</Button>
        <Button onClick={reset} disabled={saving || isLoading} variant="outline" className="gap-1"><RotateCcw className="h-4 w-4" /> Clear Custom Order</Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No specials to order.</p>
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
        <div className="text-xs text-muted-foreground truncate">{item.business_name}</div>
      </div>
    </div>
  );
};

export default AdminSpecialsOrder;
