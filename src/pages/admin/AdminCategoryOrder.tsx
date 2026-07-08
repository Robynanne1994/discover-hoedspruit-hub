import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, GripVertical, RotateCcw, Save } from "lucide-react";
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

type Row = { id: string; title: string; is_featured: boolean | null; hasCustomPos: boolean };

const AdminCategoryOrder = () => {
  const { id: categoryId } = useParams<{ id: string }>();
  const [items, setItems] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: category } = useQuery({
    queryKey: ["admin-cat-order-cat", categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, title").eq("id", categoryId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-cat-order-listings", categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const [{ data: junction }, { data: legacy }] = await Promise.all([
        supabase.from("listing_categories").select("listing_id").eq("category_id", categoryId!),
        supabase.from("listings").select("id").eq("category_id", categoryId!),
      ]);
      const idSet = new Set<string>();
      (junction || []).forEach((r: any) => idSet.add(r.listing_id));
      (legacy || []).forEach((r: any) => idSet.add(r.id));
      const ids = Array.from(idSet);
      if (ids.length === 0) return { rows: [] as Row[] };

      const [{ data: listings }, { data: orderRows }] = await Promise.all([
        supabase.from("listings").select("id, title, is_featured").in("id", ids),
        supabase.from("listing_category_order").select("listing_id, position").eq("category_id", categoryId!),
      ]);
      const posMap = new Map<string, number>();
      (orderRows || []).forEach((r: any) => posMap.set(r.listing_id, r.position));

      const rows: Row[] = (listings || []).map((l: any) => ({
        id: l.id,
        title: l.title,
        is_featured: l.is_featured,
        hasCustomPos: posMap.has(l.id),
      }));

      // Sort: featured first, then custom positions asc, then remaining alphabetically for admin's convenience.
      rows.sort((a, b) => {
        if (!!b.is_featured !== !!a.is_featured) return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        const ap = posMap.get(a.id);
        const bp = posMap.get(b.id);
        if (ap != null && bp != null) return ap - bp;
        if (ap != null) return -1;
        if (bp != null) return 1;
        return a.title.localeCompare(b.title);
      });
      return { rows };
    },
  });

  useEffect(() => {
    if (data?.rows) setItems(data.rows);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    setItems(arrayMove(items, oldIdx, newIdx));
  };

  const save = async () => {
    if (!categoryId) return;
    setSaving(true);
    try {
      // Wipe old order and re-insert positions for every listing in current arrangement.
      // Position 1..N assigned in the order shown.
      const { error: delErr } = await supabase
        .from("listing_category_order")
        .delete()
        .eq("category_id", categoryId);
      if (delErr) throw delErr;

      const rows = items.map((it, idx) => ({
        category_id: categoryId,
        listing_id: it.id,
        position: idx + 1,
      }));
      if (rows.length > 0) {
        const { error: insErr } = await supabase.from("listing_category_order").insert(rows);
        if (insErr) throw insErr;
      }
      toast.success("Order saved");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!categoryId) return;
    if (!confirm("Clear custom order for this category? Listings will fall back to the default order.")) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("listing_category_order")
        .delete()
        .eq("category_id", categoryId);
      if (error) throw error;
      toast.success("Custom order cleared");
      refetch();
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
          <Link to="/admin/categories"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <h1 className="text-xl font-semibold">Order listings — {category?.title ?? ""}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Drag listings into the order you want them to appear on the category page (default sort).
        Featured listings still appear at the top of their group. Clear the custom order to fall back to the default arrangement.
      </p>
      <div className="flex gap-2 mb-4">
        <Button onClick={save} disabled={saving || isLoading} className="gap-1"><Save className="h-4 w-4" /> Save order</Button>
        <Button onClick={reset} disabled={saving || isLoading} variant="outline" className="gap-1"><RotateCcw className="h-4 w-4" /> Clear custom order</Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No listings in this category yet.</p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((it, idx) => (
                <SortableRow key={it.id} item={it} index={idx} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

const SortableRow = ({ item, index }: { item: Row; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 px-3 py-2 border-t border-border first:border-t-0 bg-background">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="text-sm text-muted-foreground w-8 tabular-nums">{index + 1}</div>
      <div className="flex-1 text-sm text-foreground truncate">{item.title}</div>
      {item.is_featured && (
        <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary rounded px-1.5 py-0.5">Featured</span>
      )}
    </div>
  );
};

export default AdminCategoryOrder;
