import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export type ModerationAction =
  | "warn"
  | "suspend"
  | "ban"
  | "content_removed"
  | "dismissed"
  | "unsuspend"
  | "unban";

const TITLES: Record<ModerationAction, string> = {
  warn: "Warn user",
  suspend: "Suspend user",
  ban: "Ban user",
  content_removed: "Mark content removed",
  dismissed: "Dismiss report",
  unsuspend: "Lift suspension",
  unban: "Lift ban",
};

const DESCRIPTIONS: Record<ModerationAction, string> = {
  warn: "Send the user a formal warning. Their account stays active.",
  suspend:
    "Suspend the account for a set number of days. They cannot post, follow, submit, or report during that time.",
  ban: "Permanently ban the account. They are hidden from search and cannot post.",
  content_removed:
    "Logs that the offending content was removed. No restriction is placed on the account.",
  dismissed: "No violation found. Closes the report.",
  unsuspend: "Restore the suspended account back to active.",
  unban: "Restore the banned account back to active.",
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reportId?: string | null;
  reportedUserLabel?: string;
  action: ModerationAction;
  reporterIsUser?: boolean; // only show reporter note when there is a registered reporter
};

const ModerationActionDialog = ({
  open,
  onOpenChange,
  reportId,
  reportedUserLabel,
  action,
  reporterIsUser,
}: Props) => {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [reporterMsg, setReporterMsg] = useState("");
  const [durationDays, setDurationDays] = useState<string>("7");
  const [severity, setSeverity] = useState<string>(
    action === "warn"
      ? "minor"
      : action === "suspend"
        ? "moderate"
        : action === "ban"
          ? "severe"
          : "none",
  );

  useEffect(() => {
    if (open) {
      setNote("");
      setReporterMsg("");
      setDurationDays(action === "suspend" ? "7" : "");
      setSeverity(
        action === "warn"
          ? "minor"
          : action === "suspend"
            ? "moderate"
            : action === "ban"
              ? "severe"
              : "none",
      );
    }
  }, [open, action]);

  const needsNote = action !== "unsuspend" && action !== "unban";
  const showDuration = action === "suspend";
  const showSeverity = ["warn", "suspend", "ban", "content_removed"].includes(action);

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc("apply_moderation_action", {
        _report_id: reportId ?? null,
        _action: action,
        _severity: showSeverity ? severity : null,
        _duration_days: showDuration ? Number(durationDays) || 7 : null,
        _admin_note: note.trim() || null,
        _notify_reporter_message:
          reporterIsUser && reporterMsg.trim() ? reporterMsg.trim() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${TITLES[action]} — done`);
      qc.invalidateQueries({ queryKey: ["admin-user-reports"] });
      qc.invalidateQueries({ queryKey: ["admin-moderated-users"] });
      qc.invalidateQueries({ queryKey: ["user-moderation-summary"] });
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || "Action failed");
    },
  });

  const disabled = useMemo(() => {
    if (submit.isPending) return true;
    if (needsNote && !note.trim()) return true;
    if (showDuration && !Number(durationDays)) return true;
    return false;
  }, [submit.isPending, needsNote, note, showDuration, durationDays]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{TITLES[action]}</DialogTitle>
          <DialogDescription>
            {reportedUserLabel ? <>Target: <strong>{reportedUserLabel}</strong>. </> : null}
            {DESCRIPTIONS[action]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {showSeverity && (
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {showDuration && (
            <div className="space-y-1.5">
              <Label>Duration (days)</Label>
              <Select value={durationDays} onValueChange={setDurationDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {needsNote && (
            <div className="space-y-1.5">
              <Label>Admin note {action !== "dismissed" ? "(shown to the user)" : ""}</Label>
              <Textarea
                rows={3}
                placeholder={
                  action === "dismissed"
                    ? "Internal note — why this was dismissed."
                    : "Explain what was found and what action was taken."
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}

          {reporterIsUser && (
            <div className="space-y-1.5">
              <Label>Message to reporter (optional)</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Thanks — we reviewed and acted on this report."
                value={reporterMsg}
                onChange={(e) => setReporterMsg(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submit.isPending}>
            Cancel
          </Button>
          <Button onClick={() => submit.mutate()} disabled={disabled}>
            {submit.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModerationActionDialog;
