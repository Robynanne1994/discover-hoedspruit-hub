import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";

type Row = { id: string; title: string; location: string | null; category_page_location: string | null; image_url: string | null; card_image_url: string | null };

/** Shows every listing grouped into one "X & others added" notification. */
const NotificationListings = () => {
  const { id } = useParams();
  const isEvents = useLocation().pathname.startsWith("/my-notifications/events/");
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data: n } = await supabase.from("business_notifications").select("ref_id,ref_ids").eq("id", id!).maybeSingle();
      const ids = (n?.ref_ids?.length ? n.ref_ids : n?.ref_id ? [n.ref_id] : []) as string[];
      if (!ids.length) return setRows([]);
      const { data } = await supabase
        .from(isEvents ? "events" : "listings")
        .select(isEvents ? "id,title,location,image_url,card_image_url:homepage_image_url" : "id,title,location,category_page_location,image_url,card_image_url")
        .in("id", ids)
        .eq("is_active", true)
        .order("title");
      setRows(((data ?? []) as unknown as Row[]).map((r) => ({ category_page_location: null, ...r })));
    })();
  }, [id, isEvents]);

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: "var(--nav-clearance)" }}>
      <PageHeader title={isEvents ? "New Events" : "New Listings"} />
      <div className="px-5 pt-5 flex flex-col gap-1">
        {rows === null ? null : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">{isEvents ? "These events are no longer available." : "These listings are no longer available."}</p>
        ) : (
          rows.map((l) => (
            <Link key={l.id} to={isEvents ? `/events/${l.id}` : `/listing/${l.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-3 border border-border">
              {(l.card_image_url || l.image_url) && (
                <img src={l.card_image_url || l.image_url!} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] text-foreground truncate">{l.title}</p>
                {(l.category_page_location || l.location) && (
                  <p className="text-[13px] text-muted-foreground truncate">{l.category_page_location || l.location}</p>
                )}
              </div>
              <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationListings;
