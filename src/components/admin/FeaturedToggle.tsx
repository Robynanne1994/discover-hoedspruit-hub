import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type FeaturedTable = "events" | "specials" | "listings" | "bush_telegraph_resources";

type FeaturedToggleProps = {
  table: FeaturedTable;
  id: string;
  title: string;
  featured: boolean;
};

const FeaturedToggle = ({ table, id, title, featured }: FeaturedToggleProps) => {
  const qc = useQueryClient();
  const [checked, setChecked] = useState(featured);
  const [saving, setSaving] = useState(false);

  useEffect(() => setChecked(featured), [featured]);

  const updateFeatured = async (next: boolean) => {
    const previous = checked;
    setChecked(next);
    setSaving(true);

    try {
      const { error } = await supabase.from(table).update({ is_featured: next }).eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success(next ? "Marked as featured" : "Removed from featured");
    } catch (error) {
      setChecked(previous);
      toast.error(error instanceof Error ? error.message : "Could not update Featured");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Switch
      checked={checked}
      disabled={saving}
      onCheckedChange={updateFeatured}
      aria-label={`Featured: ${title}`}
      aria-busy={saving}
    />
  );
};

export default FeaturedToggle;
