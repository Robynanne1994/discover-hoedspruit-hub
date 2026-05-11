import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const CREAM_SOFT = "#F4EFE3";
const RUST = "#9B5A3C";
const INK = "#2A2A24";
const INK_SOFT = "#6B6A5E";
const LINE_CREAM = "rgba(238,232,218,0.18)";
const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const PLAYFAIR = '"Playfair Display", Georgia, serif';

const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):/i });

const inlineFormat = (text: string) =>
  text
    .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:600;color:${CREAM}">$1</strong>`)
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      `<a href="$2" style="color:${CREAM};text-decoration:underline;text-underline-offset:3px" target="_blank" rel="noopener">$1</a>`,
    );

type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string; attr?: string };

const parseBody = (text: string): Block[] => {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("> ")) {
      // Pull quote: "> quote text" optionally followed by "> -- attribution"
      const qText = line.slice(2).trim();
      let attr: string | undefined;
      if (i + 1 < lines.length && lines[i + 1].startsWith(">")) {
        const next = lines[i + 1].slice(1).trim();
        const m = next.match(/^(?:--|—|-)\s*(.+)$/);
        if (m) {
          attr = m[1];
          i++;
        }
      }
      blocks.push({ type: "quote", text: qText, attr });
    } else if (line.startsWith("## ") || line.startsWith("# ")) {
      blocks.push({ type: "h", text: line.replace(/^#+\s/, "") });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    } else if (line.trim() !== "") {
      blocks.push({ type: "p", text: line });
    }
    i++;
  }
  return blocks;
};

const renderBody = (text: string) => {
  const blocks = parseBody(text);
  return blocks.map((b, idx) => {
    if (b.type === "h") {
      return (
        <h2
          key={idx}
          style={{
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 24,
            lineHeight: 1.15,
            color: CREAM,
            marginTop: 32,
            marginBottom: 16,
            letterSpacing: "-0.3px",
          }}
        >
          {b.text}
        </h2>
      );
    }
    if (b.type === "ul") {
      return (
        <ul key={idx} style={{ paddingLeft: 22, marginBottom: 20 }}>
          {b.items.map((item, j) => (
            <li
              key={j}
              style={{
                fontFamily: HELV,
                fontWeight: 400,
                fontSize: 15,
                lineHeight: 1.7,
                color: "rgba(238,232,218,0.9)",
                marginBottom: 8,
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(inlineFormat(item)) }}
            />
          ))}
        </ul>
      );
    }
    if (b.type === "quote") {
      return (
        <figure key={idx} style={{ margin: "36px 0" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: RUST, marginBottom: 18 }} />
          <blockquote
            style={{
              margin: 0,
              fontFamily: PLAYFAIR,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 22,
              lineHeight: 1.4,
              letterSpacing: "-0.3px",
              color: CREAM,
              marginBottom: b.attr ? 14 : 0,
            }}
          >
            {b.text}
          </blockquote>
          {b.attr && (
            <figcaption
              style={{
                fontFamily: HELV,
                fontSize: 11,
                letterSpacing: "2.4px",
                textTransform: "uppercase",
                color: "rgba(238,232,218,0.7)",
              }}
            >
              {b.attr}
            </figcaption>
          )}
        </figure>
      );
    }
    return (
      <p
        key={idx}
        style={{
          fontFamily: HELV,
          fontWeight: 400,
          fontSize: 15,
          lineHeight: 1.7,
          color: "rgba(238,232,218,0.9)",
          marginBottom: 20,
        }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(inlineFormat(b.text)) }}
      />
    );
  });
};

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles" as any)
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .single();
      return data as any;
    },
    enabled: !!slug,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related-articles", slug, article?.category],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles" as any)
        .select("*")
        .eq("is_published", true)
        .neq("slug", slug!)
        .order("published_at", { ascending: false })
        .limit(10);
      const all = (data || []) as any[];
      const sameCategory = all.filter((a) => a.category === article?.category);
      const others = all.filter((a) => a.category !== article?.category);
      return [...sameCategory, ...others].slice(0, 3);
    },
    enabled: !!article,
  });

  const formatDate = (d: string) => {
    try {
      return format(new Date(d), "d MMMM yyyy");
    } catch {
      return d;
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: article?.title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: OLIVE }}>
        <p style={{ color: "rgba(238,232,218,0.65)", fontFamily: HELV }}>Loading...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: OLIVE }}>
        <p style={{ color: "rgba(238,232,218,0.65)", fontFamily: HELV }}>Article not found.</p>
      </div>
    );
  }

  const author = article.author || "Hello Hoedspruit";
  const initial = author.trim().charAt(0).toUpperCase();
  const lede: string | undefined = article.excerpt || article.subtitle || article.lede;
  const pullQuote: string | undefined = article.pull_quote;
  const pullQuoteAttr: string | undefined = article.pull_quote_attribution;

  // Optionally inject a single pull-quote into the body if the article has one
  // and the body doesn't already contain a `> ` line.
  let bodyText: string = article.body || "";
  if (pullQuote && !/^>\s/m.test(bodyText)) {
    const paras = bodyText.split(/\n\n+/);
    if (paras.length >= 3) {
      const insertAt = Math.floor(paras.length / 2);
      const quoteBlock = `> ${pullQuote}` + (pullQuoteAttr ? `\n> -- ${pullQuoteAttr}` : "");
      paras.splice(insertAt, 0, quoteBlock);
      bodyText = paras.join("\n\n");
    }
  }

  const iconStroke = {
    stroke: INK,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: OLIVE,
        paddingBottom: 140,
      }}
    >
      {/* Hero */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3.4", background: "#3f4630", overflow: "hidden" }}>
        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.25) 100%)",
            pointerEvents: "none",
          }}
        />
        <button
          onClick={() => navigate("/headlines")}
          aria-label="Back"
          style={{
            position: "absolute",
            top: 60,
            left: 20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: CREAM,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" {...iconStroke}>
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <button
          onClick={handleShare}
          aria-label="Share"
          style={{
            position: "absolute",
            top: 60,
            right: 20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: CREAM,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" {...iconStroke}>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      </div>

      {/* Article header */}
      <div style={{ padding: "32px 24px 0" }}>
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: HELV,
            fontWeight: 400,
            fontSize: 12,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: "rgba(238,232,218,0.7)",
            marginBottom: 16,
          }}
        >
          {article.category} · The Lowveld
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: PLAYFAIR,
            fontStyle: "normal",
            fontWeight: 400,
            fontSize: 48,
            lineHeight: 1.0,
            letterSpacing: "-1.2px",
            color: CREAM,
            margin: 0,
            marginBottom: 18,
          }}
        >
          {article.title}
        </h1>

        {/* Byline */}
        <div
          style={{
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.4,
            color: "rgba(238,232,218,0.65)",
            marginBottom: 28,
          }}
        >
          {author} · {formatDate(article.published_at)} · {article.read_time || 3} min read
        </div>

        {/* Hairline */}
        <div
          style={{
            height: 1,
            background: LINE_CREAM,
            marginLeft: -24,
            marginRight: -24,
            marginBottom: 28,
          }}
        />

        {/* Lede */}
        {lede && (
          <p
            style={{
              fontFamily: PLAYFAIR,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 17,
              lineHeight: 1.4,
              color: "rgba(238,232,218,0.75)",
              margin: 0,
              marginBottom: 32,
            }}
          >
            {lede}
          </p>
        )}

        {/* Body */}
        <div>{renderBody(bodyText)}</div>

        {/* Author footer card */}
        <div
          style={{
            marginTop: 36,
            background: CREAM,
            borderRadius: 24,
            padding: "24px 22px",
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: RUST,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: PLAYFAIR,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 22,
                color: CREAM,
                lineHeight: 1,
              }}
            >
              {initial}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: HELV,
                fontWeight: 400,
                fontSize: 10.5,
                letterSpacing: "1.8px",
                textTransform: "uppercase",
                color: INK_SOFT,
                marginBottom: 6,
              }}
            >
              Written By
            </div>
            <div
              style={{
                fontFamily: PLAYFAIR,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 22,
                lineHeight: 1.0,
                color: INK,
                marginBottom: 6,
              }}
            >
              {author}
            </div>
            <div
              style={{
                fontFamily: PLAYFAIR,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 13.5,
                lineHeight: 1.45,
                color: INK_SOFT,
              }}
            >
              {article.author_bio || "Telling Hoedspruit stories, slowly."}
            </div>
          </div>
        </div>

        {/* Share outlined pill */}
        <button
          onClick={handleShare}
          style={{
            marginTop: 28,
            width: "100%",
            height: 44,
            borderRadius: 999,
            background: "transparent",
            border: `1px solid rgba(238,232,218,0.35)`,
            color: CREAM,
            fontFamily: HELV,
            fontWeight: 400,
            fontSize: 14,
            letterSpacing: "0.1px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke={CREAM}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share This Story
        </button>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontFamily: HELV,
                  fontWeight: 400,
                  fontSize: 11,
                  letterSpacing: "2.4px",
                  textTransform: "uppercase",
                  color: "rgba(238,232,218,0.7)",
                }}
              >
                More From The Lowdown
              </span>
              <button
                onClick={() => navigate("/headlines")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: HELV,
                  fontWeight: 400,
                  fontSize: 11,
                  letterSpacing: "1.8px",
                  textTransform: "uppercase",
                  color: "rgba(238,232,218,0.75)",
                }}
              >
                See All
              </button>
            </div>

            <h2
              style={{
                fontFamily: PLAYFAIR,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 28,
                lineHeight: 1.0,
                letterSpacing: "-0.4px",
                color: CREAM,
                textTransform: "lowercase",
                margin: 0,
                marginBottom: 22,
              }}
            >
              keep reading.
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {related.map((r: any) => (
                <Link key={r.id} to={`/headlines/${r.slug}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      background: CREAM,
                      borderRadius: 20,
                      padding: 14,
                      display: "flex",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 14,
                        overflow: "hidden",
                        background: CREAM_SOFT,
                        flexShrink: 0,
                      }}
                    >
                      {r.image_url && (
                        <img
                          src={r.image_url}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div
                        style={{
                          fontFamily: HELV,
                          fontWeight: 400,
                          fontSize: 10.5,
                          letterSpacing: "1.8px",
                          textTransform: "uppercase",
                          color: INK_SOFT,
                          marginBottom: 6,
                        }}
                      >
                        {r.category}
                      </div>
                      <div
                        style={{
                          fontFamily: HELV,
                          fontWeight: 400,
                          fontSize: 17,
                          lineHeight: 1.2,
                          letterSpacing: "-0.2px",
                          color: INK,
                          marginBottom: 8,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as any,
                          overflow: "hidden",
                        }}
                      >
                        {r.title}
                      </div>
                      <div
                        style={{
                          fontFamily: HELV,
                          fontWeight: 400,
                          fontSize: 13,
                          color: INK_SOFT,
                        }}
                      >
                        {formatDate(r.published_at)}
                        <span style={{ margin: "0 4px" }}>·</span>
                        {r.read_time || 3} min read
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Whisper sign-off */}
        <div
          style={{
            marginTop: 44,
            marginBottom: 40,
            textAlign: "center",
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            letterSpacing: "-0.2px",
            color: "rgba(238,232,218,0.65)",
            textTransform: "lowercase",
          }}
        >
          told slowly, from the lowveld.
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
