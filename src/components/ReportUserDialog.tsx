import { CSSProperties, useState } from "react";
import { z } from "zod";
import { ChevronDown, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
  detail: z
    .string()
    .trim()
    .min(10, "Please add at least 10 characters")
    .max(2000, "Max 2000 characters"),
});

const guestSchema = baseSchema.extend({
  reporter_name: z.string().trim().min(1, "Name is required").max(100),
  reporter_email: z.string().trim().email("Valid email is required").max(255),
});

// Match the Local Channels "Suggest a Channel" sheet styling exactly
const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const MUTED = "#7A6E5C";

const inputStyle: CSSProperties = {
  fontFamily: HN,
  fontWeight: 400,
  fontSize: 15,
  color: INK,
  background: "#fff",
  border: `2px solid #C5C0BA`,
  borderRadius: 12,
  padding: "13px 14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  lineHeight: 1.4,
};

const labelStyle: CSSProperties = {
  fontFamily: HN,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#423324",
  marginBottom: 6,
  display: "block",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName?: string | null;
  reportedUserHandle?: string | null;
};

const ReportUserDialog = ({ open, onOpenChange, reportedUserId, reportedUserName, reportedUserHandle }: Props) => {
  const { user } = useAuth();
  const isGuest = !user;
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const reset = () => {
    setReason("");
    setDetail("");
    setName("");
    setEmail("");
  };

  const close = () => {
    reset();
    onOpenChange(false);
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
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,10,10,0.4)", display: "flex", alignItems: "flex-end" }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: HN,
          width: "100%",
          background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 32px",
          animation: "ru-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <style>{`@keyframes ru-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} } .ru-input::placeholder { color: ${MUTED}; opacity: 1; }`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: HN, fontSize: 11, letterSpacing: "0.08em", color: MUTED, textTransform: "uppercase" }}>{"\n"}</div>
          <button onClick={close} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
            <X size={20} color={INK} strokeWidth={1.75} />
          </button>
        </div>
        <h2 style={{ fontFamily: "'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 700, fontSize: 22, color: INK, margin: "0 0 8px" }}>
          {reportedUserHandle ? `Report @${reportedUserHandle}` : "Report user"}
        </h2>
        <p style={{ fontFamily: HN, fontSize: 14, lineHeight: 1.55, color: "#2b2420", margin: "0 0 20px" }}>
          {reportedUserName ? (
            <>
              Tell us what's wrong with <strong style={{ color: INK, fontWeight: 700 }}>{reportedUserName}</strong>'s profile or behaviour.
            </>
          ) : (
            "Tell us what's wrong with this profile or behaviour."
          )}{" "}
          We will review your report and act accordingly.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Reason */}
          <div>
            <label style={labelStyle}>Reason</label>
            <div style={{ position: "relative" }}>
              <select
                className="ru-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  paddingRight: 40,
                  color: reason ? INK : MUTED,
                  cursor: "pointer",
                }}
              >
                <option value="" disabled>
                  Select a reason
                </option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                color={MUTED}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
            </div>
          </div>

          {/* Detail */}
          <div>
            <label style={labelStyle}>More detail</label>
            <textarea
              className="ru-input"
              placeholder="Tell us more about what happened…"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={2000}
              rows={5}
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>

          {/* Guest fields */}
          {isGuest && (
            <>
              <div>
                <label style={labelStyle}>Your name</label>
                <input
                  className="ru-input"
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Your email</label>
                <input
                  className="ru-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  style={inputStyle}
                />
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            fontFamily: HN,
            marginTop: 20,
            width: "100%",
            height: 48,
            borderRadius: 9999,
            background: "#423324",
            color: "#FFFFFF",
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            lineHeight: "20px",
            padding: "8px 16px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={16} color="#fff" className="animate-spin" /> Sending...
            </>
          ) : (
            "Submit Report"
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportUserDialog;
