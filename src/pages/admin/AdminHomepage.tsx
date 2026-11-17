import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Search, Plus, Pencil, Check } from "lucide-react";

import HomeWhatsOnEditor from "@/components/admin/HomeWhatsOnEditor";

const SECTIONS = [
  { key: "homepage-eat", label: "Eat in Hoedspruit", categorySearch: "%restaurant%" },
  { key: "homepage-stay", label: "Places to Stay", categorySearch: "%accommodation%" },
  { key: "homepage-shop", label: "Where to Shop", categorySearch: "%shop%" },
  { key: "homepage-do", label: "What to Do", categorySearch: "%activit%" },
];

interface Listing {
  id: string;
  title: string;
  image_url: string | null;
  location: string | null;
}

const SectionTitleEditor = ({ sectionKey, defaultLabel }: { sectionKey: string; defaultLabel: string }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const titleKey = `${sectionKey}-title`;

  const { data: customTitle } = useQuery({
    queryKey: ["site-content", titleKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", titleKey)
        .maybeSingle();
      if (data?.content && typeof data.content === "string" && data.content.trim()) {
        return data.content;
      }
      return null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const { data: existing } = await supabase
        .from("site_content")
        .select("id")
        .eq("section", titleKey)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("site_content")
          .update({ content: newTitle as any })
          .eq("section", titleKey);
      } else {
        await supabase
          .from("site_content")
          .insert([{ section: titleKey, content: newTitle as any }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content", titleKey] });
      // Also invalidate the frontend hook cache
      const shortKey = sectionKey.replace("homepage-", "");
      queryClient.invalidateQueries({ queryKey: [`homepage-${shortKey}-title`] });
      toast.success("Section title updated");
      setIsEditing(false);
    },
  });

  const displayTitle = customTitle || defaultLabel;

  const startEditing = () => {
    setEditValue(displayTitle);
    setIsEditing(true);
  };

  const saveTitle = () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === defaultLabel) {
      // Reset to default
      saveMutation.mutate(defaultLabel);
    } else {
      saveMutation.mutate(trimmed);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="text-base font-semibold h-10 w-full sm:w-64 min-w-0 bg-card"
          onKeyDown={(e) => e.key === "Enter" && saveTitle()}
          autoFocus
        />
        <Button size="icon" onClick={saveTitle} disabled={saveMutation.isPending} aria-label="Save Section Title" title="Save Section Title">
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={() => setIsEditing(false)} aria-label="Cancel Title Edit" title="Cancel Title Edit">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h3 className="font-bold text-lg text-foreground">{displayTitle}</h3>
      <Button size="icon" onClick={startEditing} className="h-8 w-8 shrink-0 bg-[var(--filter-ink)] text-primary-foreground border-transparent hover:bg-primary-hover" aria-label={`Edit ${defaultLabel} Title`} title="Edit Section Title">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

const SectionEditor = ({ sectionKey, label, categorySearch }: { sectionKey: string; label: string; categorySearch: string }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: curatedIds = [] } = useQuery({
    queryKey: ["site-content", sectionKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", sectionKey)
        .maybeSingle();
      if (data?.content && Array.isArray(data.content)) {
        return data.content as string[];
      }
      return [];
    },
  });

  const { data: curatedListings = [] } = useQuery({
    queryKey: ["curated-listings", sectionKey, curatedIds],
    queryFn: async () => {
      if (!curatedIds.length) return [];
      const { data } = await supabase
        .from("listings")
        .select("id, title, image_url, location")
        .in("id", curatedIds);
      const map = new Map((data || []).map((l) => [l.id, l]));
      return curatedIds.map((id) => map.get(id)).filter(Boolean) as Listing[];
    },
    enabled: curatedIds.length > 0,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["listing-search", sectionKey, search],
    queryFn: async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .ilike("title", categorySearch)
        .limit(1);

      if (!categories?.length) return [];
      const categoryId = categories[0].id;

      const { data: linkedIds } = await supabase
        .from("listing_categories")
        .select("listing_id")
        .eq("category_id", categoryId);
      const ids = linkedIds?.map((l) => l.listing_id) || [];

      let query = supabase
        .from("listings")
        .select("id, title, image_url, location")
        .or(`category_id.eq.${categoryId}${ids.length ? `,id.in.(${ids.join(",")})` : ""}`);

      if (search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }

      const { data } = await query.limit(20);
      return (data || []) as Listing[];
    },
    enabled: true,
  });

  const saveMutation = useMutation({
    mutationFn: async (newIds: string[]) => {
      const { data: existing } = await supabase
        .from("site_content")
        .select("id")
        .eq("section", sectionKey)
        .maybeSingle();

      const contentValue = JSON.parse(JSON.stringify(newIds));

      if (existing) {
        await supabase
          .from("site_content")
          .update({ content: contentValue })
          .eq("section", sectionKey);
      } else {
        await supabase
          .from("site_content")
          .insert([{ section: sectionKey, content: contentValue }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content", sectionKey] });
      queryClient.invalidateQueries({ queryKey: ["curated-listings", sectionKey] });
      toast.success("Homepage updated");
    },
  });

  const addListing = (id: string) => {
    if (curatedIds.includes(id)) return;
    if (curatedIds.length >= 8) {
      toast.error("Maximum 8 listings per section");
      return;
    }
    saveMutation.mutate([...curatedIds, id]);
  };

  const removeListing = (id: string) => {
    saveMutation.mutate(curatedIds.filter((cid) => cid !== id));
  };

  const availableResults = searchResults.filter((l) => !curatedIds.includes(l.id));

  return (
    <section aria-label={label} className="bg-card text-card-foreground border border-border rounded-xl p-4 sm:p-6 space-y-5 shadow-sm">
      <div className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 rounded-t-xl bg-primary-tint border-b border-border">
        <SectionTitleEditor sectionKey={sectionKey} defaultLabel={label} />
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-3 leading-6">
          Selected ({curatedIds.length}/8) — {curatedIds.length === 0 ? "showing auto-picks" : "showing curated picks"}
        </p>
        <div className="divide-y divide-border">
          {curatedListings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-3 py-3">
              {listing.image_url && (
                <img src={listing.image_url} alt="" className="w-12 h-12 shrink-0 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground break-words">{listing.title}</p>
                <p className="text-sm text-muted-foreground break-words">{listing.location}</p>
              </div>
              <Button size="icon" className="h-7 w-7 shrink-0 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={() => removeListing(listing.id)} disabled={saveMutation.isPending} aria-label={`Remove ${listing.title}`} title={`Remove ${listing.title}`}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {curatedIds.length < 8 && (
        <div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search listings to add..."
              aria-label={`Search ${label} Listings`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-12 bg-card border-primary/30 focus-visible:ring-primary"
            />
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {availableResults.map((listing) => (
              <Button
                key={listing.id}
                onClick={() => addListing(listing.id)}
                variant="ghost"
                disabled={saveMutation.isPending}
                aria-label={`Add ${listing.title}`}
                className="flex items-center justify-start gap-3 w-full h-auto min-h-16 text-left p-3 rounded-none whitespace-normal text-foreground hover:bg-surface-inset hover:text-foreground"
              >
                {listing.image_url && (
                  <img src={listing.image_url} alt="" className="w-12 h-12 shrink-0 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold break-words">{listing.title}</p>
                  <p className="text-sm font-normal text-muted-foreground break-words">{listing.location}</p>
                </div>
                <Plus className="h-4 w-4 text-primary shrink-0" />
              </Button>
            ))}
          </div>
        </div>
      )}

      {curatedIds.length > 0 && (
        <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate([])}>
          Clear All (Use Auto-Picks)
        </Button>
      )}
    </section>
  );
};

const AdminHomepage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Homepage Sections</h1>
      </div>
      <HomeWhatsOnEditor />
      {SECTIONS.map((section) => (
        <SectionEditor key={section.key} sectionKey={section.key} label={section.label} categorySearch={section.categorySearch} />
      ))}
    </div>
  );
};

export default AdminHomepage;
