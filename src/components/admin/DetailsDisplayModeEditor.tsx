import { DISPLAY_SECTIONS, sectionsForGroup, type DisplayMode, type SectionGroup, DISPLAY_DEFAULTS_SECTION } from "@/lib/detailsDisplayModes";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const MODE_OPTIONS: { label: string; value: DisplayMode | "default" }[] = [
  { label: "Default", value: "default" },
  { label: "Yes only", value: "yes_only" },
  { label: "Yes & No", value: "all" },
];

const GLOBAL_OPTIONS: { label: string; value: DisplayMode }[] = [
  { label: "Yes only", value: "yes_only" },
  { label: "Yes & No", value: "all" },
];

interface PerListingProps {
  value: Record<string, DisplayMode | "default">;
  onChange: (v: Record<string, DisplayMode | "default">) => void;
  groups: SectionGroup[];
}

export const DetailsDisplayModeEditor = ({ value, onChange, groups }: PerListingProps) => {
  const visible = DISPLAY_SECTIONS.filter((s) => groups.includes(s.group));
  if (visible.length === 0) return null;
  return (
    <div className="border-t border-border pt-4 mt-2 space-y-3">
      <p className="text-foreground mb-1 text-xl font-bold border-2 border-zinc-900 text-center bg-zinc-700 text-slate-50">
        Details Cards Display
      </p>
      <p className="text-xs text-muted-foreground">
        Per card, choose whether to show only the "yes" items, or both "yes" and "no" with ticks/crosses. "Default" follows the global setting.
      </p>
      <div className="space-y-2">
        {visible.map((s) => {
          const current = value?.[s.key] ?? "default";
          return (
            <div key={s.key} className="flex items-center justify-between gap-3">
              <Label className="text-sm font-semibold text-slate-950">{s.title}</Label>
              <div className="inline-flex rounded-md border border-border bg-background overflow-hidden">
                {MODE_OPTIONS.map((opt) => {
                  const active = current === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChange({ ...value, [s.key]: opt.value })}
                      className={cn(
                        "px-3 py-1 text-xs transition-colors",
                        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DetailsDisplayDefaultsEditor = () => {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["details-display-defaults"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", DISPLAY_DEFAULTS_SECTION)
        .maybeSingle();
      return ((data?.content as any)?.defaults ?? {}) as Record<string, DisplayMode>;
    },
  });
  const [local, setLocal] = useState<Record<string, DisplayMode>>({});
  useEffect(() => { if (data) setLocal(data); }, [data]);

  const save = useMutation({
    mutationFn: async (next: Record<string, DisplayMode>) => {
      const { data: row } = await supabase
        .from("site_content")
        .select("id")
        .eq("section", DISPLAY_DEFAULTS_SECTION)
        .maybeSingle();
      if (row?.id) {
        const { error } = await supabase.from("site_content").update({ content: { defaults: next } }).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_content").insert({ section: DISPLAY_DEFAULTS_SECTION, content: { defaults: next } });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["details-display-defaults"] });
      toast.success("Defaults saved");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  return (
    <div className="rounded-lg border border-border p-4 space-y-3 bg-background">
      <div>
        <p className="font-semibold text-slate-950">Details cards — global defaults</p>
        <p className="text-xs text-muted-foreground">
          Default mode for each yes/no card. Individual listings can override these.
        </p>
      </div>
      <div className="space-y-2">
        {DISPLAY_SECTIONS.map((s) => {
          const current = local[s.key] ?? "all";
          return (
            <div key={s.key} className="flex items-center justify-between gap-3">
              <Label className="text-sm text-slate-950">
                <span className="text-muted-foreground capitalize text-xs mr-2">{s.group}</span>
                {s.title}
              </Label>
              <div className="inline-flex rounded-md border border-border bg-background overflow-hidden">
                {GLOBAL_OPTIONS.map((opt) => {
                  const active = current === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLocal({ ...local, [s.key]: opt.value })}
                      className={cn(
                        "px-3 py-1 text-xs transition-colors",
                        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => save.mutate(local)} disabled={save.isPending}>
          Save defaults
        </Button>
      </div>
    </div>
  );
};
