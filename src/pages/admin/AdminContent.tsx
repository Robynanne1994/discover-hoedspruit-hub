import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";

const AdminContent = () => {
  const qc = useQueryClient();

  // Header / Logo state
  const [logoUrl, setLogoUrl] = useState("");

  // Hero image state
  const [heroImageUrl, setHeroImageUrl] = useState("");

  // Advertise section state
  const [advTitle, setAdvTitle] = useState("");
  const [advDescription, setAdvDescription] = useState("");
  const [advBenefits, setAdvBenefits] = useState("");

  // Footer section state
  const [footerTagline, setFooterTagline] = useState("");
  const [footerAddress, setFooterAddress] = useState("");
  const [footerEmail, setFooterEmail] = useState("");
  const [footerPhone, setFooterPhone] = useState("");

  const { data: headerData } = useQuery({
    queryKey: ["admin-site-content", "header"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*").eq("section", "header").single();
      if (error) throw error;
      return data;
    },
  });

  const { data: heroData } = useQuery({
    queryKey: ["admin-site-content", "hero"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*").eq("section", "hero").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: advData } = useQuery({
    queryKey: ["admin-site-content", "advertise"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*").eq("section", "advertise").single();
      if (error) throw error;
      return data;
    },
  });

  const { data: footerData } = useQuery({
    queryKey: ["admin-site-content", "footer"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*").eq("section", "footer").single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (headerData?.content) {
      const c = headerData.content as { logo_url?: string };
      setLogoUrl(c.logo_url ?? "");
    }
  }, [headerData]);

  useEffect(() => {
    if (advData?.content) {
      const c = advData.content as { title?: string; description?: string; benefits?: string[] };
      setAdvTitle(c.title ?? "");
      setAdvDescription(c.description ?? "");
      setAdvBenefits((c.benefits ?? []).join("\n"));
    }
  }, [advData]);

  useEffect(() => {
    if (footerData?.content) {
      const c = footerData.content as { tagline?: string; address?: string; email?: string; phone?: string };
      setFooterTagline(c.tagline ?? "");
      setFooterAddress(c.address ?? "");
      setFooterEmail(c.email ?? "");
      setFooterPhone(c.phone ?? "");
    }
  }, [footerData]);

  const saveHeader = useMutation({
    mutationFn: async () => {
      const content = { logo_url: logoUrl };
      const { error } = await supabase.from("site_content").update({ content }).eq("section", "header");
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["site-content"] }); toast.success("Header saved"); },
    onError: (e) => toast.error(e.message),
  });

  const saveAdvertise = useMutation({
    mutationFn: async () => {
      const content = { title: advTitle, description: advDescription, benefits: advBenefits.split("\n").filter(Boolean) };
      const { error } = await supabase.from("site_content").update({ content }).eq("section", "advertise");
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["site-content"] }); toast.success("Advertise section saved"); },
    onError: (e) => toast.error(e.message),
  });

  const saveFooter = useMutation({
    mutationFn: async () => {
      const content = { tagline: footerTagline, address: footerAddress, email: footerEmail, phone: footerPhone };
      const { error } = await supabase.from("site_content").update({ content }).eq("section", "footer");
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["site-content"] }); toast.success("Footer saved"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Site Content</h1>

      <div className="space-y-8 max-w-2xl">
        {/* Header / Logo */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold text-foreground">Header / Logo</h2>
          <div>
            <Label>Logo Image</Label>
            <ImageUpload bucket="listing-images" value={logoUrl} onChange={setLogoUrl} />
          </div>
          <Button onClick={() => saveHeader.mutate()} disabled={saveHeader.isPending}>Save Changes</Button>
        </div>

        {/* Advertise Section */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold text-foreground">Advertise Section</h2>
          <div><Label>Title</Label><Input value={advTitle} onChange={(e) => setAdvTitle(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={advDescription} onChange={(e) => setAdvDescription(e.target.value)} rows={3} /></div>
          <div><Label>Benefits (one per line)</Label><Textarea value={advBenefits} onChange={(e) => setAdvBenefits(e.target.value)} rows={4} /></div>
          <Button onClick={() => saveAdvertise.mutate()} disabled={saveAdvertise.isPending}>Save Changes</Button>
        </div>

        {/* Footer Section */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold text-foreground">Footer</h2>
          <div><Label>Tagline</Label><Textarea value={footerTagline} onChange={(e) => setFooterTagline(e.target.value)} rows={3} /></div>
          <div><Label>Address</Label><Input value={footerAddress} onChange={(e) => setFooterAddress(e.target.value)} /></div>
          <div><Label>Email</Label><Input value={footerEmail} onChange={(e) => setFooterEmail(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={footerPhone} onChange={(e) => setFooterPhone(e.target.value)} /></div>
          <Button onClick={() => saveFooter.mutate()} disabled={saveFooter.isPending}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default AdminContent;
