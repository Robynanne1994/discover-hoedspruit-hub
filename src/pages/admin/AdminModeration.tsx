import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type TabKey = "listing" | "specials" | "events" | "claims" | "features";

const TABS: { key: TabKey; label: string }[] = [
  { key: "listing", label: "Listing edits" },
  { key: "specials", label: "Specials" },
  { key: "events", label: "Events" },
  { key: "claims", label: "Claim requests" },
  { key: "features", label: "Feature requests" },
];

const PILL: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  changes_requested: "bg-zinc-200 text-zinc-700",
};

const Pill = ({ status }: { status: string }) => (
  <span className={`text-xs font-medium px-2 py-1 rounded-full ${PILL[status] ?? "bg-zinc-200"}`}>
    {status.replace("_", " ")}
  </span>
);

const isImageUrl = (s: string) =>
  /^https?:\/\/\S+/i.test(s) && (/\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i.test(s) || /\/storage\/v1\/object\/public\//i.test(s));

const extractImageUrls = (label: string, value: any): string[] => {
  const labelLooksImage = /image|photo|gallery|cover|logo|avatar|hero|banner|thumb/i.test(label);
  if (typeof value === "string") {
    const parts = value.split(/\r?\n|,\s*/).map((s) => s.trim()).filter(Boolean);
    const imgs = parts.filter((p) => isImageUrl(p) || (labelLooksImage && /^https?:\/\//i.test(p)));
    return imgs;
  }
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string" && (isImageUrl(v) || (labelLooksImage && /^https?:\/\//i.test(v))));
  }
  return [];
};

const KV = ({ label, value }: { label: string; value: any }) => {
  if (value === null || value === undefined || value === "") return null;
  const images = extractImageUrls(label, value);
  const isObj = typeof value === "object" && images.length === 0;
  return (
    <div className="text-sm py-1.5 border-b border-border last:border-0">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="mt-1 break-words">
        {images.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {images.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer" className="block aspect-[4/3] rounded-md overflow-hidden border border-border bg-muted">
                  <img src={src} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </a>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground break-all">{images.join("\n")}</div>
          </div>
        ) : isObj ? (
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
        ) : (
          String(value)
        )}
      </div>
    </div>
  );
};

const AdminModeration = () => {
  const [tab, setTab] = useState<TabKey>("listing");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [extra, setExtra] = useState<Record<string, any>>({});
  const [accounts, setAccounts] = useState<Record<string, any>>({});

  const tableFor = (t: TabKey) =>
    t === "listing" ? "listing_edits_pending"
    : t === "specials" ? "specials_pending"
    : t === "events" ? "events_pending"
    : t === "claims" ? "claim_requests"
    : "feature_requests";

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from(tableFor(tab) as any).select("*").order("created_at", { ascending: false });
    setItems(data ?? []);

    // Hydrate live data for context (listing title, current values)
    const listingIds = new Set<string>();
    const userIds = new Set<string>();
    (data ?? []).forEach((r: any) => {
      if (r.listing_id) listingIds.add(r.listing_id);
      const uid = r.owner_id ?? r.user_id;
      if (uid) userIds.add(uid);
    });
    if (listingIds.size > 0) {
      const { data: listings } = await supabase.from("listings").select("*").in("id", Array.from(listingIds));
      const m: Record<string, any> = {};
      (listings ?? []).forEach((l: any) => { m[l.id] = l; });
      setExtra(m);
    } else {
      setExtra({});
    }
    if (userIds.size > 0) {
      const { data: accs } = await supabase.from("business_accounts").select("user_id,business_name,contact_name,contact_email,contact_phone").in("user_id", Array.from(userIds));
      const a: Record<string, any> = {};
      (accs ?? []).forEach((r: any) => { a[r.user_id] = r; });
      setAccounts(a);
    } else {
      setAccounts({});
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const resolve = async (item: any, status: "approved" | "rejected" | "changes_requested") => {
    const t = tableFor(tab);
    const adminNote = note || null;

    if (status === "approved") {
      // Apply to live tables
      try {
        if (tab === "listing") {
          const { error } = await supabase.from("listings").update({ ...item.payload }).eq("id", item.listing_id);
          if (error) throw error;
        } else if (tab === "specials") {
          if (item.special_id) {
            await supabase.from("specials").update({ ...item.payload }).eq("id", item.special_id);
          } else {
            await supabase.from("specials").insert({ ...item.payload });
          }
        } else if (tab === "events") {
          if (item.event_id) {
            await supabase.from("events").update({ ...item.payload }).eq("id", item.event_id);
          } else {
            await supabase.from("events").insert({ ...item.payload });
          }
        } else if (tab === "claims") {
          // Assign user role + link listing
          await supabase.from("user_roles").insert({ user_id: item.user_id, role: "business_owner" as any }).select();
          await supabase.from("listings").update({ business_owner_id: item.user_id }).eq("id", item.listing_id);
        } else if (tab === "features") {
          // Mark live item as featured for date range
          if (item.item_type === "special" && item.item_id) {
            await supabase.from("specials").update({ is_featured: true } as any).eq("id", item.item_id);
          } else if (item.item_type === "event" && item.item_id) {
            await supabase.from("events").update({ is_featured: true } as any).eq("id", item.item_id);
          }
        }
      } catch (e: any) {
        toast.error(e.message ?? "Failed to apply approval");
        return;
      }
    }

    const { error } = await supabase.from(t as any).update({
      status,
      admin_note: adminNote,
      resolved_at: new Date().toISOString(),
    }).eq("id", item.id);

    if (error) { toast.error(error.message); return; }

    // Send in-app notification to the business owner
    try {
      const ownerId = item.owner_id ?? item.user_id;
      if (ownerId) {
        const kindLabel =
          tab === "listing" ? "Business edit" :
          tab === "specials" ? "Special" :
          tab === "events" ? "Event" :
          tab === "claims" ? "Business claim" :
          "Feature request";
        const itemTitle = item.payload?.title || (tab === "listing" ? "your business details" : tab === "claims" ? "your claim" : "your submission");
        const statusLabel = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "needs changes";
        const title = `${kindLabel} ${statusLabel}`;
        const body = adminNote
          ? `${itemTitle} — ${adminNote}`
          : status === "approved" ? `${itemTitle} is now live.`
          : status === "rejected" ? `${itemTitle} was not approved.`
          : `Please update ${itemTitle} and resubmit.`;
        const link =
          tab === "specials" ? "/business/specials" :
          tab === "events" ? "/business/events" :
          tab === "listing" ? "/business/listing" :
          "/business/dashboard";
        await supabase.from("business_notifications").insert({
          user_id: ownerId,
          kind: tab,
          status,
          title,
          body,
          link,
          ref_table: t,
          ref_id: item.id,
        });
      }
    } catch (e) {
      console.warn("Notification send failed", e);
    }

    toast.success(status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Changes requested");
    setOpenId(null);
    setNote("");
    await load();
  };

  return (
    <div className="text-gray-950">
      <h1 className="text-2xl font-bold mb-1">Moderation queue</h1>
      <p className="text-sm text-muted-foreground mb-6">Review pending submissions from business owners.</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setOpenId(null); }}
            className={`text-sm px-4 py-2 rounded-full border transition-colors ${
              tab === t.key ? "bg-foreground text-background border-foreground" : "bg-card text-foreground border-border hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!loading && items.length === 0 && <p className="text-sm text-muted-foreground">Nothing to review.</p>}

      <div className="space-y-3">
        {items.map((it) => {
          const open = openId === it.id;
          const live = it.listing_id ? extra[it.listing_id] : null;
          const acc = accounts[it.owner_id ?? it.user_id];
          return (
            <div key={it.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {tab === "claims" ? `Claim for: ${live?.title ?? it.listing_id}` :
                     tab === "listing" ? `Listing edit: ${live?.title ?? it.listing_id}` :
                     tab === "features" ? `Feature ${it.item_type}` :
                     it.payload?.title ?? "Untitled"}
                  </div>
                  {(acc?.business_name || acc?.contact_name || acc?.contact_email) && (
                    <div className="text-xs text-foreground/80 mt-1">
                      {acc.business_name && <span className="font-medium">{acc.business_name}</span>}
                      {acc.business_name && acc.contact_name && <span className="text-muted-foreground"> · </span>}
                      {acc.contact_name && <span>{acc.contact_name}</span>}
                      {acc.contact_email && <span className="text-muted-foreground"> · {acc.contact_email}</span>}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(it.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill status={it.status} />
                  <Button size="sm" variant="outline" onClick={() => { setOpenId(open ? null : it.id); setNote(it.admin_note ?? ""); }}>
                    {open ? "Close" : "Review"}
                  </Button>
                </div>
              </div>

              {open && (
                <div className="mt-4 border-t border-border pt-4">
                  {tab === "listing" && live && (
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Current</div>
                        <KV label="Title" value={live.title} />
                        <KV label="Description" value={live.description} />
                        <KV label="Phone" value={live.phone} />
                        <KV label="Email" value={live.email} />
                        <KV label="Website" value={live.website} />
                        <KV label="Location" value={live.location} />
                        <KV label="Hours" value={live.opening_hours} />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Proposed</div>
                        {Object.entries(it.payload ?? {}).map(([k, v]) => <KV key={k} label={k} value={v} />)}
                      </div>
                    </div>
                  )}

                  {(tab === "specials" || tab === "events") && (
                    <div className="mb-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Preview</div>
                      {it.payload?.image_url && <img src={it.payload.image_url} alt="" className="w-full max-w-sm rounded-lg mb-3" />}
                      {Object.entries(it.payload ?? {}).map(([k, v]) => <KV key={k} label={k} value={v} />)}
                      {it.feature_requested && <div className="text-xs mt-2 text-orange-700">Feature requested</div>}
                    </div>
                  )}

                  {tab === "claims" && (
                    <div className="mb-4">
                      <KV label="Business name" value={acc?.business_name} />
                      <KV label="Contact name" value={acc?.contact_name} />
                      <KV label="Contact email" value={acc?.contact_email} />
                      <KV label="Contact phone" value={acc?.contact_phone} />
                      <KV label="Listing" value={live?.title} />
                      <KV label="Listing phone" value={live?.phone} />
                      <KV label="Listing email" value={live?.email} />
                      <KV label="Proof contact" value={it.proof_contact} />
                      <KV label="Note" value={it.note} />
                    </div>
                  )}

                  {tab === "features" && (
                    <div className="mb-4">
                      {Object.entries(it).filter(([k]) => !["id"].includes(k)).map(([k, v]) => <KV key={k} label={k} value={v} />)}
                    </div>
                  )}

                  <Textarea
                    placeholder="Optional note to owner (required for changes requested)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mb-3"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => resolve(it, "approved")}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => resolve(it, "changes_requested")} disabled={!note}>
                      Request changes
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => resolve(it, "rejected")}>Reject</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminModeration;
