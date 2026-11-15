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
      <p className="mb-3 text-xl font-bold border-2 border-primary-hover text-center bg-primary text-primary-foreground">
        Details Cards Display
      </p>
      <p className="text-xs text-muted-foreground">{"\n"}</p>
      <div className="space-y-2">
        {visible.map((s) => {
          const current = value?.[s.key] ?? "default";
          return (
            <div key={s.key} className="flex items-center justify-between gap-3">
              <Label>{s.title}</Label>
              <div className="inline-flex shrink-0 rounded-md border border-primary bg-card overflow-hidden">
                {MODE_OPTIONS.map((opt) => {
                  const active = current === opt.value;
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant="ghost"
                      aria-pressed={active}
                      onClick={() => onChange({ ...value, [s.key]: opt.value })}
                      className={cn(
                        "h-7 rounded-none px-3 py-1 text-xs font-medium transition-colors",
                        active ? "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground" : "bg-card text-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </Button>
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
        <p className="font-semibold text-foreground">Details cards — global defaults</p>
        <p className="text-xs text-muted-foreground">
          Default mode for each yes/no card. Individual listings can override these.
        </p>
      </div>
      <div className="space-y-2">
        {DISPLAY_SECTIONS.map((s) => {
          const current = local[s.key] ?? "all";
          return (
            <div key={s.key} className="flex items-center justify-between gap-3">
              <Label className="text-sm text-foreground">
                <span className="text-muted-foreground capitalize text-xs mr-2">{s.group}</span>
                {s.title}
              </Label>
              <div className="inline-flex shrink-0 rounded-md border border-primary bg-card overflow-hidden">
                {GLOBAL_OPTIONS.map((opt) => {
                  const active = current === opt.value;
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant="ghost"
                      aria-pressed={active}
                      onClick={() => setLocal({ ...local, [s.key]: opt.value })}
                      className={cn(
                        "h-7 rounded-none px-3 py-1 text-xs font-medium transition-colors",
                        active ? "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground" : "bg-card text-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </Button>
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
