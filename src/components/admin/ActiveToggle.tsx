import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type ActiveTable = "events" | "specials" | "listings" | "bush_telegraph_resources";

type ActiveToggleProps = {
  table: ActiveTable;
  id: string;
  title: string;
  active: boolean;
};

const ActiveToggle = ({ table, id, title, active }: ActiveToggleProps) => {
  const qc = useQueryClient();
  const [checked, setChecked] = useState(active);
  const [saving, setSaving] = useState(false);

  useEffect(() => setChecked(active), [active]);

  const updateActive = async (next: boolean) => {
    const previous = checked;
    setChecked(next);
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from(table)
        // A manual choice always wins over the first-image draft automation.
        .update({ is_active: next, auto_activate_on_image: false })
        .eq("id", id)
        .select("is_active")
        .single();
      if (error) throw error;
      setChecked(data.is_active);
      await qc.invalidateQueries();
      if (next && !data.is_active) {
        toast.success("Saved as a draft — it activates when an image is added");
      } else {
        toast.success(data.is_active ? "Marked as active" : "Hidden from the app");
      }
    } catch (error) {
      setChecked(previous);
      toast.error(error instanceof Error ? error.message : "Could not update Active");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Switch
      checked={checked}
      disabled={saving}
      onCheckedChange={updateActive}
      aria-label={`Active: ${title}`}
      aria-busy={saving}
    />
  );
};

export default ActiveToggle;
