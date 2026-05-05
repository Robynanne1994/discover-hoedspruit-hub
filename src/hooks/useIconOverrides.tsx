import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type IconOverrideMap = Record<string, string>;

export const useIconOverrides = () => {
  return useQuery({
    queryKey: ["icon-overrides"],
    queryFn: async (): Promise<IconOverrideMap> => {
      const { data, error } = await supabase
        .from("icon_overrides")
        .select("slot, image_url");
      if (error) throw error;
      const map: IconOverrideMap = {};
      (data ?? []).forEach((r: any) => {
        if (r.slot && r.image_url) map[r.slot] = r.image_url;
      });
      return map;
    },
    staleTime: 1000 * 60 * 5,
  });
};
