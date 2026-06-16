import { CSSProperties, useEffect, useState } from "react";
import { z } from "zod";
import { ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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

// Match Feedback page styling exactly
const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#7A6E5C";
const SUBMIT_BG = "#3D2E22";

const tap = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
  },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
  },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
  },
};

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

  // Match the feedback page's placeholder styling
  useEffect(() => {
    const id = "report-placeholder-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .ru-input::placeholder { color: ${MUTED}; opacity: 1; font-family: ${FF}; font-size: 15px; font-weight: 400; }
    `;
    document.head.appendChild(style);
  }, []);

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

  const inputBase: CSSProperties = {
    width: "100%",
    background: CARD,
    border: "none",
    borderRadius: 999,
    height: 52,
    padding: "0 22px",
    fontFamily: FF,
    fontSize: 15,
    fontWeight: 400,
    color: INK,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontFamily: FF,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: INK,
    marginBottom: 8,
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <SheetContent
        side="bottom"
        className="p-0 border-0"
        style={{
          background: BG,
          maxHeight: "92vh",
          overflowY: "auto",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          fontFamily: FF,
        }}
      >
        {/* Grabber */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
          <div
            style={{
              width: 42,
              height: 4,
              borderRadius: 999,
              background: "rgba(26,26,26,0.18)",
            }}
          />
        </div>

        {/* Header */}
        <div style={{ padding: "14px 24px 0" }}>
          <h2
            style={{
              fontFamily: FF,
              fontSize: 22,
              fontWeight: 700,
              color: INK,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: "-0.2px",
            }}
          >
            Report user
          </h2>
          <p
            style={{
              fontFamily: FF,
              fontSize: 13.5,
              fontWeight: 400,
              color: "#4A3F35",
              lineHeight: 1.5,
              margin: "8px 0 0",
            }}
          >
            {reportedUserName
              ? `Tell us what's wrong with ${reportedUserName}'s profile or behaviour.`
              : "Tell us what's wrong with this profile or behaviour."}{" "}
            We will review your report and act accordingly.
          </p>
        </div>

        {/* Form */}
        <div
          style={{
            padding: "20px 24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Reason */}
          <div>
            <label style={labelStyle}>Reason</label>
            <div style={{ position: "relative" }}>
              <select
                className="ru-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  ...inputBase,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  paddingRight: 44,
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
                style={{
                  position: "absolute",
                  right: 20,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
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
              style={{
                ...inputBase,
                borderRadius: 24,
                height: "auto",
                minHeight: 140,
                padding: "18px 22px",
                resize: "none",
                lineHeight: 1.5,
              }}
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
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  style={inputBase}
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
                  style={inputBase}
                />
              </div>
            </>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            {...tap}
            style={{
              width: "100%",
              marginTop: 6,
              background: SUBMIT_BG,
              color: "#fff",
              border: "none",
              borderRadius: 999,
              height: 58,
              fontFamily: FF,
              fontSize: 16,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              transition: "transform 0.15s ease, opacity 0.15s ease",
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} color="#fff" className="animate-spin" /> Sending
              </>
            ) : (
              "Submit Report"
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReportUserDialog;
