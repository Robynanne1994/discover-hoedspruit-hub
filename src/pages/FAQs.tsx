import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ChevronDown, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

const FF = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const FF_HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FF_PF = "'Playfair Display', Georgia, serif";

const SECTION_ORDER = [
  "About Hello Hoedspruit",
  "Using the app",
  "Listings & information",
  "For business owners",
  "Account & privacy",
  "General",
];

// Map possible legacy DB section names to the new sentence-case labels
const SECTION_ALIASES: Record<string, string> = {
  "About Hello Hoedspruit": "About Hello Hoedspruit",
  "Using the App": "Using the app",
  "Using the app": "Using the app",
  "Listings & Information": "Listings & information",
  "Listings and Information": "Listings & information",
  "Listings and information": "Listings & information",
  "For Business Owners": "For business owners",
  "For business owners": "For business owners",
  "Account & Privacy": "Account & privacy",
  "Account and Privacy": "Account & privacy",
  "Account and privacy": "Account & privacy",
  "General": "General",
};

const baseStyle = {
  fontStretch: "normal" as const,
  fontSynthesis: "none" as const,
  transform: "none" as const,
};

const FAQs = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openItem, setOpenItem] = useState<string | null>(null);

  const { data: faqs, isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const sections = useMemo(() => {
    if (!faqs) return [];
    const grouped: Record<string, typeof faqs> = {};
    faqs.forEach((faq) => {
      const label = SECTION_ALIASES[faq.section] || faq.section;
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(faq);
    });
    return SECTION_ORDER
      .filter((s) => grouped[s]?.length)
      .map((s) => ({ title: s, items: grouped[s] }));
  }, [faqs]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search, sections]);

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", paddingBottom: 120, fontFamily: FF, ...baseStyle }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px 8px" }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "#FFFFFF",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(10,10,10,0.08)",
            cursor: "pointer",
            ...baseStyle,
          }}
        >
          <BackArrowIcon size={20} color="#0A0A0A" />
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: "20px 24px 0" }}>
        <h1 style={{
          fontFamily: FF_HN,
          fontWeight: 700,
          fontSize: 60,
          lineHeight: 0.92,
          letterSpacing: "-0.03em",
          color: "#0A0A0A",
          margin: 0,
          ...baseStyle,
        }}>
          How can<br />we help?
        </h1>
      </div>

      {/* Search */}
      <div style={{ padding: "28px 24px 24px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "#FFFFFF",
          borderRadius: 999,
          padding: "14px 20px",
          gap: 12,
        }}>
          <Search size={18} strokeWidth={1.8} color="#8A8480" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search FAQs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              outline: "none",
              border: "none",
              fontSize: 15,
              color: "#0A0A0A",
              fontFamily: FF,
              ...baseStyle,
            }}
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ padding: "0 24px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              <Skeleton className="h-3 w-32 mb-3" />
              <Skeleton className="h-40 w-full rounded-[20px]" />
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && filteredSections.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <p style={{ fontSize: 15, color: "#8A8480", fontFamily: FF, ...baseStyle }}>
            No matching questions found.
          </p>
        </div>
      )}

      {/* FAQ sections */}
      {!isLoading && filteredSections.map((section) => (
        <div key={section.title} style={{ padding: "0 24px", marginBottom: 24 }}>
          <h3 style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "none",
            color: "#0A0A0A",
            fontFamily: FF_HN,
            fontWeight: 400,
            margin: "0 0 12px 4px",
            ...baseStyle,
          }}>
            {section.title}
          </h3>
          <div style={{ background: "#FFFFFF", borderRadius: 20, overflow: "hidden" }}>
            {section.items.map((item, i) => {
              const isOpen = openItem === item.id;
              const hasAnswer = item.answer && item.answer.trim().length > 0;
              return (
                <div key={item.id}>
                  {i > 0 && (
                    <div style={{ height: 1, background: "#F2EFEC", margin: "0 20px" }} />
                  )}
                  <button
                    onClick={() => toggleItem(item.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      textAlign: "left",
                      padding: 20,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      ...baseStyle,
                    }}
                  >
                    <span style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: "#0A0A0A",
                      lineHeight: 1.3,
                      flex: 1,
                      fontFamily: FF,
                      ...baseStyle,
                    }}>
                      {item.question}
                    </span>
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: isOpen ? "#423324" : "#F2EFEC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background 0.2s ease",
                    }}>
                      <ChevronDown
                        size={16}
                        strokeWidth={2}
                        color={isOpen ? "#FFFFFF" : "#0A0A0A"}
                        style={{
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 20px 20px" }}>
                      <p style={{
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: "#8A8480",
                        margin: 0,
                        fontFamily: FF,
                        ...baseStyle,
                      }}>
                        {hasAnswer ? item.answer : "We're still writing this one. Check back soon."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Coral contact card */}
      {!isLoading && (
        <div style={{ padding: "8px 24px 0" }}>
          <div style={{
            background: "#5B4632",
            borderRadius: 24,
            padding: 28,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.75)",
                fontFamily: FF,
                marginBottom: 14,
                ...baseStyle,
              }}>
                Still stuck
              </div>
              <h3 style={{
                fontFamily: FF_HN,
                fontWeight: 700,
                fontSize: 34,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
                margin: 0,
                ...baseStyle,
              }}>
                Ask us anything.
              </h3>
              <p style={{
                fontFamily: FF,
                fontWeight: 400,
                fontSize: 15,
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.85)",
                margin: "14px 0 22px",
                ...baseStyle,
              }}>
                We're a small team but we answer every message. Drop us a line and we'll get back to you.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <a
                  href="https://wa.me/27613321709"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp us"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    background: "#FFFFFF",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A0A0A" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.47 3.488"/>
                  </svg>
                </a>
                <a
                  href="mailto:hellohoedspruit@gmail.com"
                  aria-label="Email us"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    background: "#FFFFFF",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  <Mail size={22} strokeWidth={1.8} color="#0A0A0A" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQs;
