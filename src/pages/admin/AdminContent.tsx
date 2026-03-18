import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AdminContent = () => {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [benefits, setBenefits] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-site-content", "advertise"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*").eq("section", "advertise").single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data?.content) {
      const c = data.content as { title?: string; description?: string; benefits?: string[] };
      setTitle(c.title ?? "");
      setDescription(c.description ?? "");
      setBenefits((c.benefits ?? []).join("\n"));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const content = {
        title,
        description,
        benefits: benefits.split("\n").filter(Boolean),
      };
      const { error } = await supabase.from("site_content").update({ content }).eq("section", "advertise");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-content"] });
      toast.success("Content saved");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Site Content</h1>
      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">Advertise Section</h2>
        <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
        <div><Label>Benefits (one per line)</Label><Textarea value={benefits} onChange={(e) => setBenefits(e.target.value)} rows={4} /></div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Save Changes</Button>
      </div>
    </div>
  );
};

export default AdminContent;
