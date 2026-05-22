import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Bold,
  Italic,
  Link2,
  Mail,
  List as ListIcon,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";

type FAQRow = {
  id: string;
  section: string;
  question: string;
  answer: string;
  sort_order: number;
  is_visible: boolean;
};

// ----- Simple rich text editor (contentEditable + execCommand) -----
const RichTextEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const addLink = () => {
    const url = window.prompt("Enter URL (https://…)");
    if (!url) return;
    exec("createLink", url);
  };

  const addEmail = () => {
    const email = window.prompt("Enter email address");
    if (!email) return;
    exec("createLink", `mailto:${email}`);
  };

  return (
    <div className="border rounded-md bg-background">
      <div className="flex items-center gap-1 border-b px-2 py-1.5 flex-wrap">
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("bold")} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("italic")} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <ListIcon className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={addLink} title="Insert link">
          <Link2 className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={addEmail} title="Insert email link">
          <Mail className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("removeFormat")} title="Clear formatting">
          ✕
        </Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        className="min-h-[140px] px-3 py-2 text-sm text-foreground focus:outline-none [&_a]:underline [&_a]:text-primary [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
      />
      <p className="px-3 py-1.5 text-[11px] text-muted-foreground border-t">
        Tip: select text, then click <b>B</b>, link, or email icons to format.
      </p>
    </div>
  );
};

const AdminFAQs = () => {
  const [rows, setRows] = useState<FAQRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<FAQRow> | null>(null);
  const [renameOpen, setRenameOpen] = useState<{ from: string; to: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data as FAQRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const sections = useMemo(() => {
    const map = new Map<string, { items: FAQRow[]; min: number }>();
    rows.forEach((r) => {
      const ex = map.get(r.section);
      if (ex) ex.items.push(r);
      else map.set(r.section, { items: [r], min: r.sort_order ?? 0 });
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1].min - b[1].min)
      .map(([title, v]) => ({ title, items: v.items }));
  }, [rows]);

  const save = async () => {
    if (!editing) return;
    const payload = {
      section: (editing.section || "").trim(),
      question: (editing.question || "").trim(),
      answer: editing.answer || "",
      sort_order: editing.sort_order ?? 0,
      is_visible: editing.is_visible ?? true,
    };
    if (!payload.section || !payload.question) {
      toast.error("Section and question are required");
      return;
    }
    if (editing.id) {
      const { error } = await supabase.from("faqs").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("FAQ updated");
    } else {
      const { error } = await supabase.from("faqs").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("FAQ added");
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleVisible = async (r: FAQRow) => {
    const { error } = await supabase
      .from("faqs")
      .update({ is_visible: !r.is_visible })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  const swap = async (a: FAQRow, b: FAQRow) => {
    const [r1, r2] = await Promise.all([
      supabase.from("faqs").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("faqs").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    if (r1.error || r2.error) return toast.error((r1.error || r2.error)!.message);
    load();
  };

  const moveItem = (sectionItems: FAQRow[], idx: number, dir: -1 | 1) => {
    const target = sectionItems[idx + dir];
    if (!target) return;
    swap(sectionItems[idx], target);
  };

  const deleteSection = async (title: string) => {
    if (!confirm(`Delete entire "${title}" section and all its questions?`)) return;
    const { error } = await supabase.from("faqs").delete().eq("section", title);
    if (error) return toast.error(error.message);
    toast.success("Section deleted");
    load();
  };

  const renameSection = async () => {
    if (!renameOpen) return;
    const to = renameOpen.to.trim();
    if (!to) return;
    const { error } = await supabase
      .from("faqs")
      .update({ section: to })
      .eq("section", renameOpen.from);
    if (error) return toast.error(error.message);
    setRenameOpen(null);
    toast.success("Section renamed");
    load();
  };

  const addNewInSection = (section: string) => {
    const maxOrder = Math.max(0, ...rows.map((r) => r.sort_order || 0));
    setEditing({
      section,
      question: "",
      answer: "",
      sort_order: maxOrder + 1,
      is_visible: true,
    });
  };

  const addNewSection = () => {
    const name = window.prompt("New section title");
    if (!name?.trim()) return;
    const maxOrder = Math.max(0, ...rows.map((r) => r.sort_order || 0));
    setEditing({
      section: name.trim(),
      question: "",
      answer: "",
      sort_order: maxOrder + 1,
      is_visible: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">FAQs</h1>
          <p className="text-sm text-muted-foreground mb-6 text-slate-950">
            Manage the sections, questions and answers shown on the public FAQs page.
          </p>
        </div>
        <Button onClick={addNewSection}>
          <Plus className="h-4 w-4 mr-1" /> Add Section
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {sections.map(({ title, items }) => (
        <div key={title} className="bg-card border rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => addNewInSection(title)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Question
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRenameOpen({ from: title, to: title })}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" /> Rename
              </Button>
              <Button size="sm" variant="outline" onClick={() => deleteSection(title)}>
                <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" /> Delete
              </Button>
            </div>
          </div>

          <div className="divide-y">
            {items.map((r, idx) => (
              <div key={r.id} className="py-3 flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={idx === 0}
                    onClick={() => moveItem(items, idx, -1)}
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(items, idx, 1)}
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">{r.question}</div>
                  <div
                    className="text-xs text-muted-foreground mt-1 line-clamp-2 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: r.answer }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleVisible(r)}
                    title={r.is_visible ? "Visible — click to hide" : "Hidden — click to show"}
                  >
                    {r.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-sm text-muted-foreground py-3">No questions yet.</div>
            )}
          </div>
        </div>
      ))}

      {/* Edit / create dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit FAQ" : "New FAQ"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Section</Label>
                <Input
                  value={editing.section || ""}
                  onChange={(e) => setEditing({ ...editing, section: e.target.value })}
                  list="faq-sections"
                  placeholder="e.g. Using The App"
                />
                <datalist id="faq-sections">
                  {sections.map((s) => (
                    <option key={s.title} value={s.title} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Question</Label>
                <Input
                  value={editing.question || ""}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                />
              </div>
              <div>
                <Label>Answer</Label>
                <RichTextEditor
                  value={editing.answer || ""}
                  onChange={(html) => setEditing({ ...editing, answer: html })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="vis">Visible on site</Label>
                  <Switch
                    id="vis"
                    checked={editing.is_visible ?? true}
                    onCheckedChange={(v) => setEditing({ ...editing, is_visible: v })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="ord">Sort order</Label>
                  <Input
                    id="ord"
                    type="number"
                    className="w-24"
                    value={editing.sort_order ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename section */}
      <Dialog open={!!renameOpen} onOpenChange={(o) => !o && setRenameOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename section</DialogTitle>
          </DialogHeader>
          {renameOpen && (
            <Input
              value={renameOpen.to}
              onChange={(e) => setRenameOpen({ ...renameOpen, to: e.target.value })}
            />
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(null)}>
              Cancel
            </Button>
            <Button onClick={renameSection}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFAQs;
