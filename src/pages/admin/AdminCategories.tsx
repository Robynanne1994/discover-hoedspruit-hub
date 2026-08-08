import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, GripVertical, ArrowDownAZ, ArrowDownUp, MoveRight } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import ImageUpload from "@/components/admin/ImageUpload";
import CategoryImagePreview from "@/components/admin/CategoryImagePreview";
import { CATEGORY_IMAGE_SLOT } from "@/lib/categoryImageSlot";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  CollisionDetection,
  useDroppable,
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
type SubSubcategory = Tables<"sub_subcategories">;

const AdminCategories = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ title: "", description: "", icon: "Folder", image_url: "", sort_order: 0, is_quick_category: false });
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const [subOpen, setSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [subForm, setSubForm] = useState({ title: "", description: "", sort_order: 0, category_id: "" });

  const [subSubOpen, setSubSubOpen] = useState(false);
  const [editingSubSub, setEditingSubSub] = useState<any | null>(null);
  const [subSubForm, setSubSubForm] = useState({ title: "", description: "", sort_order: 0, subcategory_id: "" });

  const [orderedCats, setOrderedCats] = useState<Category[]>([]);
  const [orderedSubs, setOrderedSubs] = useState<Record<string, Subcategory[]>>({});
  const [orderedSubSubs, setOrderedSubSubs] = useState<Record<string, SubSubcategory[]>>({});

  const [viewSub, setViewSub] = useState<Subcategory | null>(null);
  const [alphaSort, setAlphaSort] = useState<Record<string, boolean>>({});

  const { data: subListings, isLoading: subListingsLoading } = useQuery({
    queryKey: ["admin-subcategory-listings", viewSub?.id],
    enabled: !!viewSub,
    queryFn: async () => {
      // Direct subcategory links
      const { data: links, error: linkErr } = await supabase
        .from("listing_subcategories")
        .select("listing_id")
        .eq("subcategory_id", viewSub!.id);
      if (linkErr) throw linkErr;
      const idSet = new Set<string>((links ?? []).map((l: any) => l.listing_id as string));

      // Plus listings from any sub-subcategories under this subcategory
      const { data: ssList } = await supabase
        .from("sub_subcategories")
        .select("id")
        .eq("subcategory_id", viewSub!.id);
      const ssIds = (ssList ?? []).map((s: any) => s.id as string);
      if (ssIds.length > 0) {
        const { data: ssLinks } = await supabase
          .from("listing_sub_subcategories")
          .select("listing_id")
          .in("sub_subcategory_id", ssIds);
        (ssLinks ?? []).forEach((l: any) => idSet.add(l.listing_id as string));
      }

      const ids = Array.from(idSet);
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

  const { data: subSubcategories } = useQuery({
    queryKey: ["admin-sub-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_subcategories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: subSubCounts } = useQuery({
    queryKey: ["admin-listing-sub-subcategories-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listing_sub_subcategories").select("sub_subcategory_id");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        map[r.sub_subcategory_id] = (map[r.sub_subcategory_id] ?? 0) + 1;
      });
      return map;
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
    queryKey: ["admin-listing-subcategories-counts-aggregated"],
    queryFn: async () => {
      // Direct listing→subcategory links
      const { data: direct, error } = await supabase
        .from("listing_subcategories")
        .select("subcategory_id, listing_id");
      if (error) throw error;

      // Listing→sub_subcategory links + parent subcategory mapping
      const [{ data: ssLinks }, { data: ssRows }] = await Promise.all([
        supabase.from("listing_sub_subcategories").select("sub_subcategory_id, listing_id"),
        supabase.from("sub_subcategories").select("id, subcategory_id"),
      ]);
      const ssParent = new Map<string, string>();
      (ssRows ?? []).forEach((r: any) => ssParent.set(r.id, r.subcategory_id));

      // Build subcategory_id → Set<listing_id> (distinct)
      const sets: Record<string, Set<string>> = {};
      (direct ?? []).forEach((r: any) => {
        (sets[r.subcategory_id] ??= new Set()).add(r.listing_id);
      });
      (ssLinks ?? []).forEach((r: any) => {
        const subId = ssParent.get(r.sub_subcategory_id);
        if (!subId) return;
        (sets[subId] ??= new Set()).add(r.listing_id);
      });

      const map: Record<string, number> = {};
      Object.entries(sets).forEach(([k, v]) => { map[k] = v.size; });
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

  useEffect(() => {
    if (subSubcategories) {
      const grouped: Record<string, SubSubcategory[]> = {};
      subSubcategories.forEach((s) => {
        (grouped[s.subcategory_id] ??= []).push(s);
      });
      setOrderedSubSubs(grouped);
    }
  }, [subSubcategories]);

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

  const upsertSubSub = useMutation({
    mutationFn: async (values: { title: string; description: string; sort_order: number; subcategory_id: string }) => {
      const payload = {
        title: values.title,
        description: values.description || null,
        sort_order: values.sort_order,
        subcategory_id: values.subcategory_id,
      };
      if (editingSubSub) {
        const { error } = await supabase.from("sub_subcategories").update(payload).eq("id", editingSubSub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_subcategories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sub-subcategories"] });
      toast.success(editingSubSub ? "Sub-subcategory updated" : "Sub-subcategory created");
      resetSubSubForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteSubSubMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sub-subcategories"] });
      toast.success("Sub-subcategory deleted");
    },
  });

  const persistSubSubOrder = async (items: SubSubcategory[]) => {
    const updates = items.map((it, idx) =>
      supabase.from("sub_subcategories").update({ sort_order: idx }).eq("id", it.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error("Failed to save order");
      qc.invalidateQueries({ queryKey: ["admin-sub-subcategories"] });
    } else {
      toast.success("Order saved");
    }
  };

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

  const resetSubSubForm = () => {
    setSubSubForm({ title: "", description: "", sort_order: 0, subcategory_id: "" });
    setEditingSubSub(null);
    setSubSubOpen(false);
  };

  const openAddSubSub = (subcategoryId: string) => {
    setEditingSubSub(null);
    setSubSubForm({ title: "", description: "", sort_order: 0, subcategory_id: subcategoryId });
    setSubSubOpen(true);
  };

  const openEditSubSub = (ss: any) => {
    setEditingSubSub(ss);
    setSubSubForm({
      title: ss.title,
      description: ss.description ?? "",
      sort_order: ss.sort_order,
      subcategory_id: ss.subcategory_id,
    });
    setSubSubOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Hierarchical collision detection: prefer the row the pointer is directly over.
  // If pointer is over a nested child, exclude the active item itself, then pick
  // the deepest match (subsub > sub > cat) so dragging onto a parent row nests.
  const hierarchicalCollision: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args).filter((c) => c.id !== args.active.id);
    if (pointerCollisions.length > 0) {
      // Prefer deepest level (nest-zone > subsub > sub > cat)
      const rank = (id: string) =>
        id.startsWith("nest:") ? 4 : id.startsWith("subsub:") ? 3 : id.startsWith("sub:") ? 2 : 1;
      pointerCollisions.sort((a, b) => rank(String(b.id)) - rank(String(a.id)));
      return [pointerCollisions[0]];
    }
    const rectColls = rectIntersection(args).filter((c) => c.id !== args.active.id);
    if (rectColls.length > 0) return rectColls;
    return closestCenter(args).filter((c) => c.id !== args.active.id);
  };


  const parseId = (raw: string): { kind: "cat" | "sub" | "subsub" | "nest"; id: string } | null => {
    const [kind, id] = raw.split(":");
    if (!id) return null;
    if (kind === "cat" || kind === "sub" || kind === "subsub" || kind === "nest") return { kind, id };
    return null;
  };

  const promoteSubSubToSub = async (subSubId: string, targetCategoryId: string) => {
    const ss = (subSubcategories ?? []).find((s) => s.id === subSubId);
    if (!ss) return;
    const { data: inserted, error: insErr } = await supabase
      .from("subcategories")
      .insert({ title: ss.title, description: ss.description, sort_order: 999, category_id: targetCategoryId })
      .select("id")
      .single();
    if (insErr || !inserted) { toast.error(insErr?.message ?? "Failed to promote"); return; }
    const { data: links } = await supabase.from("listing_sub_subcategories").select("listing_id").eq("sub_subcategory_id", subSubId);
    if (links && links.length > 0) {
      await supabase.from("listing_subcategories").insert(links.map((l: any) => ({ listing_id: l.listing_id, subcategory_id: inserted.id })));
    }
    await supabase.from("listing_sub_subcategories").delete().eq("sub_subcategory_id", subSubId);
    await supabase.from("sub_subcategories").delete().eq("id", subSubId);
    qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
    qc.invalidateQueries({ queryKey: ["admin-sub-subcategories"] });
    qc.invalidateQueries({ queryKey: ["admin-listing-subcategories-counts"] });
    qc.invalidateQueries({ queryKey: ["admin-listing-sub-subcategories-counts"] });
    toast.success("Promoted to subcategory");
  };

  const demoteSubToSubSub = async (subId: string, targetSubcategoryId: string) => {
    if (subId === targetSubcategoryId) return;
    const sub = (subcategories ?? []).find((s) => s.id === subId);
    if (!sub) return;
    const { data: inserted, error: insErr } = await supabase
      .from("sub_subcategories")
      .insert({ title: sub.title, description: sub.description, sort_order: 999, subcategory_id: targetSubcategoryId })
      .select("id")
      .single();
    if (insErr || !inserted) { toast.error(insErr?.message ?? "Failed to demote"); return; }
    const { data: links } = await supabase.from("listing_subcategories").select("listing_id").eq("subcategory_id", subId);
    if (links && links.length > 0) {
      await supabase.from("listing_sub_subcategories").insert(links.map((l: any) => ({ listing_id: l.listing_id, sub_subcategory_id: inserted.id })));
    }
    await supabase.from("sub_subcategories").update({ subcategory_id: targetSubcategoryId }).eq("subcategory_id", subId);
    await supabase.from("listing_subcategories").delete().eq("subcategory_id", subId);
    await supabase.from("subcategories").delete().eq("id", subId);
    qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
    qc.invalidateQueries({ queryKey: ["admin-sub-subcategories"] });
    qc.invalidateQueries({ queryKey: ["admin-listing-subcategories-counts"] });
    qc.invalidateQueries({ queryKey: ["admin-listing-sub-subcategories-counts"] });
    toast.success("Demoted to sub-subcategory");
  };

  const moveSubToCategory = async (subId: string, targetCategoryId: string) => {
    const { error } = await supabase.from("subcategories").update({ category_id: targetCategoryId }).eq("id", subId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
    toast.success("Moved subcategory");
  };

  const moveSubSubToSub = async (subSubId: string, targetSubId: string) => {
    const { error } = await supabase.from("sub_subcategories").update({ subcategory_id: targetSubId }).eq("id", subSubId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-sub-subcategories"] });
    toast.success("Moved sub-subcategory");
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const a = parseId(String(active.id));
    const o = parseId(String(over.id));
    if (!a || !o) return;

    // Drop onto a "nest under this subcategory" zone — works even when the
    // target subcategory has no sub-subcategories yet.
    if (o.kind === "nest") {
      if (a.kind === "sub") { demoteSubToSubSub(a.id, o.id); return; }
      if (a.kind === "subsub") { moveSubSubToSub(a.id, o.id); return; }
      return;
    }


    if (a.kind === "cat" && o.kind === "cat") {
      const oldIdx = orderedCats.findIndex((c) => c.id === a.id);
      const newIdx = orderedCats.findIndex((c) => c.id === o.id);
      if (oldIdx < 0 || newIdx < 0) return;
      const next = arrayMove(orderedCats, oldIdx, newIdx);
      setOrderedCats(next);
      persistCategoryOrder(next);
      return;
    }
    if (a.kind === "sub" && o.kind === "sub") {
      const aSub = (subcategories ?? []).find((s) => s.id === a.id);
      const oSub = (subcategories ?? []).find((s) => s.id === o.id);
      if (!aSub || !oSub) return;
      if (aSub.category_id === oSub.category_id) {
        const list = orderedSubs[aSub.category_id] ?? [];
        const oldIdx = list.findIndex((s) => s.id === a.id);
        const newIdx = list.findIndex((s) => s.id === o.id);
        const next = arrayMove(list, oldIdx, newIdx);
        setOrderedSubs({ ...orderedSubs, [aSub.category_id]: next });
        persistSubcategoryOrder(next);
      } else {
        // Drag onto a subcategory in a different category → demote into that subcategory
        demoteSubToSubSub(a.id, o.id);
      }
      return;
    }
    if (a.kind === "subsub" && o.kind === "subsub") {
      const aSS = (subSubcategories ?? []).find((s) => s.id === a.id);
      const oSS = (subSubcategories ?? []).find((s) => s.id === o.id);
      if (!aSS || !oSS) return;
      if (aSS.subcategory_id === oSS.subcategory_id) {
        const list = orderedSubSubs[aSS.subcategory_id] ?? [];
        const oldIdx = list.findIndex((s) => s.id === a.id);
        const newIdx = list.findIndex((s) => s.id === o.id);
        const next = arrayMove(list, oldIdx, newIdx);
        setOrderedSubSubs({ ...orderedSubSubs, [aSS.subcategory_id]: next });
        persistSubSubOrder(next);
      } else {
        moveSubSubToSub(a.id, oSS.subcategory_id);
      }
      return;
    }

    // Cross-level fluid drops (Shopify-style nesting)
    if (a.kind === "sub" && o.kind === "cat") { moveSubToCategory(a.id, o.id); return; }
    if (a.kind === "subsub" && o.kind === "sub") { moveSubSubToSub(a.id, o.id); return; }
    if (a.kind === "subsub" && o.kind === "cat") { promoteSubSubToSub(a.id, o.id); return; }
    if (a.kind === "sub" && o.kind === "subsub") {
      const oSS = (subSubcategories ?? []).find((s) => s.id === o.id);
      if (!oSS) return;
      demoteSubToSubSub(a.id, oSS.subcategory_id);
      return;
    }
    if (a.kind === "cat" && o.kind === "sub") {
      // Dragging a top-level category onto a subcategory → demote category to subcategory under that subcategory's parent
      const oSub = (subcategories ?? []).find((s) => s.id === o.id);
      if (!oSub) return;
      // Move existing subs of dragged cat? Simpler: just convert cat to sub under target's parent category.
      // For safety here, just move under same category as a sub. We'll create the subcategory and skip recursive content.
      toast.info("Drag a subcategory or sub-subcategory to nest. Top-level categories can only be reordered.");
      return;
    }
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-[550] text-slate-950">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag to reorder or nest between levels.</p>
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
              <div className="space-y-1.5">
                <Label>Cover Image</Label>
                <p className="text-xs text-muted-foreground">
                  Shown on the category cards on Explore. Cropped to {CATEGORY_IMAGE_SLOT.aspectLabel} —
                  drag and zoom to choose what stays in frame.
                </p>
                <ImageUpload
                  bucket="category-images"
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                  aspect={CATEGORY_IMAGE_SLOT.aspect}
                  lockAspect
                  aspectLabel={CATEGORY_IMAGE_SLOT.aspectLabel}
                  cropTitle="Crop — category cover"
                  previewRender={(renderImage) => (
                    <CategoryImagePreview
                      title={form.title}
                      listingCount={editing ? catCounts?.[editing.id] ?? 0 : 0}
                      renderImage={renderImage}
                    />
                  )}
                />
              </div>
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

      {/* Sub-subcategory dialog */}
      <Dialog open={subSubOpen} onOpenChange={(v) => { if (!v) resetSubSubForm(); setSubSubOpen(v); }}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubSub ? "Edit Sub-subcategory" : "Add Sub-subcategory"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              upsertSubSub.mutate(subSubForm);
            }}
          >
            <div><Label>Title</Label><Input value={subSubForm.title} onChange={(e) => setSubSubForm({ ...subSubForm, title: e.target.value })} required /></div>
            <div><Label>Description</Label><Input value={subSubForm.description} onChange={(e) => setSubSubForm({ ...subSubForm, description: e.target.value })} /></div>
            <div><Label>Sort Order</Label><Input type="number" value={subSubForm.sort_order} onChange={(e) => setSubSubForm({ ...subSubForm, sort_order: parseInt(e.target.value) || 0 })} /></div>
            <Button type="submit" className="w-full" disabled={upsertSubSub.isPending}>
              {editingSubSub ? "Update" : "Create"}
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

          <DndContext
            sensors={sensors}
            collisionDetection={hierarchicalCollision}
            onDragOver={(e) => {
              const over = e.over;
              if (!over) return;
              const o = parseId(String(over.id));
              const a = parseId(String(e.active.id));
              // Auto-expand the subcategory the user is dragging over so the
              // "nest under this subcategory" drop zone becomes visible — even
              // when the target has no sub-subcategories yet.
              if (o?.kind === "sub" && (a?.kind === "sub" || a?.kind === "subsub") && a.id !== o.id) {
                setExpandedCat((prev) => prev);
                setExpandedSub(o.id);
              }
              if (o?.kind === "nest" && (a?.kind === "sub" || a?.kind === "subsub")) {
                setExpandedSub(o.id);
              }
            }}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={orderedCats.map((c) => `cat:${c.id}`)} strategy={verticalListSortingStrategy}>
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
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={alphaSort[cat.id] ? "default" : "outline"}
                              className="gap-1"
                              onClick={() => setAlphaSort((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                              title={alphaSort[cat.id] ? "Show front-end order" : "Show alphabetical order"}
                            >
                              {alphaSort[cat.id] ? <ArrowDownUp className="h-3 w-3" /> : <ArrowDownAZ className="h-3 w-3" />}
                              {alphaSort[cat.id] ? "Front-end order" : "Alphabetically"}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => openAddSub(cat.id)}>
                              <Plus className="h-3 w-3" /> Add
                            </Button>
                          </div>
                        </div>
                        {subs.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No subcategories yet. Drag a subcategory or sub-subcategory onto this category to move it here.</p>
                        ) : (
                          (() => {
                            const displaySubs = alphaSort[cat.id]
                              ? [...subs].sort((a, b) => a.title.localeCompare(b.title))
                              : subs;
                            const renderSub = (sub: Subcategory, hideDrag?: boolean) => {
                              const ssList = orderedSubSubs[sub.id] ?? [];
                              const isExpanded = expandedSub === sub.id;
                              return (
                                <SortableSubRow
                                  key={sub.id}
                                  sub={sub}
                                  count={subCounts?.[sub.id] ?? 0}
                                  subSubCount={ssList.length}
                                  isExpanded={isExpanded}
                                  onToggle={() => setExpandedSub(isExpanded ? null : sub.id)}
                                  onView={() => setViewSub(sub)}
                                  onEdit={() => openEditSub(sub)}
                                  onDelete={() => deleteSubMut.mutate(sub.id)}
                                  hideDrag={hideDrag}
                                  categories={orderedCats}
                                  subcategories={subcategories ?? []}
                                  onMoveToCategory={(cid) => moveSubToCategory(sub.id, cid)}
                                  onDemoteToSubSub={(targetSubId) => {
                                    if (confirm(`Make "${sub.title}" a sub-subcategory under the chosen subcategory? Its listings and any existing sub-subcategories will be moved.`)) {
                                      demoteSubToSubSub(sub.id, targetSubId);
                                    }
                                  }}
                                >
                                  <div className="bg-muted/40 px-3 py-2 border-t border-border">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-medium text-muted-foreground">Sub-subcategories</span>
                                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => openAddSubSub(sub.id)}>
                                        <Plus className="h-3 w-3" /> Add
                                      </Button>
                                    </div>
                                    {ssList.length > 0 && (
                                      <SortableContext items={ssList.map((s) => `subsub:${s.id}`)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-1.5 mb-2">
                                          {ssList.map((ss) => (
                                            <SortableSubSubRow
                                              key={ss.id}
                                              ss={ss}
                                              count={subSubCounts?.[ss.id] ?? 0}
                                              onEdit={() => openEditSubSub(ss)}
                                              onDelete={() => deleteSubSubMut.mutate(ss.id)}
                                              categories={orderedCats}
                                              subcategories={subcategories ?? []}
                                              onMoveToSub={(targetSubId) => moveSubSubToSub(ss.id, targetSubId)}
                                              onPromoteToSub={(targetCategoryId) => {
                                                if (confirm(`Promote "${ss.title}" to a top-level subcategory under the chosen category?`)) {
                                                  promoteSubSubToSub(ss.id, targetCategoryId);
                                                }
                                              }}
                                            />
                                          ))}
                                        </div>
                                      </SortableContext>
                                    )}
                                    <NestDropZone subId={sub.id} subTitle={sub.title} />
                                  </div>
                                </SortableSubRow>
                              );
                            };
                            if (alphaSort[cat.id]) {
                              return (
                                <div className="space-y-2">
                                  {displaySubs.map((sub) => renderSub(sub, true))}
                                </div>
                              );
                            }
                            return (
                              <SortableContext items={displaySubs.map((s) => `sub:${s.id}`)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                  {displaySubs.map((sub) => renderSub(sub))}
                                </div>
                              </SortableContext>
                            );
                          })()
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `cat:${cat.id}` });
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
          <Button variant="ghost" size="icon" asChild title="Order listings">
            <a href={`/admin/categories/${cat.id}/order`}>
              <ArrowDownUp className="h-4 w-4" />
            </a>
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
  subSubCount,
  isExpanded,
  onToggle,
  onView,
  onEdit,
  onDelete,
  hideDrag,
  categories,
  subcategories,
  onMoveToCategory,
  onDemoteToSubSub,
  children,
}: {
  sub: Subcategory;
  count: number;
  subSubCount?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  hideDrag?: boolean;
  categories: Category[];
  subcategories: Subcategory[];
  onMoveToCategory: (categoryId: string) => void;
  onDemoteToSubSub: (targetSubId: string) => void;
  children?: React.ReactNode;
}) => {
  const sortable = useSortable({ id: `sub:${sub.id}`, disabled: hideDrag });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {!hideDrag && (
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          {onToggle && (
            <button type="button" onClick={onToggle} className="text-muted-foreground hover:text-foreground">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          <button type="button" onClick={onView} className="min-w-0 text-left hover:text-primary">
            <span className="font-medium text-foreground text-sm">{sub.title}</span>
            <span className="text-muted-foreground text-xs ml-1">({count})</span>
            {subSubCount !== undefined && (
              <span className="text-muted-foreground text-xs ml-1">· {subSubCount} sub</span>
            )}
            {sub.description && <span className="text-muted-foreground text-xs ml-2">— {sub.description}</span>}
          </button>
        </div>
        <div className="flex gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Move">
                <MoveRight className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-popover z-50">
              <DropdownMenuLabel>Move subcategory to…</DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Another category</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-72 overflow-y-auto bg-popover z-50">
                  {(categories ?? []).filter((c) => c.id !== sub.category_id).map((c) => (
                    <DropdownMenuItem key={c.id} onClick={() => onMoveToCategory(c.id)}>{c.title}</DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Demote to sub-subcategory under…</DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Choose parent subcategory</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-72 overflow-y-auto bg-popover z-50">
                  {(subcategories ?? []).filter((s) => s.id !== sub.id).map((s) => {
                    const parent = (categories ?? []).find((c) => c.id === s.category_id);

                    return (
                      <DropdownMenuItem key={s.id} onClick={() => onDemoteToSubSub(s.id)}>
                        {parent?.title ?? "?"} › {s.title}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>
      {isExpanded && children}
    </div>
  );
};

const NestDropZone = ({ subId }: { subId: string; subTitle?: string }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `nest:${subId}` });
  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={`h-10 rounded-md border border-dashed transition-colors ${
        isOver ? "border-primary bg-primary/10" : "border-border bg-transparent"
      }`}
    />
  );
};

const SortableSubSubRow = ({
  ss,
  count,
  onEdit,
  onDelete,
  hideDrag,
  categories,
  subcategories,
  onMoveToSub,
  onPromoteToSub,
}: {
  ss: SubSubcategory;
  count: number;
  onEdit: () => void;
  onDelete: () => void;
  hideDrag?: boolean;
  categories: Category[];
  subcategories: Subcategory[];
  onMoveToSub: (targetSubId: string) => void;
  onPromoteToSub: (targetCategoryId: string) => void;
}) => {
  const sortable = useSortable({ id: `subsub:${ss.id}`, disabled: hideDrag });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between bg-background border border-border rounded-md px-2 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        {!hideDrag && (
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        <span className="font-medium text-foreground text-sm">{ss.title}</span>
        <span className="text-muted-foreground text-xs">({count})</span>
        {ss.description && <span className="text-muted-foreground text-xs">— {ss.description}</span>}
      </div>
      <div className="flex gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Move">
              <MoveRight className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-popover z-50">
            <DropdownMenuLabel>Move to subcategory…</DropdownMenuLabel>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Choose subcategory</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-72 overflow-y-auto bg-popover z-50">
                {(subcategories ?? []).filter((s) => s.id !== ss.subcategory_id).map((s) => {
                  const parent = (categories ?? []).find((c) => c.id === s.category_id);

                  return (
                    <DropdownMenuItem key={s.id} onClick={() => onMoveToSub(s.id)}>
                      {parent?.title ?? "?"} › {s.title}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Promote to subcategory under…</DropdownMenuLabel>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Choose category</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-72 overflow-y-auto bg-popover z-50">
                {(categories ?? []).map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => onPromoteToSub(c.id)}>{c.title}</DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

export default AdminCategories;
