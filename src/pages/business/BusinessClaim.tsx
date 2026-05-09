import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Check, X, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import { toast } from "sonner";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const SOFT_CREAM = "#F4EFE3";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

interface ListingHit {
  id: string;
  title: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  business_owner_id: string | null;
  image_url: string | null;
  category_id: string | null;
  category_title?: string | null;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

const BusinessClaim = () => {
  const navigate = useNavigate();
  const { user, authLoading, loading, listing, pendingClaim, refresh } = useBusinessOwner();

  const [q, setQ] = useState("");
  const [results, setResults] = useState<ListingHit[]>([]);
  const [picked, setPicked] = useState<ListingHit | null>(null);
  const [proof, setProof] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // Load Playfair
  useEffect(() => {
    const id = "playfair-display-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!authLoading && !loading && !user) {
      navigate("/business/sign-up?intent=claim", { replace: true });
    }
  }, [authLoading, loading, user, navigate]);

  useEffect(() => {
    if (listing) navigate("/business/dashboard", { replace: true });
  }, [listing, navigate]);

  // Search listings (both claimed and unclaimed) + join category title
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, title, location, phone, email, business_owner_id, image_url, category_id, categories(title)")
        .ilike("title", `%${q.trim()}%`)
        .limit(12);
      const hits: ListingHit[] = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        location: r.location,
        phone: r.phone,
        email: r.email,
        business_owner_id: r.business_owner_id,
        image_url: r.image_url,
        category_id: r.category_id,
        category_title: r.categories?.title ?? null,
      }));
      setResults(hits);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const submitClaim = async () => {
    if (!user || !picked) return;
    setBusy(true);
    await supabase.rpc("claim_business_owner_role" as any);
    const { error } = await supabase.from("claim_requests").insert({
      user_id: user.id,
      listing_id: picked.id,
      proof_contact: proof || null,
      note: note || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Claim sent for review");
    await refresh();
    navigate("/business/dashboard");
  };

  const hasQuery = q.trim().length > 0;
  const showResults = hasQuery && results.length > 0;
  const showZeroState = hasQuery && q.trim().length >= 2 && results.length === 0;
  const fallbackHeadline = !hasQuery
    ? "Tip: search by part of the name."
    : showZeroState
      ? `No matches for ${q.trim()}.`
      : "Can't find your business?";
  const fallbackBody = !hasQuery
    ? "If your business doesn't appear, you can still list it as new."
    : showZeroState
      ? "Try a different name or list it as new if it isn't on the app yet."
      : "Search by part of the name, or list it as new if it isn't on the app yet.";

  const counter = useMemo(() => {
    const n = results.length;
    return `${n} Found`;
  }, [results.length]);

  // Pending claim banner
  if (pendingClaim && pendingClaim.status === "pending") {
    return (
      <div style={{ minHeight: "100dvh", background: OLIVE, fontFamily: SANS, padding: 24 }}>
        <button
          onClick={() => navigate("/business/start")}
          aria-label="Back"
          style={{
            width: 44, height: 44, borderRadius: "50%", background: CREAM, border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            marginBottom: 24,
          }}
        >
          <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 1.6, color: INK }} />
        </button>
        <div style={{ background: CREAM, borderRadius: 20, padding: 24 }}>
          <p style={{ fontFamily: SANS, fontSize: 12, letterSpacing: "2.4px", textTransform: "uppercase", color: MUTED, margin: 0, marginBottom: 10 }}>
            Under Review
          </p>
          <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 28, color: INK, margin: 0, marginBottom: 8 }}>
            Claim under review.
          </h2>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: MUTED, margin: 0 }}>
            We'll review this within 48 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: OLIVE, fontFamily: SANS, paddingBottom: 48 }}>
      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate("/business/start")}
          aria-label="Back"
          style={{
            width: 44, height: 44, borderRadius: "50%", background: CREAM, border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 1.6, color: INK }} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <p style={{
          fontFamily: SANS, fontSize: 12, fontWeight: 400, letterSpacing: "2.4px",
          textTransform: "uppercase", color: "rgba(238, 232, 218, 0.7)", margin: 0, marginBottom: 14,
        }}>
          Claim Your Listing
        </p>
        <h1 style={{
          fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 72,
          lineHeight: 0.92, letterSpacing: "-2.5px", color: CREAM, margin: 0, marginBottom: 14,
        }}>
          find yours.
        </h1>
        <p style={{
          fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 17,
          lineHeight: 1.4, color: "rgba(238, 232, 218, 0.75)", margin: 0, maxWidth: 300,
        }}>
          Search by name. Pick the matching listing and we'll send a claim.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12, height: 52,
          borderRadius: 999, background: "rgba(238, 232, 218, 0.92)",
          padding: "0 22px",
        }}>
          <Search style={{ width: 18, height: 18, strokeWidth: 1.6, color: MUTED, flexShrink: 0 }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by business name"
            style={{
              flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
              fontFamily: SANS, fontSize: 15, fontWeight: 400,
              color: hasQuery ? INK : MUTED,
            }}
          />
          {hasQuery && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear"
              style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "rgba(107, 106, 94, 0.12)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <X style={{ width: 11, height: 11, strokeWidth: 2, color: INK }} />
            </button>
          )}
        </div>
      </div>

      {/* Section heading */}
      {hasQuery && (
        <div style={{
          padding: "0 24px", display: "flex", alignItems: "baseline",
          justifyContent: "space-between", marginBottom: 14,
        }}>
          <h2 style={{
            fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 28,
            lineHeight: 1, letterSpacing: "-0.5px", color: CREAM, margin: 0,
          }}>
            matches
          </h2>
          <span style={{
            fontFamily: SANS, fontSize: 11, fontWeight: 400, letterSpacing: "1.8px",
            textTransform: "uppercase", color: "rgba(238, 232, 218, 0.75)",
          }}>
            {counter}
          </span>
        </div>
      )}

      {/* Results card */}
      {showResults && (
        <div style={{
          marginLeft: 24, marginRight: 24, marginBottom: 24,
          background: CREAM, borderRadius: 20, padding: "6px 18px",
        }}>
          {results.map((r, i) => {
            const claimed = !!r.business_owner_id;
            const meta = [r.category_title, r.location].filter(Boolean);
            return (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px 0",
                borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
              }}>
                {/* Logo */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: r.image_url
                    ? `center/cover url(${r.image_url})`
                    : "linear-gradient(135deg, #B8916A, #715A3D)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}>
                  {!r.image_url && (
                    <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 20, color: CREAM }}>
                      {initialsOf(r.title)}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: SANS, fontWeight: 400, fontSize: 16, lineHeight: 1.2,
                    letterSpacing: "-0.1px", color: INK, marginBottom: 3,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {r.title}
                  </div>
                  {meta.length > 0 && (
                    <div style={{
                      fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 13,
                      lineHeight: 1.35, color: MUTED,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {meta.map((m, idx) => (
                        <span key={idx}>
                          {idx > 0 && (
                            <span style={{
                              display: "inline-block", width: 3, height: 3, borderRadius: "50%",
                              background: MUTED, opacity: 0.6, verticalAlign: "middle",
                              margin: "0 4px",
                            }} />
                          )}
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action */}
                {claimed ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
                    fontFamily: SERIF, fontStyle: "italic", fontSize: 13,
                    color: "rgba(107, 106, 94, 0.75)",
                  }}>
                    <Check style={{ width: 13, height: 13, strokeWidth: 1.5, color: MUTED }} />
                    already claimed
                  </span>
                ) : (
                  <button
                    onClick={() => setPicked(r)}
                    style={{
                      flexShrink: 0, height: 32, padding: "0 16px", borderRadius: 999,
                      background: INK, color: CREAM, border: "none", cursor: "pointer",
                      fontFamily: SANS, fontSize: 13, fontWeight: 400, letterSpacing: "0.1px",
                    }}
                  >
                    Claim
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback card */}
      <div style={{
        marginLeft: 24, marginRight: 24,
        background: SOFT_CREAM, borderRadius: 20,
        padding: "20px 22px 22px",
      }}>
        <h3 style={{
          fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 20,
          lineHeight: 1.1, letterSpacing: "-0.3px", color: INK,
          margin: 0, marginBottom: 6,
        }}>
          {fallbackHeadline}
        </h3>
        <p style={{
          fontFamily: SANS, fontSize: 14, lineHeight: 1.55,
          color: "rgba(42, 42, 36, 0.8)", margin: 0, marginBottom: 14,
        }}>
          {fallbackBody}
        </p>
        <button
          onClick={() => navigate("/business/sign-up")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            height: 38, padding: "0 18px", borderRadius: 999,
            background: "transparent", border: `1px solid ${LINE}`,
            fontFamily: SANS, fontSize: 13.5, fontWeight: 400, color: INK,
            cursor: "pointer",
          }}
        >
          List It As New
          <ArrowUpRight style={{ width: 13, height: 13, strokeWidth: 1.8, color: INK }} />
        </button>
      </div>

      {/* Claim verification overlay */}
      {picked && (
        <div
          onClick={() => !busy && setPicked(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(42, 42, 36, 0.55)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            zIndex: 60,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 560, background: CREAM,
              borderRadius: "24px 24px 0 0", padding: 24,
            }}
          >
            <p style={{
              fontFamily: SANS, fontSize: 11, letterSpacing: "1.8px",
              textTransform: "uppercase", color: MUTED, margin: 0, marginBottom: 8,
            }}>
              Verify Ownership
            </p>
            <h3 style={{
              fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 26,
              letterSpacing: "-0.4px", color: INK, margin: 0, marginBottom: 4,
            }}>
              {picked.title}
            </h3>
            <p style={{
              fontFamily: SERIF, fontStyle: "italic", fontSize: 14,
              color: MUTED, margin: 0, marginBottom: 20,
            }}>
              Confirm a contact already on this listing so we can verify you.
            </p>

            <label style={{
              display: "block", fontFamily: SANS, fontSize: 11, letterSpacing: "1.8px",
              textTransform: "uppercase", color: MUTED, marginBottom: 8,
            }}>
              Proof Contact
            </label>
            <input
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder={picked.phone || picked.email || "Phone or email on file"}
              style={{
                width: "100%", height: 46, padding: "0 16px",
                borderRadius: 12, border: `1px solid ${LINE}`,
                background: SOFT_CREAM, fontFamily: SANS, fontSize: 15, color: INK,
                marginBottom: 16, outline: "none",
              }}
            />

            <label style={{
              display: "block", fontFamily: SANS, fontSize: 11, letterSpacing: "1.8px",
              textTransform: "uppercase", color: MUTED, marginBottom: 8,
            }}>
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell us your role at the business"
              rows={3}
              style={{
                width: "100%", padding: 14, borderRadius: 12,
                border: `1px solid ${LINE}`, background: SOFT_CREAM,
                fontFamily: SANS, fontSize: 15, color: INK, resize: "none",
                marginBottom: 20, outline: "none",
              }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setPicked(null)}
                disabled={busy}
                style={{
                  flex: 1, height: 48, borderRadius: 999,
                  background: "transparent", border: `1px solid ${LINE}`,
                  fontFamily: SANS, fontSize: 14, color: INK, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitClaim}
                disabled={busy}
                style={{
                  flex: 2, height: 48, borderRadius: 999,
                  background: INK, color: CREAM, border: "none",
                  fontFamily: SANS, fontSize: 14, letterSpacing: "0.1px",
                  cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? "Sending…" : "Send For Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessClaim;
