import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";
import { Plus, Pencil, Trash2, X, FileSpreadsheet } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  image_url: string | null;
  category: string;
  author: string | null;
  read_time: number | null;
  is_featured: boolean;
  is_published: boolean;
  published_at: string;
  sort_order: number;
}

const emptyForm: Omit<Article, "id"> = {
  title: "", slug: "", excerpt: "", body: "", image_url: null,
  category: "news", author: "Hello Hoedspruit", read_time: null,
  is_featured: false, is_published: true, published_at: new Date().toISOString().slice(0, 16),
  sort_order: 0,
};

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const AdminArticles = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState<Omit<Article, "id">>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data } = await supabase.from("articles" as any).select("*").order("published_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const slug = payload.slug || generateSlug(payload.title);
      const record = { ...payload, slug };

      if (record.is_featured) {
        await supabase.from("articles" as any).update({ is_featured: false } as any).eq("is_featured", true);
      }

      if (editing) {
        const { error } = await supabase.from("articles" as any).update(record as any).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles" as any).insert(record as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success(editing ? "Article updated" : "Article created");
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success("Article deleted");
    },
  });

  const resetForm = () => { setEditing(null); setForm(emptyForm); setShowForm(false); };

  const startEdit = (a: Article) => {
    setEditing(a);
    setForm({
      title: a.title, slug: a.slug, excerpt: a.excerpt || "", body: a.body, image_url: a.image_url,
      category: a.category, author: a.author || "Hello Hoedspruit", read_time: a.read_time,
      is_featured: a.is_featured, is_published: a.is_published,
      published_at: a.published_at ? a.published_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
      sort_order: a.sort_order,
    });
    setShowForm(true);
  };

  const handleExport = () => {
    const headers = ["title", "excerpt", "body", "image_url", "category", "author", "read_time", "is_featured", "is_published", "published_at"];
    const rows = articles.map((a: any) => headers.map((h) => {
      const val = a[h];
      if (val === null || val === undefined) return "";
      if (typeof val === "boolean") return val ? "true" : "false";
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "articles.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) { toast.error("CSV must have headers and data"); return; }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^,]*)/g)?.map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) || [];
      const row: any = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      if (!row.title || !row.body) continue;

      const payload: any = {
        title: row.title,
        slug: generateSlug(row.title),
        excerpt: row.excerpt || null,
        body: row.body,
        ...(row.image_url ? { image_url: row.image_url } : { image_url: null }),
        category: row.category || "news",
        author: row.author || "Hello Hoedspruit",
        read_time: row.read_time ? parseInt(row.read_time) : null,
        is_featured: row.is_featured === "true",
        is_published: row.is_published !== "false",
        published_at: row.published_at || new Date().toISOString(),
      };

      const { error } = await supabase.from("articles" as any).insert(payload as any);
      if (!error) imported++;
    }

    toast.success(`Imported ${imported} articles`);
    queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    e.target.value = "";
  };

  const formatDate = (d: string) => { try { return format(new Date(d), "dd MMM yyyy"); } catch { return d; } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">The Lowveld Lowdown</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><FileSpreadsheet className="h-4 w-4 mr-1" />Export</Button>
          <Label htmlFor="csv-import" className="cursor-pointer">
            <Button variant="outline" size="sm" asChild><span><FileSpreadsheet className="h-4 w-4 mr-1" />Import CSV</span></Button>
          </Label>
          <input id="csv-import" type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" />New Article</Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">{editing ? "Edit Article" : "New Article"}</h2>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </div>

          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>Category *</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Type any category, e.g. News, Wildlife, Property" /></div>
            <div><Label>Excerpt</Label><Textarea value={form.excerpt || ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="A short 1-2 sentence summary" style={{ maxHeight: 80 }} /></div>
            <div><Label>Body *</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your article here. Supports basic markdown." style={{ minHeight: 300 }} /></div>
            <div><Label>Image</Label><ImageUpload bucket="listing-images" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} /></div>
            <div><Label>Author</Label><Input value={form.author || ""} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
            <div><Label>Read Time (minutes)</Label><Input type="number" value={form.read_time ?? ""} onChange={(e) => setForm({ ...form, read_time: e.target.value ? parseInt(e.target.value) : null })} placeholder="Estimated minutes" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
              <div><Label>Featured</Label><p className="text-xs text-muted-foreground">Only one article can be featured at a time.</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label>Published</Label>
            </div>
            <div><Label>Published At</Label><Input type="datetime-local" value={form.published_at?.slice(0, 16) || ""} onChange={(e) => setForm({ ...form, published_at: e.target.value })} /></div>
            <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.title || !form.body}>
              {editing ? "Update Article" : "Create Article"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? <p>Loading...</p> : (
        <div className="space-y-2">
          {articles.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
              <div className="w-[50px] h-[50px] rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {a.image_url ? <img src={a.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-muted-foreground">No img</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.category} · {formatDate(a.published_at)}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {a.is_published ? "Published" : "Draft"}
              </span>
              <Button variant="ghost" size="icon" onClick={() => startEdit(a)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this article?")) deleteMutation.mutate(a.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminArticles;
