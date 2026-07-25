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
import { Megaphone, Send, Bell, Smartphone, Users } from "lucide-react";

type Broadcast = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  recipient_count: number;
  pushed_count: number;
  created_at: string;
};

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
      const { data, error } = await supabase.rpc("send_app_update", {
        p_title: title.trim(),
        p_body: body.trim(),
        p_link: link.trim(),
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? { recipient_count: 0, pushed_count: 0 }) as {
        recipient_count: number;
        pushed_count: number;
      };
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

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-slate-950">App Updates &amp; Notifications</h1>
        </div>
        <p className="text-sm opacity-80 mt-1">
          Send an announcement to <strong>every</strong> app user. It always appears in their
          Notifications tab (with the unread red dot). Users who have{" "}
          <strong>App Updates &amp; News</strong> switched on also get it pushed to their phone;
          those who&apos;ve turned it off still see it in-app, just without the push.
        </p>
      </div>

      {/* Composer */}
      <div className="bg-card rounded-lg p-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="app-update-title">Title</Label>
          <Input
            id="app-update-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New: Save your favourite events"
            maxLength={120}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="app-update-body">Message</Label>
          <Textarea
            id="app-update-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tell users what's new. Keep it short and friendly."
            rows={4}
            maxLength={500}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="app-update-link">Link (optional)</Label>
          <Input
            id="app-update-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="e.g. /events  or  /listing/123"
          />
          <p className="text-xs text-muted-foreground">
            Where the notification takes the user when tapped. Use an in-app path like{" "}
            <code>/events</code>. Leave blank for a plain announcement.
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bell className="h-3.5 w-3.5" />
            Goes to all users in-app
            <span className="opacity-40">·</span>
            <Smartphone className="h-3.5 w-3.5" />
            Pushed to opted-in phones
          </div>
          <Button disabled={!canSend} onClick={() => setConfirmOpen(true)}>
            <Send className="h-4 w-4" />
            {send.isPending ? "Sending…" : "Send to all users"}
          </Button>
        </div>
      </div>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-950">Recent broadcasts</h2>
        {history.isLoading ? (
          <div className="text-sm">Loading…</div>
        ) : (history.data ?? []).length === 0 ? (
          <div className="bg-card rounded-lg p-5 text-sm opacity-70">
            No app updates sent yet.
          </div>
        ) : (
          <div className="space-y-3">
            {(history.data ?? []).map((b) => (
              <div key={b.id} className="bg-card rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950 truncate">{b.title}</p>
                    {b.body && <p className="text-sm opacity-80 mt-0.5">{b.body}</p>}
                    {b.link && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Links to <code>{b.link}</code>
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(b.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {b.recipient_count} in-app
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Smartphone className="h-3.5 w-3.5" />
                    {b.pushed_count} pushed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
