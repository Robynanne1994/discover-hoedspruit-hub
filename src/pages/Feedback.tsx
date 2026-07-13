import { useState, useEffect, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { toast } from "sonner";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";


const FEEDBACK_TYPES = ["General", "Suggestion", "Bug", "Compliment", "Other"] as const;

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#7A6E5C";
const LABEL = "#9A8E7A";
const SUBMIT_BG = "#3D2E22";

const tap = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; },
};

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [type, setType] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; message?: string; type?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = "feedback-placeholder-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .fb-input::placeholder { color: ${MUTED}; opacity: 1; font-family: ${FF}; font-size: 15px; font-weight: 400; }
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
    if (!requireAuth("send feedback")) return;

    setSubmitting(true);
    try {
      const { error: dbError } = await supabase.from("feedback" as any).insert({
        user_id: user?.id || null,
        feedback_type: type.toLowerCase(),
        subject: subject.trim() || null,
        message: message.trim(),
      } as any);
      if (dbError) throw dbError;
      toast.success("Thank you. We have received your feedback. Someone from our team will be in touch with you ASAP.");
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
    width: "100%", background: CARD, border: "none",
    borderRadius: 16, height: 52, padding: "0 22px",
    fontFamily: FF, fontSize: 15, fontWeight: 400, color: INK,
    outline: "none", boxSizing: "border-box",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontFamily: '"Bricolage Grotesque", ' + FF,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: INK,
    marginBottom: 8,
    marginLeft: -1,
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, paddingBottom: 140, fontFamily: FF, overflowX: "hidden" }}>
      <Seo
        title="Send Feedback — Hello Hoedspruit"
        description="Share feedback, ideas, bug reports or compliments with the Hello Hoedspruit team."
        path="/feedback"
        noIndex
      />
      {/* Top bar */}
      <PageHeader title="Feedback" />


      {/* Heading */}
      <h1 style={{
        fontFamily: "'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 26, fontWeight: 700, color: INK,
        lineHeight: 1.2, margin: 0, padding: "16px 24px 12px",
      }}>
        {"\n"}
      </h1>

      {/* Form */}
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Topic */}
        <div>
          <label style={labelStyle}>Topic</label>
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
              <option value="" disabled>What is this about?</option>
              {FEEDBACK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown
              size={18}
              color={MUTED}
              style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
          </div>
          {errors.type && (
            <p style={{ fontSize: 12, color: "#B0432B", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>
              {errors.type}
            </p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label style={labelStyle}>Subject</label>
          <input
            className="fb-input"
            type="text"
            placeholder="Briefly summarise your feedback"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (errors.subject) setErrors((p) => ({ ...p, subject: undefined }));
            }}
            style={inputBase}
          />
          {errors.subject && (
            <p style={{ fontSize: 12, color: "#B0432B", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>
              {errors.subject}
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label style={labelStyle}>Message</label>
          <textarea
            className="fb-input"
            placeholder="Tell us more..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((p) => ({ ...p, message: undefined }));
            }}
            style={{
              ...inputBase,
              borderRadius: 16,
              height: "auto", minHeight: 160,
              padding: "18px 22px",
              resize: "none", lineHeight: 1.5,
            }}
          />
          {errors.message && (
            <p style={{ fontSize: 12, color: "#B0432B", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>
              {errors.message}
            </p>
          )}
        </div>

        {/* Submit */}
        {(() => {
          const isEmpty = !type || !subject.trim() || !message.trim();
          const isDisabled = submitting || isEmpty;
          return (
            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              {...tap}
              style={{
                width: "100%", marginTop: 10,
                background: isEmpty ? "#C9C0AC" : SUBMIT_BG,
                color: isEmpty ? "#7A6E5C" : "#fff",
                border: "none",
                borderRadius: 999, height: 58,
                fontFamily: FF, fontSize: 16, fontWeight: 600,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
                pointerEvents: isDisabled ? "none" : "auto",
                transition: "transform 0.15s ease, opacity 0.15s ease, background 0.15s ease",
              }}
            >
              {submitting ? (
                <><Loader2 size={16} color="#fff" className="animate-spin" /> Sending</>
              ) : "Submit Feedback"}
            </button>
          );
        })()}

        {/* Footer note */}
        <p style={{
          fontFamily: FF, fontSize: 13.5, fontWeight: 400, lineHeight: 1.55,
          color: "#4A3F35", textAlign: "left", margin: "8px 0 0",
        }}>
          {"\n"}
        </p>
      </div>
    </div>
  );
};

export default Feedback;
