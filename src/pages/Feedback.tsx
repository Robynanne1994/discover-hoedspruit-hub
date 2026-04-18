import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const feedbackTypes = ["Suggestion", "Bug", "Compliment", "Other"] as const;

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [type, setType] = useState<string>("Suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      setError("Please add a subject");
      return;
    }
    if (!message.trim()) {
      setError("Please tell us what's on your mind");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const { error: dbError } = await supabase.from("feedback" as any).insert({
        user_id: user?.id || null,
        feedback_type: type.toLowerCase(),
        subject: subject.trim() || null,
        message: message.trim(),
      } as any);
      if (dbError) throw dbError;
      toast.success("Thanks for your feedback!");
      setSubject("");
      setMessage("");
      setType("Suggestion");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#ffffff",
    border: "1px solid rgba(18,18,20,0.06)",
    borderRadius: 16,
    padding: "14px 16px",
    fontSize: 15,
    fontWeight: 500,
    color: "#2b2420",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div className="min-h-screen" style={{ background: "#ebebeb" }}>
      {/* Back */}
      <div style={{ paddingTop: 16, paddingLeft: 20, paddingRight: 20, marginBottom: 12 }}>
        <BackButton />
      </div>

      {/* Heading */}
      <div style={{ paddingTop: 28, paddingLeft: 20, paddingRight: 20 }}>
        <h1 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.01em", color: "#020202", textTransform: "capitalize", margin: 0 }}>
          Give Us Feedback
        </h1>
        <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px", lineHeight: 1.4, marginTop: 12 }}>
          Help us make Hello Hoedspruit better
        </p>
      </div>

      {/* Type selector */}
      <div style={{ padding: "32px 20px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase" as const, letterSpacing: 2, marginBottom: 12 }}>
          WHAT IS THIS ABOUT?
        </p>
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          {feedbackTypes.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                background: type === t ? "#121214" : "rgba(18,18,20,0.04)",
                border: type === t ? "1px solid #121214" : "1px solid rgba(18,18,20,0.08)",
                borderRadius: 9999,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: type === t ? 600 : 500,
                color: type === t ? "#ffffff" : "rgba(18,18,20,0.5)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "24px 20px 0" }}>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => { setSubject(e.target.value); if (error) setError(""); }}
          style={{ ...inputStyle, marginBottom: 16 }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(18,18,20,0.2)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(18,18,20,0.08)")}
        />
        <textarea
          placeholder="Share your feedback with us..."
          value={message}
          onChange={(e) => { setMessage(e.target.value); if (error) setError(""); }}
          style={{ ...inputStyle, minHeight: 150, resize: "vertical", marginBottom: error ? 4 : 16 }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(18,18,20,0.2)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(18,18,20,0.08)")}
        />
        {error && <p style={{ fontSize: 12, color: "#E24B4A", marginBottom: 16 }}>{error}</p>}
      </div>

      {/* Submit */}
      <div style={{ padding: "8px 20px 0" }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%",
            background: "#121214",
            borderRadius: 16,
            padding: 16,
            fontSize: 15,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
            textAlign: "center" as const,
          }}
        >
          {submitting ? "Sending..." : "Share Feedback"}
        </button>
      </div>

      {/* Supportive text */}
      <div style={{ padding: "28px 20px 100px" }}>
        <div style={{
          background: "#ffffff",
          border: "1px solid rgba(18,18,20,0.06)",
          borderRadius: 16,
          padding: 16,
          textAlign: "center" as const,
        }}>
          <p style={{ fontSize: 13, color: "rgba(18,18,20,0.4)", lineHeight: 1.6 }}>
            Every piece of feedback helps us improve. We read everything and appreciate you taking the time to share your thoughts with us.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
