import { useState, useEffect, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

const FEEDBACK_TYPES = ["General", "Suggestion", "Bug", "Compliment", "Other"] as const;

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

const OLIVE = "#5C6446";
const DEEP_OLIVE = "#454C36";
const CREAM = "#EEE8DA";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const RUST = "#9B5A3C";

const BLOB_RADIUS_A = "50% 45% 55% 50% / 55% 50% 60% 45%";
const BLOB_RADIUS_B = "55% 45% 50% 55% / 50% 60% 45% 55%";

const tap = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; },
};

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [type, setType] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; message?: string; type?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Load Playfair Display
  useEffect(() => {
    const id = "playfair-display-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
    document.head.appendChild(link);
  }, []);

  // Placeholder styles
  useEffect(() => {
    const id = "feedback-placeholder-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .fb-input::placeholder { color: ${MUTED}; opacity: 1; font-family: ${FF}; font-size: 15px; font-weight: 400; }
      .fb-input:focus { background: ${CREAM} !important; color: ${INK}; }
    `;
    document.head.appendChild(style);
  }, []);

  const handleSubmit = async () => {
    const errs: typeof errors = {};
    if (!type) errs.type = "Please select what this is about";
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
      setType("");
      setErrors({});
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase: CSSProperties = {
    width: "100%", background: "rgba(238, 232, 218, 0.92)", border: "none",
    borderRadius: 16, height: 52, padding: "0 20px",
    fontFamily: FF, fontSize: 15, fontWeight: 400, color: INK,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: OLIVE, paddingBottom: 140, fontFamily: FF }}>
      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24, position: "relative", zIndex: 3 }}>
        <button
          onClick={() => navigate(-1)}
          {...tap}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: CREAM, border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.15s ease",
          }}
          aria-label="Back"
        >
          <BackArrowIcon size={18} color={INK} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ position: "relative", padding: "18px 24px 0", overflow: "hidden" }}>
        <div aria-hidden style={{
          position: "absolute", top: -40, right: -80,
          width: 220, height: 240, background: DEEP_OLIVE,
          borderRadius: BLOB_RADIUS_A, opacity: 0.85, zIndex: 1,
        }} />
        <div aria-hidden style={{
          position: "absolute", top: 60, right: -30,
          width: 120, height: 130, background: "rgba(238,232,218,0.08)",
          borderRadius: BLOB_RADIUS_B, zIndex: 1,
        }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <p style={{
            fontFamily: FF, fontSize: 12, fontWeight: 400,
            letterSpacing: "2.4px", textTransform: "uppercase",
            color: "rgba(238,232,218,0.7)", margin: "0 0 14px",
          }}>We're Listening</p>
          <h1 style={{
            fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 300,
            fontSize: 72, lineHeight: 0.92, letterSpacing: "-2.5px",
            color: CREAM, margin: "0 0 18px",
          }}>feedback.</h1>
          <p style={{
            fontFamily: FF, fontSize: 15, fontWeight: 400, lineHeight: 1.65,
            color: "rgba(238,232,218,0.9)", maxWidth: 260, margin: "0 0 36px",
          }}>
            Help us make Hello Hoedspruit better.
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Type dropdown */}
        <div>
          <div style={{ position: "relative" }}>
            <select
              className="fb-input"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                if (errors.type) setErrors((p) => ({ ...p, type: undefined }));
              }}
              style={{
                ...inputBase,
                appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                paddingRight: 44,
                color: type ? INK : MUTED,
                cursor: "pointer",
              }}
            >
              <option value="" disabled>What is this about</option>
              {FEEDBACK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span aria-hidden style={{
              position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
              color: MUTED, fontSize: 13, pointerEvents: "none",
            }}>▾</span>
          </div>
          {errors.type && (
            <p style={{ fontSize: 12, color: "#FFD9D0", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>
              {errors.type}
            </p>
          )}
        </div>

        {/* Subject */}
        <div>
          <input
            className="fb-input"
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (errors.subject) setErrors((p) => ({ ...p, subject: undefined }));
            }}
            style={inputBase}
          />
          {errors.subject && (
            <p style={{ fontSize: 12, color: "#FFD9D0", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>
              {errors.subject}
            </p>
          )}
        </div>

        {/* Textarea */}
        <div>
          <textarea
            className="fb-input"
            placeholder="Share your feedback with us…"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((p) => ({ ...p, message: undefined }));
            }}
            style={{
              ...inputBase,
              height: "auto", minHeight: 140,
              paddingTop: 18, paddingBottom: 18, paddingLeft: 20, paddingRight: 20,
              resize: "none", lineHeight: 1.5,
            }}
          />
          {errors.message && (
            <p style={{ fontSize: 12, color: "#FFD9D0", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>
              {errors.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          {...tap}
          style={{
            width: "100%", marginTop: 8, marginBottom: 20,
            background: INK, color: CREAM, border: "none",
            borderRadius: 999, height: 54,
            fontFamily: FF, fontSize: 15, fontWeight: 400,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.7 : 1,
            transition: "transform 0.15s ease, opacity 0.15s ease",
          }}
        >
          {submitting ? (
            <><Loader2 size={16} color={CREAM} className="animate-spin" /> Sending</>
          ) : "Share Feedback"}
        </button>
      </div>

      {/* Info card */}
      <div style={{ padding: "0 24px", marginBottom: 12 }}>
        <div style={{
          background: CREAM, borderRadius: 20,
          padding: "20px 24px 22px",
          display: "flex", alignItems: "flex-start", gap: 14,
        }}>
          <span aria-hidden style={{
            flex: "0 0 auto",
            width: 8, height: 8, borderRadius: "50%",
            background: RUST, marginTop: 8,
          }} />
          <p style={{
            fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 400,
            fontSize: 14.5, lineHeight: 1.55,
            color: "rgba(42,42,36,0.78)", margin: 0,
          }}>
            Every piece of feedback helps us improve. We read everything, and appreciate you taking the time to share your thoughts with us.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
