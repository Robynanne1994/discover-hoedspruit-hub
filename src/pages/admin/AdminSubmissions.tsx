import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trash2, Mail, MessageSquare, Eye, Radio, ExternalLink, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Contact = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

type Feedback = {
  id: string;
  user_id: string;
  feedback_type: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

type ResourceSuggestion = Contact & {
  parsed: {
    resourceName: string;
    resourceLink: string;
    about: string;
  };
};

type AdvertiseEnquiry = Contact & {
  parsed: { business: string; about: string };
};

const LC_TAG = "[Local Channels suggestion]";
const AD_TAG = "[Advertising Enquiry]";

function parseResourceSuggestion(c: Contact): ResourceSuggestion | null {
  if (!c.message.includes(LC_TAG)) return null;
  const lines = c.message.split("\n");
  let resourceName = "";
  let resourceLink = "";
  let about = "";
  for (const line of lines) {
    if (line.startsWith("Resource name:")) resourceName = line.replace("Resource name:", "").trim();
    if (line.startsWith("Resource link:")) resourceLink = line.replace("Resource link:", "").trim();
    if (line.startsWith("About:")) about = line.replace("About:", "").trim();
  }
  if (!resourceName && !resourceLink) return null;
  return { ...c, parsed: { resourceName, resourceLink, about } };
}

function parseAdvertiseEnquiry(c: Contact): AdvertiseEnquiry | null {
  if (!c.message.includes(AD_TAG)) return null;
  const rest = c.message.replace(AD_TAG, "").trim();
  const businessMatch = rest.match(/^Business:\s*([^.]+)\.\s*/);
  const business = businessMatch ? businessMatch[1].trim() : "";
  const about = businessMatch ? rest.slice(businessMatch[0].length).trim() : rest;
  return { ...c, parsed: { business, about } };
}

const AdminSubmissions = () => {
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<{ kind: "contact" | "feedback" | "resource" | "advertise"; data: any } | null>(null);

  const contactsQ = useQuery({
    queryKey: ["admin-contact-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contact[];
    },
  });

  const feedbackQ = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Feedback[];
    },
  });

  const profilesQ = useQuery({
    queryKey: ["admin-feedback-profiles", feedbackQ.data?.map((f) => f.user_id).join(",")],
    enabled: !!feedbackQ.data?.length,
    queryFn: async () => {
      const ids = Array.from(new Set((feedbackQ.data ?? []).map((f) => f.user_id)));
      if (!ids.length) return {} as Record<string, { display_name: string | null; email: string | null }>;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", ids);
      if (error) throw error;
      const map: Record<string, { display_name: string | null; email: string | null }> = {};
      (data ?? []).forEach((p: any) => (map[p.id] = { display_name: p.display_name, email: p.email }));
      return map;
    },
  });

  const { regularContacts, resourceSuggestions, advertiseEnquiries } = useMemo(() => {
    const all = contactsQ.data ?? [];
    const resources: ResourceSuggestion[] = [];
    const ads: AdvertiseEnquiry[] = [];
    const regular: Contact[] = [];
    for (const c of all) {
      const r = parseResourceSuggestion(c);
      if (r) { resources.push(r); continue; }
      const a = parseAdvertiseEnquiry(c);
      if (a) { ads.push(a); continue; }
      regular.push(c);
    }
    return { regularContacts: regular, resourceSuggestions: resources, advertiseEnquiries: ads };
  }, [contactsQ.data]);

  const markRead = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase.from("feedback").update({ is_read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-feedback"] }),
  });

  const deleteFeedback = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feedback").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-feedback"] });
      toast.success("Feedback deleted");
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-contact-submissions"] });
      toast.success("Deleted");
    },
  });

  const fmt = (d: string) => format(new Date(d), "d MMM yyyy, HH:mm");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Messages from contact forms, user feedback, and resource suggestions.
        </p>
      </div>

      <Tabs defaultValue="contact" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contact" className="gap-2">
            <Mail className="h-4 w-4" />
            Contact ({regularContacts.length})
          </TabsTrigger>
          <TabsTrigger value="advertise" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Advertise ({advertiseEnquiries.length})
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <Radio className="h-4 w-4" />
            Local Channels ({resourceSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback ({feedbackQ.data?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="space-y-2">
          {contactsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {regularContacts.length === 0 && (
            <p className="text-sm text-muted-foreground">No contact submissions yet.</p>
          )}
          {regularContacts.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-lg p-4 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <a href={`mailto:${c.email}`} className="text-sm text-primary hover:underline">
                    {c.email}
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{fmt(c.created_at)}</p>
                <p className="text-sm text-foreground mt-2 line-clamp-2 whitespace-pre-wrap">
                  {c.message}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewing({ kind: "contact", data: c })}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Delete this submission?")) deleteContact.mutate(c.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="advertise" className="space-y-2">
          {contactsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {advertiseEnquiries.length === 0 && (
            <p className="text-sm text-muted-foreground">No advertising enquiries yet.</p>
          )}
          {advertiseEnquiries.map((a) => (
            <div
              key={a.id}
              className="bg-card border border-border rounded-lg p-4 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">Advertise</Badge>
                  <span className="font-medium text-foreground">{a.parsed.business || a.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {a.name} · <a href={`mailto:${a.email}`} className="text-primary hover:underline">{a.email}</a> · {fmt(a.created_at)}
                </p>
                {a.parsed.about && (
                  <p className="text-sm text-foreground mt-2 line-clamp-2 whitespace-pre-wrap">
                    {a.parsed.about}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewing({ kind: "advertise", data: a })}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Delete this enquiry?")) deleteContact.mutate(a.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="resources" className="space-y-2">
          {contactsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {resourceSuggestions.length === 0 && (
            <p className="text-sm text-muted-foreground">No resource suggestions yet.</p>
          )}
          {resourceSuggestions.map((r) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-lg p-4 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">Local Channels</Badge>
                  <span className="font-medium text-foreground">{r.parsed.resourceName || "Unnamed resource"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {r.name} · <a href={`mailto:${r.email}`} className="text-primary hover:underline">{r.email}</a> · {fmt(r.created_at)}
                </p>
                {r.parsed.about && (
                  <p className="text-sm text-foreground mt-2 line-clamp-2 whitespace-pre-wrap">
                    {r.parsed.about}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewing({ kind: "resource", data: r })}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Delete this resource suggestion?")) deleteContact.mutate(r.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-2">
          {feedbackQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {feedbackQ.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No feedback yet.</p>
          )}
          {feedbackQ.data?.map((f) => {
            const prof = profilesQ.data?.[f.user_id];
            return (
              <div
                key={f.id}
                className="bg-card border border-border rounded-lg p-4 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="capitalize">
                      {f.feedback_type}
                    </Badge>
                    {!f.is_read && <Badge>New</Badge>}
                    {f.subject && (
                      <span className="font-medium text-foreground">{f.subject}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {prof?.display_name ?? "User"} {prof?.email ? `· ${prof.email}` : ""} · {fmt(f.created_at)}
                  </p>
                  <p className="text-sm text-foreground mt-2 line-clamp-2 whitespace-pre-wrap">
                    {f.message}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setViewing({ kind: "feedback", data: { ...f, _profile: prof } });
                      if (!f.is_read) markRead.mutate({ id: f.id, is_read: true });
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Delete this feedback?")) deleteFeedback.mutate(f.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          {viewing?.kind === "contact" && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.data.name}</DialogTitle>
                <DialogDescription>
                  <a href={`mailto:${viewing.data.email}`} className="text-primary hover:underline">
                    {viewing.data.email}
                  </a>
                  {" · "}
                  {fmt(viewing.data.created_at)}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm whitespace-pre-wrap text-foreground">{viewing.data.message}</p>
              <Button asChild>
                <a href={`mailto:${viewing.data.email}?subject=Re: your message`}>Reply by email</a>
              </Button>
            </>
          )}
          {viewing?.kind === "resource" && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.data.parsed.resourceName || "Resource suggestion"}</DialogTitle>
                <DialogDescription>
                  {viewing.data.name}
                  {" · "}
                  <a href={`mailto:${viewing.data.email}`} className="text-primary hover:underline">
                    {viewing.data.email}
                  </a>
                  {" · "}
                  {fmt(viewing.data.created_at)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {viewing.data.parsed.resourceLink && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={viewing.data.parsed.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {viewing.data.parsed.resourceLink}
                    </a>
                  </div>
                )}
                {viewing.data.parsed.about && (
                  <p className="text-sm whitespace-pre-wrap text-foreground">{viewing.data.parsed.about}</p>
                )}
                <p className="text-xs text-muted-foreground whitespace-pre-wrap border-t border-border pt-3 mt-2">
                  {viewing.data.message}
                </p>
              </div>
              <Button asChild>
                <a href={`mailto:${viewing.data.email}?subject=Re: your resource suggestion`}>Reply by email</a>
              </Button>
            </>
          )}
          {viewing?.kind === "advertise" && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.data.parsed.business || "Advertising enquiry"}</DialogTitle>
                <DialogDescription>
                  {viewing.data.name}
                  {" · "}
                  <a href={`mailto:${viewing.data.email}`} className="text-primary hover:underline">
                    {viewing.data.email}
                  </a>
                  {" · "}
                  {fmt(viewing.data.created_at)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {viewing.data.parsed.about && (
                  <p className="text-sm whitespace-pre-wrap text-foreground">{viewing.data.parsed.about}</p>
                )}
                <p className="text-xs text-muted-foreground whitespace-pre-wrap border-t border-border pt-3 mt-2">
                  {viewing.data.message}
                </p>
              </div>
              <Button asChild>
                <a href={`mailto:${viewing.data.email}?subject=Re: your advertising enquiry`}>Reply by email</a>
              </Button>
            </>
          )}
          {viewing?.kind === "feedback" && (
            <>
              <DialogHeader>
                <DialogTitle className="capitalize">
                  {viewing.data.subject || `${viewing.data.feedback_type} feedback`}
                </DialogTitle>
                <DialogDescription>
                  {viewing.data._profile?.display_name ?? "User"}
                  {viewing.data._profile?.email ? ` · ${viewing.data._profile.email}` : ""}
                  {" · "}
                  {fmt(viewing.data.created_at)}
                </DialogDescription>
              </DialogHeader>
              <Badge variant="secondary" className="w-fit capitalize">
                {viewing.data.feedback_type}
              </Badge>
              <p className="text-sm whitespace-pre-wrap text-foreground">{viewing.data.message}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    markRead.mutate({ id: viewing.data.id, is_read: !viewing.data.is_read })
                  }
                >
                  Mark as {viewing.data.is_read ? "unread" : "read"}
                </Button>
                {viewing.data._profile?.email && (
                  <Button asChild>
                    <a href={`mailto:${viewing.data._profile.email}?subject=Re: your feedback`}>
                      Reply
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubmissions;