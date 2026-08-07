import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trash2, Mail, MessageSquare, Eye, Radio, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Contact = {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read?: boolean;
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
  admin_reply?: string | null;
  replied_at?: string | null;
  replied_by?: string | null;
  image_url?: string | null;
  reply_by_email?: boolean | null;
  reply_email?: string | null;
};

type ResourceSuggestion = Contact & {
  parsed: {
    resourceName: string;
    resourceLink: string;
    about: string;
  };
};

type FeedbackProfile = { display_name: string | null; email: string | null };

type ViewingSubmission =
  | { kind: "contact"; data: Contact }
  | { kind: "resource"; data: ResourceSuggestion }
  | { kind: "feedback"; data: Feedback & { _profile?: FeedbackProfile } };

type ContactSubmissionsAdminClient = {
  from: (table: "contact_submissions") => {
    update: (values: { is_read: boolean }) => {
      eq: (column: "id", value: string) => Promise<{ error: Error | null }>;
    };
  };
};

const contactSubmissionsClient = supabase as unknown as ContactSubmissionsAdminClient;

const LC_TAG = "[Local Channels suggestion]";

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


const AdminSubmissions = () => {
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<ViewingSubmission | null>(null);

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
      const map: Record<string, FeedbackProfile> = {};
      (data ?? []).forEach((p) => (map[p.id] = { display_name: p.display_name, email: p.email }));
      return map;
    },
  });

  const { regularContacts, resourceSuggestions } = useMemo(() => {
    const all = contactsQ.data ?? [];
    const resources: ResourceSuggestion[] = [];
    const regular: Contact[] = [];
    for (const c of all) {
      const r = parseResourceSuggestion(c);
      if (r) { resources.push(r); continue; }
      regular.push(c);
    }
    return { regularContacts: regular, resourceSuggestions: resources };
  }, [contactsQ.data]);

  const markRead = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase.from("feedback").update({ is_read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-feedback"] });
      qc.invalidateQueries({ queryKey: ["admin-count-feedback-unread"] });
    },
  });

  const markContactRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-contact-submissions"] });
      qc.invalidateQueries({ queryKey: ["admin-count-contact-submissions-unread"] });
    },
  });

  const deleteFeedback = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feedback").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-feedback"] });
      qc.invalidateQueries({ queryKey: ["admin-count-feedback-unread"] });
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
      qc.invalidateQueries({ queryKey: ["admin-count-contact-submissions-unread"] });
      toast.success("Deleted");
    },
  });

  const sendReply = useMutation({
    mutationFn: async ({
      feedback,
      reply,
    }: {
      feedback: Feedback & { _profile?: FeedbackProfile };
      reply: string;
    }) => {
      const trimmed = reply.trim();
      if (!trimmed) throw new Error("Reply cannot be empty");
      const { data: authData } = await supabase.auth.getUser();
      const adminId = authData.user?.id ?? null;

      const { error: upErr } = await supabase
        .from("feedback")
        .update({
          admin_reply: trimmed,
          replied_at: new Date().toISOString(),
          replied_by: adminId,
          is_read: true,
        })
        .eq("id", feedback.id);
      if (upErr) throw upErr;

      const subjectLabel = feedback.subject || `${feedback.feedback_type} feedback`;
      const { error: notifErr } = await supabase.from("business_notifications").insert({
        user_id: feedback.user_id,
        kind: "feedback_reply",
        status: "unread",
        title: "Admin has replied to your feedback",
        body: trimmed,
        link: null,
        ref_table: "feedback",
        ref_id: feedback.id,
      });
      if (notifErr) throw notifErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-feedback"] });
      qc.invalidateQueries({ queryKey: ["admin-count-feedback-unread"] });
      toast.success("Reply sent");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to send reply"),
  });

  const fmt = (d: string) => format(new Date(d), "d MMM yyyy, HH:mm");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-[550] text-slate-950">Submissions</h1>
        <p className="text-sm text-muted-foreground mb-6 text-slate-950">
          Messages from contact forms, user feedback, and resource suggestions.
        </p>
      </div>

      <Tabs defaultValue="contact" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contact" className="gap-2">
            <Mail className="h-4 w-4" />
            Contact ({regularContacts.length})
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
                  onClick={() => {
                    setViewing({ kind: "contact", data: c });
                    if (!c.is_read) markContactRead.mutate(c.id);
                  }}
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
                  onClick={() => {
                    setViewing({ kind: "resource", data: r });
                    if (!r.is_read) markContactRead.mutate(r.id);
                  }}
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
          {viewing?.kind === "feedback" && (
            <FeedbackReplyPanel
              feedback={viewing.data}
              onMarkRead={(is_read) => markRead.mutate({ id: viewing.data.id, is_read })}
              onSend={(reply) =>
                sendReply.mutate(
                  { feedback: viewing.data, reply },
                  {
                    onSuccess: () => {
                      setViewing({
                        kind: "feedback",
                        data: {
                          ...viewing.data,
                          admin_reply: reply.trim(),
                          replied_at: new Date().toISOString(),
                          is_read: true,
                        },
                      });
                    },
                  }
                )
              }
              sending={sendReply.isPending}
              fmt={fmt}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

type FeedbackReplyPanelProps = {
  feedback: Feedback & { _profile?: FeedbackProfile };
  onMarkRead: (is_read: boolean) => void;
  onSend: (reply: string) => void;
  sending: boolean;
  fmt: (d: string) => string;
};

const FeedbackReplyPanel = ({
  feedback,
  onMarkRead,
  onSend,
  sending,
  fmt,
}: FeedbackReplyPanelProps) => {
  const [reply, setReply] = useState("");
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    setReply("");
    setEditing(false);
  }, [feedback.id]);

  const hasReply = !!feedback.admin_reply;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="capitalize">
          {feedback.subject || `${feedback.feedback_type} feedback`}
        </DialogTitle>
        <DialogDescription>
          {feedback._profile?.display_name ?? "User"}
          {feedback._profile?.email ? ` · ${feedback._profile.email}` : ""}
          {" · "}
          {fmt(feedback.created_at)}
        </DialogDescription>
      </DialogHeader>
      <Badge variant="secondary" className="w-fit capitalize">
        {feedback.feedback_type}
      </Badge>
      <p className="text-sm whitespace-pre-wrap text-foreground">{feedback.message}</p>

      {feedback.image_url && (
        <a href={feedback.image_url} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={feedback.image_url}
            alt="User attachment"
            className="max-h-64 w-full rounded-lg border border-border object-cover"
          />
        </a>
      )}

      {feedback.reply_by_email && (
        <a
          href={`mailto:${feedback.reply_email || feedback._profile?.email || ""}?subject=Re: ${feedback.subject || `${feedback.feedback_type} feedback`}`}
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-primary hover:underline"
        >
          <Mail className="h-4 w-4" />
          User asked for an email reply
          {(feedback.reply_email || feedback._profile?.email) ? ` · ${feedback.reply_email || feedback._profile?.email}` : ""}
        </a>
      )}

      {hasReply && !editing && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your reply{feedback.replied_at ? ` · ${fmt(feedback.replied_at)}` : ""}
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{feedback.admin_reply}</p>
          <div className="pt-1">
            <Button variant="ghost" size="sm" onClick={() => { setReply(feedback.admin_reply ?? ""); setEditing(true); }}>
              Send another reply
            </Button>
          </div>
        </div>
      )}

      {(!hasReply || editing) && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reply to user
          </label>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply. The user will receive this as an in-app notification."
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            This reply is delivered as an in-app notification to the user.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => onMarkRead(!feedback.is_read)}>
          Mark as {feedback.is_read ? "unread" : "read"}
        </Button>
        {(!hasReply || editing) && (
          <Button
            onClick={() => onSend(reply)}
            disabled={sending || !reply.trim()}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Send reply"}
          </Button>
        )}
      </div>
    </>
  );
};

export default AdminSubmissions;