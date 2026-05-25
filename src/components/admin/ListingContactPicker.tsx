import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface ListingContacts {
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  additional_emails: string[];
  additional_phones: string[];
  additional_whatsapps: string[];
}

interface Props {
  /** Fired when the admin selects a listing — receives that listing's contact details. */
  onApply: (contacts: ListingContacts, listing: { id: string; title: string }) => void;
  /** Optional: pre-supplied listings. If omitted the picker fetches them. */
  listings?: Array<{ id: string; title: string }>;
  className?: string;
}

/**
 * Reusable admin control:
 *  1. Checkbox: "Use existing listing's contact details"
 *  2. When ticked, a searchable listing picker
 *  3. On pick, fetches that listing's contact fields and calls onApply
 */
const ListingContactPicker = ({ onApply, listings: providedListings, className }: Props) => {
  const [enabled, setEnabled] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<{ id: string; title: string } | null>(null);

  const { data: fetched } = useQuery({
    queryKey: ["listing-contact-picker-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, title")
        .order("title", { ascending: true })
        .limit(2000);
      return data ?? [];
    },
    enabled: enabled && !providedListings,
  });

  const listings = providedListings ?? fetched ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings.slice(0, 8);
    return listings.filter((l) => l.title.toLowerCase().includes(q)).slice(0, 8);
  }, [listings, query]);

  useEffect(() => {
    if (!enabled) {
      setQuery("");
      setPicked(null);
    }
  }, [enabled]);

  const handlePick = async (l: { id: string; title: string }) => {
    setPicked(l);
    setQuery("");
    const { data, error } = await supabase
      .from("listings")
      .select("phone, email, whatsapp, additional_phones, additional_emails, additional_whatsapps")
      .eq("id", l.id)
      .maybeSingle();
    if (error || !data) return;
    onApply(
      {
        contact_email: data.email || "",
        contact_phone: data.phone || "",
        contact_whatsapp: data.whatsapp || "",
        additional_emails: Array.isArray(data.additional_emails) ? data.additional_emails : [],
        additional_phones: Array.isArray(data.additional_phones) ? data.additional_phones : [],
        additional_whatsapps: Array.isArray(data.additional_whatsapps) ? data.additional_whatsapps : [],
      },
      l,
    );
  };

  return (
    <div className={`rounded-md border p-3 space-y-2 ${className || ""}`}>
      <div className="flex items-center gap-2">
        <Checkbox
          id="use-listing-contacts"
          checked={enabled}
          onCheckedChange={(v) => setEnabled(!!v)}
        />
        <Label htmlFor="use-listing-contacts" className="text-sm cursor-pointer font-normal">
          Use existing listing's contact details
        </Label>
      </div>
      {enabled && (
        <div className="space-y-2">
          {picked ? (
            <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
              <span className="text-sm">
                Copied contacts from <strong>{picked.title}</strong>
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPicked(null)}>
                Change
              </Button>
            </div>
          ) : (
            <>
              <Input
                placeholder="Type to search listings..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {filtered.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {filtered.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handlePick(l)}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    >
                      {l.title}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Selecting a listing fills the contact fields below with its details. You can still edit them after.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ListingContactPicker;
