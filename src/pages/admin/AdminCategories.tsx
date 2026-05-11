import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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

type Category = Tables<"categories">;
type Subcategory = Tables<"subcategories">;

const AdminCategories = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ title: "", description: "", icon: "Folder", image_url: "", sort_order: 0, is_quick_category: false });
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const [subOpen, setSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [subForm, setSubForm] = useState({ title: "", description: "", sort_order: 0, category_id: "" });

  const [orderedCats, setOrderedCats] = useState<Category[]>([]);
  const [orderedSubs, setOrderedSubs] = useState<Record<string, Subcategory[]>>({});

  const [viewSub, setViewSub] = useState<Subcategory | null>(null);

  const { data: subListings, isLoading: subListingsLoading } = useQuery({
    queryKey: ["admin-subcategory-listings", viewSub?.id],
    enabled: !!viewSub,
    queryFn: async () => {
      const { data: links, error: linkErr } = await supabase
        .from("listing_subcategories")
        .select("listing_id")
        .eq("subcategory_id", viewSub!.id);
      if (linkErr) throw linkErr;
      const ids = (links ?? []).map((l: any) => l.listing_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, location, image_url")
        .in("id", ids)
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: subcategories } = useQuery({
    queryKey: ["admin-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subcategories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Listing counts per category and subcategory
  const { data: catCounts } = useQuery({
    queryKey: ["admin-listing-categories-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listing_categories").select("category_id");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        map[r.category_id] = (map[r.category_id] ?? 0) + 1;
      });
      return map;
    },
  });

  const { data: subCounts } = useQuery({
    queryKey: ["admin-listing-subcategories-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listing_subcategories").select("subcategory_id");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        map[r.subcategory_id] = (map[r.subcategory_id] ?? 0) + 1;
      });
      return map;
    },
  });

  useEffect(() => {
    if (categories) setOrderedCats(categories);
  }, [categories]);

  useEffect(() => {
    if (subcategories) {
      const grouped: Record<string, Subcategory[]> = {};
      subcategories.forEach((s) => {
        (grouped[s.category_id] ??= []).push(s);
      });
      setOrderedSubs(grouped);
    }
  }, [subcategories]);

  const upsert = useMutation({
    mutationFn: async (values: TablesInsert<"categories">) => {
      if (editing) {
        const { error } = await supabase.from("categories").update(values).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success(editing ? "Category updated" : "Category created");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category deleted");
    },
  });

  const upsertSub = useMutation({
    mutationFn: async (values: { title: string; description: string; sort_order: number; category_id: string }) => {
      const payload = {
        title: values.title,
        description: values.description || null,
        sort_order: values.sort_order,
        category_id: values.category_id,
      };
      if (editingSub) {
        const { error } = await supabase.from("subcategories").update(payload).eq("id", editingSub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subcategories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
      toast.success(editingSub ? "Subcategory updated" : "Subcategory created");
      resetSubForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteSubMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
      toast.success("Subcategory deleted");
    },
  });

  const persistCategoryOrder = async (items: Category[]) => {
    const updates = items.map((it, idx) =>
      supabase.from("categories").update({ sort_order: idx }).eq("id", it.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error("Failed to save order");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    } else {
      toast.success("Order saved");
    }
  };

  const persistSubcategoryOrder = async (items: Subcategory[]) => {
    const updates = items.map((it, idx) =>
      supabase.from("subcategories").update({ sort_order: idx }).eq("id", it.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error("Failed to save order");
      qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
    } else {
      toast.success("Order saved");
    }
  };

  const resetForm = () => {
    setForm({ title: "", description: "", icon: "Folder", image_url: "", sort_order: 0, is_quick_category: false });
    setEditing(null);
    setOpen(false);
  };

  const resetSubForm = () => {
    setSubForm({ title: "", description: "", sort_order: 0, category_id: "" });
    setEditingSub(null);
    setSubOpen(false);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      title: cat.title,
      description: cat.description ?? "",
      icon: cat.icon,
      image_url: cat.image_url ?? "",
      sort_order: cat.sort_order,
      is_quick_category: cat.is_quick_category,
    });
    setOpen(true);
  };

  const openAddSub = (categoryId: string) => {
    setEditingSub(null);
    setSubForm({ title: "", description: "", sort_order: 0, category_id: categoryId });
    setSubOpen(true);
  };

  const openEditSub = (sub: any) => {
    setEditingSub(sub);
    setSubForm({
      title: sub.title,
      description: sub.description ?? "",
      sort_order: sub.sort_order,
      category_id: sub.category_id,
    });
    setSubOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCategoryDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = orderedCats.findIndex((c) => c.id === active.id);
    const newIdx = orderedCats.findIndex((c) => c.id === over.id);
    const next = arrayMove(orderedCats, oldIdx, newIdx);
    setOrderedCats(next);
    persistCategoryOrder(next);
  };

  const handleSubDragEnd = (catId: string) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const list = orderedSubs[catId] ?? [];
    const oldIdx = list.findIndex((s) => s.id === active.id);
    const newIdx = list.findIndex((s) => s.id === over.id);
    const next = arrayMove(list, oldIdx, newIdx);
    setOrderedSubs({ ...orderedSubs, [catId]: next });
    persistSubcategoryOrder(next);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag <GripVertical className="inline h-3 w-3" /> handles to reorder.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                upsert.mutate(form);
              }}
            >
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Icon (Lucide name)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
              <div><Label>Cover Image</Label><ImageUpload bucket="category-images" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_quick_category} onCheckedChange={(v) => setForm({ ...form, is_quick_category: v })} />
                <Label>Quick Category (pill style)</Label>
              </div>
              <Button type="submit" className="w-full" disabled={upsert.isPending}>
                {editing ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subcategory dialog */}
      <Dialog open={subOpen} onOpenChange={(v) => { if (!v) resetSubForm(); setSubOpen(v); }}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSub ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              upsertSub.mutate(subForm);
            }}
          >
            <div><Label>Title</Label><Input value={subForm.title} onChange={(e) => setSubForm({ ...subForm, title: e.target.value })} required /></div>
            <div><Label>Description</Label><Input value={subForm.description} onChange={(e) => setSubForm({ ...subForm, description: e.target.value })} /></div>
            <div><Label>Sort Order</Label><Input type="number" value={subForm.sort_order} onChange={(e) => setSubForm({ ...subForm, sort_order: parseInt(e.target.value) || 0 })} /></div>
            <Button type="submit" className="w-full" disabled={upsertSub.isPending}>
              {editingSub ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View subcategory listings dialog */}
      <Dialog open={!!viewSub} onOpenChange={(v) => { if (!v) setViewSub(null); }}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewSub?.title} <span className="text-muted-foreground font-normal text-sm">({subListings?.length ?? 0} listings)</span>
            </DialogTitle>
          </DialogHeader>
          {subListingsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !subListings || subListings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No listings in this subcategory yet.</p>
          ) : (
            <div className="space-y-2">
              {subListings.map((l: any) => (
                <a
                  key={l.id}
                  href={`/admin/listings?edit=${l.id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2 hover:border-primary transition-colors"
                >
                  {l.image_url ? (
                    <img src={l.image_url} alt={l.title} className="h-10 w-10 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">{l.title}</div>
                    {l.location && <div className="text-xs text-muted-foreground truncate">{l.location}</div>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[32px_1fr_140px_120px_80px_120px] gap-3 px-3 py-2 bg-muted text-xs font-medium text-muted-foreground">
            <div></div>
            <div>Title</div>
            <div>Icon</div>
            <div>Type</div>
            <div>Listings</div>
            <div className="text-right">Actions</div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
            <SortableContext items={orderedCats.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {orderedCats.map((cat) => {
                const subs = orderedSubs[cat.id] ?? [];
                const isExpanded = expandedCat === cat.id;
                const listingCount = catCounts?.[cat.id] ?? 0;
                return (
                  <SortableCategoryRow
                    key={cat.id}
                    cat={cat}
                    listingCount={listingCount}
                    subsCount={subs.length}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedCat(isExpanded ? null : cat.id)}
                    onEdit={() => openEdit(cat)}
                    onDelete={() => deleteMut.mutate(cat.id)}
                  >
                    {isExpanded && (
                      <div className="bg-muted/30 px-4 py-3 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-muted-foreground">Subcategories</span>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => openAddSub(cat.id)}>
                            <Plus className="h-3 w-3" /> Add
                          </Button>
                        </div>
                        {subs.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No subcategories yet.</p>
                        ) : (
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubDragEnd(cat.id)}>
                            <SortableContext items={subs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-2">
                                {subs.map((sub) => (
                                  <SortableSubRow
                                    key={sub.id}
                                    sub={sub}
                                    count={subCounts?.[sub.id] ?? 0}
                                    onView={() => setViewSub(sub)}
                                    onEdit={() => openEditSub(sub)}
                                    onDelete={() => deleteSubMut.mutate(sub.id)}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}
                      </div>
                    )}
                  </SortableCategoryRow>
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

const SortableCategoryRow = ({
  cat,
  listingCount,
  subsCount,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  children,
}: {
  cat: Category;
  listingCount: number;
  subsCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="border-t border-border">
      <div className="grid grid-cols-[32px_1fr_140px_120px_80px_120px] gap-3 items-center px-3 py-2.5">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" className="flex items-center gap-1 hover:text-primary text-left font-medium text-foreground" onClick={onToggle}>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {cat.title}
          <span className="text-muted-foreground font-normal text-sm ml-1">({subsCount})</span>
        </button>
        <div className="text-sm text-muted-foreground truncate">{cat.icon}</div>
        <div className="text-sm text-muted-foreground">{cat.is_quick_category ? "Quick" : "Featured"}</div>
        <div className="text-sm text-muted-foreground">{listingCount}</div>
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
};

const SortableSubRow = ({
  sub,
  count,
  onView,
  onEdit,
  onDelete,
}: {
  sub: Subcategory;
  count: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sub.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={onView} className="min-w-0 text-left hover:text-primary">
          <span className="font-medium text-foreground text-sm">{sub.title}</span>
          <span className="text-muted-foreground text-xs ml-1">({count})</span>
          {sub.description && <span className="text-muted-foreground text-xs ml-2">— {sub.description}</span>}
        </button>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

export default AdminCategories;
