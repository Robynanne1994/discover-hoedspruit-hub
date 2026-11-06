import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { channelOrderUpdates, compareChannels } from "@/lib/channelOrder";

type Channel = { id: string; title: string; platform: string; is_featured: boolean; sort_order: number };

export default function ChannelOrderDialog({ open, onOpenChange, channels }: { open: boolean; onOpenChange: (open: boolean) => void; channels: Channel[] }) {
  const qc = useQueryClient();
  const [items, setItems] = useState<Channel[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) setItems(channels.filter((channel) => !channel.is_featured).sort(compareChannels));
  }, [open, channels]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const reorder = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setItems((current) => {
      const from = current.findIndex((item) => item.id === active.id);
      const to = current.findIndex((item) => item.id === over.id);
      return from < 0 || to < 0 ? current : arrayMove(current, from, to);
    });
  };
  const save = async () => {
    setSaving(true);
    try {
      const results = await Promise.all(channelOrderUpdates(items).map(({ id, sort_order }) =>
        supabase.from("bush_telegraph_resources").update({ sort_order }).eq("id", id),
      ));
      const error = results.find((result) => result.error)?.error;
      if (error) throw error;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-bush-telegraph"] }),
        qc.invalidateQueries({ queryKey: ["bush-telegraph"] }),
        qc.invalidateQueries({ queryKey: ["home-local-channels"] }),
        qc.invalidateQueries({ queryKey: ["search-channels"] }),
        qc.invalidateQueries({ queryKey: ["my-saved-resources"] }),
        qc.invalidateQueries({ queryKey: ["user-saved-resources"] }),
        qc.invalidateQueries({ queryKey: ["user-saved-resources-full"] }),
      ]);
      toast.success("Order saved");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save order");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!saving) onOpenChange(value); }}>
      <DialogContent className="max-w-xl max-h-[85dvh] flex flex-col">
        <DialogHeader><DialogTitle>Order Local Channels</DialogTitle></DialogHeader>
        <div className="overflow-y-auto min-h-0 border border-border rounded-md" aria-label="Channel order">
          {items.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No channels to order.</p> : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder}>
              <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                {items.map((item, index) => <ChannelRow key={item.id} item={item} index={index} disabled={saving} />)}
              </SortableContext>
            </DndContext>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || items.length === 0} className="gap-2"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save Order"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChannelRow({ item, index, disabled }: { item: Channel; index: number; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, disabled });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-3 px-3 py-2 border-t border-border first:border-t-0 bg-card">
      <Button variant="ghost" size="icon" {...attributes} {...listeners} disabled={disabled} aria-label={`Move ${item.title}`} title="Drag to reorder" className="shrink-0 touch-none cursor-grab active:cursor-grabbing"><GripVertical className="h-4 w-4" /></Button>
      <span className="w-6 shrink-0 tabular-nums text-sm text-muted-foreground">{index + 1}</span>
      <div className="min-w-0 flex-1"><div className="text-sm break-words">{item.title}</div><div className="text-xs text-muted-foreground">{item.platform}</div></div>
    </div>
  );
}