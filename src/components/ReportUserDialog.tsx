import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REASONS = [
  "Harassment or bullying",
  "Hate speech or discrimination",
  "Spam or scam",
  "Impersonation",
  "Inappropriate or offensive content",
  "Fake profile",
  "Other",
];

const baseSchema = z.object({
  reason: z.string().min(1, "Please choose a reason"),
  detail: z.string().trim().min(10, "Please add at least 10 characters").max(2000, "Max 2000 characters"),
});

const guestSchema = baseSchema.extend({
  reporter_name: z.string().trim().min(1, "Name is required").max(100),
  reporter_email: z.string().trim().email("Valid email is required").max(255),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName?: string | null;
};

const ReportUserDialog = ({ open, onOpenChange, reportedUserId, reportedUserName }: Props) => {
  const { user } = useAuth();
  const isGuest = !user;
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason("");
    setDetail("");
    setName("");
    setEmail("");
  };

  const handleSubmit = async () => {
    const schema = isGuest ? guestSchema : baseSchema;
    const parsed = schema.safeParse(
      isGuest
        ? { reason, detail, reporter_name: name, reporter_email: email }
        : { reason, detail },
    );
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(first ?? "Please complete all required fields");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("user_reports").insert({
      reported_user_id: reportedUserId,
      reporter_user_id: user?.id ?? null,
      reporter_name: isGuest ? name.trim() : null,
      reporter_email: isGuest ? email.trim() : null,
      reason,
      detail: detail.trim(),
    });
    setSubmitting(false);

    if (error) {
      toast.error("Could not submit report. Please try again.");
      return;
    }
    toast.success("Report submitted. Thank you.");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report user</DialogTitle>
          <DialogDescription>
            {reportedUserName
              ? `Tell us what's wrong with ${reportedUserName}'s profile or behaviour.`
              : "Tell us what's wrong with this profile or behaviour."}{" "}
            Our team will review your report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="report-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-detail">
              More detail <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="report-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Tell us more about what happened…"
              rows={4}
              maxLength={2000}
            />
          </div>

          {isGuest && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="report-name">
                  Your name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="report-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-email">
                  Your email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="report-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  maxLength={255}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserDialog;
