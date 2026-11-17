import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Megaphone, Send, Bell, Smartphone, Users, Inbox } from "lucide-react";

type Broadcast = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  recipient_count: number;
  pushed_count: number;
  created_at: string;
};

const TITLE_MAX = 120;
const BODY_MAX = 500;

const AdminAppUpdates = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const history = useQuery({
    queryKey: ["admin-app-update-broadcasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_update_broadcasts")
        .select("id,title,body,link,recipient_count,pushed_count,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Broadcast[];
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-app-update", {
        body: {
          title: title.trim(),
          body: body.trim(),
          link: link.trim(),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { recipient_count: number; pushed_count: number };
    },
    onSuccess: (data) => {
      toast.success(
        `Sent to ${data.recipient_count} user${data.recipient_count === 1 ? "" : "s"} · ` +
          `${data.pushed_count} pushed to phone`,
      );
      setTitle("");
      setBody("");
      setLink("");
      queryClient.invalidateQueries({ queryKey: ["admin-app-update-broadcasts"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Could not send the update.");
    },
  });

  const canSend = title.trim().length > 0 && !send.isPending;
  const broadcasts = history.data ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-tint border border-border">
          <Megaphone className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">App Updates</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-6">
            Send an announcement to <strong className="font-semibold text-foreground">every</strong>{" "}
            app user. It always appears in their Notifications tab (with the unread red dot). Users
            who have <strong className="font-semibold text-foreground">App Updates &amp; News</strong>{" "}
            switched on also get it pushed to their phone; those who&apos;ve turned it off still see
            it in-app, just without the push.
          </p>
        </div>
      </div>

      {/* Composer */}
      <section className="bg-card text-card-foreground border border-border rounded-xl shadow-sm">
        <div className="px-5 py-4 rounded-t-xl bg-primary-tint border-b border-border">
          <h2 className="font-heading text-lg font-bold text-foreground">Compose Update</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Goes out as soon as you press send.
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="app-update-title">Title</Label>
              <span
                className={`text-xs tabular-nums ${
                  title.length >= TITLE_MAX ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <Input
              id="app-update-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New: Save your favourite events"
              maxLength={TITLE_MAX}
              className="h-12 rounded-xl bg-card border-border"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="app-update-body">Message</Label>
              <span
                className={`text-xs tabular-nums ${
                  body.length >= BODY_MAX ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {body.length}/{BODY_MAX}
              </span>
            </div>
            <Textarea
              id="app-update-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell users what's new. Keep it short and friendly."
              rows={4}
              maxLength={BODY_MAX}
              className="rounded-xl bg-card border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="app-update-link">Link (Optional)</Label>
            <Input
              id="app-update-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. /events  or  /listing/123"
              className="h-12 rounded-xl bg-card border-border"
            />
            <p className="text-xs text-muted-foreground leading-5">
              Where the notification takes the user when tapped. Use an in-app path like{" "}
              <code className="rounded bg-primary-tint px-1.5 py-0.5 text-foreground">/events</code>.
              Leave blank for a plain announcement.
            </p>
          </div>

          <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              Goes to all users in-app
              <span className="opacity-40">·</span>
              <Smartphone className="h-3.5 w-3.5" />
              Pushed to opted-in phones
            </div>
            <Button disabled={!canSend} onClick={() => setConfirmOpen(true)}>
              <Send className="h-4 w-4" />
              {send.isPending ? "Sending…" : "Send to All Users"}
            </Button>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-foreground">Recent Broadcasts</h2>
          {!history.isLoading && broadcasts.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {broadcasts.length} sent
            </span>
          )}
        </div>

        {history.isLoading ? (
          <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground shadow-sm">
            Loading…
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-sm">
            <Inbox className="h-6 w-6 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground mt-2">No app updates sent yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your first announcement will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <article
                key={b.id}
                className="bg-card text-card-foreground border border-border rounded-xl p-4 space-y-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground break-words">{b.title}</p>
                    {b.body && (
                      <p className="text-sm text-muted-foreground mt-1 leading-6 break-words">
                        {b.body}
                      </p>
                    )}
                    {b.link && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Links to{" "}
                        <code className="rounded bg-primary-tint px-1.5 py-0.5 text-foreground">
                          {b.link}
                        </code>
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(b.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <div className="border-t border-border pt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {b.recipient_count} in-app
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Smartphone className="h-3.5 w-3.5" />
                    {b.pushed_count} pushed
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this to all app users?</AlertDialogTitle>
            <AlertDialogDescription>
              Every user will see “{title.trim()}” in their Notifications. Users with App Updates
              &amp; News switched on will also get a push notification. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                send.mutate();
              }}
            >
              Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAppUpdates;
