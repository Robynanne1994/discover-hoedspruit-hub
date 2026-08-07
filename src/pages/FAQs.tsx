import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import Seo from "@/components/Seo";
import { SECTION_INSET, type } from "@/lib/type";


const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const BODY = "#5C544A";
const MUTED = "#9C9387";
const LINE = "#EAE4D5";
const ROW_LINE = "#EFE9DA";

type FAQ = { id: string; question: string; answer: string };
type Section = { title: string; items: FAQ[] };

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").toLowerCase();

// Preserve line and paragraph breaks entered in the admin editor.
// If the answer already contains block-level HTML, leave it as-is.
const formatAnswer = (answer: string) => {
  if (!answer) return "";
  const hasBlockHtml = /<(p|br|ul|ol|li|div|h[1-6])\b/i.test(answer);
  if (hasBlockHtml) return answer;
  return answer
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br />")}</p>`)
    .join("");
};

const FAQRow = ({
  item,
  isFirst,
  open,
  onToggle,
}: {
  item: FAQ;
  isFirst: boolean;
  open: boolean;
  onToggle: () => void;
}) => (
  <div style={{ borderTop: isFirst ? "none" : `1px solid ${ROW_LINE}` }}>
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "none",
        border: "none",
        minHeight: 56,
        padding: "10px 0",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: FF,
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: open ? 600 : 500,
          lineHeight: 1.35,
          letterSpacing: "-0.1px",
          color: INK,
        }}
      >
        {item.question}
      </span>
      <span
        aria-hidden
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 200ms ease-out",
          color: INK,
        }}
      >
        <ChevronDown size={16} strokeWidth={2} color="#B4AE9E" />
      </span>
    </button>
    {open && (
      <div
        className="faq-answer"
        style={{
          fontSize: 14,
          fontFamily: FF,
          fontWeight: 400,
          lineHeight: 1.55,
          color: BODY,
          paddingBottom: 18,
          paddingRight: 8,
        }}
        dangerouslySetInnerHTML={{ __html: formatAnswer(item.answer) }}
      />
    )}
  </div>
);

const FAQs = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("faqs")
        .select("id, section, question, answer, sort_order")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });
      if (!data) return;
      const map = new Map<string, { title: string; items: FAQ[]; min: number }>();
      data.forEach((r: any, i: number) => {
        const existing = map.get(r.section);
        if (existing) {
          existing.items.push({ id: r.id, question: r.question, answer: r.answer });
        } else {
          map.set(r.section, {
            title: r.section,
            items: [{ id: r.id, question: r.question, answer: r.answer }],
            min: r.sort_order ?? i,
          });
        }
      });
      const list = Array.from(map.values())
        .sort((a, b) => {
          if (a.title === "About Hello Hoedspruit") return -1;
          if (b.title === "About Hello Hoedspruit") return 1;
          return a.min - b.min;
        })
        .map(({ title, items }) => ({ title, items }));
      setSections(list);
      if (list[0]?.items[0]) setOpenKey(`${list[0].title}-${list[0].items[0].id}`);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (i) =>
            i.question.toLowerCase().includes(q) || stripHtml(i.answer).includes(q),
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [query, sections]);

  const faqJsonLd = useMemo(() => {
    const items = sections.flatMap((s) => s.items);
    if (!items.length) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((i) => ({
        "@type": "Question",
        name: i.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: i.answer.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
        },
      })),
    };
  }, [sections]);

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, fontFamily: FF, color: INK, paddingBottom: 100 }}>
      <Seo
        title="Hello Hoedspruit — FAQs"
        description="Answers to common questions about Hello Hoedspruit: accounts, saving places, listing your business, events and more."
        path="/faqs"
        jsonLd={faqJsonLd}
      />

      <style>{`
        .faq-answer a { color: #1A1A1A; text-decoration: underline; }
        .faq-answer p { margin: 0 0 8px; }
        .faq-answer p:last-child { margin-bottom: 0; }
        .faq-answer ul, .faq-answer ol { margin: 4px 0 8px 18px; padding: 0; }
      `}</style>
      {/* Top bar */}
      <PageHeader title="FAQs" />

      {/* Search */}
      <div style={{ padding: "20px 20px 0" }}>
        <SearchBar
          variant="light"
          value={query}
          onChange={setQuery}
          placeholder="Search FAQs"
        />
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 24 }}>
        {filtered.map((section) => (
          <div key={section.title}>
            <div
              style={{
                ...type.sectionEyebrow,
                padding: `0 ${SECTION_INSET}px`,
              }}
            >
              {section.title}
            </div>
            <div style={{ padding: `0 ${SECTION_INSET}px` }}>
              <div
                style={{
                  background: CARD,
                  borderRadius: 20,
                  padding: "0 16px",
                }}
              >
                {section.items.map((item, idx) => {
                  const key = `${section.title}-${item.id}`;
                  return (
                    <FAQRow
                      key={key}
                      item={item}
                      isFirst={idx === 0}
                      open={openKey === key}
                      onToggle={() => setOpenKey(openKey === key ? null : key)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div
        style={{
          marginTop: 36,
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: FF,
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.45,
            color: BODY,
            textAlign: "center",
          }}
        >
          Still stuck? Please reach out to us for help!
        </p>
        <PrimaryButton
          fullWidth
          onClick={() => navigate("/contact")}
          style={{ maxWidth: 320 }}
        >
          Contact Us
        </PrimaryButton>
      </div>

      <BottomNav />
    </div>
  );
};

export default FAQs;
