import { useState, useEffect, useRef, CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  AlertTriangle,
  MapPin,
  Pencil,
  Lightbulb,
  Heart,
  MessageCircle,
  Camera,
  X,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";
import { MUTED as TOKEN_MUTED, SECTION_INSET, type as t } from "@/lib/type";


// Each topic maps to a friendly label + icon. The label is stored (lowercased)
// as feedback_type so the admin panel shows the same wording the user picked.
const TOPICS: ReadonlyArray<{ label: string; icon: LucideIcon }> = [
  { label: "Report a Problem", icon: AlertTriangle },
  { label: "Suggest a Listing", icon: MapPin },
  { label: "Wrong Information", icon: Pencil },
  { label: "Feature Idea", icon: Lightbulb },
  { label: "Say Thanks", icon: Heart },
  { label: "Something Else", icon: MessageCircle },
];

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = TOKEN_MUTED;
const SUBMIT_BG = "#423324";
const RED = "#C0432B";

const tap = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; },
};

const SMALL_WORDS = new Set(["a","an","and","as","at","but","by","for","if","in","nor","of","on","or","the","to","up","from","be","is","it","so","via","with"]);
const titleCaseSubject = (s: string | null | undefined) => {
  if (!s) return "";
  const words = s.trim().toLowerCase().split(/(\s+)/);
  let wordIdx = 0;
  const total = words.filter(w => w.trim()).length;
  return words.map((w) => {
    if (!w.trim()) return w;
    const cur = wordIdx;
    wordIdx += 1;
    if (cur !== 0 && cur !== total - 1 && SMALL_WORDS.has(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join("");
};

type Reply = {
  id: string;
  subject: string | null;
  message: string;
  admin_reply: string;
  replied_at: string;
  image_url: string | null;
};

const Feedback = () => {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [type, setType] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [replyByEmail, setReplyByEmail] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; message?: string; type?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "replies" ? "replies" : "submit";
  const [replies, setReplies] = useState<Reply[]>([]);
  const [unreadReplies, setUnreadReplies] = useState(0);

  useEffect(() => {
    if (!user) { setReplies([]); setUnreadReplies(0); return; }
    (async () => {
      const { data } = await supabase
        .from("feedback")
        .select("id,subject,message,admin_reply,replied_at,image_url")
        .eq("user_id", user.id)
        .not("admin_reply", "is", null)
        .order("replied_at", { ascending: false });
      setReplies((data ?? []) as unknown as Reply[]);

      const { count } = await supabase
        .from("business_notifications")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", user.id)
        .eq("kind", "feedback_reply")
        .eq("is_read", false);
      setUnreadReplies(count ?? 0);
    })();
  }, [user]);

  const hasReplies = replies.length > 0;

  // Opening the replies tab clears the "unread reply" state (the red dot).
  useEffect(() => {
    if (activeTab !== "replies" || !user || unreadReplies === 0) return;
    (async () => {
      await supabase
        .from("business_notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("kind", "feedback_reply")
        .eq("is_read", false);
      setUnreadReplies(0);
    })();
  }, [activeTab, user, unreadReplies]);

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

  const handlePhotoPick = () => {
    if (!user) { requireAuth("add images"); return; }
    if (imageUrls.length >= MAX_IMAGES) {
      toast.error(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (fileRef.current) fileRef.current.value = "";
    if (!picked.length) return;
    if (!user) { requireAuth("add images"); return; }

    const remaining = MAX_IMAGES - imageUrls.length;
    if (remaining <= 0) {
      toast.error(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    let files = picked;
    if (files.length > remaining) {
      files = files.slice(0, remaining);
      toast.error(`Only ${remaining} more ${remaining === 1 ? "image" : "images"} can be added.`);
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error("Please choose image files only.");
          continue;
        }
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 8MB).`);
          continue;
        }
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("feedback-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("feedback-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length) setImageUrls((prev) => [...prev, ...uploaded].slice(0, MAX_IMAGES));
    } catch {
      toast.error("Couldn't upload those images. Please try again.");
    } finally {
      setUploading(false);
    }
  };


  const handleSubmit = async () => {
    const errs: typeof errors = {};
    if (!type) errs.type = "Please choose what this is about";
    if (!subject.trim()) errs.subject = "Please add a subject";
    if (!message.trim()) errs.message = "Please share your feedback";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!requireAuth("send feedback")) return;

    setSubmitting(true);
    try {
      const wantsEmail = replyByEmail && !!user;
      const { error: dbError } = await supabase.from("feedback" as any).insert({
        user_id: user?.id || null,
        feedback_type: type.toLowerCase(),
        subject: subject.trim() || null,
        message: message.trim(),
        image_url: imageUrls[0] || null,
        image_urls: imageUrls,
        reply_by_email: wantsEmail,
        reply_email: wantsEmail ? user?.email ?? null : null,
      } as any);
      if (dbError) throw dbError;
      toast.success("Thank you. We have received your feedback. Someone from our team will be in touch with you ASAP.");
      setSubject("");
      setMessage("");
      setType("");
      setImageUrl("");
      setErrors({});
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase: CSSProperties = {
    width: "100%", background: CARD, border: "none",
    borderRadius: 12, height: 48, padding: "0 16px",
    fontFamily: FF, fontSize: 15, fontWeight: 400, color: INK,
    outline: "none", boxSizing: "border-box",
  };

  const labelStyle: CSSProperties = {
    ...t.sectionEyebrow,
    display: "block",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, paddingBottom: 100, fontFamily: FF, overflowX: "hidden" }}>
      <Seo
        title="Send Feedback — Hello Hoedspruit"
        description="Share feedback, ideas, bug reports or compliments with the Hello Hoedspruit team."
        path="/feedback"
        noIndex
      />
      {/* Top bar */}
      <PageHeader title="Feedback" />


      {/* Tabs — segmented toggle */}
      {(
        <div style={{ padding: "10px 20px 6px" }}>
          <div
            role="tablist"
            style={{
              display: "flex",
              gap: 4,
              padding: 4,
              borderRadius: 999,
              background: "#D8D0BE",
            }}
          >
            {([
              { key: "submit", label: "Send Feedback" },
              { key: "replies", label: hasReplies ? `My Replies (${replies.length})` : "My Replies" },
            ] as const).map((t) => {
              const active = activeTab === t.key;
              const showDot = t.key === "replies" && unreadReplies > 0;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() =>
                    // replace (not push) so switching pills never adds history
                    // entries — Back always leaves the Feedback page entirely.
                    setSearchParams(t.key === "submit" ? {} : { tab: "replies" }, { replace: true })
                  }
                  {...tap}
                  style={{
                    position: "relative",
                    flex: 1,
                    height: 40,
                    borderRadius: 999,
                    border: "none",
                    background: active ? CARD : "transparent",
                    color: active ? INK : MUTED,
                    fontFamily: FF,
                    fontSize: 14,
                    fontWeight: active ? 700 : 600,
                    letterSpacing: "-0.1px",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, background 0.15s ease, color 0.15s ease",
                  }}
                >
                  {t.label}
                  {showDot && (
                    <span
                      aria-label="Unread reply"
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: RED,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Form */}
      {activeTab === "submit" && (
      <div style={{ padding: "16px 24px 0", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Topic — what's it about? */}
        <div>
          <label style={labelStyle}>What's it about?</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {TOPICS.map(({ label, icon: Icon }) => {
              const selected = type === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setType(selected ? "" : label);
                    if (errors.type) setErrors((p) => ({ ...p, type: undefined }));
                  }}
                  {...tap}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    width: "100%",
                    height: 48,
                    padding: "0 14px",
                    borderRadius: 12,
                    border: selected ? "none" : "1px solid rgba(66,51,36,0.10)",
                    background: selected ? SUBMIT_BG : CARD,
                    color: selected ? "#fff" : INK,
                    fontFamily: FF,
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, background 0.15s ease",
                  }}
                >
                  <Icon size={18} color={selected ? "#fff" : INK} strokeWidth={1.9} style={{ flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.1 }}>{label}</span>
                </button>
              );
            })}
          </div>
          {errors.type && (
            <p style={{ fontSize: 12, color: "#B0432B", margin: "8px 0 0", paddingLeft: 4, fontFamily: FF }}>
              {errors.type}
            </p>
          )}
        </div>

        {/* Subject */}
        <div style={{ opacity: type ? 1 : 0.5 }}>
          <label style={labelStyle}>Subject</label>
          <input
            className="fb-input"
            type="text"
            disabled={!type}
            placeholder={type ? "Briefly summarise your feedback" : "Choose what this is about first"}
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (errors.subject) setErrors((p) => ({ ...p, subject: undefined }));
            }}
            style={{ ...inputBase, cursor: type ? "text" : "not-allowed" }}
          />
          {errors.subject && (
            <p style={{ fontSize: 12, color: "#B0432B", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>
              {errors.subject}
            </p>
          )}
        </div>

        {/* Message */}
        <div style={{ opacity: type ? 1 : 0.5 }}>
          <label style={labelStyle}>Message</label>
          <textarea
            className="fb-input"
            disabled={!type}
            placeholder={type ? "Tell us more..." : "Choose what this is about first"}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((p) => ({ ...p, message: undefined }));
            }}
            style={{
              ...inputBase,
              borderRadius: 12,
              height: "auto", minHeight: 160,
              padding: "14px 16px",
              resize: "none", lineHeight: 1.5,
              cursor: type ? "text" : "not-allowed",
            }}
          />
          {errors.message && (
            <p style={{ fontSize: 12, color: "#B0432B", margin: "6px 0 0", paddingLeft: 18, fontFamily: FF }}>
              {errors.message}
            </p>
          )}
        </div>


        {/* Supporting images (optional) */}
        <div>
          <label style={labelStyle}>Add Supporting Images (Optional)</label>
          <p style={{ fontFamily: FF, fontSize: 12.5, fontWeight: 400, color: "#6B6A5E", margin: "0 0 10px", paddingLeft: 18 }}>
            Add up to {MAX_IMAGES} supporting screenshots or images to help us understand.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFile}
            style={{ display: "none" }}
          />
          {imageUrls.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
              {imageUrls.map((url) => (
                <div
                  key={url}
                  style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: CARD, aspectRatio: "1 / 1" }}
                >
                  <img
                    src={url}
                    alt="Supporting image preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrls((prev) => prev.filter((u) => u !== url))}
                    aria-label="Remove image"
                    style={{
                      position: "absolute", top: 6, right: 6,
                      width: 26, height: 26, borderRadius: 999,
                      background: "rgba(26,26,26,0.72)", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} color="#fff" strokeWidth={2.2} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {imageUrls.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={handlePhotoPick}
              disabled={uploading}
              {...tap}
              style={{
                width: "100%",
                minHeight: 56,
                padding: "0 16px",
                borderRadius: 12,
                background: CARD,
                border: "1px dashed rgba(66,51,36,0.28)",
                display: "flex", alignItems: "center", gap: 12,
                cursor: uploading ? "wait" : "pointer",
                color: MUTED,
                fontFamily: FF, fontSize: 15, fontWeight: 600,
                transition: "transform 0.15s ease",
              }}
            >
              {uploading ? (
                <>
                  <Loader2 size={20} color={MUTED} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Camera size={20} color={SUBMIT_BG} strokeWidth={1.8} />
                  <span style={{ color: SUBMIT_BG }}>
                    {imageUrls.length === 0
                      ? "Add screenshots or images"
                      : `Add more (${MAX_IMAGES - imageUrls.length} left)`}
                  </span>
                </>
              )}
            </button>
          )}
        </div>


        {/* Reply to me by email (logged-in users only) */}
        {user?.email && (
          <button
            type="button"
            onClick={() => setReplyByEmail((v) => !v)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              width: "100%", textAlign: "left",
              background: CARD, border: "none", borderRadius: 16,
              padding: "16px 20px", cursor: "pointer",
            }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: FF, fontSize: 16, fontWeight: 500, letterSpacing: "-0.01em", color: INK }}>
                Reply to me by email
              </span>
              <span
                style={{
                  display: "block", fontFamily: FF, fontSize: 12.5, fontWeight: 400, color: "#6B6A5E",
                  marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </span>
            </span>
            <span
              role="switch"
              aria-checked={replyByEmail}
              style={{
                position: "relative", flexShrink: 0,
                width: 52, height: 30, borderRadius: 999,
                background: replyByEmail ? SUBMIT_BG : "#D8D0BE",
                transition: "background 0.18s ease",
              }}
            >
              <span
                style={{
                  position: "absolute", top: 3, left: replyByEmail ? 25 : 3,
                  width: 24, height: 24, borderRadius: 999, background: "#fff",
                  transition: "left 0.18s ease",
                }}
              />
            </span>
          </button>
        )}

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
                color: isEmpty ? TOKEN_MUTED : "#fff",
                border: "none",
                borderRadius: 999, height: 48,
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
      )}

      {activeTab === "replies" && (
        <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {!hasReplies && (
            <p style={{ margin: "24px 0 0", textAlign: "center", fontFamily: FF, fontSize: 14, color: MUTED }}>
              You have no replies yet. We will get back to you here once we have responded.
            </p>
          )}
          {replies.map((r) => (
            <div
              key={r.id}
              style={{
                background: CARD,
                borderRadius: 20,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontFamily: FF, fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: "#423324", marginBottom: 4 }}>
                  Subject
                </div>
                <div style={{ fontFamily: FF, fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.3 }}>
                  {titleCaseSubject(r.subject) || "—"}
                </div>
              </div>
              <div style={{ height: 1, background: "rgba(0,0,0,0.08)" }} />
              <div>
                <div style={{ fontFamily: FF, fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: "#423324", marginBottom: 4 }}>
                  Your message
                </div>
                <p
                  style={{
                    margin: 0, fontFamily: FF, fontSize: 13, lineHeight: 1.5, color: MUTED,
                    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "pre-wrap",
                    marginBottom: r.image_url ? 10 : 8,
                  }}
                >
                  {r.message}
                </p>
                {r.image_url && (
                  <img
                    src={r.image_url}
                    alt="Your attachment"
                    style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12, display: "block" }}
                  />
                )}
              </div>
              <div>
                <div style={{ fontFamily: FF, fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: "#423324", marginBottom: 6 }}>
                  Admin reply
                </div>
                <p style={{ margin: 0, fontFamily: FF, fontSize: 14, lineHeight: 1.5, color: INK, whiteSpace: "pre-wrap" }}>
                  {r.admin_reply}
                </p>
              </div>

              <div style={{ fontFamily: FF, fontSize: 11, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase", color: "#423324" }}>
                {new Date(r.replied_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feedback;
