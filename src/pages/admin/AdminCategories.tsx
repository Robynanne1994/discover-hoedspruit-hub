import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import ImageUpload from "@/components/admin/ImageUpload";

type Category = Tables<"categories">;

const AdminCategories = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ title: "", description: "", icon: "Folder", image_url: "", sort_order: 0, is_quick_category: false });
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // Subcategory state
  const [subOpen, setSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [subForm, setSubForm] = useState({ title: "", description: "", sort_order: 0, category_id: "" });

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

  // Subcategory mutations
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

  const getSubcategoriesForCategory = (catId: string) =>
    subcategories?.filter((s) => s.category_id === catId) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Categories</h1>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
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
        <DialogContent>
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

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Icon</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Order</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Subs</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {categories?.map((cat) => {
                const subs = getSubcategoriesForCategory(cat.id);
                const isExpanded = expandedCat === cat.id;
                return (
                  <>
                    <tr key={cat.id} className="border-t border-border">
                      <td className="p-3 font-medium text-foreground">
                        <button
                          type="button"
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                          onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          {cat.title}
                        </button>
                      </td>
                      <td className="p-3 text-muted-foreground">{cat.icon}</td>
                      <td className="p-3 text-muted-foreground">{cat.is_quick_category ? "Quick" : "Featured"}</td>
                      <td className="p-3 text-muted-foreground">{cat.sort_order}</td>
                      <td className="p-3 text-muted-foreground">{subs.length}</td>
                      <td className="p-3 flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(cat.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${cat.id}-subs`} className="border-t border-border bg-muted/30">
                        <td colSpan={6} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-muted-foreground">Subcategories</span>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => openAddSub(cat.id)}>
                              <Plus className="h-3 w-3" /> Add
                            </Button>
                          </div>
                          {subs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No subcategories yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {subs.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
                                  <div>
                                    <span className="font-medium text-foreground text-sm">{sub.title}</span>
                                    {sub.description && <span className="text-muted-foreground text-xs ml-2">— {sub.description}</span>}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSub(sub)}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSubMut.mutate(sub.id)}>
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
