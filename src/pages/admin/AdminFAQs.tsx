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
  LinkIcon,
} from "lucide-react";

// Curated list of in-app destinations admins can link to from FAQ answers.
const APP_LINK_OPTIONS: { group: string; items: { label: string; path: string }[] }[] = [
  {
    group: "Main",
    items: [
      { label: "Home", path: "/" },
      { label: "Explore Categories", path: "/categories" },
      { label: "Search", path: "/search" },
      { label: "Events", path: "/events" },
      { label: "Specials", path: "/specials" },
      { label: "Local Channels", path: "/local-channels" },
    ],
  },
  {
    group: "My Account",
    items: [
      { label: "My Account", path: "/my-account" },
      { label: "My Profile", path: "/my-profile" },
      { label: "Account Info", path: "/account-settings/info" },
      { label: "Privacy Settings", path: "/account-settings/privacy" },
      { label: "Blocked Users", path: "/account-settings/blocked" },
      { label: "Reported Users", path: "/account-settings/reported" },
      { label: "Notifications", path: "/my-notifications" },
      { label: "Notification Preferences", path: "/notification-preferences" },
      { label: "Follow Requests", path: "/follow-requests" },
    ],
  },
  {
    group: "Help & Info",
    items: [
      { label: "Help Centre", path: "/help-centre" },
      { label: "FAQs", path: "/faqs" },
      { label: "Contact Us", path: "/contact" },
      { label: "Terms & Policies", path: "/terms" },
    ],
  },
];

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
  const savedRange = useRef<Range | null>(null);
  const [appLinkOpen, setAppLinkOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [linkLabel, setLinkLabel] = useState<string>("");

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

  const openAppLink = () => {
    // Save current selection so we can restore it after the dialog closes.
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
      setLinkLabel(sel.toString());
    } else {
      savedRange.current = null;
      setLinkLabel("");
    }
    setSelectedPath("");
    setAppLinkOpen(true);
  };

  const insertAppLink = () => {
    if (!selectedPath) return;
    const editor = ref.current;
    if (!editor) return;
    editor.focus();

    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }

    const hasSelectedText = sel && sel.toString().length > 0;
    if (hasSelectedText) {
      document.execCommand("createLink", false, selectedPath);
    } else {
      const label =
        linkLabel.trim() ||
        APP_LINK_OPTIONS.flatMap((g) => g.items).find((i) => i.path === selectedPath)?.label ||
        selectedPath;
      const safeLabel = label.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const html = `<a href="${selectedPath}">${safeLabel}</a>`;
      document.execCommand("insertHTML", false, html);
    }

    onChange(editor.innerHTML);
    setAppLinkOpen(false);
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
        <Button type="button" size="sm" variant="ghost" onClick={addLink} title="Insert external URL">
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={openAppLink}
          title="Link to an app page"
        >
          <LinkIcon className="h-4 w-4" />
          <span className="ml-1 text-xs">App page</span>
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
        Tip: select text, then click <b>B</b>, external URL, <b>App page</b>, or email icons to format.
      </p>

      <Dialog open={appLinkOpen} onOpenChange={setAppLinkOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link to an app page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Link text</Label>
              <Input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="e.g. See the Help Centre"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                If you had text selected in the editor, it will be used automatically.
              </p>
            </div>
            <div>
              <Label className="text-xs">Destination page</Label>
              <div className="mt-2 space-y-3">
                {APP_LINK_OPTIONS.map((group) => (
                  <div key={group.group}>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                      {group.group}
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {group.items.map((opt) => (
                        <button
                          key={opt.path}
                          type="button"
                          onClick={() => setSelectedPath(opt.path)}
                          className={`text-left text-sm px-3 py-2 rounded border ${
                            selectedPath === opt.path
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-[11px] text-muted-foreground">{opt.path}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAppLinkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertAppLink} disabled={!selectedPath}>
              Insert link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      .sort((a, b) => {
        if (a[0] === "About Hello Hoedspruit") return -1;
        if (b[0] === "About Hello Hoedspruit") return 1;
        return a[1].min - b[1].min;
      })
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
          <h1 className="text-2xl font-[550] text-slate-950">FAQs</h1>
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
            <h2 className="text-lg font-medium text-slate-950">{title}</h2>
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
