import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const FEEDBACK_TYPES = ["General", "Suggestion", "Bug", "Compliment", "Other"] as const;

const FF = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const FF_DISPLAY = "'Helvetica Neue', Helvetica, 'Pragmatica', 'Inter', sans-serif";

const INK = "#0A0A0A";
const MUTED = "#8A8480";
const PAGE = "#EBEBEB";
const CARD = "#FFFFFF";
const CORAL = "#F26A48";

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

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [type, setType] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; message?: string; type?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const errs: typeof errors = {};
    if (!subject.trim()) errs.subject = "Please add a subject";
    if (!message.trim()) errs.message = "Please share your feedback";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const { error: dbError } = await supabase.from("feedback" as any).insert({
        user_id: user?.id || null,
        feedback_type: type.toLowerCase(),
        subject: subject.trim() || null,
        message: message.trim(),
      } as any);
      if (dbError) throw dbError;
      toast.success("Thanks, we've got it.");
      setSubject("");
      setMessage("");
      setType("General");
      setErrors({});
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "transparent", fontFamily: FF, paddingBottom: 120, minHeight: "100vh" }}
    >
      {/* Decorative coral circle (placeholder for future warm image) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 80,
          right: -130,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 30%, #6d553d 0%, #5b4632 70%, #4a3826 100%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Back */}
      <div style={{ padding: "16px 24px 0", position: "relative", zIndex: 1 }}>
        <button
          onClick={() => navigate(-1)}
          {...tap}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "transparent",
            border: "none",
            padding: 0,
            color: INK,
            fontFamily: FF,
            fontWeight: 400,
            fontSize: 15,
            cursor: "pointer",
            transition: "transform 150ms ease-out",
          }}
        >
          <ChevronLeft size={20} strokeWidth={2} />
          Back
        </button>
      </div>

      {/* Editorial header */}
      <div style={{ padding: "28px 24px 0", position: "relative", zIndex: 1 }}>
        <h1
          style={{
            fontFamily: FF_DISPLAY,
            fontWeight: 700,
            fontSize: 52,
            lineHeight: 0.98,
            letterSpacing: "-0.03em",
            color: INK,
            margin: 0,
            marginBottom: 14,
          }}
        >
          Give Us
          <br />
          Feedback
        </h1>
        <p
          style={{
            fontFamily: FF,
            fontWeight: 400,
            fontSize: 15,
            lineHeight: 1.45,
            color: "#0a0a0a",
            margin: 0,
            maxWidth: 240,
          }}
        >
          Help us make Hello Hoedspruit better.
        </p>
      </div>

      {/* Category section */}
      <div style={{ padding: "44px 24px 0", position: "relative", zIndex: 1 }}>
        <p
          style={{
            fontFamily: FF,
            fontWeight: 400,
            fontSize: 12,
            letterSpacing: "0.02em",
            color: "#0a0a0a",
            margin: 0,
            marginBottom: 14,
          }}
        >
          What is this about
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {FEEDBACK_TYPES.map((t) => {
            const active = type === t;
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                {...tap}
                style={{
                  background: active ? "#5B4632" : CARD,
                  color: active ? "#FFFFFF" : INK,
                  border: "none",
                  borderRadius: 999,
                  padding: "12px 22px",
                  fontFamily: FF,
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: 1,
                  cursor: "pointer",
                  transition: "transform 150ms ease-out, background 150ms ease-out, color 150ms ease-out",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject */}
      <div style={{ padding: "32px 24px 0", position: "relative", zIndex: 1 }}>
        <div
          style={{
            background: CARD,
            borderRadius: 16,
            padding: "18px 20px",
            border: errors.subject ? `1px solid ${CORAL}` : "1px solid transparent",
            transition: "border-color 150ms ease-out",
          }}
        >
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (errors.subject) setErrors((p) => ({ ...p, subject: undefined }));
            }}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: FF,
              fontWeight: 400,
              fontSize: 15,
              color: INK,
            }}
          />
        </div>
        {errors.subject && (
          <p style={{ fontSize: 12, color: CORAL, margin: "6px 0 0", paddingLeft: 4, fontFamily: FF }}>
            {errors.subject}
          </p>
        )}
      </div>

      {/* Textarea */}
      <div style={{ padding: "10px 24px 0", position: "relative", zIndex: 1 }}>
        <div
          style={{
            background: CARD,
            borderRadius: 16,
            padding: "18px 20px",
            border: errors.message ? `1px solid ${CORAL}` : "1px solid transparent",
            transition: "border-color 150ms ease-out",
          }}
        >
          <textarea
            placeholder="Share your feedback with us..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((p) => ({ ...p, message: undefined }));
            }}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              resize: "none",
              minHeight: 128,
              fontFamily: FF,
              fontWeight: 400,
              fontSize: 15,
              lineHeight: 1.45,
              color: INK,
            }}
          />
        </div>
        {errors.message && (
          <p style={{ fontSize: 12, color: CORAL, margin: "6px 0 0", paddingLeft: 4, fontFamily: FF }}>
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <div style={{ padding: "20px 24px 0", position: "relative", zIndex: 1 }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          {...tap}
          style={{
            width: "100%",
            background: "#5B4632",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "18px 24px",
            fontFamily: FF,
            fontWeight: 400,
            fontSize: 15,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.7 : 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "transform 150ms ease-out, opacity 150ms ease-out",
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending
            </>
          ) : (
            "Share feedback"
          )}
        </button>
      </div>

      {/* Reassurance footer card */}
      <div style={{ padding: "28px 24px 0", position: "relative", zIndex: 1 }}>
        <div
          style={{
            background: CARD,
            borderRadius: 24,
            padding: "22px 24px",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          <span
            aria-hidden
            style={{
              flex: "0 0 auto",
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#5b4632",
              marginTop: 8,
            }}
          />
          <p
            style={{
              fontFamily: FF,
              fontWeight: 400,
              fontSize: 14,
              lineHeight: 1.5,
              color: "#0a0a0a",
              margin: 0,
            }}
          >
            Every piece of feedback helps us improve. We read everything and appreciate you taking the time to share your thoughts with us.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
